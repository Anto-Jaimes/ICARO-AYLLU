import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { canSpeak, speak, stopSpeaking } from '../utils/audioGuide';

interface AudioGuideButtonProps {
  className?: string;
  screenTitle?: string;
}

export const AudioGuideButton: React.FC<AudioGuideButtonProps> = ({ className = '' }) => {
  const { mode, tab, userLocation, hasLocation, items, isAlertsOpen, isNewsOpen, showNotice } = useApp();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const wasStopped = useRef(false);

  useEffect(() => () => stopSpeaking(), []);

  if (!canSpeak()) return null;

  const spokenText = (): string => {
    if (mode === 'emergency') {
      return 'Modo emergencia activado. En esta pantalla puedes ver a los vecinos que necesitan ayuda urgente y los grupos de apoyo. Para llamar a los Bomberos marca el ciento dieciséis. Para la Policía, el ciento cinco. O toca el botón rojo S.O.S.';
    }
    if (isAlertsOpen) {
      return 'Alertas oficiales del Perú. Aquí verás los sismos del Instituto Geofísico del Perú y los avisos de lluvias o huaicos del Senamhi.';
    }
    if (isNewsOpen) {
      return 'Noticias de tu barrio. Aquí los vecinos comparten fotos y avisos de lo que pasa en tu zona.';
    }
    if (tab === 'services') {
      return 'Oficios de tu barrio. Aquí encuentras gasfitería, electricidad, cerrajería y más, recomendados por tus propios vecinos. Toca un servicio para ver cómo contactarlo.';
    }
    if (tab === 'favors') {
      return 'Favores entre vecinos. Aquí los vecinos prestan herramientas como taladros o escaleras, y ofrecen ayuda sin cobrar. Toca un favor para coordinar.';
    }
    if (tab === 'map') {
      return 'Mapa de tu zona. Los círculos de colores muestran los oficios, los favores y los puntos de emergencia cerca de ti.';
    }
    const nearby = items.filter((item) => item.type === 'service' || item.type === 'favor_offer').length;
    const place = hasLocation ? `Estás en ${userLocation.name}. ` : '';
    return `Bienvenido a AYLLU, tu red de vecinos. ${place}Hay ${nearby} oficios y favores cerca de ti. Abajo tienes el botón rojo S.O.S. para emergencias, que funciona sin internet ni saldo, y el botón azul para publicar.`;
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
    speak(spokenText())
      .catch(() => {
        if (!wasStopped.current) showNotice('Tu teléfono no tiene una voz en español. Puedes instalarla en los ajustes de texto a voz.');
      })
      .finally(() => setIsSpeaking(false));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isSpeaking ? 'Detener la lectura' : 'Escuchar esta pantalla'}
      aria-pressed={isSpeaking}
      title={isSpeaking ? 'Detener la lectura' : 'Escuchar esta pantalla'}
      className={`icon-btn ${isSpeaking ? 'bg-sunken text-anil' : ''} ${className}`}
    >
      {isSpeaking ? <VolumeX className="w-6 h-6" aria-hidden="true" /> : <Volume2 className="w-6 h-6" aria-hidden="true" />}
    </button>
  );
};
