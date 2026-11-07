import React, { useState } from 'react';
import { HeartPulse, Droplets, AlertTriangle, Activity, Flame, Shield } from 'lucide-react';
import { BottomSheet } from './BottomSheet';

interface FirstAidSheetProps {
  open: boolean;
  onClose: () => void;
}

const GUIDES = [
  {
    id: 'hemorragia',
    title: 'Hemorragia Severa',
    icon: Droplets,
    badge: 'Urgente',
    steps: [
      'Presiona directamente sobre la herida con un paño limpio o gasa con fuerza continua.',
      'No retires el paño aunque se empape; coloca otro encima y sigue presionando.',
      'Eleva la extremidad herida por encima del nivel del corazón si no hay fractura.',
      'Mantén a la persona abrigada y acostada mientras llega auxilio médico.'
    ]
  },
  {
    id: 'asfixia',
    title: 'Atragantamiento (Heimlich)',
    icon: Activity,
    badge: 'Vital',
    steps: [
      'Pregunta a la persona si puede hablar o toser. Si tose, anímala a seguir tosiendo.',
      'Si no puede respirar ni emitir sonido: colócate detrás y rodea su cintura con tus brazos.',
      'Coloca un puño con el pulgar hacia adentro justo arriba del ombligo.',
      'Cubre el puño con tu otra mano y presiona con fuerza hacia adentro y hacia arriba en forma de "J".'
    ]
  },
  {
    id: 'inconsciente',
    title: 'Persona Inconsciente',
    icon: HeartPulse,
    badge: 'Seguridad',
    steps: [
      'Verifica si respira acercando tu mejilla a su boca durante 10 segundos.',
      'Si respira: colócala en Posición Lateral de Seguridad (de costado) para evitar que se asfixie con la lengua o vómito.',
      'Si NO respira: inicia compresiones torácicas en el centro del pecho (100 a 120 por minuto) y llama al 106 (SAMU) o 116 (Bomberos).'
    ]
  },
  {
    id: 'agua',
    title: 'Purificación Casera de Agua',
    icon: Shield,
    badge: 'Salud',
    steps: [
      'Si el agua está turbia, fíltrola primero con un paño limpio o tela de algodón.',
      'Hervir a borbotones durante al menos 3 minutos continuos.',
      'O desinfección con lejía (cloro sin aroma): agrega 2 gotas de lejía por cada litro de agua (o 1 cucharadita por bidón de 20 litros) y espera 30 minutos antes de consumir.'
    ]
  }
];

export const FirstAidSheet: React.FC<FirstAidSheetProps> = ({ open, onClose }) => {
  const [selectedId, setSelectedId] = useState<string>('hemorragia');
  const activeGuide = GUIDES.find((g) => g.id === selectedId) || GUIDES[0];

  return (
    <BottomSheet open={open} onClose={onClose} title="Primeros Auxilios Offline">
      <div className="px-4 pb-6 space-y-4 text-ink">
        <p className="text-secondary text-ink-2">
          Protocolos básicos para salvar vidas en situaciones críticas sin internet ni ambulancias cercanas.
        </p>

        {/* Tab Selector */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {GUIDES.map((guide) => (
            <button
              key={guide.id}
              type="button"
              onClick={() => setSelectedId(guide.id)}
              className={`px-3 py-1.5 rounded-xl text-secondary font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                selectedId === guide.id
                  ? 'bg-rojo text-white shadow-xs'
                  : 'bg-surface border border-line text-ink-2 hover:bg-surface-press'
              }`}
            >
              {guide.title}
            </button>
          ))}
        </div>

        {/* Active Protocol Card */}
        <div className="p-4 bg-surface rounded-2xl border-2 border-line space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-section font-bold text-ink">{activeGuide.title}</h3>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-100 text-rojo">
              {activeGuide.badge}
            </span>
          </div>

          <ol className="list-decimal pl-5 space-y-2 text-secondary text-ink leading-relaxed">
            {activeGuide.steps.map((step, idx) => (
              <li key={idx} className="pl-1">
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </BottomSheet>
  );
};
