/**
 * SUTRAN & Provías Carreteras Service:
 * Manages official road status for Peru's National Highway Network (Red Vial Nacional):
 * Interrupted, restricted, and clear highways due to landslides, overflowing rivers, and weather.
 * Caches reports locally so drivers, travelers and relief brigades can consult status offline.
 */

export type RoadAlertLevel = 'interrumpido' | 'restringido' | 'normal';

export interface RoadAlert {
  id: string;
  highway: string; // e.g., 'Panamericana Norte PE-1N', 'Carretera Central PE-22'
  department: string;
  location: string; // e.g., 'Km 84 - Matucana / San Mateo'
  cause: 'huaico' | 'desborde_rio' | 'derrumbe' | 'nevada' | 'mantenimiento' | 'bloqueo';
  level: RoadAlertLevel;
  description: string;
  updatedAt: string;
  alternativeRoute?: string;
}

const STORAGE_KEY = 'ayllu_sutran_alerts_v1';

// Base seed data for critical Peruvian highways
export const BASE_ROAD_ALERTS: RoadAlert[] = [
  {
    id: 'sutran-carretera-central-km84',
    highway: 'Carretera Central (PE-22)',
    department: 'Lima / Junín',
    location: 'Km 78 - 86 (Corcona - Matucana)',
    cause: 'derrumbe',
    level: 'restringido',
    description: 'Tránsito restringido a un carril por caída de rocas y lodo en quebradas activas. Maquinaria de Provías en la zona.',
    updatedAt: new Date().toISOString(),
    alternativeRoute: 'Ruta alterna por Canta - Huayllay - Cerro de Pasco para vehículos livianos.'
  },
  {
    id: 'sutran-panamericana-norte-km340',
    highway: 'Panamericana Norte (PE-1N)',
    department: 'Áncash / Casma',
    location: 'Km 375 (Sector Sechín)',
    cause: 'desborde_rio',
    level: 'normal',
    description: 'Vía completamente libre y transitable. Monitoreo constante del caudal del río Sechín.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sutran-panamericana-sur-km290',
    highway: 'Panamericana Sur (PE-1S)',
    department: 'Ica / Arequipa',
    location: 'Km 320 (Ocucaje)',
    cause: 'mantenimiento',
    level: 'normal',
    description: 'Tránsito fluido. Pavimento despejado sin presencia de arena en calzada.',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sutran-via-interoceanica-sur',
    highway: 'Vía Interoceánica Sur (PE-30C)',
    department: 'Cusco / Puno / Madre de Dios',
    location: 'Km 140 (Sector Urcos - Quincemil)',
    cause: 'huaico',
    level: 'restringido',
    description: 'Deslizamiento menor por lluvias persistentes en selva alta. Tránsito vehicular alternado con pase regulado.',
    updatedAt: new Date().toISOString(),
    alternativeRoute: 'Manejar a velocidad reducida con luces intermitentes.'
  }
];

export function getCachedRoadAlerts(): RoadAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : BASE_ROAD_ALERTS;
  } catch {
    return BASE_ROAD_ALERTS;
  }
}

export function saveRoadAlerts(alerts: RoadAlert[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  } catch (e) {
    console.warn('Could not cache road alerts', e);
  }
}

/** Direct contact numbers for road assistance in Peru */
export const ROAD_EMERGENCY_CONTACTS = {
  sutranWhatsapp: '+51999382606', // Fiscafono WhatsApp 24/7
  sutranTollFree: '080012345',     // SUTRAN Línea Gratuita
  proviasCentral: '016157800',     // Provías Nacional
  policiaCarreteras: '110'         // Policía de Protección de Carreteras PNP
};
