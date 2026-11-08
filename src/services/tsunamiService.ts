import { tr } from '../i18n/translate';
/**
 * DHN (Dirección de Hidrografía y Navegación de la Marina de Guerra del Perú)
 * Centro Nacional de Alerta de Tsunamis (CNAT) Service.
 * Analyzes seismic events along the Peruvian coast and determines tsunami threat status.
 */

export type TsunamiStatus = 'ALERTA' | 'VIGILANCIA' | 'NO_GENERA';

export interface TsunamiBulletin {
  status: TsunamiStatus;
  title: string;
  detail: string;
  issuedAt: string;
  source: 'DHN - Marina de Guerra del Perú' | 'Estimación técnica AYLLU';
  coastalSafetyZoneMeters: number; // minimum safe elevation (30m)
  evacuationRecommended: boolean;
}

/**
 * Assesses tsunami potential in Peru based on IGP quake parameters & DHN protocol
 * (Epicenter latitude/longitude, depth, and magnitude).
 */
export function evaluateTsunamiRisk(
  magnitude: number,
  depthKm: number,
  lat: number,
  lng: number,
  quakeTime: string
): TsunamiBulletin {
  // Approximate Peru Pacific coastline longitude range (-82° to -70°) and latitude (0° to -19°)
  const isMarineOrCoastal = lng <= -75.0 && lat <= 0 && lat >= -19.5 && depthKm <= 70;

  if (magnitude >= 7.0 && isMarineOrCoastal) {
    return {
      status: 'ALERTA',
      title: tr('Posible tsunami en el litoral peruano'),
      detail: tr('Sismo de magnitud {magnitude} en el mar y poco profundo ({depth} km). Si estás en la costa, aléjate de la playa y sube ahora a una zona alta, a más de 30 metros. Sigue los comunicados de la DHN (Marina de Guerra).', { magnitude, depth: depthKm }),
      issuedAt: quakeTime || new Date().toISOString(),
      source: 'Estimación técnica AYLLU',
      coastalSafetyZoneMeters: 30,
      evacuationRecommended: true
    };
  }

  if (magnitude >= 6.0 && isMarineOrCoastal) {
    return {
      status: 'VIGILANCIA',
      title: tr('Atención en la costa'),
      detail: tr('Sismo de magnitud {magnitude} en el mar. Aléjate de la orilla de la playa y atiende los comunicados de la DHN (Marina de Guerra).', { magnitude }),
      issuedAt: quakeTime || new Date().toISOString(),
      source: 'Estimación técnica AYLLU',
      coastalSafetyZoneMeters: 15,
      evacuationRecommended: false
    };
  }

  return {
    status: 'NO_GENERA',
    title: tr('No se espera tsunami'),
    detail: tr('Por su magnitud, profundidad y lugar, este sismo no tiene las condiciones de un tsunami. Ante cualquier duda, sigue los comunicados de la DHN (Marina de Guerra).'),
    issuedAt: quakeTime || new Date().toISOString(),
    source: 'Estimación técnica AYLLU',
    coastalSafetyZoneMeters: 0,
    evacuationRecommended: false
  };
}

export const DHN_CONTACTS = {
  centralTsunamis: '012078900', // DHN Central
  canalVhfEmergencias: 'Canal 16 Marino',
  indeciCoen: '115'
};
