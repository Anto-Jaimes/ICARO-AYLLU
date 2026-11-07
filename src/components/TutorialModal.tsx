import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  ShieldCheck, 
  HeartHandshake, 
  AlertTriangle, 
  WifiOff, 
  Check,
  Sparkles
} from 'lucide-react';

export const TutorialModal: React.FC = () => {
  const { isTutorialOpen, setIsTutorialOpen } = useApp();
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isTutorialOpen) return null;

  const slides = [
    {
      emoji: '☀️',
      title: '¡Bienvenido a ICARO-AYLLU!',
      subtitle: 'La red comunitaria de proximidad y economía solidaria de tu barrio.',
      description: 'Inspirada en el concepto andino del "Ayllu" (ayuda mutua y reciprocidad), esta app conecta a vecinos cercanos para acceder a oficios de confianza, compartir herramientas sin dinero y responder juntos ante emergencias.',
      highlight: 'Ahorra costos de transporte contratando y compartiendo con personas de tu propia cuadra.'
    },
    {
      emoji: '🛡️',
      title: '1. Servicios de Proximidad & Visto Bueno',
      subtitle: 'Contrata oficios recomendados por tus propios vecinos.',
      description: 'Encuentra gasfiteros, electricistas, cerrajeros y cuidadores de mascotas en tu zona. Cada servicio cuenta con un sistema de "Visto Bueno Vecinal" y testimonios reales para garantizar total seguridad y confianza.',
      highlight: '¡Tú también puedes apoyar a tus vecinos honrados otorgándoles tu Visto Bueno!'
    },
    {
      emoji: '🤝',
      title: '2. Cadena de Favores (Sin Dinero)',
      subtitle: 'Resuelve necesidades cotidianas mediante solidaridad comunitaria.',
      description: '¿Necesitas un taladro para un arreglo puntual? ¿Tienes libros o materiales para donar? En el muro de favores puedes prestar herramientas, intercambiar habilidades (trueque) o pedir una mano para mover un mueble sin gastar dinero.',
      highlight: 'La verdadera riqueza del barrio es la solidaridad entre vecinos.'
    },
    {
      emoji: '🚨',
      title: '3. Modo Emergencia & Resiliencia Vecinal',
      subtitle: 'Actívalo ante sismos, cortes prolongados o situaciones críticas.',
      description: 'Al pulsar el botón "Modo Emergencia", la app se transforma en un centro de comando vecinal: reportes geolocalizados de vecinos vulnerables (adultos mayores solos), puntos de agua o recarga solar, y brigadas de primeros auxilios.',
      highlight: 'Funciona también sin conexión a internet (Modo Offline) para cuando se cae la red.'
    },
    {
      emoji: '⚡',
      title: '4. Publicación Rápida en 3 Clics',
      subtitle: 'Diseñado para que cualquier persona del barrio pueda usarlo fácilmente.',
      description: 'Toca el botón flotante (+), elige qué ofreces o necesitas con un toque, y confirma. En solo 3 clics tu publicación estará visible en el mapa y listado de tu zona.',
      highlight: '¡Comienza ahora a fortalecer los lazos de tu comunidad!'
    }
  ];

  const slide = slides[currentSlide];

  const handleFinish = () => {
    localStorage.setItem('icaro_ayllu_tutorial_seen', 'true');
    setIsTutorialOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <span className="text-xs font-bold tracking-wider uppercase text-amber-400">
            Tutorial de uso ({currentSlide + 1} de {slides.length})
          </span>
          <button
            onClick={handleFinish}
            className="text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center flex-1 flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-700 flex items-center justify-center text-4xl shadow-inner mb-4 border border-amber-200">
            {slide.emoji}
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
            {slide.title}
          </h3>

          <p className="text-xs sm:text-sm font-semibold text-amber-700 mt-1">
            {slide.subtitle}
          </p>

          <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed max-w-md">
            {slide.description}
          </p>

          <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-medium text-slate-700 max-w-md">
            💡 <strong>Dato clave:</strong> {slide.highlight}
          </div>
        </div>

        {/* Dots & Nav Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {/* Slide dots */}
          <div className="flex gap-1.5">
            {slides.map((_, idx) => (
              <span
                key={idx}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentSlide
                    ? 'w-6 bg-amber-500'
                    : 'bg-slate-300'
                }`}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {currentSlide > 0 && (
              <button
                onClick={() => setCurrentSlide(prev => prev - 1)}
                className="p-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                title="Paso anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {currentSlide < slides.length - 1 ? (
              <button
                onClick={() => setCurrentSlide(prev => prev + 1)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs flex items-center gap-1.5 transition shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>¡Empezar a usar ICARO-AYLLU!</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
