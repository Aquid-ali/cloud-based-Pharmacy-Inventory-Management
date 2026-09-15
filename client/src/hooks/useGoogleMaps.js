import { useEffect, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
let optionsSet = false;

// Google's own runtime shows an intrusive "This page can't load Google Maps
// correctly" dialog whenever it detects an invalid/restricted key or a
// billing problem on the Cloud project - a *runtime* API failure that can
// still happen even after the script itself has loaded successfully, so it
// isn't caught by loadCoreLibraries()'s own .catch() below. `gm_authFailure`
// is Google's own documented escape hatch for this: if it's defined, Google
// calls it instead of showing that dialog. Every active useGoogleMaps() call
// registers itself here so it can fall back to the app's existing "Map
// couldn't be loaded" UI instead - this doesn't fix the underlying key/
// billing problem (see README "Google Maps Setup"), it just replaces
// Google's own popup with this app's normal error state.
const authFailureListeners = new Set();
if (typeof window !== 'undefined') {
  window.gm_authFailure = () => {
    authFailureListeners.forEach((notify) => notify());
  };
}

function ensureOptionsSet() {
  if (!optionsSet) {
    setOptions({ key: API_KEY, v: 'weekly' });
    optionsSet = true;
  }
}

// Module-level (not per-hook-call) so each library is only ever requested
// once for the whole app lifetime, no matter how many components/mounts ask
// for it - caching the promises here means a second mount reuses the
// same in-flight/resolved load instead of re-triggering it.
let coreLoadPromise = null;

function loadCoreLibraries() {
  if (!coreLoadPromise) {
    ensureOptionsSet();
    // 'marker' pulls in Marker (classic) + AdvancedMarkerElement; 'maps'
    // pulls in Map/InfoWindow/etc. Both populate the window.google.maps
    // global namespace as a side effect, which is what components consume.
    // Deliberately NOT loading 'routes' (Directions) here - see
    // loadRoutesLibrary() below for why it's kept separate.
    coreLoadPromise = Promise.all([importLibrary('maps'), importLibrary('marker')]);
  }
  return coreLoadPromise;
}

let routesLoadPromise = null;

/**
 * Loads the 'routes' library (DirectionsService/DirectionsRenderer/
 * TravelMode) on demand - called by PharmacyMap.jsx only when a customer
 * actually requests directions, not on every map load. Kept as a fully
 * separate load from the core map/marker libraries above so that if the
 * Directions API isn't enabled on the Cloud project (a separate opt-in from
 * the base Maps JavaScript API - see README "Google Maps Setup"), only the
 * on-demand directions feature degrades - the map itself, its markers, and
 * every other page that uses useGoogleMaps() keep working normally.
 */
export function loadRoutesLibrary() {
  if (!routesLoadPromise) {
    ensureOptionsSet();
    routesLoadPromise = importLibrary('routes');
  }
  return routesLoadPromise;
}

/**
 * Loads the core Google Maps JavaScript API on demand. Only ever invoked
 * from components that actually render a map (see
 * components/map/PharmacyMap.jsx), so pages that don't use maps never load
 * this script at all.
 */
export default function useGoogleMaps() {
  const [state, setState] = useState({ google: null, loading: true, error: null });

  useEffect(() => {
    if (!API_KEY) {
      setState({ google: null, loading: false, error: 'missing-key' });
      return undefined;
    }

    let active = true;

    const handleAuthFailure = () => {
      if (active) setState({ google: null, loading: false, error: 'auth-failure' });
    };
    authFailureListeners.add(handleAuthFailure);

    loadCoreLibraries()
      .then(() => {
        if (active) setState({ google: window.google, loading: false, error: null });
      })
      .catch((err) => {
        if (active) setState({ google: null, loading: false, error: err?.message || 'load-failed' });
      });

    return () => {
      active = false;
      authFailureListeners.delete(handleAuthFailure);
    };
  }, []);

  return state;
}
