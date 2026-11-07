import { PERU_DEPARTMENTS } from './departments';

/** Province name -> [district, lat, lng][]. Official INEI list; loaded only when needed. */
type Provinces = Record<string, [string, number, number][]>;
export type Ubigeo = Record<string, Provinces>;

let ubigeo: Promise<Ubigeo> | null = null;

export function loadUbigeo(): Promise<Ubigeo> {
  ubigeo ??= import('./ubigeo.json').then((module) => module.default as unknown as Ubigeo);
  return ubigeo;
}

export interface PlaceChoice {
  departmentId: string;
  province: string;
  district: string;
}

export function departmentName(id: string): string {
  return PERU_DEPARTMENTS.find((department) => department.id === id)?.name ?? '';
}

export function districtCoordinates(data: Ubigeo, place: PlaceChoice): { lat: number; lng: number } | null {
  const match = data[place.departmentId]?.[place.province]?.find(([name]) => name === place.district);
  return match ? { lat: match[1], lng: match[2] } : null;
}

/** The closest district to a point, to prefill the place. The neighbour can always change it. */
export function nearestPlace(data: Ubigeo, lat: number, lng: number): PlaceChoice | null {
  let best: PlaceChoice | null = null;
  let bestDistance = Infinity;

  for (const [departmentId, provinces] of Object.entries(data)) {
    for (const [province, districts] of Object.entries(provinces)) {
      for (const [district, districtLat, districtLng] of districts) {
        const distance = (districtLat - lat) ** 2 + (districtLng - lng) ** 2;
        if (distance < bestDistance) {
          bestDistance = distance;
          best = { departmentId, province, district };
        }
      }
    }
  }
  return best;
}
