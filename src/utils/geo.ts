// Calculates distance in meters between two lat/lng coordinates using the Haversine formula
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function formatDistance(meters?: number): string {
  if (meters === undefined || isNaN(meters)) return 'Cerca de ti';
  if (meters < 100) return 'A pocos pasos (<100m)';
  if (meters < 1000) return `A ${meters} metros`;
  return `A ${(meters / 1000).toFixed(1)} km`;
}

/** Returns a number that WhatsApp and the dialer can open, or undefined if it is not one. */
export function normalizePhone(rawPhone: string): string | undefined {
  const phone = rawPhone.replace(/[^\d+]/g, '');
  if (/^9\d{8}$/.test(phone)) return `+51${phone}`; // Peruvian mobile without country code
  return /^\+?\d{6,15}$/.test(phone) ? phone : undefined;
}

export function buildWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}
