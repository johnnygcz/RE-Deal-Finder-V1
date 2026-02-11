// Point-in-polygon detection using ray-casting algorithm
// Used to determine which Windsor ward a property belongs to

/**
 * Determines if a point (lat, lng) is inside a polygon
 * Uses ray-casting algorithm: counts how many times a ray crosses polygon edges
 * Odd number of crossings = inside, Even = outside
 */
export function pointInPolygon(point, polygon) {
  const [lat, lng] = point;
  const coords = polygon[0]; // polygon is array of rings, we use outer ring
  
  let inside = false;
  
  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const [lngI, latI] = coords[i]; // GeoJSON uses [lng, lat]
    const [lngJ, latJ] = coords[j];
    
    const intersect = ((latI > lat) !== (latJ > lat)) &&
      (lng < (lngJ - lngI) * (lat - latI) / (latJ - latI) + lngI);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Finds which ward contains the given coordinates
 * Returns ward object with NUMBER, Name, COUNCILLOR or null if not found
 */
export function findWardForLocation(lat, lng, wardFeatures) {
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return null;
  }
  
  // Parse string coordinates if needed (Monday.com returns them as strings)
  const latNum = typeof lat === 'string' ? parseFloat(lat) : lat;
  const lngNum = typeof lng === 'string' ? parseFloat(lng) : lng;
  
  if (!latNum || !lngNum || isNaN(latNum) || isNaN(lngNum)) {
    return null;
  }
  
  for (const feature of wardFeatures) {
    if (pointInPolygon([latNum, lngNum], feature.geometry.coordinates)) {
      return {
        number: feature.properties.NUMBER,
        name: feature.properties.Name,
        councillor: feature.properties.COUNCILLOR
      };
    }
  }
  
  return null; // Not in any ward
}
