/**
 * Safe Places Service: Queries OpenStreetMap Overpass API for critical humanitarian infrastructure:
 * Hospitals, water points, shelters/assembly points, fire stations, and police.
 * All results are automatically cached locally in LocalStorage for 100% offline access.
 */

export interface SafePlace {
  id: string;
  name: string;
  category: 'salud' | 'agua' | 'refugio' | 'bomberos' | 'policia';
  lat: number;
  lng: number;
  address?: string;
  phone?: string;
  operator?: string;
  distanceMeters?: number;
}

const CACHE_KEY = 'ayllu_safe_places_cache_v1';
const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// Key emergency base points in Peru as offline fallback
const FALLBACK_SAFE_PLACES: SafePlace[] = [
  {
    id: 'cgbvp-central',
    name: 'Cuerpo General de Bomberos del Perú (CGBVP) - Central 116',
    category: 'bomberos',
    lat: -12.0628,
    lng: -77.0345,
    address: 'Av. Salaverry / Av. Cuba, Jesús María',
    phone: '116'
  },
  {
    id: 'hospital-loayza',
    name: 'Hospital Nacional Arzobispo Loayza (SAMU 106)',
    category: 'salud',
    lat: -12.0478,
    lng: -77.0422,
    address: 'Av. Alfonso Ugarte 848, Lima',
    phone: '106'
  },
  {
    id: 'hospital-rebagliati',
    name: 'Hospital Nacional Edgardo Rebagliati Martins',
    category: 'salud',
    lat: -12.0782,
    lng: -77.0371,
    address: 'Av. Edgardo Rebagliati 490, Jesús María',
    phone: '01 2654901'
  },
  {
    id: 'indeci-campo-marte',
    name: 'Zona Segura y Refugio de Evacuación Campo de Marte (INDECI)',
    category: 'refugio',
    lat: -12.0694,
    lng: -77.0416,
    address: 'Campo de Marte, Jesús María'
  },
  {
    id: 'punto-agua-sedapal-1',
    name: 'Punto de Distribución de Agua de Emergencia Sedapal',
    category: 'agua',
    lat: -12.0520,
    lng: -77.0450,
    address: 'Reservorio y pileta pública comunitaria'
  },
  {
    id: 'comisaria-lima-central',
    name: 'Comisaría PNP Alfonso Ugarte - Central 105',
    category: 'policia',
    lat: -12.0440,
    lng: -77.0435,
    address: 'Av. Alfonso Ugarte, Lima',
    phone: '105'
  }
];

interface CachedPayload {
  timestamp: number;
  lat: number;
  lng: number;
  places: SafePlace[];
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getCachedSafePlaces(userLat: number, userLng: number): SafePlace[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) {
      return withDistances(FALLBACK_SAFE_PLACES, userLat, userLng);
    }
    const data: CachedPayload = JSON.parse(raw);
    const isExpired = Date.now() - data.timestamp > CACHE_MAX_AGE_MS;
    const places = !isExpired && data.places && data.places.length > 0 ? data.places : FALLBACK_SAFE_PLACES;
    return withDistances(places, userLat, userLng);
  } catch {
    return withDistances(FALLBACK_SAFE_PLACES, userLat, userLng);
  }
}

function withDistances(places: SafePlace[], lat: number, lng: number): SafePlace[] {
  return places.map((p) => ({
    ...p,
    distanceMeters: calculateDistance(lat, lng, p.lat, p.lng)
  })).sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));
}

/**
 * Fetches emergency infrastructure from OpenStreetMap Overpass API within radiusMeters (default 4000m)
 */
export async function fetchNearbySafePlaces(lat: number, lng: number, radiusMeters = 4000): Promise<SafePlace[]> {
  const overpassQuery = `
    [out:json][timeout:15];
    (
      nwr["amenity"~"hospital|clinic|pharmacy"](around:${radiusMeters},${lat},${lng});
      nwr["amenity"="drinking_water"](around:${radiusMeters},${lat},${lng});
      nwr["man_made"="water_well"](around:${radiusMeters},${lat},${lng});
      nwr["emergency"~"shelter|disaster_help_point|assembly_point"](around:${radiusMeters},${lat},${lng});
      nwr["amenity"="fire_station"](around:${radiusMeters},${lat},${lng});
      nwr["amenity"="police"](around:${radiusMeters},${lat},${lng});
    );
    out center 40;
  `;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(overpassQuery)}`,
      signal: AbortSignal.timeout(9000)
    });

    if (!response.ok) {
      throw new Error(`Overpass HTTP ${response.status}`);
    }

    const data = await response.json();
    const rawElements = data.elements || [];

    const fetched: SafePlace[] = [];

    for (const el of rawElements) {
      const tags = el.tags || {};
      const elLat = el.lat ?? el.center?.lat;
      const elLng = el.lon ?? el.center?.lon;
      if (!elLat || !elLng) continue;

      let category: SafePlace['category'] = 'refugio';
      let defaultName = 'Punto de Emergencia';

      if (tags.amenity === 'hospital' || tags.amenity === 'clinic' || tags.amenity === 'pharmacy') {
        category = 'salud';
        defaultName = tags.amenity === 'hospital' ? 'Hospital' : tags.amenity === 'clinic' ? 'Posta / Clínica' : 'Farmacia';
      } else if (tags.amenity === 'drinking_water' || tags.man_made === 'water_well') {
        category = 'agua';
        defaultName = 'Punto de Agua Potable';
      } else if (tags.amenity === 'fire_station') {
        category = 'bomberos';
        defaultName = 'Compañía de Bomberos';
      } else if (tags.amenity === 'police') {
        category = 'policia';
        defaultName = 'Comisaría PNP';
      } else if (tags.emergency === 'shelter' || tags.emergency === 'assembly_point' || tags.emergency === 'disaster_help_point') {
        category = 'refugio';
        defaultName = 'Zona Segura / Albergue INDECI';
      }

      fetched.push({
        id: `osm-${el.id}`,
        name: tags.name || tags['name:es'] || defaultName,
        category,
        lat: elLat,
        lng: elLng,
        address: tags['addr:street'] ? `${tags['addr:street']} ${tags['addr:housenumber'] || ''}`.trim() : undefined,
        phone: tags.phone || tags['contact:phone']
      });
    }

    const merged = fetched.length > 0 ? fetched : FALLBACK_SAFE_PLACES;
    const finalPlaces = withDistances(merged, lat, lng);

    // Save to cache
    try {
      const payload: CachedPayload = {
        timestamp: Date.now(),
        lat,
        lng,
        places: finalPlaces
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch {
      // storage full, ignore
    }

    return finalPlaces;
  } catch (error) {
    console.warn('Overpass API failed or offline, using cached/fallback places:', error);
    return getCachedSafePlaces(lat, lng);
  }
}
