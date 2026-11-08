import React, { useEffect, useState } from 'react';
import { ExternalLink, Info, MapPin, Phone, Pill } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DIGEMID_SEARCH_URL, isOpenAllDay, nearbyPharmacies, Pharmacy, savedPharmacies } from '../services/pharmacyService';
import { dialablePhone, formatDistance } from '../services/placesService';
import { formatRelativeTime } from '../utils/time';
import { BottomSheet } from './BottomSheet';
import { useT } from '../i18n/LanguageContext';

interface PharmacySheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The pharmacies nearest to the neighbour, as they are on the map, and DIGEMID's official search for
 * medicines and prices. It never says which one is "de turno": that is not published as open data.
 */
export const PharmacySheet: React.FC<PharmacySheetProps> = ({ open, onClose }) => {
  const { userLocation, hasLocation, isOnline } = useApp();
  const t = useT();
  const [pharmacies, setPharmacies] = useState<Pharmacy[] | null>(() => savedPharmacies()?.pharmacies ?? null);
  const [savedAt, setSavedAt] = useState<string | null>(() => savedPharmacies()?.savedAt ?? null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open || !hasLocation || !isOnline) return;
    setIsLoading(true);
    nearbyPharmacies(userLocation.lat, userLocation.lng)
      .then((found) => {
        setPharmacies(found);
        setSavedAt(null);
      })
      .catch(() => setSavedAt(savedPharmacies()?.savedAt ?? null))
      .finally(() => setIsLoading(false));
  }, [open, hasLocation, isOnline, userLocation.lat, userLocation.lng]);

  return (
    <BottomSheet open={open} onClose={onClose} title={t('Farmacias cerca')}>
      <div style={{ paddingBottom: 'calc(16px + var(--safe-bottom))' }}>
        <p className="mx-4 flex gap-3 p-3 rounded-lg bg-sunken text-secondary">
          <Info className="w-6 h-6 shrink-0 text-anil" aria-hidden="true" />
          {t('No sabemos qué farmacia está de turno hoy: llama antes de ir.')}
        </p>

        {!hasLocation && !pharmacies && (
          <p className="px-4 pt-3 text-secondary text-ink-2">{t('Activa tu ubicación para ver las farmacias más cercanas.')}</p>
        )}
        {isLoading && !pharmacies && <p role="status" className="px-4 pt-3 text-secondary text-ink-2">{t('Buscando farmacias...')}</p>}
        {pharmacies && pharmacies.length === 0 && (
          <p className="px-4 pt-3 text-secondary text-ink-2">{t('No encontramos farmacias en el mapa a menos de 20 km.')}</p>
        )}
        {savedAt && (
          <p className="px-4 pt-3 text-meta text-ink-2">{t('Guardado {time}, sin internet.', { time: formatRelativeTime(savedAt).toLowerCase() })}</p>
        )}

        {pharmacies && pharmacies.length > 0 && (
          <ul className="list-plain pt-2">
            {pharmacies.map((pharmacy) => {
              const name = pharmacy.name ?? t('Farmacia');
              const href = pharmacy.phone
                ? `tel:${dialablePhone(pharmacy.phone)}`
                : `https://maps.google.com/?q=${pharmacy.lat},${pharmacy.lng}`;
              const details = [
                pharmacy.address,
                formatDistance(pharmacy.distance_m),
                isOpenAllDay(pharmacy.opening_hours) ? t('Abierta las 24 horas, según el mapa') : null,
                pharmacy.phone
              ].filter(Boolean).join('. ');
              return (
                <li key={`${pharmacy.lat}-${pharmacy.lng}`}>
                  <a
                    href={href}
                    target={pharmacy.phone ? undefined : '_blank'}
                    rel={pharmacy.phone ? undefined : 'noreferrer'}
                    className="row no-underline"
                    aria-label={`${name}: ${details}. ${pharmacy.phone ? t('Llamar al {phone}', { phone: pharmacy.phone }) : t('Ver cómo llegar')}`}
                  >
                    <Pill className="w-6 h-6 shrink-0 text-verde" aria-hidden="true" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-row font-semibold truncate">{name}</span>
                      <span className="block text-secondary text-ink-2">{details}</span>
                    </span>
                    {pharmacy.phone
                      ? <Phone className="w-6 h-6 shrink-0 text-anil" aria-hidden="true" />
                      : <MapPin className="w-6 h-6 shrink-0 text-anil" aria-hidden="true" />}
                  </a>
                </li>
              );
            })}
          </ul>
        )}

        <section aria-labelledby="digemid-title" className="px-4 pt-4 space-y-2">
          <h3 id="digemid-title" className="text-row font-bold">{t('¿Buscas un medicamento?')}</h3>
          <p className="text-secondary text-ink-2">
            {t('DIGEMID, del Ministerio de Salud, muestra en qué farmacias lo venden y a qué precio.')}
          </p>
          <a href={DIGEMID_SEARCH_URL} target="_blank" rel="noreferrer" className="btn btn-secondary no-underline">
            <ExternalLink className="w-6 h-6" aria-hidden="true" />
            {t('Buscar en DIGEMID')}
          </a>
          <p className="text-meta text-ink-2">{t('Farmacias: datos de OpenStreetMap. Si no tiene teléfono, te mostramos cómo llegar.')}</p>
        </section>
      </div>
    </BottomSheet>
  );
};
