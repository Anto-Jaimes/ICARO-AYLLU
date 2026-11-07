/**
 * Service for reverse geocoding and pedestrian routing.
 * Uses OpenStreetMap Nominatim and OSRM (Open Source Routing Machine) Walking profile.
 * Completely free, no API key required, with in-memory caching.
 */

const geocodeCache = new Map<string, string>();
const walkingRouteCache = new Map<string, { durationMinutes: number; distanceMeters: number }>();

export interface WalkingEstimate {
  distanceMeters: number;
  durationMinutes: number;
  formattedText: string;
}

/**
 * Converts latitude and longitude coordinates into a human-readable street and neighborhood name.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AYLLU-App/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim responded with status ${response.status}`);
    }

    const data = await response.json();
    const address = data.address || {};
    
    // Pick the most relevant local details
    const road = address.road || address.pedestrian || address.neighbourhood || address.suburb || '';
    const houseNumber = address.house_number ? ` #${address.house_number}` : '';
    const district = address.suburb || address.city_district || address.town || address.city || '';

    const street = road ? `${road}${houseNumber}` : '';
    const formatted = [street, district].filter(Boolean).join(', ') || 'Tu ubicación';
    geocodeCache.set(cacheKey, formatted);
    return formatted;
  } catch (error) {
    console.warn('Reverse geocoding fallback used:', error);
    return 'Tu ubicación';
  }
}

/**
 * Calculates real pedestrian walking route distance and time between two points using OSRM Walking API.
 */
export async function calculateWalkingEstimate(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<WalkingEstimate> {
  const cacheKey = `${originLat.toFixed(4)},${originLng.toFixed(4)}->${destLat.toFixed(4)},${destLng.toFixed(4)}`;
  if (walkingRouteCache.has(cacheKey)) {
    const cached = walkingRouteCache.get(cacheKey)!;
    return {
      distanceMeters: cached.distanceMeters,
      durationMinutes: cached.durationMinutes,
      formattedText: formatWalkingText(cached.durationMinutes, cached.distanceMeters)
    };
  }

  try {
    // OSRM coordinates order: {longitude},{latitude}
    const url = `https://router.project-osrm.org/route/v1/foot/${originLng},${originLat};${destLng},${destLat}?overview=false`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`OSRM responded with status ${response.status}`);
    }

    const data = await response.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distanceMeters = Math.round(route.distance);
      const durationMinutes = Math.max(1, Math.round(route.duration / 60));

      walkingRouteCache.set(cacheKey, { distanceMeters, durationMinutes });

      return {
        distanceMeters,
        durationMinutes,
        formattedText: formatWalkingText(durationMinutes, distanceMeters)
      };
    }
  } catch (err) {
    console.warn('OSRM walking route error, using Haversine fallback estimate:', err);
  }

  // Fallback estimation assuming walking speed of 4.5 km/h (75 m/min)
  const dLat = (destLat - originLat) * 111000;
  const dLng = (destLng - originLng) * 111000 * Math.cos((originLat * Math.PI) / 180);
  const straightDistance = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));
  const walkingDistance = Math.round(straightDistance * 1.25); // Factor for street detours
  const minutes = Math.max(1, Math.round(walkingDistance / 75));

  return {
    distanceMeters: walkingDistance,
    durationMinutes: minutes,
    formattedText: formatWalkingText(minutes, walkingDistance)
  };
}

function formatWalkingText(minutes: number, distanceMeters: number): string {
  if (minutes <= 1) return `A 1 min a pie (${distanceMeters}m)`;
  if (distanceMeters < 1000) return `A ${minutes} min a pie (${distanceMeters}m)`;
  return `A ${minutes} min a pie (${(distanceMeters / 1000).toFixed(1)} km)`;
}
