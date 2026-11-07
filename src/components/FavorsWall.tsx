import React from 'react';
import { useApp } from '../context/AppContext';
import { CommunityItem } from '../types';
import { 
  HeartHandshake, 
  MapPin, 
  MessageCircle, 
  Plus, 
  Sparkles,
  Footprints,
  Award,
  ArrowRightLeft,
  Gift
} from 'lucide-react';
import { formatDistance, buildWhatsAppLink } from '../utils/geo';

export const FavorsWall: React.FC = () => {
  const { 
    filteredItems, 
    toggleVistoBueno, 
    setSelectedItemForDetail, 
    setIsPublishModalOpen 
  } = useApp();

  const [filterType, setFilterType] = React.useState<'all' | 'offer' | 'request'>('all');

  const favorItems = filteredItems.filter((i) => 
    i.type === 'favor_offer' || i.type === 'favor_request'
  );

  const displayed = favorItems.filter((item) => {
    if (filterType === 'offer') return item.type === 'favor_offer';
    if (filterType === 'request') return item.type === 'favor_request';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Banner sin textos redundantes */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-600/10 border border-amber-300/70 p-4 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
            <HeartHandshake className="w-5 h-5" />
          </span>
          <div>
            <h2 className="font-black text-slate-900 text-base sm:text-lg tracking-tight">
              Muro de Favores & Red Ayni
            </h2>
            <p className="text-xs text-slate-600">Préstamo de herramientas, trueque de saberes y donaciones sin dinero.</p>
          </div>
        </div>

        <button
          onClick={() => setIsPublishModalOpen(true)}
          className="self-stretch sm:self-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Publicar Favor</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            filterType === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Todos ({favorItems.length})
        </button>
        <button
          onClick={() => setFilterType('offer')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            filterType === 'offer'
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          🎁 Ofrezco prestar / donar
        </button>
        <button
          onClick={() => setFilterType('request')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            filterType === 'request'
              ? 'bg-amber-600 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          🤝 Necesito un favor
        </button>
      </div>

      {/* Grid de Favores */}
      {displayed.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-300 p-6">
          <p className="text-3xl mb-1">🤝</p>
          <h3 className="font-bold text-slate-700 text-sm">Sin favores activos en esta categoría</h3>
          <button
            onClick={() => setIsPublishModalOpen(true)}
            className="mt-3 px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
          >
            Sé el primero en compartir
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {displayed.map((item) => (
            <FavorCard
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

interface FavorCardProps {
  item: CommunityItem;
  onVistoBueno: () => void;
  onOpenDetail: () => void;
}

const FavorCard: React.FC<FavorCardProps> = ({ item, onVistoBueno, onOpenDetail }) => {
  const isOffer = item.type === 'favor_offer';
  const whatsappUrl = item.authorPhone && buildWhatsAppLink(
    item.authorPhone,
    `Hola ${item.authorName}, te contacto desde ICARO-AYLLU por tu publicación solidaria "${item.title}".`
  );

  const walkingMinutes = Math.max(1, Math.round((item.distanceMeters || 100) / 80));

  return (
    <article className="bg-white rounded-3xl border border-slate-200/90 hover:border-amber-400 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
      <div className="p-4 sm:p-5 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
            isOffer 
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}>
            {isOffer ? 'Ofrezco Ayuda' : 'Solicito Apoyo'}
          </span>

          <button
            onClick={onVistoBueno}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition active:scale-95 ${
              item.hasUserVoted
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>{item.vistosBuenos} Vistos Buenos</span>
          </button>
        </div>

        <h3 
          onClick={onOpenDetail}
          className="font-bold text-slate-900 text-base hover:text-amber-600 transition cursor-pointer leading-snug"
        >
          {item.title}
        </h3>

        <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-600 font-semibold bg-slate-100 px-2.5 py-1 rounded-xl w-fit">
          <Footprints className="w-3.5 h-3.5 text-amber-600" />
          <span>{walkingMinutes} min a pie ({formatDistance(item.distanceMeters || 100)})</span>
        </div>
      </div>

      <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1 text-slate-500 truncate">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{item.neighborhood}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenDetail}
            className="px-2.5 py-1.5 text-slate-600 font-bold hover:text-slate-900"
          >
            Ver
          </button>

          {item.authorPhone && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Contactar</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
};
