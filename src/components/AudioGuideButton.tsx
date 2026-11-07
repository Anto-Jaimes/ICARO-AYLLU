import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { audioGuide } from '../utils/audioGuide';

interface AudioGuideButtonProps {
  className?: string;
  screenTitle?: string;
}

export const AudioGuideButton: React.FC<AudioGuideButtonProps> = ({ className = '', screenTitle = '' }) => {
  const { mode, tab, userLocation, items, isAlertsOpen, isNewsOpen } = useApp();
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      audioGuide.stop();
    };
  }, []);

  const getSpokenText = (): string => {
    if (mode === 'emergency') {
      return 'Modo Emergencia activado. En esta pantalla puedes ver los vecinos que necesitan auxilio urgente y los grupos de apoyo. Para llamar a los Bomberos marca el ciento dieciséis. Para la Policía marca el ciento cinco. O toca el botón rojo S.O.S. abajo a la derecha.';
    }

    if (isAlertsOpen) {
      return 'Pantalla de alertas oficiales del Perú. Aquí verás los reportes sísmicos del Instituto Geofísico del Perú y avisos de lluvias o huaicos del Senamhi.';
    }

    if (isNewsOpen) {
      return 'Noticias y reportes de tu barrio. Aquí los vecinos comparten fotos y avisos de lo que ocurre en tu zona.';
    }

    if (tab === 'services') {
      return 'Directorio de oficios y trabajos de tu barrio. Aquí encuentras gasfitería, electricidad, cerrajería y más, recomendados por tus propios vecinos a pocos minutos caminando. Puedes tocar cualquier servicio para llamarlo directamente por teléfono.';
    }

    if (tab === 'favors') {
      return 'Cadena de favores y Ayni solidario. En esta sección los vecinos prestan herramientas como taladros o escaleras, y ofrecen ayuda temporal sin gastar dinero. Toca cualquier favor para coordinar.';
    }

    if (tab === 'map') {
      return 'Mapa interactivo de tu zona. Muestra con círculos de colores los oficios, herramientas y puntos de emergencia alrededor de tu casa.';
    }

    // Default Home Screen description
    const servicesCount = items.filter((i) => i.type === 'service').length;
    return `Bienvenido a AYLLU, tu red comunitaria. Tu ubicación es ${userLocation.name}. Tienes ${servicesCount} oficios y favores disponibles cerca de ti. Abajo a la derecha tienes el botón rojo de S.O.S. para emergencias que funciona sin internet ni saldo, y el botón azul para publicar.`;
  };

  const handleToggleAudio = () => {
    if (isSpeaking) {
      audioGuide.stop();
      setIsSpeaking(false);
    } else {
      const text = getSpokenText();
      const started = audioGuide.speak(text, (speaking) => {
        setIsSpeaking(speaking);
      });
      if (started) setIsSpeaking(true);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggleAudio}
      aria-label={isSpeaking ? 'Detener lectura en voz alta' : 'Escuchar pantalla en voz alta (Audioguía)'}
      className={`icon-btn flex items-center justify-center transition-all cursor-pointer ${
        isSpeaking ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-400' : 'text-ink-2 hover:text-ink'
      } ${className}`}
      title={isSpeaking ? 'Detener voz' : '🔊 Escuchar pantalla en voz alta (Accesible sin internet)'}
    >
      {isSpeaking ? (
        <VolumeX className="w-6 h-6 text-amber-700 animate-pulse" aria-hidden="true" />
      ) : (
        <Volume2 className="w-6 h-6" aria-hidden="true" />
      )}
    </button>
  );
};
