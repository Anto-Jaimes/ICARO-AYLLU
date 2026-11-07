import React, { useState } from 'react';
import { BottomSheet } from './BottomSheet';

interface FirstAidSheetProps {
  open: boolean;
  onClose: () => void;
}

const GUIDES = [
  {
    id: 'hemorragia',
    title: 'Sangrado fuerte',
    steps: [
      'Presiona directamente sobre la herida con un paño limpio o gasa, con fuerza y sin soltar.',
      'No retires el paño aunque se empape; coloca otro encima y sigue presionando.',
      'Eleva la extremidad herida por encima del nivel del corazón si no hay fractura.',
      'Mantén a la persona abrigada y acostada mientras llega ayuda. Llama al 106.'
    ]
  },
  {
    id: 'asfixia',
    title: 'Atragantamiento',
    steps: [
      'Pregunta a la persona si puede hablar o toser. Si tose, anímala a seguir tosiendo.',
      'Si no puede respirar ni hacer sonido: colócate detrás y rodea su cintura con tus brazos.',
      'Coloca un puño, con el pulgar hacia adentro, justo arriba del ombligo.',
      'Cubre el puño con tu otra mano y presiona con fuerza hacia adentro y hacia arriba. Repite hasta que expulse el objeto.',
      'Si se desmaya, llama al 106 y empieza a presionar el pecho.'
    ]
  },
  {
    id: 'inconsciente',
    title: 'Persona desmayada',
    steps: [
      'Mira si respira: acerca tu mejilla a su boca durante 10 segundos.',
      'Si respira: ponla de costado para que no se ahogue con la lengua o el vómito.',
      'Si no respira: pide que alguien llame al 106 o 116 y presiona fuerte en el centro del pecho, de 100 a 120 veces por minuto, sin parar hasta que llegue ayuda.'
    ]
  },
  {
    id: 'agua',
    title: 'Agua segura',
    steps: [
      'Si el agua está turbia, fíltrala primero con un paño limpio o una tela de algodón.',
      'Hiérvela a borbotones durante al menos 3 minutos.',
      'Si no puedes hervirla: agrega 2 gotas de lejía sin aroma por cada litro (40 gotas, media cucharadita, para un bidón de 20 litros) y espera 30 minutos antes de tomarla.'
    ]
  }
];

export const FirstAidSheet: React.FC<FirstAidSheetProps> = ({ open, onClose }) => {
  const [selectedId, setSelectedId] = useState(GUIDES[0].id);
  const guide = GUIDES.find((item) => item.id === selectedId) ?? GUIDES[0];

  return (
    <BottomSheet open={open} onClose={onClose} title="Primeros auxilios">
      <div className="pb-6 space-y-3">
        <p className="px-4 text-secondary text-ink-2">Pasos básicos mientras llega la ayuda. Funciona sin internet.</p>

        <div className="chip-row" role="group" aria-label="Elige qué pasó">
          {GUIDES.map((item) => (
            <button
              key={item.id}
              type="button"
              className="chip"
              aria-pressed={item.id === selectedId}
              onClick={() => setSelectedId(item.id)}
            >
              {item.title}
            </button>
          ))}
        </div>

        <section className="px-4" aria-live="polite">
          <h3 className="pb-2 text-section font-bold">{guide.title}</h3>
          <ol className="list-decimal pl-6 space-y-2 text-body">
            {guide.steps.map((step) => (
              <li key={step} className="pl-1">{step}</li>
            ))}
          </ol>
        </section>
      </div>
    </BottomSheet>
  );
};
