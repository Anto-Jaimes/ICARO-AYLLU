import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Droplets, 
  Hospital, 
  Flame, 
  Shield, 
  MapPin, 
  Phone, 
  ExternalLink, 
  RefreshCw,
  Search,
  CheckCircle2,
  Navigation
} from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { SafePlace, fetchNearbySafePlaces, getCachedSafePlaces } from '../services/safePlacesService';
import { describeDistance } from '../utils/geo';
import { tapFeedback } from '../lib/native';
import { useApp } from '../context/AppContext';

interface SafePlacesSheetProps {
  open: boolean;
  onClose: () => void;
  onSelectOnMap?: (place: SafePlace) => void;
}

export const SafePlacesSheet: React.FC<SafePlacesSheetProps> = ({ open, onClose, onSelectOnMap }) => {
  const { userLocation } = useApp();
  const [places, setPlaces] = useState<SafePlace[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshed, setIsRefreshed] = useState(false);

  useEffect(() => {
    if (open) {
      // First load from local offline cache
      const cached = getCachedSafePlaces(userLocation.lat, userLocation.lng);
      setPlaces(cached);

      // If online, fetch fresh Overpass OSM data in background
      if (navigator.onLine) {
        setIsLoading(true);
        fetchNearbySafePlaces(userLocation.lat, userLocation.lng)
          .then((fresh) => {
            setPlaces(fresh);
            setIsRefreshed(true);
          })
          .catch((err) => console.warn('Could not refresh OSM safe places', err))
          .finally(() => setIsLoading(false));
      }
    }
  }, [open, userLocation.lat, userLocation.lng]);

  const handleRefresh = async () => {
    tapFeedback();
    setIsLoading(true);
    try {
      const fresh = await fetchNearbySafePlaces(userLocation.lat, userLocation.lng);
      setPlaces(fresh);
      setIsRefreshed(true);
    } catch (err) {
      console.warn('Refresh error', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPlaces = places.filter((p) => {
    const matchesCategory = selectedCategory === 'todos' || p.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.address && p.address.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryDetails = (cat: SafePlace['category']) => {
    switch (cat) {
      case 'salud':
        return { label: 'Salud / Posta', color: 'bg-red-600', icon: Hospital, text: 'text-red-500' };
      case 'agua':
        return { label: 'Agua Potable', color: 'bg-blue-600', icon: Droplets, text: 'text-blue-500' };
      case 'refugio':
        return { label: 'Refugio / Zona Segura', color: 'bg-emerald-600', icon: ShieldCheck, text: 'text-emerald-500' };
      case 'bomberos':
        return { label: 'Bomberos (116)', color: 'bg-amber-600', icon: Flame, text: 'text-amber-500' };
      case 'policia':
        return { label: 'Comisaría (105)', color: 'bg-indigo-600', icon: Shield, text: 'text-indigo-500' };
      default:
        return { label: 'Punto Seguro', color: 'bg-slate-600', icon: MapPin, text: 'text-slate-500' };
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Puntos Seguros y Recursos de Emergencia">
      <div className="flex flex-col gap-3 pb-6 text-ink">
        {/* Info Header */}
        <div className="p-3 bg-emerald-950/20 border border-emerald-600/40 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="text-left">
              <span className="block text-xs font-bold text-ink">
                Red de Supervivencia INDECI / OSM
              </span>
              <span className="block text-[11px] text-ink-secondary">
                100% disponible offline con soporte de OpenStreetMap
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 bg-surface hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-line rounded-lg text-ink"
            title="Actualizar datos con Overpass API"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar posta, punto de agua, albergue..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-surface border border-line text-ink focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'salud', label: '🏥 Salud' },
            { id: 'agua', label: '💧 Agua' },
            { id: 'refugio', label: '⛺ Refugio' },
            { id: 'bomberos', label: '🚒 Bomberos' },
            { id: 'policia', label: '👮 Policía' }
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => { setSelectedCategory(cat.id); tapFeedback(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
                selectedCategory === cat.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface border border-line text-ink-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* List of Safe Places */}
        <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto pr-1">
          {filteredPlaces.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-secondary">
              No se encontraron puntos seguros con ese filtro en este radio.
            </div>
          ) : (
            filteredPlaces.map((place) => {
              const details = getCategoryDetails(place.category);
              const CategoryIcon = details.icon;
              const distText = describeDistance(place.distanceMeters);

              return (
                <div
                  key={place.id}
                  className="p-3 bg-surface border border-line rounded-xl flex flex-col gap-2 shadow-xs hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg ${details.color} text-white flex items-center justify-center shrink-0 shadow-xs`}>
                        <CategoryIcon className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="block text-xs font-bold text-ink leading-tight">
                          {place.name}
                        </span>
                        <span className="text-[10px] text-ink-secondary font-medium">
                          {details.label} {distText ? `• a ${distText}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {place.address && (
                    <span className="text-[11px] text-ink-secondary flex items-center gap-1 pl-1">
                      <MapPin className="w-3.5 h-3.5 text-ink-secondary shrink-0" />
                      {place.address}
                    </span>
                  )}

                  <div className="flex items-center gap-2 pt-1 border-t border-line/40">
                    {place.phone && (
                      <a
                        href={`tel:${place.phone}`}
                        className="py-1 px-3 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Llamar ({place.phone})
                      </a>
                    )}

                    {onSelectOnMap ? (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectOnMap(place);
                          onClose();
                        }}
                        className="py-1 px-3 bg-surface border border-line text-ink hover:bg-neutral-100 text-xs font-bold rounded-lg flex items-center gap-1.5 ml-auto"
                      >
                        <Navigation className="w-3.5 h-3.5 text-primary" />
                        Ver en mapa
                      </button>
                    ) : (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1 px-3 bg-surface border border-line text-ink hover:bg-neutral-100 text-xs font-bold rounded-lg flex items-center gap-1.5 ml-auto"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-primary" />
                        Ruta GPS
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
