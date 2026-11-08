import React, { useEffect, useState } from 'react';
import { Flame, Hospital, MapPin, Phone, ShieldHalf, type LucideIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dialablePhone, EmergencyPlace, formatDistance, nearbyEmergencyPlaces, PlaceKind, savedEmergencyPlaces } from '../services/placesService';
import { formatRelativeTime } from '../utils/time';
import { useT } from '../i18n/LanguageContext';

const KIND: Record<PlaceKind, { label: string; icon: LucideIcon }> = {
  police: { label: 'Comisaría', icon: ShieldHalf },
  fire_station: { label: 'Bomberos', icon: Flame },
  hospital: { label: 'Hospital o clínica', icon: Hospital }
};

/** The nearest police, firefighters and hospital, with their phone when the map knows it. */
export const NearbyHelp: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  const { userLocation, hasLocation, isOnline } = useApp();
  const t = useT();
  const [places, setPlaces] = useState<EmergencyPlace[] | null>(() => savedEmergencyPlaces()?.places ?? null);
  const [savedAt, setSavedAt] = useState<string | null>(() => savedEmergencyPlaces()?.savedAt ?? null);

  useEffect(() => {
    if (!isVisible || !hasLocation || !isOnline) return;
    nearbyEmergencyPlaces(userLocation.lat, userLocation.lng)
      .then((found) => {
        setPlaces(found);
        setSavedAt(null);
      })
      .catch(() => setSavedAt(savedEmergencyPlaces()?.savedAt ?? null));
  }, [isVisible, hasLocation, isOnline, userLocation.lat, userLocation.lng]);

  if (!hasLocation && !places) {
    return (
      <p className="px-4 pt-3 text-secondary text-ink-2">
        {t('Activa tu ubicación para ver la comisaría, los bomberos y el hospital más cercanos.')}
      </p>
    );
  }
  if (!places?.length) return null;

  return (
    <section aria-labelledby="nearby-help-title" className="pt-3">
      <h3 id="nearby-help-title" className="px-4 text-secondary font-bold">{t('Más cerca de ti')}</h3>
      {savedAt && (
        <p className="px-4 text-meta text-ink-2">{t('Guardado {time}, sin internet.', { time: formatRelativeTime(savedAt).toLowerCase() })}</p>
      )}
      <ul className="list-plain">
        {places.map((place) => {
          const { icon: Icon } = KIND[place.kind];
          const label = t(KIND[place.kind].label);
          const name = place.name ?? label;
          const href = place.phone ? `tel:${dialablePhone(place.phone)}` : `https://maps.google.com/?q=${place.lat},${place.lng}`;
          return (
            <li key={`${place.kind}-${place.lat}-${place.lng}`}>
              <a
                href={href}
                target={place.phone ? undefined : '_blank'}
                rel={place.phone ? undefined : 'noreferrer'}
                className="row no-underline"
                aria-label={`${label}: ${name}, ${formatDistance(place.distance_m)}. ${place.phone ? t('Llamar al {phone}', { phone: place.phone }) : t('Ver cómo llegar')}`}
              >
                <Icon className="w-6 h-6 shrink-0 text-rojo" aria-hidden="true" />
                <span className="flex-1 min-w-0">
                  <span className="block text-row font-semibold truncate">{name}</span>
                  <span className="block text-secondary text-ink-2">
                    {label}, {formatDistance(place.distance_m)}{place.phone ? `. ${place.phone}` : ''}
                  </span>
                </span>
                {place.phone
                  ? <Phone className="w-6 h-6 shrink-0 text-anil" aria-hidden="true" />
                  : <MapPin className="w-6 h-6 shrink-0 text-anil" aria-hidden="true" />}
              </a>
            </li>
          );
        })}
      </ul>
      <p className="px-4 text-meta text-ink-2">{t('Datos de OpenStreetMap. Si no tiene teléfono, te mostramos cómo llegar.')}</p>
    </section>
  );
};
