import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../i18n/LanguageContext';
import { canSpeak, speak, stopSpeaking } from '../utils/audioGuide';
import { placeLabel } from '../services/geoService';

interface AudioGuideButtonProps {
  className?: string;
  screenTitle?: string;
}

export const AudioGuideButton: React.FC<AudioGuideButtonProps> = ({ className = '' }) => {
  const { mode, tab, userLocation, hasLocation, items, isAlertsOpen, isNewsOpen, showNotice } = useApp();
  const { lang, t } = useLanguage();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const wasStopped = useRef(false);

  useEffect(() => () => stopSpeaking(), []);

  if (!canSpeak()) return null;

  const spokenText = (): string => {
    if (mode === 'emergency') {
      return t('Modo emergencia activado. En esta pantalla puedes ver a los vecinos que necesitan ayuda urgente y los grupos de apoyo. Para llamar a los Bomberos marca el ciento dieciséis. Para la Policía, el ciento cinco. O toca el botón rojo S.O.S.');
    }

    if (isAlertsOpen) {
      return t('Alertas oficiales del Perú. Aquí verás los sismos del Instituto Geofísico del Perú y los avisos de lluvias o huaicos del Senamhi.');
    }

    if (isNewsOpen) {
      return t('Noticias de tu barrio. Aquí los vecinos comparten fotos y avisos de lo que pasa en tu zona.');
    }

    if (tab === 'services') {
      return t('Oficios de tu barrio. Aquí encuentras gasfitería, electricidad, cerrajería y más, recomendados por tus propios vecinos. Toca un servicio para ver cómo contactarlo.');
    }

    if (tab === 'favors') {
      return t('Donaciones entre vecinos. Aquí los vecinos regalan lo que ya no usan, como ropa, muebles o útiles, y las familias u organizaciones piden lo que necesitan. Toca una donación para coordinar.');
    }

    if (tab === 'map') {
      return t('Mapa de tu zona. Los círculos de colores muestran los oficios, las donaciones y los puntos de emergencia cerca de ti.');
    }
    const count = items.filter((item) => item.type === 'service' || item.type === 'favor_offer').length;
    return hasLocation
      ? t('Bienvenido a AYLLU, tu red de vecinos. Estás en {place}. Hay {count} oficios y donaciones cerca de ti. Abajo tienes el botón rojo S.O.S. para emergencias, que funciona sin internet ni saldo, y el botón azul para publicar.', { place: placeLabel(userLocation.name), count })
      : t('Bienvenido a AYLLU, tu red de vecinos. Hay {count} oficios y donaciones cerca de ti. Abajo tienes el botón rojo S.O.S. para emergencias, que funciona sin internet ni saldo, y el botón azul para publicar.', { count });
  };

  const toggle = () => {
    if (isSpeaking) {
      wasStopped.current = true;
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }
    wasStopped.current = false;
    setIsSpeaking(true);
    speak(spokenText(), lang)
      .catch(() => {
        if (wasStopped.current) return;
        // English is read with an English voice; Spanish, Quechua and Aymara with a Spanish one.
        showNotice(
          lang === 'en'
            ? t('Tu teléfono no tiene una voz en inglés. Puedes instalarla en los ajustes de texto a voz.')
            : t('Tu teléfono no tiene una voz en español. Puedes instalarla en los ajustes de texto a voz.')
        );
      })
      .finally(() => setIsSpeaking(false));
  };

  const label = isSpeaking ? t('Detener la lectura') : t('Escuchar esta pantalla');

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={isSpeaking}
      title={label}
      className={`icon-btn ${isSpeaking ? 'bg-sunken text-primary' : ''} ${className}`}
    >
      {isSpeaking ? <VolumeX className="w-6 h-6" aria-hidden="true" /> : <Volume2 className="w-6 h-6" aria-hidden="true" />}
    </button>
  );
};
