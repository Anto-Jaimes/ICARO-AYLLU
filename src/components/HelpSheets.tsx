import React, { useState } from 'react';
import { CircleHelp, HandHeart, Plus, Printer, Siren, Store, TriangleAlert, type LucideIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BottomSheet } from './BottomSheet';

interface Slide {
  icon: LucideIcon;
  title: string;
  text: string;
}

const SLIDES: Slide[] = [
  {
    icon: TriangleAlert,
    title: 'Mira si tu zona está bien',
    text: 'Arriba verás un color y una frase con las alertas oficiales de tu zona.'
  },
  {
    icon: Store,
    title: 'Encuentra y ayuda a tus vecinos',
    text: 'Busca servicios que otros vecinos recomiendan, y presta o pide favores sin dinero.'
  },
  {
    icon: Plus,
    title: 'Publica con 3 toques',
    text: 'Toca Publicar y elige: avisar de un accidente o huaico con foto o video, ofrecer tu trabajo, o pedir un favor.'
  },
  {
    icon: Siren,
    title: 'En una emergencia, toca SOS',
    text: 'Está siempre abajo a la derecha. Llama a los números de auxilio aunque no tengas internet.'
  }
];

export const TutorialSheet: React.FC = () => {
  const { isTutorialOpen, setIsTutorialOpen } = useApp();
  const [slide, setSlide] = useState(0);

  const finish = () => {
    localStorage.setItem('icaro_ayllu_tutorial_seen', 'true');
    setIsTutorialOpen(false);
    setSlide(0);
  };

  const { icon: Icon, title, text } = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  return (
    <BottomSheet
      open={isTutorialOpen}
      onClose={finish}
      title="Cómo se usa"
      footer={
        <button type="button" className="btn btn-primary" onClick={() => (isLast ? finish() : setSlide(slide + 1))}>
          {isLast ? 'Empezar' : 'Siguiente'}
        </button>
      }
    >
      <div className="px-4 pb-4">
        <Icon className="w-10 h-10 text-anil" aria-hidden="true" />
        <h3 className="mt-3 text-section font-bold">{title}</h3>
        <p className="mt-1">{text}</p>
        <p className="mt-3 text-meta text-ink-2">Paso {slide + 1} de {SLIDES.length}</p>
      </div>
    </BottomSheet>
  );
};

export const MenuSheet: React.FC = () => {
  const { isMenuOpen, setIsMenuOpen, setIsTutorialOpen, setIsMuralOpen } = useApp();

  return (
    <BottomSheet open={isMenuOpen} onClose={() => setIsMenuOpen(false)} title="Ayuda">
      <div style={{ paddingBottom: 'calc(16px + var(--safe-bottom))' }}>
        <ul className="list-plain">
          <li>
            <button
              type="button"
              className="row"
              onClick={() => {
                setIsMenuOpen(false);
                setIsTutorialOpen(true);
              }}
            >
              <CircleHelp className="w-6 h-6 shrink-0 text-anil" aria-hidden="true" />
              <span className="flex-1 text-row font-semibold">Cómo se usa</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className="row"
              onClick={() => {
                setIsMenuOpen(false);
                setIsMuralOpen(true);
              }}
            >
              <Printer className="w-6 h-6 shrink-0 text-anil" aria-hidden="true" />
              <span className="flex-1 text-row font-semibold">Imprimir mural comunal</span>
            </button>
          </li>
        </ul>
        <section className="px-4 pt-4 border-t border-line">
          <h3 className="flex items-center gap-2 text-row font-bold">
            <HandHeart className="w-5 h-5 text-anil" aria-hidden="true" />
            Qué es el ayllu
          </h3>
          <p className="mt-1 text-secondary text-ink-2">
            Es la comunidad andina que se ayuda entre sí. Esta app conecta a los vecinos de tu barrio.
          </p>
          <h3 className="mt-4 text-row font-bold">De dónde vienen las alertas</h3>
          <p className="mt-1 text-secondary text-ink-2">
            Sismos del IGP. Huaicos, lluvias y avisos de SENAMHI. Son datos oficiales del Perú. Ante una emergencia, sigue a las autoridades.
          </p>
        </section>
      </div>
    </BottomSheet>
  );
};
