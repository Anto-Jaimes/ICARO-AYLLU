import { formatDate, tr } from '../i18n/translate';

/** "Hace 5 min", "Ayer"... in the chosen language. Callers lowercase it to put it inside a sentence. */
export function formatRelativeTime(isoDate: string): string {
  const minutes = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000);
  if (minutes < 1) return tr('Hace un momento');
  if (minutes < 60) return tr('Hace {minutes} min', { minutes });

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? tr('Hace 1 hora') : tr('Hace {hours} horas', { hours });

  const days = Math.floor(hours / 24);
  if (days === 1) return tr('Ayer');
  if (days < 30) return tr('Hace {days} días', { days });
  return formatDate(new Date(isoDate), { day: 'numeric', month: 'numeric', year: 'numeric' });
}

const DAY_MONTH: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', timeZone: 'America/Lima' };

/** "8 nov" for a single day, "8 nov al 9 nov" for a range. Always in Peru's time. */
export function formatDayRange(startIso: string, endIso: string): string {
  const start = formatDate(new Date(startIso), DAY_MONTH);
  const end = formatDate(new Date(endIso), DAY_MONTH);
  return start === end ? start : tr('{start} al {end}', { start, end });
}
