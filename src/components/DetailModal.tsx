import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  MapPin, 
  Phone, 
  MessageCircle, 
  ThumbsUp, 
  Clock, 
  UserCheck, 
  Send,
  QrCode,
  Footprints
} from 'lucide-react';
import { formatDistance, buildWhatsAppLink } from '../utils/geo';
import { calculateWalkingEstimate, WalkingEstimate } from '../services/geoService';
import { generateNeighborPaymentQr, PaymentQrInfo } from '../services/paymentService';

export const DetailModal: React.FC = () => {
  const { 
    selectedItemForDetail, 
    setSelectedItemForDetail, 
    toggleVistoBueno, 
    addReview,
    userLocation
  } = useApp();

  const [commentText, setCommentText] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [walkingEstimate, setWalkingEstimate] = useState<WalkingEstimate | null>(null);
  const [showPaymentQr, setShowPaymentQr] = useState<boolean>(false);
  const [paymentQrInfo, setPaymentQrInfo] = useState<PaymentQrInfo | null>(null);

  useEffect(() => {
    if (selectedItemForDetail) {
      calculateWalkingEstimate(
        userLocation.lat,
        userLocation.lng,
        selectedItemForDetail.coordinates[0],
        selectedItemForDetail.coordinates[1]
      ).then((res) => setWalkingEstimate(res));

      setPaymentQrInfo(
        selectedItemForDetail.authorPhone
          ? generateNeighborPaymentQr(
              selectedItemForDetail.authorPhone,
              selectedItemForDetail.authorName,
              undefined,
              selectedItemForDetail.title
            )
          : null
      );
      setShowPaymentQr(false);
    }
    // Keyed by id: live votes must not reset an open payment QR.
  }, [selectedItemForDetail?.id, userLocation.lat, userLocation.lng]);

  if (!selectedItemForDetail) return null;

  const item = selectedItemForDetail;
  const isEmergency = ['emergency_need', 'emergency_resource', 'support_group'].includes(item.type);

  const whatsappUrl = item.authorPhone && buildWhatsAppLink(
    item.authorPhone,
    `Hola ${item.authorName}, te contacto desde la app vecinal ICARO-AYLLU respecto a tu publicación "${item.title}".`
  );

  const handleSendReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    addReview(
      item.id,
      commentText.trim(),
      reviewerName.trim() || 'Vecino del barrio'
    );

    setCommentText('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className={`px-5 py-4 flex items-center justify-between text-white ${
          isEmergency ? 'bg-rose-950 border-b border-rose-800' : 'bg-slate-900 border-b border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase ${
              isEmergency ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
            }`}>
              {item.category}
            </span>
            {walkingEstimate ? (
              <span className="text-xs text-amber-300 font-bold flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-md">
                <Footprints className="w-3.5 h-3.5" />
                {walkingEstimate.formattedText}
              </span>
            ) : (
              <span className="text-xs text-slate-300 font-semibold">
                {formatDistance(item.distanceMeters)}
              </span>
            )}
          </div>

          <button
            onClick={() => setSelectedItemForDetail(null)}
            className="p-1 rounded-full text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Title & Status */}
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {item.title}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                {item.neighborhood}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {item.createdAt}
              </span>
            </div>
          </div>

          {/* Visto Bueno Vecinal Callout */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-xl shadow-md">
                🛡️
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <span>{item.vistosBuenos} Vistos Buenos Vecinales</span>
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Vecinos de esta zona han validado su honradez y servicio.
                </p>
              </div>
            </div>

            <button
              onClick={() => toggleVistoBueno(item.id)}
              className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 active:scale-95 shrink-0 ${
                item.hasUserVoted
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                  : 'bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${item.hasUserVoted ? 'fill-current' : ''}`} />
              <span>{item.hasUserVoted ? '¡Recomendado!' : '+1 Recomendar'}</span>
            </button>
          </div>

          {/* Full Description */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Descripción detallada
            </h4>
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
              {item.description}
            </p>

            {item.priceInfo && (
              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-600">💵 Modalidad:</span>
                  <span className="bg-white px-2 py-1 rounded-md border border-slate-200 text-slate-900">
                    {item.priceInfo}
                  </span>
                </div>

                {item.type === 'service' && paymentQrInfo && (
                  <button
                    onClick={() => setShowPaymentQr(!showPaymentQr)}
                    className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{showPaymentQr ? 'Ocultar QR' : 'Pagar con Yape / Plin'}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Digital Neighbor Payment QR Modal Snippet */}
          {showPaymentQr && paymentQrInfo && (
            <div className="p-4 bg-emerald-50/70 border-2 border-emerald-300 rounded-2xl text-center space-y-2 animate-fadeIn">
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider bg-emerald-100 px-2 py-0.5 rounded-full">
                Pago Directo sin Comisión (Yape / Plin)
              </span>
              <h4 className="font-extrabold text-sm text-slate-900">
                Escanea para pagar a {paymentQrInfo.recipientName}
              </h4>
              <div className="flex justify-center py-2">
                <img
                  src={paymentQrInfo.qrImageUrl}
                  alt="QR Yape / Plin Vecinal"
                  className="w-44 h-44 rounded-xl border-2 border-white shadow-md bg-white p-2"
                />
              </div>
              <p className="text-xs text-slate-600 font-mono">
                Número celular: <strong>{paymentQrInfo.phone}</strong>
              </p>
              <p className="text-[11px] text-slate-500 italic">
                El pago se transfiere directamente de cuenta vecina a cuenta vecina sin intermediarios.
              </p>
            </div>
          )}

          {/* Contact Author Box */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Persona de contacto
              </span>
              <h4 className="font-extrabold text-base text-white">
                {item.authorName}
              </h4>
              <p className="text-xs text-slate-300">
                {item.authorPhone ? `Teléfono: ${item.authorPhone}` : 'No dejó teléfono de contacto'}
              </p>
            </div>

            {whatsappUrl && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href={`tel:${item.authorPhone}`}
                  className="flex items-center justify-center p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition"
                  title="Llamar directamente"
                >
                  <Phone className="w-4 h-4 text-amber-400" />
                </a>
              </div>
            )}
          </div>

          {/* Neighbor Reviews & Testimonials Section */}
          <div className="border-t border-slate-200 pt-4">
            <h4 className="font-black text-slate-900 text-sm mb-2 flex items-center justify-between">
              <span>Recomendaciones Vecinales ({item.reviews.length})</span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Verificadas por vecinos
              </span>
            </h4>

            {item.reviews.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                Aún no hay testimonios escritos. Sé el primer vecino en dejar una reseña para ayudar al barrio.
              </p>
            ) : (
              <div className="space-y-2.5 mb-4">
                {item.reviews.map((rev) => (
                  <div key={rev.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {rev.authorName}
                      </span>
                      <span className="text-[10px] text-slate-400">{rev.date}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed italic">
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Leave a review form */}
            <form onSubmit={handleSendReview} className="mt-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                Dejar recomendación a este vecino
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Tu nombre (ej: Vecina Lucía)"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Escribe tu recomendación (ej: Don Carlos cobra lo justo y es puntual...)"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publicar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
