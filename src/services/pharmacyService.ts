/**
 * DIGEMID & MINSA Pharmacy Service:
 * Manages official 24-hour on-duty pharmacies (Farmacias de Turno) and essential
 * generic medicines reference prices from DIGEMID (Dirección General de Medicamentos, Insumos y Drogas).
 * 
 * Works 100% offline with local cached records and GPS proximity calculation.
 */
import { calculateDistanceMeters } from '../utils/geo';

export interface EssentialMedicine {
  name: string;
  genericName: string;
  dosage: string;
  referencePriceSoles: number;
  category: 'analgesico' | 'antibiotico' | 'rehidratacion' | 'primeros_auxilios';
}

export interface Pharmacy {
  id: string;
  name: string;
  chain?: string;
  address: string;
  district: string;
  department: string;
  lat: number;
  lng: number;
  phone?: string;
  isOpen24h: boolean;
  isOnDuty: boolean; // Farmacia de turno oficial
  distanceMeters?: number;
  essentialStock?: string[]; // Meds available
}

export const ESSENTIAL_MEDICINES: EssentialMedicine[] = [
  {
    name: 'Paracetamol 500 mg',
    genericName: 'Paracetamol',
    dosage: 'Tableta 500mg (Fracción)',
    referencePriceSoles: 0.20,
    category: 'analgesico'
  },
  {
    name: 'Ibuprofeno 400 mg',
    genericName: 'Ibuprofeno',
    dosage: 'Tableta 400mg',
    referencePriceSoles: 0.30,
    category: 'analgesico'
  },
  {
    name: 'Sales de Rehidratación Oral (SRO)',
    genericName: 'Electrolitos orales',
    dosage: 'Sobre para 1 Litro',
    referencePriceSoles: 1.50,
    category: 'rehidratacion'
  },
  {
    name: 'Alcohol Medicinal 70° (500 ml)',
    genericName: 'Alcohol etílico',
    dosage: 'Frasco 500ml',
    referencePriceSoles: 4.50,
    category: 'primeros_auxilios'
  },
  {
    name: 'Gasa Estéril y Vendas Elásticas',
    genericName: 'Material de curación',
    dosage: 'Paquete de curación básica',
    referencePriceSoles: 2.50,
    category: 'primeros_auxilios'
  },
  {
    name: 'Amoxicilina 500 mg',
    genericName: 'Amoxicilina',
    dosage: 'Cápsula 500mg',
    referencePriceSoles: 0.50,
    category: 'antibiotico'
  }
];

const BASE_PHARMACIES: Pharmacy[] = [
  {
    id: 'digemid-ph-01',
    name: 'Botica Institucional MINSA - DIGEMID',
    chain: 'MINSA',
    address: 'Av. Salaverry 801, Jesús María',
    district: 'Jesús María',
    department: 'Lima',
    lat: -12.0712,
    lng: -77.0421,
    phone: '01 6314300',
    isOpen24h: true,
    isOnDuty: true,
    essentialStock: ['Paracetamol 500 mg', 'Ibuprofeno 400 mg', 'Sales de Rehidratación Oral (SRO)', 'Alcohol Medicinal 70° (500 ml)', 'Amoxicilina 500 mg']
  },
  {
    id: 'digemid-ph-02',
    name: 'Farmacia de Emergencia Hospital Loayza',
    chain: 'Minsa Emergencias',
    address: 'Av. Alfonso Ugarte 848',
    district: 'Cercado de Lima',
    department: 'Lima',
    lat: -12.0478,
    lng: -77.0422,
    phone: '01 6144646',
    isOpen24h: true,
    isOnDuty: true,
    essentialStock: ['Paracetamol 500 mg', 'Gasa Estéril y Vendas Elásticas', 'Alcohol Medicinal 70° (500 ml)', 'Sales de Rehidratación Oral (SRO)']
  },
  {
    id: 'digemid-ph-03',
    name: 'Botica Comunal Santa Rosa - De Turno',
    chain: 'Botica Comunal',
    address: 'Av. Gran Chimú 1420',
    district: 'San Juan de Lurigancho',
    department: 'Lima',
    lat: -12.0234,
    lng: -77.0012,
    phone: '01 4598712',
    isOpen24h: true,
    isOnDuty: true,
    essentialStock: ['Paracetamol 500 mg', 'Ibuprofeno 400 mg', 'Alcohol Medicinal 70° (500 ml)', 'Gasa Estéril y Vendas Elásticas']
  },
  {
    id: 'digemid-ph-04',
    name: 'Farmacia Hospital Rebagliati (Puerta Emergencia)',
    chain: 'EsSalud Farmacias',
    address: 'Av. Rebagliati 490',
    district: 'Jesús María',
    department: 'Lima',
    lat: -12.0782,
    lng: -77.0371,
    phone: '01 2654901',
    isOpen24h: true,
    isOnDuty: true,
    essentialStock: ['Paracetamol 500 mg', 'Ibuprofeno 400 mg', 'Sales de Rehidratación Oral (SRO)', 'Amoxicilina 500 mg']
  },
  {
    id: 'digemid-ph-05',
    name: 'Botica Popular Señor de los Milagros',
    chain: 'Independiente',
    address: 'Av. Túpac Amaru 3450',
    district: 'Comas',
    department: 'Lima',
    lat: -11.9321,
    lng: -77.0512,
    phone: '01 5429011',
    isOpen24h: false,
    isOnDuty: true,
    essentialStock: ['Paracetamol 500 mg', 'Alcohol Medicinal 70° (500 ml)', 'Gasa Estéril y Vendas Elásticas']
  },
  {
    id: 'digemid-ph-06',
    name: 'Botica Salud y Vida - 24 Horas',
    chain: 'Red Vecinal',
    address: 'Av. Universitaria 1820',
    district: 'San Miguel',
    department: 'Lima',
    lat: -12.0745,
    lng: -77.0789,
    phone: '01 5621489',
    isOpen24h: true,
    isOnDuty: true,
    essentialStock: ['Paracetamol 500 mg', 'Ibuprofeno 400 mg', 'Sales de Rehidratación Oral (SRO)', 'Alcohol Medicinal 70° (500 ml)']
  },
  {
    id: 'digemid-ph-07',
    name: 'Botica Regional del Sur - De Turno',
    chain: 'Red Regional Arequipa',
    address: 'Calle San Juan de Dios 214',
    district: 'Cercado',
    department: 'Arequipa',
    lat: -16.4012,
    lng: -71.5356,
    phone: '054 284512',
    isOpen24h: true,
    isOnDuty: true,
    essentialStock: ['Paracetamol 500 mg', 'Alcohol Medicinal 70° (500 ml)', 'Gasa Estéril y Vendas Elásticas']
  },
  {
    id: 'digemid-ph-08',
    name: 'Botica Imperial Qosqo - 24H',
    chain: 'Red Regional Cusco',
    address: 'Av. El Sol 620',
    district: 'Wanchaq',
    department: 'Cusco',
    lat: -13.5218,
    lng: -71.9734,
    phone: '084 231456',
    isOpen24h: true,
    isOnDuty: true,
    essentialStock: ['Paracetamol 500 mg', 'Ibuprofeno 400 mg', 'Sales de Rehidratación Oral (SRO)']
  }
];

const STORAGE_KEY = 'ayllu_digemid_pharmacies_v1';

export function getCachedPharmacies(userLat: number, userLng: number): Pharmacy[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: Pharmacy[] = raw ? JSON.parse(raw) : BASE_PHARMACIES;
    return list.map((item) => ({
      ...item,
      distanceMeters: calculateDistanceMeters(userLat, userLng, item.lat, item.lng)
    })).sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));
  } catch {
    return BASE_PHARMACIES.map((item) => ({
      ...item,
      distanceMeters: calculateDistanceMeters(userLat, userLng, item.lat, item.lng)
    })).sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));
  }
}

export function savePharmaciesCache(list: Pharmacy[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // LocalStorage full or private browsing
  }
}
