import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CommunityItem } from '../types';
import { 
  HeartHandshake, 
  Plus, 
  MapPin, 
  MessageCircle, 
  ShieldCheck, 
  ThumbsUp,
  Sparkles,
  Handshake
} from 'lucide-react';
import { formatDistance, buildWhatsAppLink } from '../utils/geo';
import { CommunityImpactWidget } from './CommunityImpactWidget';
import { AyniHandshakeModal } from './AyniHandshakeModal';

export const FavorsWall: React.FC = () => {
  const { 
    filteredItems, 
    toggleVistoBueno, 
    setSelectedItemForDetail, 
    setIsPublishModalOpen 
  } = useApp();

  const [favorFilter, setFavorFilter] = useState<'all' | 'offer' | 'request'>('all');
  const [selectedHandshakeItem, setSelectedHandshakeItem] = useState<CommunityItem | null>(null);

  const displayedFavors = filteredItems.filter((item) => {
    if (favorFilter === 'offer') return item.type === 'favor_offer';
    if (favorFilter === 'request') return item.type === 'favor_request';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Community Ecological and Savings Impact Widget */}
      <CommunityImpactWidget />

      {/* Module 2 Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-sm">
              <HeartHandshake className="w-4 h-4" />
            </span>
            <h2 className="font-extrabold text-slate-800 text-base sm:text-lg">
              Cadena de Favores & Economía Solidaria
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-xl">
            Muro colaborativo para <strong className="text-emerald-800">resolver necesidades sin dinero</strong>: préstamo de herramientas, ayuda temporal, donación de materiales, intercambio de saberes y movilidad solidaria entre vecinos.
          </p>
        </div>

        <button
          onClick={() => setIsPublishModalOpen(true)}
          className="self-stretch sm:self-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Publicar favor</span>
        </button>
      </div>

      {/* Sub-filter tabs */}
      <div className="flex items-center justify-between gap-2 bg-slate-100 p-1 rounded-xl max-w-sm">
        <button
          onClick={() => setFavorFilter('all')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
            favorFilter === 'all'
              ? 'bg-white text-emerald-800 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Todos ({filteredItems.length})
        </button>
        <button
          onClick={() => setFavorFilter('offer')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
            favorFilter === 'offer'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🎁 Ofrezco / Presto
        </button>
        <button
          onClick={() => setFavorFilter('request')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
            favorFilter === 'request'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🙋 Necesito ayuda
        </button>
      </div>

      {/* Grid of Favors */}
      {displayedFavors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-4xl mb-2">🤝</p>
          <h3 className="font-bold text-slate-700 text-base">No hay publicaciones con estos filtros</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            ¿Tienes una herramienta para prestar o necesitas una mano en tu casa?
          </p>
          <button
            onClick={() => setIsPublishModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Publicar en el muro solidario
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedFavors.map((item) => (
            <FavorCard 
              key={item.id} 
              item={item} 
              onVistoBueno={() => toggleVistoBueno(item.id)}
              onOpenDetail={() => setSelectedItemForDetail(item)}
              onAyniHandshake={() => setSelectedHandshakeItem(item)}
            />
          ))}
        </div>
      )}

      {/* Ayni Handshake Modal */}
      <AyniHandshakeModal
        item={selectedHandshakeItem}
        isOpen={Boolean(selectedHandshakeItem)}
        onClose={() => setSelectedHandshakeItem(null)}
      />
    </div>
  );
};

interface FavorCardProps {
  item: CommunityItem;
  onVistoBueno: () => void;
  onOpenDetail: () => void;
  onAyniHandshake: () => void;
}

const FavorCard: React.FC<FavorCardProps> = ({ 
  item, 
  onVistoBueno, 
  onOpenDetail,
  onAyniHandshake 
}) => {
  const isOffer = item.type === 'favor_offer';

  const whatsappUrl = item.authorPhone && buildWhatsAppLink(
    item.authorPhone,
    `Hola ${item.authorName}, te escribo por tu publicación solidaria "${item.title}" en ICARO-AYLLU para coordinar con confianza.`
  );

  return (
    <div className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
      isOffer
        ? 'bg-white border-emerald-200/90 hover:border-emerald-400'
        : 'bg-white border-amber-200/90 hover:border-amber-400'
    }`}>
      <div className="p-4 sm:p-5 pb-3">
        {/* Type Badge & Category */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full ${
              isOffer 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              {isOffer ? '🎁 Ofrezco / Presto' : '🙋 Necesito Favor'}
            </span>

            <span className="text-[10px] text-slate-500 font-semibold uppercase">
              • {item.category}
            </span>
          </div>

          <button
            onClick={onVistoBueno}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition cursor-pointer active:scale-95 ${
              item.hasUserVoted
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="Dar respaldo vecinal a este favor"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>{item.vistosBuenos}</span>
            <ThumbsUp className={`w-3 h-3 ${item.hasUserVoted ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Title */}
        <h3 
          onClick={onOpenDetail}
          className="font-bold text-slate-900 text-base hover:text-emerald-700 transition cursor-pointer leading-snug"
        >
          {item.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-600 mt-1.5 line-clamp-3 leading-relaxed">
          {item.description}
        </p>

        {/* Solidary Tag: No money involved */}
        <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50/90 px-2.5 py-1 rounded-lg border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{item.priceInfo || 'Intercambio solidario / Sin dinero'}</span>
          </div>

          {/* Ayni Handshake Button */}
          {isOffer && (
            <button
              onClick={onAyniHandshake}
              className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-white hover:bg-emerald-600 bg-emerald-100/60 px-2.5 py-1 rounded-lg transition cursor-pointer"
              title="Registrar préstamo de herramienta y pacto de devolución"
            >
              <Handshake className="w-3.5 h-3.5" />
              <span>Pacto Ayni</span>
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto text-xs">
        <div className="flex flex-col text-slate-500 min-w-0">
          <div className="flex items-center gap-1 font-medium text-slate-700 truncate">
            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">{item.neighborhood}</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold pl-4">
            {formatDistance(item.distanceMeters)} • Por {item.authorName}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onOpenDetail}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-medium text-xs transition cursor-pointer"
          >
            Detalles
          </button>

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Coordinar</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
