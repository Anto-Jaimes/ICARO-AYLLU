/**
 * OSINERGMIN "Facilito" GLP Service:
 * Manages official neighborhood distributors of 10kg domestic gas cylinders (GLP).
 * Allows citizens to find fair prices, verified safety seals, and direct local phone delivery
 * without middlemen or abusive price speculation during normal and emergency times.
 */
import { calculateDistanceMeters } from '../utils/geo';

export interface GasDistributor {
  id: string;
  name: string;
  brand: 'Solgas' | 'Llamagas' | 'Primax Gas' | 'Zeta Gas' | 'Costagas' | 'Lima Gas' | 'Multimarca';
  address: string;
  district: string;
  department: string;
  lat: number;
  lng: number;
  phone: string;
  price10kg: number; // Precio oficial en Soles
  osinergminCode: string; // Código de registro formal de Osinergmin
  hasHomeDelivery: boolean;
  distanceMeters?: number;
}

const BASE_GAS_DISTRIBUTORS: GasDistributor[] = [
  {
    id: 'osinergmin-gas-01',
    name: 'Distribuidora San Judas Tadeo',
    brand: 'Solgas',
    address: 'Jr. Huiracocha 1245',
    district: 'Jesús María',
    department: 'Lima',
    lat: -12.0735,
    lng: -77.0452,
    phone: '01 4632010',
    price10kg: 44.50,
    osinergminCode: 'OSIN-GLP-2024-8841',
    hasHomeDelivery: true
  },
  {
    id: 'osinergmin-gas-02',
    name: 'Gas del Centro y Servicios',
    brand: 'Primax Gas',
    address: 'Av. Brasil 890',
    district: 'Breña',
    department: 'Lima',
    lat: -12.0620,
    lng: -77.0480,
    phone: '01 3324512',
    price10kg: 43.00,
    osinergminCode: 'OSIN-GLP-2024-1923',
    hasHomeDelivery: true
  },
  {
    id: 'osinergmin-gas-03',
    name: 'Distribuidora Los Laureles',
    brand: 'Llamagas',
    address: 'Av. Las Flores de Primavera 580',
    district: 'San Juan de Lurigancho',
    department: 'Lima',
    lat: -12.0150,
    lng: -77.0040,
    phone: '01 3881290',
    price10kg: 41.50,
    osinergminCode: 'OSIN-GLP-2024-5542',
    hasHomeDelivery: true
  },
  {
    id: 'osinergmin-gas-04',
    name: 'Comercializadora El Sol',
    brand: 'Zeta Gas',
    address: 'Av. Túpac Amaru 2810',
    district: 'Comas',
    department: 'Lima',
    lat: -11.9450,
    lng: -77.0540,
    phone: '01 5378822',
    price10kg: 42.00,
    osinergminCode: 'OSIN-GLP-2024-3319',
    hasHomeDelivery: true
  },
  {
    id: 'osinergmin-gas-05',
    name: 'Distribuidora Virgen de la Puerta',
    brand: 'Lima Gas',
    address: 'Av. Próceres de la Independencia 2100',
    district: 'San Juan de Lurigancho',
    department: 'Lima',
    lat: -11.9950,
    lng: -77.0090,
    phone: '01 4589910',
    price10kg: 42.50,
    osinergminCode: 'OSIN-GLP-2024-7712',
    hasHomeDelivery: true
  },
  {
    id: 'osinergmin-gas-06',
    name: 'Punto Gas Arequipa - Cerro Colorado',
    brand: 'Solgas',
    address: 'Av. Aviación 612',
    district: 'Cerro Colorado',
    department: 'Arequipa',
    lat: -16.3750,
    lng: -71.5580,
    phone: '054 254411',
    price10kg: 45.00,
    osinergminCode: 'OSIN-GLP-AQP-014',
    hasHomeDelivery: true
  },
  {
    id: 'osinergmin-gas-07',
    name: 'Gas del Valle Sagrado',
    brand: 'Costagas',
    address: 'Av. Pachacútec 410',
    district: 'Wanchaq',
    department: 'Cusco',
    lat: -13.5280,
    lng: -71.9680,
    phone: '084 227744',
    price10kg: 46.50,
    osinergminCode: 'OSIN-GLP-CUZ-092',
    hasHomeDelivery: true
  }
];

const STORAGE_KEY = 'ayllu_osinergmin_gas_v1';

export function getCachedGasDistributors(userLat: number, userLng: number): GasDistributor[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: GasDistributor[] = raw ? JSON.parse(raw) : BASE_GAS_DISTRIBUTORS;
    return list.map((item) => ({
      ...item,
      distanceMeters: calculateDistanceMeters(userLat, userLng, item.lat, item.lng)
    })).sort((a, b) => a.price10kg - b.price10kg); // Ordenar por economía primero
  } catch {
    return BASE_GAS_DISTRIBUTORS.map((item) => ({
      ...item,
      distanceMeters: calculateDistanceMeters(userLat, userLng, item.lat, item.lng)
    })).sort((a, b) => a.price10kg - b.price10kg);
  }
}

export function saveGasDistributorsCache(list: GasDistributor[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // LocalStorage full or private browsing
  }
}
