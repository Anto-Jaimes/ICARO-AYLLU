/**
 * The same colours as the tokens in src/index.css, for what cannot read CSS variables: the map's canvas
 * and the files the app exports. Change both together; components use the CSS tokens.
 */
export const COLORS = {
  primary: '#1e3f8f',
  statusSafe: '#0b5a3c',
  statusWarning: '#ffd02e',
  statusDanger: '#a90f1c',
  triageBlack: '#1f2937',
  white: '#ffffff'
} as const;

/** The weather card's sky. Both ends of every gradient keep white text at 7:1 or more (WCAG AAA). */
export const SKY = {
  night: 'linear-gradient(160deg, #0f172a 0%, #1e3a8a 100%)',
  clear: 'linear-gradient(160deg, #16306e 0%, #1e40af 100%)',
  cloudy: 'linear-gradient(160deg, #374151 0%, #4b5563 100%)',
  rain: 'linear-gradient(160deg, #1e293b 0%, #334155 100%)',
  storm: 'linear-gradient(160deg, #1e1b4b 0%, #4c1d95 100%)'
} as const;
