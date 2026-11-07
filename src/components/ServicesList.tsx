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
  Footprints,
  Clock,
  Award
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
      <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-600/15 border border-amber-300/80 p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="font-black text-slate-900 text-base sm:text-xl tracking-tight">
              Directorio de Proximidad & Oficios con "Visto Bueno"
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1.5 max-w-xl leading-relaxed">
            Oficios locales verificados por vecinos del cuadrante (gasfitería, cerrajería, electricidad, clases).
            <strong className="text-amber-800"> Menos de 15 minutos a pie y S/. 0 en costos de transporte.</strong>
          </p>
        </div>

        <button
          onClick={() => setIsPublishModalOpen(true)}
          className="self-stretch sm:self-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-md transition cursor-pointer shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Promover mi oficio</span>
        </button>
      </div>

      {/* List of Services */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300 p-6">
          <p className="text-4xl mb-2">🔍</p>
          <h3 className="font-bold text-slate-700 text-base">No se encontraron oficios en este radio</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Prueba ampliando el filtro de distancia o buscando con otros términos.
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
  const whatsappUrl = buildWhatsAppLink(
    item.authorPhone,
    `Hola ${item.authorName}, vi tu servicio "${item.title}" en la app vecinal ICARO-AYLLU y me gustaría coordinar un servicio en mi zona.`
  );

  // Estimación de tiempo a pie (80m por minuto aprox)
  const walkingMinutes = Math.max(1, Math.round((item.distanceMeters || 120) / 80));

  return (
    <article className="bg-white rounded-3xl border border-slate-200/90 hover:border-amber-400/80 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group">
      {/* Top Card Bar */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          {/* Category Tag */}
          <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/80 shadow-xs">
            {item.category}
          </span>

          {/* Visto Bueno Badge con Algoritmo */}
          <button
            onClick={onVistoBueno}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition cursor-pointer active:scale-95 shadow-sm ${
              item.hasUserVoted
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 shadow-emerald-500/20'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
            }`}
            title="Dar tu Visto Bueno Vecinal verificado"
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>{item.vistosBuenos} Visto Bueno</span>
            <ThumbsUp className={`w-3.5 h-3.5 ${item.hasUserVoted ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Title */}
        <h3 
          onClick={onOpenDetail}
          className="font-extrabold text-slate-900 text-base group-hover:text-amber-600 transition cursor-pointer leading-snug"
        >
          {item.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed font-normal">
          {item.description}
        </p>

        {/* Proximidad & Tiempo a pie */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 text-slate-700 font-semibold bg-slate-100/90 px-2.5 py-1 rounded-xl">
            <Footprints className="w-3.5 h-3.5 text-amber-600" />
            <span>{walkingMinutes} min caminando ({formatDistance(item.distanceMeters || 120)})</span>
          </div>

          {item.priceInfo && (
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
              <span>💵 {item.priceInfo}</span>
            </div>
          )}
        </div>

        {/* Testimonio vecinal */}
        {item.reviews && item.reviews.length > 0 && (
          <div className="mt-3.5 p-2.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-[11px] text-slate-700">
            <p className="italic line-clamp-1 font-medium">
              "{item.reviews[0].comment}"
            </p>
            <span className="font-bold text-[10px] text-amber-700 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {item.reviews[0].authorName} (Vecino de {item.neighborhood})
            </span>
          </div>
        )}
      </div>

      {/* Footer Info & Actions */}
      <div className="px-5 py-3.5 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-3 mt-auto text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 truncate">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate font-medium">{item.neighborhood}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenDetail}
            className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-bold transition rounded-xl hover:bg-slate-200/60"
          >
            Detalles
          </button>

          {item.authorPhone ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-sm transition active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Contactar</span>
            </a>
          ) : (
            <button
              onClick={onOpenDetail}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-black shadow-sm transition active:scale-95"
            >
              <span>Conectar</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
