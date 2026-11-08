import React, { useState } from 'react';
import { useT } from '../i18n/LanguageContext';
import { LocateFixed, MapPin, Star, Trash2 } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { MAX_PLACE_NAME, MAX_PLACES, type Home, type MapPoint, type MyPlace } from '../services/myPlaces';

const SHEET_BODY = 'px-4 pb-4 space-y-3';
const STAYS_HERE = 'Se guarda solo en este celular.';

interface HomeSheetProps {
  open: boolean;
  onClose: () => void;
  home: Home | null;
  isLocating: boolean;
  /** False while the map is not drawn (no internet since the screen opened). */
  canPickOnMap: boolean;
  onUseMyLocation: () => void;
  onPickOnMap: () => void;
  onRemove: () => void;
}

export const HomeSheet: React.FC<HomeSheetProps> = ({
  open, onClose, home, isLocating, canPickOnMap, onUseMyLocation, onPickOnMap, onRemove
}) => {
  const t = useT();
  return (
  <BottomSheet open={open} onClose={onClose} title={home ? t('Cambiar mi casa') : t('¿Dónde es tu casa?')}>
    <div className={SHEET_BODY} style={{ paddingBottom: 'calc(16px + var(--safe-bottom))' }}>
      <p className="text-secondary text-ink-2">
        {home
          ? home.address
            ? t('Ahora está en {place}.', { place: home.address })
            : t('Ahora está en un punto que elegiste en el mapa.')
          : t('Guárdala para saber a cuánto estás y cómo volver. Si estás en casa, usa tu ubicación.')}{' '}
        {t(STAYS_HERE)}
      </p>
      <button
        type="button"
        className="btn btn-primary disabled:opacity-60"
        onClick={onUseMyLocation}
        disabled={isLocating}
        aria-busy={isLocating}
      >
        <LocateFixed className="w-6 h-6" aria-hidden="true" />
        {isLocating ? t('Buscando tu ubicación...') : t('Estoy en casa ahora')}
      </button>
      {canPickOnMap && (
        <>
          <button type="button" className="btn btn-secondary" onClick={onPickOnMap}>
            <MapPin className="w-6 h-6" aria-hidden="true" />
            {t('Elegirla en el mapa')}
          </button>
          <p className="text-meta text-ink-2">{t('También puedes buscar tu dirección arriba y tocar «Es mi casa».')}</p>
        </>
      )}
      {home && (
        <button type="button" onClick={onRemove} className="flex items-center gap-2 min-h-12 px-1 text-secondary font-bold text-rojo">
          <Trash2 className="w-5 h-5" aria-hidden="true" />
          {t('Quitar mi casa')}
        </button>
      )}
    </div>
  </BottomSheet>
  );
};

interface PlacesSheetProps {
  open: boolean;
  onClose: () => void;
  places: MyPlace[];
  distanceTo: (point: MapPoint) => string | null;
  isLocating: boolean;
  canPickOnMap: boolean;
  onOpenPlace: (place: MyPlace) => void;
  onDelete: (place: MyPlace) => void;
  onAddHere: () => void;
  onAddOnMap: () => void;
}

export const PlacesSheet: React.FC<PlacesSheetProps> = ({
  open, onClose, places, distanceTo, isLocating, canPickOnMap, onOpenPlace, onDelete, onAddHere, onAddOnMap
}) => {
  const t = useT();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const isFull = places.length >= MAX_PLACES;

  // A half-done delete must not wait in the list the next time it opens.
  if (!open && confirmingId !== null) setConfirmingId(null);

  const footer = isFull ? (
    <p className="pb-1 text-secondary text-ink-2">{t('Tienes {count} lugares, el máximo. Borra uno para agregar otro.', { count: MAX_PLACES })}</p>
  ) : (
    <div>
      <p className="pb-2 text-secondary font-bold">{t("Agregar un lugar")}</p>
      <div className={`grid gap-2 ${canPickOnMap ? 'grid-cols-2' : ''}`}>
        <button
          type="button"
          className="btn btn-primary text-secondary px-2 disabled:opacity-60"
          onClick={onAddHere}
          disabled={isLocating}
          aria-busy={isLocating}
        >
          <LocateFixed className="w-5 h-5 shrink-0" aria-hidden="true" />
          {isLocating ? t('Ubicando...') : t('Donde estoy')}
        </button>
        {canPickOnMap && (
          <button type="button" className="btn btn-secondary text-secondary px-2" onClick={onAddOnMap}>
            <MapPin className="w-5 h-5 shrink-0" aria-hidden="true" />
            {t('En el mapa')}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <BottomSheet open={open} onClose={onClose} title={t("Mis lugares")} footer={footer}>
      {places.length === 0 ? (
        <div className="px-4 pb-4">
          <p className="text-row font-bold">{t("Aún no guardas lugares")}</p>
          <p className="mt-1 text-secondary text-ink-2">
            {t('Guarda el colegio de tus hijos, tu trabajo o el punto de reunión de tu familia.')} {t(STAYS_HERE)}
          </p>
        </div>
      ) : (
        <ul className="list-plain border-t border-line" aria-label={t("Lugares guardados")}>
          {places.map((place) => {
            const distance = distanceTo(place);
            const isConfirming = confirmingId === place.id;
            return (
              <li key={place.id} className="flex items-center pr-2">
                <button type="button" onClick={() => onOpenPlace(place)} className="row min-h-16 flex-1 min-w-0 py-2">
                  <Star className="w-6 h-6 shrink-0 text-anil" aria-hidden="true" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-row font-bold truncate">{place.name}</span>
                    <span className="block text-meta text-ink-2 truncate">
                      {[distance && distance.charAt(0).toUpperCase() + distance.slice(1), place.address].filter(Boolean).join('. ') || t('Punto elegido en el mapa')}
                    </span>
                  </span>
                </button>
                {isConfirming ? (
                  <span className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingId(null);
                        onDelete(place);
                      }}
                      className="min-h-12 px-3 rounded-lg bg-rojo text-white text-secondary font-bold"
                    >
                      {t("Borrar")}
                    </button>
                    <button type="button" onClick={() => setConfirmingId(null)} className="min-h-12 px-3 rounded-lg text-secondary font-bold text-ink-2">
                      {t("No")}
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingId(place.id)}
                    aria-label={t('Borrar {place}', { place: place.name })}
                    title={t('Borrar')}
                    className="icon-btn text-ink-2"
                  >
                    <Trash2 className="w-5 h-5" aria-hidden="true" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </BottomSheet>
  );
};

const NAME_IDEAS = ['Punto de reunión', 'Colegio', 'Trabajo', 'Casa de familia', 'Posta'];

export interface PlaceDraft extends MapPoint {
  name: string;
  address: string;
}

interface SavePlaceSheetProps {
  draft: PlaceDraft | null;
  onClose: () => void;
  onSave: (name: string) => void;
}

export const SavePlaceSheet: React.FC<SavePlaceSheetProps> = ({ draft, onClose, onSave }) => {
  const t = useT();
  const [name, setName] = useState('');
  const [nameFor, setNameFor] = useState('');

  // A new point starts with its suggested name; its address arriving later must not wipe what was typed.
  const draftKey = draft ? `${draft.lat},${draft.lng}` : '';
  if (draftKey !== nameFor) {
    setNameFor(draftKey);
    if (draft) setName(draft.name);
  }

  const trimmed = name.trim();

  return (
    <BottomSheet open={draft !== null} onClose={onClose} title={t("Guardar lugar")}>
      <form
        className={SHEET_BODY}
        style={{ paddingBottom: 'calc(16px + var(--safe-bottom))' }}
        onSubmit={(event) => {
          event.preventDefault();
          if (trimmed) onSave(trimmed);
        }}
      >
        <p className="flex items-start gap-2 text-secondary text-ink-2">
          <MapPin className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
          {draft?.address || t('Punto elegido en el mapa')}
        </p>
        <div>
          <label htmlFor="place-name" className="block pb-1 text-secondary font-bold">{t("Nombre del lugar")}</label>
          <input
            id="place-name"
            className="field"
            value={name}
            maxLength={MAX_PLACE_NAME}
            required
            autoComplete="off"
            placeholder={t("Ej.: Colegio de mi hija")}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("Ideas de nombre")}>
          {NAME_IDEAS.map((idea) => (
            <button key={idea} type="button" className="chip" onClick={() => setName(t(idea))}>
              {t(idea)}
            </button>
          ))}
        </div>
        <p className="text-meta text-ink-2">{t(STAYS_HERE)}</p>
        <button type="submit" className="btn btn-primary disabled:opacity-60" disabled={!trimmed}>
          <Star className="w-6 h-6" aria-hidden="true" />
          {t("Guardar en mis lugares")}
        </button>
      </form>
    </BottomSheet>
  );
};
