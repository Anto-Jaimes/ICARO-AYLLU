/**
 * Draws the QR that the web shows to download the Android app, as a static image in public/.
 * Run it again only if the address changes:
 *
 *   node scripts/make-download-qr.ts
 *
 * The APK itself is not in git: the deploy copies AYLLU.apk to /descargar/ (see the deploy notes).
 */
import { writeFileSync } from 'node:fs';
import QRCode from 'qrcode';

export const DOWNLOAD_URL = 'https://ayllu-five.vercel.app/descargar/AYLLU.apk';

const svg = await QRCode.toString(DOWNLOAD_URL, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } });
writeFileSync('public/descargar-qr.svg', svg);
console.log(`QR listo en public/descargar-qr.svg para ${DOWNLOAD_URL}`);
