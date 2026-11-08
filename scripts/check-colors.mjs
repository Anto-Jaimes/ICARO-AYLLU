/**
 * Keeps AYLLU's palette in order: components use the semantic tokens of src/index.css (primary,
 * ink-secondary, status-danger, night-…), never a raw Tailwind colour, a dark: variant (the app has no
 * dark theme) or a hand-written hex value. Runs before every build:
 *
 *   node scripts/check-colors.mjs
 *
 * Hex values live only in src/index.css and src/theme/colors.ts (for the map's canvas and exports).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const RULES = [
  {
    re: /\b(?:[a-z-]+:)*(?:bg|text|border(?:-[trblxy])?|ring|ring-offset|outline|fill|stroke|from|via|to|shadow|divide|decoration|accent|caret|placeholder)-(?:red|rose|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|slate|gray|zinc|neutral|stone)-\d{2,3}(?:\/\d+)?\b/g,
    why: 'color suelto de Tailwind: usa un token (bg-primary, text-ink-secondary, bg-status-danger, badge-warning...)'
  },
  { re: /(?<=[\s"'`{])dark:[^\s"'`}]+/g, why: 'variante dark: la app no tiene tema oscuro; usa los tokens night- en el modo apagón' },
  {
    re: /\b(?:bg|text|border|ring|divide|from|via|to|fill|stroke)-(?:anil|ink-2|line|verde|amarillo|naranja|rojo|offline|unknown)(?:-press)?\b|--color-(?:anil|ink-2|line|verde|amarillo|naranja|rojo|offline|unknown)\b/g,
    why: 'nombre de token antiguo: anil->primary, ink-2->ink-secondary, line->border, verde/amarillo/naranja/rojo->status-safe/warning/severe/danger'
  },
  { re: /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![0-9a-fA-F])/g, why: 'color hexadecimal: va en src/index.css (o src/theme/colors.ts si es para el mapa o un archivo exportado)', allow: (m) => /^#(?:000000|ffffff|fff|000)$/i.test(m) }
];

const SKIP = new Set(['src/theme/colors.ts']);
const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name).replace(/\\/g, '/');
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx?)$/.test(entry.name) && !full.includes('/i18n/') && !SKIP.has(full)) files.push(full);
  }
})('src');

const problems = [];
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const rule of RULES) {
      for (const match of line.matchAll(rule.re)) {
        if (rule.allow?.(match[0])) continue;
        problems.push(`${file}:${index + 1}  "${match[0]}"  ${rule.why}`);
      }
    }
  });
}

if (problems.length) {
  console.error(`Paleta: ${problems.length} color(es) fuera del sistema de diseño:\n${problems.join('\n')}`);
  process.exit(1);
}
console.log(`Paleta en orden: ${files.length} archivos sin colores sueltos.`);
