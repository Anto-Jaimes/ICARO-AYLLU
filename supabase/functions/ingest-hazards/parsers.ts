/**
 * Turns IGP and SENAMHI responses into rows. Pure functions, no I/O, so they can be
 * checked against real pages without deploying anything.
 *
 * SENAMHI only publishes its notices as HTML: if they change the page these parsers
 * return nothing rather than guess, and the ingest reports it as a failure.
 */

export interface QuakeRow {
  codigo: string;
  fecha_utc: string;
  hora_utc: string;
  latitud: string;
  longitud: string;
  magnitud: string;
  profundidad: number;
  referencia: string;
  intensidad: string | null;
}

export interface NoticeRow {
  year: string;
  number: string;
  title: string;
  issuedOn: string;
  startsOn: string;
  endsOn: string;
  level: 'amarillo' | 'naranja' | 'rojo';
  url: string;
}

const SENAMHI_URL = 'https://www.senamhi.gob.pe/';
const ZONE_WORDS = ['Norte', 'Centro', 'Sur'];
const REGION_WORDS = ['Costa', 'Sierra', 'Selva'];

const HTML_ENTITIES: Record<string, string> = {
  nbsp: ' ', amp: '&', quot: '"', deg: '°',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', uuml: 'ü',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ntilde: 'Ñ', Uuml: 'Ü'
};

export function decodeEntities(text: string): string {
  return text
    .replace(/&([a-zA-Z]+);/g, (entity, name) => HTML_ENTITIES[name] ?? entity)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

/** "Áncash" and "ANCASH" must match: the feeds disagree on accents and case. */
export function toSourceKey(name: string): string {
  return name.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase().trim();
}

/** "2 km al E de Huambo, Caylloma - Arequipa" -> "AREQUIPA". */
export function departmentKeyFromReference(reference: string): string | null {
  if (/Provincia Constitucional del Callao/i.test(reference)) return 'CALLAO';

  const separator = reference.lastIndexOf(' - ');
  return separator === -1 ? null : toSourceKey(reference.slice(separator + 3));
}

/** IGP splits date and time into two fields, each padded with a fake counterpart. */
export function quakeTimestamp(row: Pick<QuakeRow, 'fecha_utc' | 'hora_utc'>): string {
  return `${row.fecha_utc.slice(0, 10)}T${row.hora_utc.slice(11)}`;
}

export function parseNoticeTable(html: string): NoticeRow[] {
  const cell = String.raw`\s*<td[^>]*>`;
  const row = new RegExp(
    String.raw`<td\s+class="(?:emitido|vigente)"><a href="\./(\?p=aviso-meteorologico-[a-z]+&a=(\d{4})&b=\d+&c=\d+&d=\w+)">([^<]+)</td>` +
      cell + String.raw`<a[^>]*>(\d+)[^<]*</td>` +
      cell + String.raw`([\d-]{10})</td>` +
      cell + String.raw`([\d-]{10})</td>` +
      cell + String.raw`([\d-]{10})</td>` +
      cell + String.raw`[^<]*</td>` +
      cell + String.raw`<span[^>]*>(AMARILLO|NARANJA|ROJO)</span>`,
    'g'
  );

  return [...html.matchAll(row)].map(([, query, year, title, number, issuedOn, startsOn, endsOn, level]) => ({
    year,
    number,
    title: decodeEntities(title).trim(),
    issuedOn,
    startsOn,
    endsOn,
    level: level.toLowerCase() as NoticeRow['level'],
    url: SENAMHI_URL + query.replaceAll('&amp;', '&')
  }));
}

/**
 * First sentence of each notice on the "vigente" page, which lists all of them in tabs.
 * Keyed by notice number.
 */
export function parseNoticeSummaries(html: string): Map<string, string> {
  const text = decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  ).replace(/\s+/g, ' ');

  const summaries = new Map<string, string>();
  const notice = /N°(\d+)\s+(?:AMARILLO|NARANJA|ROJO)\b.*?(El SENAMHI informa que[^.]*\.)/g;

  for (const [, number, summary] of text.matchAll(notice)) {
    if (!summaries.has(number)) summaries.set(number, summary.trim());
  }
  return summaries;
}

/**
 * "SELVA CENTRO Y SUR" -> ["Selva Centro", "Selva Sur"]; "COSTA Y SIERRA" -> all six.
 * Names match SENAMHI's own macro-region polygons.
 */
export function macroRegionsFromText(text: string): string[] {
  const words = toSourceKey(text).match(/\b(COSTA|SIERRA|SELVA|NORTE|CENTRO|SUR)\b/g) ?? [];
  const regions: string[] = [];
  let current: { region: string; zones: string[] } | null = null;

  const flush = () => {
    if (!current) return;
    const zones = current.zones.length > 0 ? current.zones : ZONE_WORDS;
    for (const zone of zones) regions.push(`${current.region} ${zone}`);
  };

  for (const word of words) {
    const name = word[0] + word.slice(1).toLowerCase();
    if (REGION_WORDS.includes(name)) {
      flush();
      current = { region: name, zones: [] };
    } else if (current) {
      current.zones.push(name);
    }
  }
  flush();

  return [...new Set(regions)];
}

export interface DepartmentRef {
  name: string;
  source_key: string;
  macro_regions: string[];
}

/**
 * Departments a notice applies to. Named departments win; otherwise its macro-regions,
 * from the title or, failing that, the summary. An empty result means nationwide, so a
 * notice we cannot place is shown to everyone rather than hidden from those affected.
 */
export function departmentsForNotice(title: string, summary: string | undefined, departments: DepartmentRef[]): string[] {
  const titleKey = toSourceKey(title);
  const named = departments.filter((d) => new RegExp(String.raw`\b${d.source_key}\b`).test(titleKey));
  if (named.length > 0) return named.map((d) => d.name);

  let regions = macroRegionsFromText(title);
  if (regions.length === 0 && summary) regions = macroRegionsFromText(summary);
  if (regions.length === 0) return [];

  return departments.filter((d) => d.macro_regions.some((r) => regions.includes(r))).map((d) => d.name);
}
