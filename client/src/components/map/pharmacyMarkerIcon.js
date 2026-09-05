// Custom map marker icons, built as google.maps.Symbol path shapes (crisp at
// any zoom, no image asset needed) instead of Google's default red pin.
// Takes the loaded `google` namespace as a parameter rather than importing it
// - these are only ever called after useGoogleMaps confirms the API is ready.

// Standard "place" pin glyph path, 24x24 coordinate space.
const PIN_PATH = 'M 12 2 C 8.13 2 5 5.13 5 9 c 0 5.25 7 13 7 13 s 7 -7.75 7 -13 c 0 -3.87 -3.13 -7 -7 -7 z';

export const getPharmacyIcon = (google, { selected = false } = {}) => ({
  path: PIN_PATH,
  fillColor: selected ? '#22D3EE' : '#3B82F6',
  fillOpacity: 1,
  strokeColor: selected ? '#07111F' : '#ffffff',
  strokeWeight: selected ? 2 : 1.5,
  scale: selected ? 1.9 : 1.5,
  anchor: new google.maps.Point(12, 22),
});

export const getUserLocationIcon = (google) => ({
  path: google.maps.SymbolPath.CIRCLE,
  fillColor: '#07111F',
  fillOpacity: 1,
  strokeColor: '#ffffff',
  strokeWeight: 2,
  scale: 7,
});
