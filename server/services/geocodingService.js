// Server-side wrapper around the Google Geocoding API - the single place that
// turns a postal address into { lat, lng }. Shared by the one-time backfill
// script (scripts/geocodePharmacyAddresses.js) and the live pharmacy-profile
// update endpoint (pharmacyController.updatePharmacy), so there's exactly one
// implementation of "how an address becomes coordinates."

/**
 * Geocodes a postal address via the Google Geocoding API.
 *
 * Distinguishes "the address itself couldn't be found" (ZERO_RESULTS - the
 * caller's fault, worth surfacing to whoever typed the address) from every
 * other failure mode (REQUEST_DENIED, OVER_QUERY_LIMIT, network errors,
 * etc. - a service/configuration problem, NOT the address's fault) so
 * callers never blame the user's address for what's actually a billing/key
 * misconfiguration on our end. See isAddressNotFound().
 *
 * @returns {Promise<{status: 'OK', lat: number, lng: number} | {status: string, errorMessage?: string}>}
 */
async function geocodeAddress({ address, city, state, pincode }, apiKey) {
  const query = [address, city, state, pincode].filter(Boolean).join(', ');
  if (!query.trim()) {
    return { status: 'INVALID_REQUEST', errorMessage: 'No address fields provided' };
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
    const { lat, lng } = data.results[0].geometry.location;
    return { status: 'OK', lat, lng };
  }

  return { status: data.status || 'UNKNOWN_ERROR', errorMessage: data.error_message };
}

/** True only when Google genuinely couldn't find any place matching the address. */
const isAddressNotFound = (status) => status === 'ZERO_RESULTS';

module.exports = { geocodeAddress, isAddressNotFound };
