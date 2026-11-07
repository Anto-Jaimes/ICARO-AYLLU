/**
 * Service to generate digital neighbor payment QR codes (Yape / Plin / Transfer)
 * for transparent community transactions without middlemen.
 */

export interface PaymentQrInfo {
  phone: string;
  recipientName: string;
  amount?: number;
  concept?: string;
  qrImageUrl: string;
}

export function generateNeighborPaymentQr(
  phone: string,
  recipientName: string,
  amount?: number,
  concept?: string
): PaymentQrInfo {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const amountStr = amount ? `S/ ${amount.toFixed(2)}` : 'Tarifa vecinal';
  const conceptStr = concept || 'Servicio Vecinal ICARO-AYLLU';

  // Digital payment payload representation
  const payload = `YAPE/PLIN:${cleanPhone}|TITULAR:${recipientName}|MONTO:${amountStr}|CONCEPTO:${conceptStr}`;
  const encodedPayload = encodeURIComponent(payload);

  // Fast, free, reliable QR generation API
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodedPayload}&color=0f172a&bgcolor=ffffff`;

  return {
    phone: cleanPhone,
    recipientName,
    amount,
    concept: conceptStr,
    qrImageUrl
  };
}
