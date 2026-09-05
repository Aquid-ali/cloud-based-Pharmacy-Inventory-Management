// Formats a distance already computed server-side (Pharmacy.distanceKm from
// getNearbyPharmacies' Haversine calculation) - never recomputes it. This is
// straight-line/geodesic distance, not a road/travel distance; callers should
// label it accordingly (see PharmacyInfoCard/PharmacyListItem).
export function formatDistance(km) {
  if (km == null || Number.isNaN(km)) return null;
  if (km < 1) return `${Math.round((km * 1000) / 10) * 10} m`;
  return `${km.toFixed(1)} km`;
}
