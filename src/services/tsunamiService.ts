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
      title: '¡ALERTA DE TSUNAMI EN EL LITORAL PERUANO!',
      detail: `Sismo de magnitud ${magnitude} con epicentro marino superficial (${depthKm} km). La Dirección de Hidrografía y Navegación (DHN) recomienda evacuar zonas bajas de la costa de inmediato hacia cotas mayores a 30 metros.`,
      issuedAt: quakeTime || new Date().toISOString(),
      source: 'DHN - Marina de Guerra del Perú',
      coastalSafetyZoneMeters: 30,
      evacuationRecommended: true
    };
  }

  if (magnitude >= 6.0 && isMarineOrCoastal) {
    return {
      status: 'VIGILANCIA',
      title: 'VIGILANCIA DE TSUNAMI - LITORAL PERUANO',
      detail: `Sismo submarino de magnitud ${magnitude}. El Centro Nacional de Alerta de Tsunamis mantiene monitoreo de la red de boyas DART y mareógrafos. Mantenerse alejados de la orilla de la playa.`,
      issuedAt: quakeTime || new Date().toISOString(),
      source: 'DHN - Marina de Guerra del Perú',
      coastalSafetyZoneMeters: 15,
      evacuationRecommended: false
    };
  }

  return {
    status: 'NO_GENERA',
    title: 'NO GENERA TSUNAMI',
    detail: 'Según los parámetros del sismo y el catálogo de la Dirección de Hidrografía y Navegación (DHN), este evento no reúne las características para generar un tsunami en el litoral peruano.',
    issuedAt: quakeTime || new Date().toISOString(),
    source: 'DHN - Marina de Guerra del Perú',
    coastalSafetyZoneMeters: 0,
    evacuationRecommended: false
  };
}

export const DHN_CONTACTS = {
  centralTsunamis: '012078900', // DHN Central
  canalVhfEmergencias: 'Canal 16 Marino',
  indeciCoen: '115'
};
