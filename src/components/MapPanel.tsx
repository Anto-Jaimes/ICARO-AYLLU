import React, { useState } from 'react';
import { Car, ChevronRight, CloudOff, Footprints, House, MapPin, Navigation, Star, Trash2, X } from 'lucide-react';
import type { TravelMode } from '../services/geoService';

/** The neighbour's home and saved places, below the map when nothing else is open. */
interface MyPlacesPanelProps {
  hasHome: boolean;
  homeLine: string;
  placesCount: number;
  onOpenHome: () => void;
  onRouteHome: () => void;
  onSetHome: () => void;
  onOpenPlaces: () => void;
}

export const MyPlacesPanel: React.FC<MyPlacesPanelProps> = ({
  hasHome, homeLine, placesCount, onOpenHome, onRouteHome, onSetHome, onOpenPlaces
}) => (
  <div>
    {hasHome ? (
      <section aria-label="Mi casa" className="grid grid-cols-[40px_1fr_auto] items-center gap-x-3 px-4 pt-3 pb-3">
        <span className="grid place-items-center w-10 h-10 rounded-lg bg-anil text-white">
          <House className="w-6 h-6" aria-hidden="true" />
        </span>
        <button type="button" onClick={onOpenHome} className="flex items-center gap-1 min-h-12 text-left text-row font-bold">
          Mi casa
          <ChevronRight className="w-5 h-5 text-ink-2" aria-hidden="true" />
          <span className="sr-only">: verla en el mapa</span>
        </button>
        <button
          type="button"
          onClick={onRouteHome}
          aria-label="Cómo llegar a casa"
          className="inline-flex items-center gap-2 min-h-12 px-4 rounded-lg bg-anil active:bg-anil-press text-white text-secondary font-bold"
        >
          <Navigation className="w-5 h-5" aria-hidden="true" />
          Cómo llegar
        </button>
        <p className="col-start-2 col-span-2 text-secondary text-ink-2" data-testid="home-line">{homeLine}</p>
      </section>
    ) : (
      <button type="button" onClick={onSetHome} className="row min-h-16 py-3">
        <span className="grid place-items-center w-10 h-10 rounded-lg bg-sunken text-anil shrink-0">
          <House className="w-6 h-6" aria-hidden="true" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-row font-bold">¿Dónde es tu casa?</span>
          <span className="block text-secondary text-ink-2">Guárdala para saber a cuánto estás y cómo volver.</span>
        </span>
        <ChevronRight className="w-6 h-6 shrink-0 text-ink-2" aria-hidden="true" />
      </button>
    )}
    <button type="button" onClick={onOpenPlaces} className="row min-h-14 py-2 border-t border-line">
      <span className="grid place-items-center w-10 h-10 shrink-0 text-anil">
        <Star className="w-6 h-6" aria-hidden="true" />
      </span>
      <span className="flex-1 text-row font-bold">Mis lugares</span>
      <span className="text-secondary text-ink-2">{placesCount === 0 ? 'Ninguno' : placesCount}</span>
      <ChevronRight className="w-6 h-6 shrink-0 text-ink-2" aria-hidden="true" />
    </button>
  </div>
);

export type SpotKind = 'result' | 'point' | 'home' | 'place';

interface SpotCardProps {
  kind: SpotKind;
  name: string;
  address: string;
  distanceLine: string;
  onClose: () => void;
  onRoute: () => void;
  onSaveAsHome: () => void;
  onSaveAsPlace: () => void;
  onChangeHome: () => void;
  onDeletePlace: () => void;
}

const SMALL_BTN = 'btn min-h-12 py-2 text-secondary';

/** One place chosen on the map: where it is, how far, and what to do with it. Give it a key per place. */
export const SpotCard: React.FC<SpotCardProps> = ({
  kind, name, address, distanceLine, onClose, onRoute, onSaveAsHome, onSaveAsPlace, onChangeHome, onDeletePlace
}) => {
  const [isConfirming, setIsConfirming] = useState(false);

  const Icon = kind === 'home' ? House : kind === 'place' ? Star : MapPin;

  return (
    <section aria-label={name} className="px-4 pt-3 pb-3" data-testid="spot-card">
      <div className="flex items-start gap-3">
        <Icon className={`w-6 h-6 mt-1 shrink-0 ${kind === 'result' || kind === 'point' ? 'text-rojo' : 'text-anil'}`} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <h2 className="text-row font-bold line-clamp-2">{name}</h2>
          {address && <p className="text-meta text-ink-2 truncate">{address}</p>}
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="icon-btn -mr-2 -mt-1 text-ink-2">
          <X className="w-6 h-6" aria-hidden="true" />
        </button>
      </div>
      <p className="mt-1 text-secondary" data-testid="spot-distance">{distanceLine}</p>

      <div className="mt-3 space-y-2">
        <button type="button" onClick={onRoute} className={`${SMALL_BTN} btn-primary`}>
          <Navigation className="w-5 h-5" aria-hidden="true" />
          {kind === 'home' ? 'Cómo llegar a casa' : 'Cómo llegar'}
        </button>
        {(kind === 'result' || kind === 'point') && (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={onSaveAsHome} className={`${SMALL_BTN} btn-secondary px-2`}>
              <House className="w-5 h-5 shrink-0" aria-hidden="true" />
              Es mi casa
            </button>
            <button type="button" onClick={onSaveAsPlace} className={`${SMALL_BTN} btn-secondary px-2`}>
              <Star className="w-5 h-5 shrink-0" aria-hidden="true" />
              Guardar lugar
            </button>
          </div>
        )}
        {kind === 'home' && (
          <button type="button" onClick={onChangeHome} className={`${SMALL_BTN} btn-secondary`}>
            <House className="w-5 h-5" aria-hidden="true" />
            Cambiar mi casa
          </button>
        )}
        {kind === 'place' && (isConfirming ? (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setIsConfirming(false)} className={`${SMALL_BTN} btn-secondary`}>No</button>
            <button type="button" onClick={onDeletePlace} className={`${SMALL_BTN} btn-danger`}>Sí, borrar</button>
          </div>
        ) : (
          <button type="button" onClick={() => setIsConfirming(true)} className={`${SMALL_BTN} btn-secondary`}>
            <Trash2 className="w-5 h-5" aria-hidden="true" />
            Borrar de mis lugares
          </button>
        ))}
      </div>
    </section>
  );
};

/** "18 min", "1 h 10 min": short enough for the two travel buttons. */
const shortMinutes = (minutes: number) => {
  const total = Math.max(1, Math.round(minutes));
  if (total < 60) return `${total} min`;
  return `${Math.floor(total / 60)} h${total % 60 ? ` ${total % 60} min` : ''}`;
};

interface TripCardProps {
  title: string;
  address: string;
  status: 'loading' | 'streets' | 'straight';
  isOffline: boolean;
  mode: TravelMode;
  walkMinutes: number | null;
  carMinutes: number | null;
  summary: string;
  onMode: (mode: TravelMode) => void;
  onClose: () => void;
  onRetry: () => void;
}

/** The way to a place: along the streets when a router answers, otherwise an honest straight line. */
export const TripCard: React.FC<TripCardProps> = ({
  title, address, status, isOffline, mode, walkMinutes, carMinutes, summary, onMode, onClose, onRetry
}) => (
  <section aria-label={title} className="px-4 pt-3 pb-3" data-testid="trip-card" data-status={status}>
    <div className="flex items-start gap-3">
      <Navigation className="w-6 h-6 mt-1 shrink-0 text-anil" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <h2 className="text-row font-bold line-clamp-2">{title}</h2>
        {address && <p className="text-meta text-ink-2 truncate">{address}</p>}
      </div>
      <button type="button" onClick={onClose} aria-label="Quitar el camino" className="icon-btn -mr-2 -mt-1 text-ink-2">
        <X className="w-6 h-6" aria-hidden="true" />
      </button>
    </div>

    {status === 'loading' && <p role="status" className="mt-2 text-secondary text-ink-2">Buscando el camino por las calles...</p>}

    {status === 'streets' && (
      <>
        <div role="group" aria-label="Cómo vas" className="mt-3 grid grid-cols-2 gap-2">
          {([
            { value: 'foot' as const, label: 'A pie', icon: Footprints, minutes: walkMinutes },
            { value: 'car' as const, label: 'En auto', icon: Car, minutes: carMinutes }
          ]).map(({ value, label, icon: Icon, minutes }) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              disabled={minutes === null}
              onClick={() => onMode(value)}
              className={`flex items-center justify-center gap-2 min-h-12 px-2 rounded-lg text-secondary font-bold whitespace-nowrap disabled:opacity-50 ${
                mode === value ? 'bg-anil text-white' : 'bg-sunken text-ink'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
              {label}
              {minutes !== null && <span className="font-medium">{shortMinutes(minutes)}</span>}
            </button>
          ))}
        </div>
        <p role="status" className="mt-2 text-secondary">{summary}</p>
      </>
    )}

    {status === 'straight' && (
      <div role="status">
        <p className="mt-2 flex items-start gap-2 text-secondary font-bold">
          <CloudOff className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
          {isOffline ? 'Sin internet: distancia en línea recta.' : 'No pudimos calcular el camino por las calles: distancia en línea recta.'}
        </p>
        <p className="mt-1 text-secondary">{summary}</p>
        {!isOffline && (
          <button type="button" onClick={onRetry} className="mt-2 min-h-12 px-1 text-secondary font-bold text-anil">
            Intentar otra vez
          </button>
        )}
      </div>
    )}
  </section>
);

interface PickBarProps {
  purpose: 'home' | 'place';
  onCancel: () => void;
  onConfirm: () => void;
}

/** Shown while the neighbour moves the map under the centre marker. */
export const PickBar: React.FC<PickBarProps> = ({ purpose, onCancel, onConfirm }) => (
  <section aria-label="Elegir en el mapa" className="px-4 pt-3 pb-3">
    <p className="text-row font-bold">{purpose === 'home' ? 'Mueve el mapa hasta tu casa' : 'Mueve el mapa hasta el lugar'}</p>
    <p className="text-secondary text-ink-2">El marcador rojo del centro señala el punto que se guarda.</p>
    <div className="mt-3 grid grid-cols-2 gap-2">
      <button type="button" onClick={onCancel} className={`${SMALL_BTN} btn-secondary`}>Cancelar</button>
      <button type="button" onClick={onConfirm} className={`${SMALL_BTN} btn-primary`}>Guardar aquí</button>
    </div>
  </section>
);
