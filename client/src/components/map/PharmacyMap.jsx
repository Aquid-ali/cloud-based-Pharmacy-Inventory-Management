import React, { useEffect, useRef } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import useGoogleMaps, { loadRoutesLibrary } from '../../hooks/useGoogleMaps';
import { getPharmacyIcon, getUserLocationIcon } from './pharmacyMarkerIcon';
import { SkeletonBlock } from '../Skeleton';

// Falls back to roughly the center of India if there's neither a user
// location nor any geocoded pharmacy to frame - just a starting viewport,
// never shown as a claim about anything's actual location.
const DEFAULT_CENTER = { lat: 22.9734, lng: 78.6569 };
const DEFAULT_ZOOM = 5;

/**
 * Owns a single google.maps.Map instance for its whole lifetime (never
 * recreated on re-render) and layers pharmacy/user markers on top of it as
 * props change. Markers with missing/invalid coordinates are silently
 * skipped rather than crashing the map.
 */
const PharmacyMap = ({
  pharmacies,
  userLocation,
  selectedId,
  onSelect,
  directionsRequest,
  onDirectionsResult,
}) => {
  const { google, loading, error } = useGoogleMaps();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const clustererRef = useRef(null);
  const userMarkerRef = useRef(null);
  const lastFitIdsRef = useRef('');
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const onDirectionsResultRef = useRef(onDirectionsResult);

  useEffect(() => {
    onDirectionsResultRef.current = onDirectionsResult;
  }, [onDirectionsResult]);

  // Create the map + clusterer exactly once, as soon as the API is ready and
  // the container div exists. The DirectionsRenderer is deliberately NOT
  // created here - it needs the separately-loaded 'routes' library (see
  // loadRoutesLibrary in useGoogleMaps.js), which core map rendering must
  // never depend on. It's created lazily on first actual directions request.
  useEffect(() => {
    if (!google || !containerRef.current || mapRef.current) return;
    mapRef.current = new google.maps.Map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeControl: false,
      clickableIcons: false,
    });
    clustererRef.current = new MarkerClusterer({ map: mapRef.current, markers: [] });
  }, [google]);

  // Rebuild pharmacy markers whenever the list changes.
  useEffect(() => {
    if (!google || !mapRef.current) return;
    const map = mapRef.current;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();
    clustererRef.current?.clearMarkers();

    const valid = pharmacies.filter(
      (p) =>
        typeof p.location?.lat === 'number' &&
        typeof p.location?.lng === 'number' &&
        !Number.isNaN(p.location.lat) &&
        !Number.isNaN(p.location.lng)
    );

    const newMarkers = valid.map((p) => {
      const marker = new google.maps.Marker({
        position: { lat: p.location.lat, lng: p.location.lng },
        icon: getPharmacyIcon(google, { selected: p._id === selectedId }),
        title: p.name,
        optimized: true,
      });
      marker.addListener('click', () => onSelect(p._id));
      markersRef.current.set(p._id, marker);
      return marker;
    });

    clustererRef.current?.addMarkers(newMarkers);

    // Only re-fit the viewport when the set of pharmacies OR any of their
    // coordinates actually changes - never on a mere selection change, so
    // clicking a marker/list row can't fight with an unrelated re-zoom.
    // Keying on coordinates too (not just IDs) matters: if an already-shown
    // pharmacy's location is edited and saved, its marker is rebuilt at the
    // new position, but without this the viewport would never re-center to
    // follow it - the marker could end up off-screen, looking exactly like
    // the map "didn't update".
    const idsKey = valid.map((p) => `${p._id}:${p.location.lat},${p.location.lng}`).sort().join('|');
    if (idsKey && idsKey !== lastFitIdsRef.current) {
      lastFitIdsRef.current = idsKey;
      if (valid.length === 1 && !userLocation) {
        map.setCenter({ lat: valid[0].location.lat, lng: valid[0].location.lng });
        map.setZoom(14);
      } else {
        const bounds = new google.maps.LatLngBounds();
        valid.forEach((p) => bounds.extend({ lat: p.location.lat, lng: p.location.lng }));
        if (userLocation) bounds.extend(userLocation);
        map.fitBounds(bounds, 64);
      }
    }
    // Deliberately excludes selectedId/userLocation/onSelect - re-running
    // this effect for those would rebuild every marker just to change one
    // icon or re-fit bounds unnecessarily; see the dedicated effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [google, pharmacies]);

  // Restyle (not rebuild) markers when the selection changes.
  useEffect(() => {
    if (!google) return;
    markersRef.current.forEach((marker, id) => {
      marker.setIcon(getPharmacyIcon(google, { selected: id === selectedId }));
    });
  }, [google, selectedId]);

  // Pan to the selected pharmacy - covers selection made from the list.
  useEffect(() => {
    if (!google || !mapRef.current || !selectedId) return;
    const marker = markersRef.current.get(selectedId);
    if (marker) mapRef.current.panTo(marker.getPosition());
  }, [google, selectedId]);

  // Keep a single "you are here" marker in sync with the user's location.
  useEffect(() => {
    if (!google || !mapRef.current) return;
    userMarkerRef.current?.setMap(null);
    userMarkerRef.current = null;
    if (userLocation) {
      userMarkerRef.current = new google.maps.Marker({
        position: userLocation,
        map: mapRef.current,
        icon: getUserLocationIcon(google),
        title: 'Your location',
        zIndex: 999,
        clickable: false,
      });
    }
  }, [google, userLocation]);

  // On-demand Directions - only ever requested when directionsRequest is set
  // (an explicit "Get Directions" click, see PharmacyInfoCard), never
  // automatically and never per-marker. Depends on the destination's raw
  // coordinates rather than the `pharmacies` array reference, and reads
  // onDirectionsResult via a ref, so an unrelated re-render (a list refetch,
  // a parent state change) can never silently re-trigger a billed request.
  const selectedPharmacy = pharmacies.find((p) => p._id === selectedId);
  const destLat = selectedPharmacy?.location?.lat;
  const destLng = selectedPharmacy?.location?.lng;
  const requestingDirections = Boolean(directionsRequest);
  const travelMode = directionsRequest?.travelMode || 'DRIVING';

  useEffect(() => {
    if (!google || !mapRef.current) return undefined;

    if (!requestingDirections) {
      directionsRendererRef.current?.setDirections({ routes: [] });
      return undefined;
    }

    if (!userLocation || destLat == null || destLng == null) {
      onDirectionsResultRef.current?.({ error: 'missing-endpoint' });
      return undefined;
    }

    let cancelled = false;

    // Loads the 'routes' library on first use only (see useGoogleMaps.js) -
    // if the Directions API isn't enabled on the Cloud project, this
    // rejects and only the directions feature degrades; the map itself is
    // completely unaffected since it never depends on this library.
    loadRoutesLibrary()
      .then(() => {
        if (cancelled) return;
        if (!directionsRendererRef.current) {
          // suppressMarkers: this app already draws its own pharmacy/user
          // markers - Directions' default A/B pins would just duplicate them.
          directionsRendererRef.current = new google.maps.DirectionsRenderer({
            map: mapRef.current,
            suppressMarkers: true,
          });
        }
        if (!directionsServiceRef.current) {
          directionsServiceRef.current = new google.maps.DirectionsService();
        }

        directionsServiceRef.current.route(
          {
            origin: userLocation,
            destination: { lat: destLat, lng: destLng },
            travelMode: google.maps.TravelMode[travelMode],
          },
          (result, status) => {
            if (cancelled) return;
            if (status === 'OK' && result) {
              directionsRendererRef.current.setDirections(result);
              const leg = result.routes[0]?.legs[0];
              onDirectionsResultRef.current?.({
                distanceText: leg?.distance?.text,
                durationText: leg?.duration?.text,
              });
            } else {
              onDirectionsResultRef.current?.({ error: status });
            }
          }
        );
      })
      .catch(() => {
        if (!cancelled) onDirectionsResultRef.current?.({ error: 'ROUTES_UNAVAILABLE' });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [google, requestingDirections, travelMode, destLat, destLng, userLocation?.lat, userLocation?.lng]);

  if (loading) {
    return <SkeletonBlock className="w-full h-full min-h-[16rem]" />;
  }

  if (error) {
    return (
      <div className="w-full h-full min-h-[16rem] flex flex-col items-center justify-center gap-1 bg-slate-50 rounded-3xl border border-slate-200 text-center p-6">
        <p className="text-sm font-semibold text-ink">Map couldn&apos;t be loaded.</p>
        <p className="text-xs text-ink-faint">Please try again later.</p>
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full min-h-[16rem] rounded-3xl overflow-hidden" />;
};

export default PharmacyMap;
