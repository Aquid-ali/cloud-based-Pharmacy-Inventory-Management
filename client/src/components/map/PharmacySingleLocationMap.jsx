import React, { useEffect, useRef } from 'react';
import useGoogleMaps from '../../hooks/useGoogleMaps';
import { getPharmacyIcon } from './pharmacyMarkerIcon';
import { SkeletonBlock } from '../Skeleton';

const DEFAULT_CENTER = { lat: 22.9734, lng: 78.6569 };
const ZOOM = 15;

/**
 * Single draggable-marker map for the admin pharmacy-profile location
 * preview - a simpler sibling to PharmacyMap.jsx (which handles many
 * clustered pharmacies + selection). No clustering, no multi-marker logic.
 */
const PharmacySingleLocationMap = ({ location, onDragEnd }) => {
  const { google, loading, error } = useGoogleMaps();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onDragEndRef = useRef(onDragEnd);

  useEffect(() => {
    onDragEndRef.current = onDragEnd;
  }, [onDragEnd]);

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
      {!location && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/90 rounded-2xl pointer-events-none px-6 text-center">
          <p className="text-xs text-ink-faint">No location set yet — save an address below to geocode one.</p>
        </div>
      )}
    </div>
  );
};

export default PharmacySingleLocationMap;
