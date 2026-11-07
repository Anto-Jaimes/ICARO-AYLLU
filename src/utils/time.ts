export function formatRelativeTime(isoDate: string): string {
  const minutes = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000);
  if (minutes < 1) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? 'Hace 1 hora' : `Hace ${hours} horas`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  if (days < 30) return `Hace ${days} días`;
  return new Date(isoDate).toLocaleDateString('es-PE');
}

const dayMonth = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', timeZone: 'America/Lima' });

/** "8 nov" for a single day, "8 nov al 9 nov" for a range. Always in Peru's time. */
export function formatDayRange(startIso: string, endIso: string): string {
  const start = dayMonth.format(new Date(startIso));
  const end = dayMonth.format(new Date(endIso));
  return start === end ? start : `${start} al ${end}`;
}
