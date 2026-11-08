import type { HazardFeed } from '../services/hazardService';
import { tr } from '../i18n/translate';

/** Why the app suggests emergency mode, from official data only. */
export interface EmergencyReason {
  /** Stable for the same event, so a "not now" is remembered for it. */
  id: string;
  title: string;
  line: string;
}

// Magnitude 6 is when damage starts to be likely in Peru's towns; IGP data arrives within minutes.
const STRONG_QUAKE = 6;
const RECENT_QUAKE_MS = 3 * 3_600_000;
const RED_LEVEL = 4;

/** A strong quake in the neighbour's department, or a red warning right where they are. */
export function emergencyReason(feed: HazardFeed | null, now = Date.now()): EmergencyReason | null {
  if (!feed) return null;

  const quake = feed.quakes.find(
    (item) => item.magnitude >= STRONG_QUAKE && now - new Date(item.occurred_at).getTime() < RECENT_QUAKE_MS
  );
  if (quake) {
    return {
      id: `sismo-${quake.id}`,
      title: tr('Sismo fuerte de magnitud {magnitude}', { magnitude: quake.magnitude.toFixed(1) }),
      // The place comes from IGP as it is written there.
      line: tr('{place}. Revisa si tú y tus vecinos están bien.', { place: quake.detail })
    };
  }

  const zone = feed.zones_here.find((item) => item.level >= RED_LEVEL);
  if (zone) {
    const day = new Date(now).toISOString().slice(0, 10);
    return {
      id: `zona-${zone.kind}-${zone.district ?? zone.province ?? ''}-${day}`,
      title: zone.kind === 'huaico' ? tr('Alerta roja de huaico en tu zona') : tr('Alerta roja de lluvia intensa en tu zona'),
      // SENAMHI's own advice is shown as SENAMHI wrote it.
      line: zone.recommendation ?? zone.description ?? tr('Sigue las indicaciones de las autoridades.')
    };
  }

  return null;
}
