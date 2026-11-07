import React from 'react';
import { useApp } from '../context/AppContext';
import { CommunityItem } from '../types';
import { 
  CheckCircle2, 
  MapPin, 
  Phone, 
  MessageCircle, 
  ThumbsUp, 
  Star, 
  Plus, 
  Sparkles,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { formatDistance, buildWhatsAppLink } from '../utils/geo';

export const ServicesList: React.FC = () => {
  const { 
    filteredItems, 
    toggleVistoBueno, 
    setSelectedItemForDetail, 
    setIsPublishModalOpen 
  } = useApp();

  return (
    <div className="space-y-4">
      {/* Module 1 Header & Intro Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500 text-white rounded-lg shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <h2 className="font-extrabold text-slate-800 text-base sm:text-lg">
              Servicios de Proximidad & Oficios Locales
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-xl">
            Conecta con oficios de tu propio barrio (gasfitería, electricidad, cerrajería, carpintería, etc.) validados con el 
            <strong className="text-amber-800"> "Visto Bueno Vecinal"</strong> de vecinos de tu misma zona, ahorrando tiempo y costos de transporte.
          </p>
        </div>

        <button
          onClick={() => setIsPublishModalOpen(true)}
          className="self-stretch sm:self-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Promover mi oficio</span>
        </button>
      </div>

      {/* List of Services */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-4xl mb-2">🔍</p>
          <h3 className="font-bold text-slate-700 text-base">No se encontraron oficios en este radio de distancia</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Prueba aumentando el radio de distancia o buscando con otros términos.
          </p>
          <button
            onClick={() => setIsPublishModalOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition"
          >
            Sé el primero en ofrecer un servicio aquí
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <ServiceCard 
              key={item.id} 
              item={item} 
              onVistoBueno={() => toggleVistoBueno(item.id)}
              onOpenDetail={() => setSelectedItemForDetail(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface ServiceCardProps {
  item: CommunityItem;
  onVistoBueno: () => void;
  onOpenDetail: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ item, onVistoBueno, onOpenDetail }) => {
  const whatsappUrl = item.authorPhone && buildWhatsAppLink(
    item.authorPhone,
    `Hola ${item.authorName}, vi tu servicio "${item.title}" en la app vecinal ICARO-AYLLU y me gustaría coordinar un servicio en mi zona.`
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-amber-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
      {/* Top Card Bar */}
      <div className="p-4 sm:p-5 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          {/* Category Tag */}
          <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
            {item.category}
          </span>

          {/* Visto Bueno Badge */}
          <button
            onClick={onVistoBueno}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold transition cursor-pointer active:scale-95 ${
              item.hasUserVoted
                ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-300'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
            title="Dar tu Visto Bueno Vecinal (Recomendación vecinal)"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{item.vistosBuenos} Vistos Buenos</span>
            <ThumbsUp className={`w-3 h-3 ${item.hasUserVoted ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Title */}
        <h3 
          onClick={onOpenDetail}
          className="font-bold text-slate-900 text-base group-hover:text-amber-600 transition cursor-pointer leading-snug"
        >
          {item.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        {/* Pricing / Tariff reference */}
        {item.priceInfo && (
          <div className="mt-2.5 flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="text-amber-600">💵</span>
            <span>{item.priceInfo}</span>
          </div>
        )}

        {/* Recent neighbor testimonial snippet if any */}
        {item.reviews && item.reviews.length > 0 && (
          <div className="mt-3 p-2 bg-emerald-50/60 rounded-xl border border-emerald-100 text-[11px] text-emerald-900">
            <p className="italic line-clamp-1">
              "{item.reviews[0].comment}"
            </p>
            <span className="font-semibold text-[10px] text-emerald-700 mt-0.5 block">
              — {item.reviews[0].authorName}{item.reviews[0].isNeighborVerified && ' (Vecino verificado)'}
            </span>
          </div>
        )}
      </div>

      {/* Footer Info & Actions */}
      <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto text-xs">
        {/* Neighborhood & Distance */}
        <div className="flex flex-col text-slate-500 min-w-0">
          <div className="flex items-center gap-1 font-medium text-slate-700 truncate">
            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">{item.neighborhood}</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold pl-4">
            {formatDistance(item.distanceMeters)}
          </span>
        </div>

        {/* Quick Contact Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onOpenDetail}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-medium text-xs transition cursor-pointer"
            title="Ver recomendaciones completas y ubicación"
          >
            Ver más
          </button>

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition"
              title="Contactar directamente por WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
