export type Mode = 'normal' | 'emergency';

export type PostType = 
  | 'service'            // Oficio o servicio local
  | 'favor_offer'        // Ofrezco favor / préstamo / donación
  | 'favor_request'      // Necesito favor sin dinero
  | 'emergency_need'     // Emergencia: Necesidad humanitaria / persona vulnerable
  | 'emergency_resource' // Emergencia: Recurso crítico disponible
  | 'support_group';     // Emergencia: Grupo o brigada de apoyo

export type ServiceCategory = 
  | 'gasfiteria' 
  | 'electricidad' 
  | 'carpinteria' 
  | 'cerrajeria' 
  | 'mascotas' 
  | 'clases' 
  | 'alimentacion' 
  | 'salud' 
  | 'otros';

export type FavorCategory = 
  | 'herramientas' 
  | 'ayuda_temporal' 
  | 'donacion' 
  | 'habilidades' 
  | 'movilidad' 
  | 'otros';

export type EmergencyCategory = 
  | 'primeros_auxilios' 
  | 'agua_alimentos' 
  | 'energia_luz' 
  | 'rescate_movilidad' 
  | 'albergue_refugio' 
  | 'vulnerabilidad_mayor';

export interface Review {
  id: string;
  authorName: string;
  comment: string;
  date: string;
  /** When it was written, so the "Hace 5 min" can be shown again in another language. */
  dateIso?: string;
  isNeighborVerified: boolean;
}

export interface CommunityItem {
  id: string;
  title: string;
  description: string;
  type: PostType;
  category: ServiceCategory | FavorCategory | EmergencyCategory | string;
  authorName: string;
  authorPhone?: string;
  neighborhood: string;
  address?: string;
  coordinates: [number, number]; // [lat, lng]
  distanceMeters?: number;
  vistosBuenos: number; // Sistema de Visto Bueno Vecinal
  hasUserVoted?: boolean;
  isMine?: boolean;
  reviews: Review[];
  priceInfo?: string; // ej: "Tarifa vecinal accesible" o "Gratis / Solidario"
  /** Paths in the post-photos bucket, up to 4. */
  photos?: string[];
  /** Donations: given to any neighbour, or meant for an organisation (comedor, olla común, albergue). */
  audience?: 'vecinos' | 'organizacion';
  urgencyLevel?: 'baja' | 'media' | 'alta' | 'critica'; // para emergencias
  status: 'active' | 'in_progress' | 'resolved';
  createdAt: string;
  /** When it was posted, so the "Hace 5 min" can be shown again in another language. */
  createdAtIso?: string;
  isOfflineCreated?: boolean;
}

export interface UserLocation {
  lat: number;
  lng: number;
  name: string;
}
