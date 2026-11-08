import React, { useState } from 'react';
import { House } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MAX_REFERENCE, referenceNear, REFERENCE_RADIUS_M, saveReference } from '../utils/exactLocation';
import { useT } from '../i18n/LanguageContext';

/**
 * "Manzana y lote": no public map knows them, so the neighbour writes them once. They stay on this
 * phone and go in rescue messages while the phone is near where they were written.
 */
export const ExactReferenceField: React.FC = () => {
  const { userLocation, hasLocation, showNotice } = useApp();
  const t = useT();
  const near = hasLocation ? referenceNear(userLocation.lat, userLocation.lng) : null;
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');

  if (!hasLocation) {
    return <p className="text-secondary text-ink-secondary">{t('Activa tu ubicación para poder enviar dónde estás exactamente.')}</p>;
  }

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (saveReference(draft, userLocation.lat, userLocation.lng)) {
      setIsEditing(false);
      showNotice(draft.trim() ? t('Guardado. Irá en tus mensajes de auxilio cuando estés aquí.') : t('Dirección exacta borrada.'));
    }
  };

  if (isEditing) {
    return (
      <form onSubmit={save} className="space-y-2 p-3 rounded-lg bg-sunken">
        <label htmlFor="exact-reference" className="block text-secondary font-bold">{t('Manzana y lote, o una referencia')}</label>
        <input
          id="exact-reference"
          className="field"
          value={draft}
          maxLength={MAX_REFERENCE}
          placeholder="Mz. B Lt. 12, AA.HH. Los Jardines"
          onChange={(event) => setDraft(event.target.value)}
          autoComplete="street-address"
        />
        <p className="text-meta text-ink-secondary">
          {t('Se guarda solo en tu celular. Irá en tus mensajes de auxilio cuando estés a menos de {meters} m de aquí.', { meters: REFERENCE_RADIUS_M })}
        </p>
        <div className="flex gap-2">
          <button type="button" className="btn btn-secondary flex-1 min-h-12" onClick={() => setIsEditing(false)}>{t('Cancelar')}</button>
          <button type="submit" className="btn btn-primary flex-1 min-h-12">{t('Guardar')}</button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex gap-3 p-3 rounded-lg bg-sunken">
      <House className="w-6 h-6 shrink-0 text-primary" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-secondary font-bold">{t('Tu dirección exacta')}</p>
        <p className="text-secondary">{near ?? t('Escribe tu manzana y lote para que la ayuda llegue a tu puerta.')}</p>
        <button
          type="button"
          className="mt-2 min-h-12 text-secondary font-bold text-primary underline underline-offset-4"
          onClick={() => {
            setDraft(near ?? '');
            setIsEditing(true);
          }}
        >
          {near ? t('Cambiar') : t('Escribir manzana y lote')}
        </button>
      </div>
    </div>
  );
};
