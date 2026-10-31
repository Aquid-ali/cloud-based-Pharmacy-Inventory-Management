import React, { useEffect, useRef, useState } from 'react';
import useGoogleMaps from '../../hooks/useGoogleMaps';
import { getPharmacyIcon } from './pharmacyMarkerIcon';
import { SkeletonBlock } from '../Skeleton';

const DEFAULT_CENTER = { lat: 22.9734, lng: 78.6569 };
const ZOOM = 15;

/**
 * Single draggable-marker map for the admin pharmacy-profile location
 * preview - a simpler sibling to PharmacyMap.jsx (which handles many
 * clustered pharmacies + selection). No clustering, no multi-marker logic.
 *
 * When no location is set the user can click anywhere on the map to drop
 * the first pin; thereafter it remains draggable for fine-tuning.
 */
const PharmacySingleLocationMap = ({ location, onDragEnd }) => {
  const { google, loading, error } = useGoogleMaps();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const clickListenerRef = useRef(null);
  const onDragEndRef = useRef(onDragEnd);
  // Tracks whether we should show the "click to place" hint overlay.
  const [showHint, setShowHint] = useState(!location);

  useEffect(() => {
    onDragEndRef.current = onDragEnd;
  }, [onDragEnd]);

  // Keep hint visibility in sync with the location prop.
  useEffect(() => {
    if (location) setShowHint(false);
  }, [location]);

  // Create the map exactly once.
  useEffect(() => {
    if (!google || !containerRef.current || mapRef.current) return;
    mapRef.current = new google.maps.Map(containerRef.current, {
      center: location || DEFAULT_CENTER,
      zoom: location ? ZOOM : 5,
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeControl: false,
      clickableIcons: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [google]);

  // Attach / detach the click-to-place listener depending on whether a
  // location already exists.  Once the user places or the parent provides
  // a location the listener is removed so normal dragging takes over.
  useEffect(() => {
    if (!google || !mapRef.current) return;

    // Remove any previous click listener before deciding whether to add one.
    if (clickListenerRef.current) {
      google.maps.event.removeListener(clickListenerRef.current);
      clickListenerRef.current = null;
    }

    if (!location) {
      // No location yet — let the user click the map to place the first pin.
      clickListenerRef.current = mapRef.current.addListener('click', (e) => {
        const newLoc = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setShowHint(false);
        onDragEndRef.current?.(newLoc);
      });
    }

    return () => {
      if (clickListenerRef.current) {
        google.maps.event.removeListener(clickListenerRef.current);
        clickListenerRef.current = null;
      }
    };
  }, [google, location]);

  // Keep the marker + viewport in sync with the `location` prop.
  useEffect(() => {
    if (!google || !mapRef.current) return;

    if (!location) {
      markerRef.current?.setMap(null);
      markerRef.current = null;
      return;
    }

    if (!markerRef.current) {
      markerRef.current = new google.maps.Marker({
        position: location,
        map: mapRef.current,
        icon: getPharmacyIcon(google, { selected: true }),
        draggable: true,
      });
      markerRef.current.addListener('dragend', () => {
        const pos = markerRef.current.getPosition();
        onDragEndRef.current?.({ lat: pos.lat(), lng: pos.lng() });
      });
    } else {
      markerRef.current.setPosition(location);
    }

    mapRef.current.setCenter(location);
    mapRef.current.setZoom(ZOOM);
  }, [google, location]);

  if (loading) {
    return <SkeletonBlock className="w-full h-56 rounded-2xl" />;
  }

  if (error) {
    return (
      <div className="w-full h-56 flex flex-col items-center justify-center gap-1 bg-slate-50 rounded-2xl border border-slate-200 text-center p-4">
        <p className="text-sm font-semibold text-ink">Map couldn&apos;t be loaded.</p>
        <p className="text-xs text-ink-faint">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={containerRef} className="w-full h-56 rounded-2xl overflow-hidden border border-slate-200" />
      {showHint && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-slate-50/80 rounded-2xl pointer-events-none px-6 text-center">
          {/* Pin icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-brandPrimary opacity-80">
            <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.003 3.5-4.697 3.5-8.327a8 8 0 10-16 0c0 3.63 1.556 6.326 3.5 8.327a19.583 19.583 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
          <p className="text-xs font-medium text-ink-faint leading-snug">
            No location set — <span className="text-brandPrimary font-semibold">click anywhere on the map</span> to place a pin,<br />
            or save your address to auto-geocode it.
          </p>
        </div>
      )}
    </div>
  );
};

export default PharmacySingleLocationMap;
