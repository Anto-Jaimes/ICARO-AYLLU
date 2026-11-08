import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pointer } from 'lucide-react';
import { Tab, useApp } from '../context/AppContext';
import { useBackHandler } from '../hooks/useBackHandler';
import { useT } from '../i18n/LanguageContext';

/**
 * "Cómo se usa" as a walk through the real screen: everything dims except the part being explained,
 * a hand shows where to tap, and the tabs open behind so the neighbour sees each section. The same on
 * the phone (bottom bar) and on a computer (side bar): each step finds its part by `data-tour`.
 */
interface TourStep {
  /** The `data-tour` name of the part to light up. */
  target: string;
  /** The screen to show behind; 'home' is the home of the current mode. */
  tab?: Tab | 'home';
  title: string;
  text: string;
  /** Shows the hand: this is something to tap, not only to look at. */
  tap?: boolean;
  /** Parts that only exist outside emergency mode. */
  normalOnly?: boolean;
}

const STEPS: TourStep[] = [
  {
    target: 'verdict',
    tab: 'home',
    title: 'Mira si tu zona está bien',
    text: 'Este color y esta frase resumen las alertas oficiales de tu zona: sismos, lluvias y huaicos.',
    normalOnly: true
  },
  {
    target: 'auxilio',
    tab: 'home',
    title: 'Auxilio rápido',
    text: 'Toca Auxilio para ver tu ubicación exacta sin internet, pedir rescate por SMS o WhatsApp y hacer sonar una alarma.',
    tap: true,
    normalOnly: true
  },
  {
    target: 'news',
    tab: 'home',
    title: 'Noticias de tu zona',
    text: 'Lo que avisan tus vecinos, con foto. Toca una noticia para ver dónde fue y comentar.',
    normalOnly: true
  },
  {
    target: 'publish',
    title: 'Publica con 3 toques',
    text: 'Toca Publicar y elige: avisar de un huaico o accidente con foto, ofrecer tu trabajo o regalar algo.',
    tap: true
  },
  {
    target: 'tab-services',
    tab: 'services',
    title: 'Servicios',
    text: 'Aquí encuentras trabajos y negocios de tu barrio que tus vecinos recomiendan.',
    tap: true,
    normalOnly: true
  },
  {
    target: 'tab-favors',
    tab: 'favors',
    title: 'Donaciones',
    text: 'Regala lo que ya no usas, o pide ayuda para ti o para una organización. Sin dinero.',
    tap: true,
    normalOnly: true
  },
  {
    target: 'tab-map',
    tab: 'map',
    title: 'Mapa',
    text: 'Busca lugares, guarda tu casa y mira cómo llegar. También ves lo que publican tus vecinos.',
    tap: true
  },
  {
    target: 'sos',
    tab: 'home',
    title: 'En una emergencia, toca SOS',
    text: 'Llama a los números de auxilio aunque no tengas internet, pide una llamada gratis o activa la alarma.',
    tap: true
  },
  {
    target: 'help',
    tab: 'home',
    title: 'Idioma y ayuda',
    text: 'Cambia el idioma aquí. En Ayuda vuelves a ver esta guía, ves tu código de usuario y cierras sesión.',
    tap: true,
    normalOnly: true
  }
];

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 6;
const EDGE = 16;
const GAP = 12;
const CARD_WIDTH = 380;
/** A part taller than this (the news) is lit from its top, so the explanation still fits. */
const MAX_SPOT_SHARE = 0.5;
const FIND_FOR_MS = 2_500;

/** The visible parts with that name (the phone and the computer each hide one of a pair). */
function findTargets(name: string): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(`[data-tour~="${name}"]`)].filter((element) => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== 'hidden';
  });
}

function measure(elements: HTMLElement[]): Box | null {
  if (elements.length === 0) return null;
  const rects = elements.map((element) => element.getBoundingClientRect());
  const top = Math.min(...rects.map((rect) => rect.top)) - PAD;
  const left = Math.min(...rects.map((rect) => rect.left)) - PAD;
  const bottom = Math.max(...rects.map((rect) => rect.bottom)) + PAD;
  const right = Math.max(...rects.map((rect) => rect.right)) + PAD;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const clampedTop = Math.max(4, top);
  const clampedLeft = Math.max(4, left);
  const height = Math.min(Math.min(bottom, vh - 4) - clampedTop, vh * MAX_SPOT_SHARE);
  return { top: clampedTop, left: clampedLeft, width: Math.min(right, vw - 4) - clampedLeft, height: Math.max(height, 0) };
}

/** Brings a part that is off the screen into view, with its top near the top. */
function bringIntoView(elements: HTMLElement[]): void {
  const first = elements[0]?.getBoundingClientRect();
  if (!first) return;
  const vh = window.innerHeight;
  if (first.top < 0 || first.top > vh * 0.45) {
    window.scrollTo({ top: Math.max(0, window.scrollY + first.top - 72), behavior: 'auto' });
  }
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

/** Next to the part when it is a narrow side-bar button, else below it, else above, else at the bottom. */
function placeCard(spot: Box | null, height: number): { top: number; left: number; width: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(CARD_WIDTH, vw - EDGE * 2);
  if (!spot) return { top: Math.max(EDGE, (vh - height) / 2), left: (vw - width) / 2, width };

  const bottom = spot.top + spot.height;
  const right = spot.left + spot.width;
  const centered = clamp(spot.left + spot.width / 2 - width / 2, EDGE, vw - width - EDGE);
  if (vw >= 1024 && spot.width < vw * 0.3 && right + GAP + width + EDGE <= vw) {
    return { top: clamp(spot.top + spot.height / 2 - height / 2, EDGE, vh - height - EDGE), left: right + GAP, width };
  }
  if (vh - bottom >= height + GAP + EDGE) return { top: bottom + GAP, left: centered, width };
  if (spot.top >= height + GAP + EDGE) return { top: spot.top - GAP - height, left: centered, width };
  return { top: vh - height - EDGE, left: centered, width };
}

const HAND = 44;

/** Beside a button, so it does not cover its name; inside the corner when there is no room. */
function placeHand(spot: Box, card: { left: number }): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const right = spot.left + spot.width;
  const isButton = spot.height <= 120;
  const cardOnRight = card.left >= right;
  const beside = clamp(spot.top + spot.height / 2 - HAND / 2 + 6, 4, vh - HAND - 4);
  if (isButton && !cardOnRight && right + 2 + HAND <= vw - 4) return { top: beside, left: right + 2 };
  if (isButton && spot.left - 2 - HAND >= 4) return { top: beside, left: spot.left - 2 - HAND };
  // On the lower corner, half outside, so the words inside stay readable.
  return { top: clamp(spot.top + spot.height - 14, 4, vh - HAND - 4), left: clamp(right - HAND + 10, 4, vw - HAND - 4) };
}

export const GuidedTour: React.FC = () => {
  const { isTutorialOpen, setIsTutorialOpen, mode, tab, setTab, homeTab, isAlertsOpen, isNewsOpen } = useApp();
  const t = useT();
  const steps = useMemo(() => STEPS.filter((step) => mode === 'normal' || !step.normalOnly), [mode]);
  const [index, setIndex] = useState(0);
  const [spot, setSpot] = useState<Box | null>(null);
  const [cardHeight, setCardHeight] = useState(0);
  const direction = useRef<1 | -1>(1);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const step = steps[Math.min(index, steps.length - 1)];
  const isLast = index >= steps.length - 1;

  const finish = useCallback(() => {
    try {
      localStorage.setItem('icaro_ayllu_tutorial_seen', 'true');
    } catch {
      // the guide simply shows again next time
    }
    setIsTutorialOpen(false);
    setIndex(0);
    setSpot(null);
    setTab(homeTab);
  }, [setIsTutorialOpen, setTab, homeTab]);

  const go = useCallback((delta: 1 | -1) => {
    direction.current = delta;
    if (delta === 1 && isLast) finish();
    else setIndex((current) => Math.max(0, current + delta));
  }, [isLast, finish]);

  useBackHandler(isTutorialOpen, finish);

  // The dialog sits above everything (sheets included) and keeps the focus inside the guide.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isTutorialOpen && !dialog.open) {
      setIndex(0);
      direction.current = 1;
      dialog.showModal();
    }
    if (!isTutorialOpen && dialog.open) dialog.close();
  }, [isTutorialOpen]);

  // Open the screen of this step behind the guide.
  useEffect(() => {
    if (!isTutorialOpen || !step?.tab) return;
    const wanted = step.tab === 'home' ? homeTab : step.tab;
    if (tab !== wanted || isAlertsOpen || isNewsOpen) setTab(wanted);
  }, [isTutorialOpen, step, homeTab, tab, isAlertsOpen, isNewsOpen, setTab]);

  // Find the part (it may appear a moment later, like the map), light it up and follow it.
  useEffect(() => {
    if (!isTutorialOpen || !step) return;
    let isCurrent = true;
    let found = false;
    const started = Date.now();
    const update = () => {
      if (!isCurrent) return;
      const targets = findTargets(step.target);
      if (targets.length > 0 && !found) {
        found = true;
        bringIntoView(targets);
      }
      if (targets.length > 0) {
        setSpot(measure(targets));
      } else if (!found && Date.now() - started > FIND_FOR_MS) {
        // This part is not on this screen (another mode or size): go on without it.
        isCurrent = false;
        if (direction.current === 1 && isLast) finish();
        else setIndex((current) => clamp(current + direction.current, 0, steps.length - 1));
      }
    };
    update();
    const timer = window.setInterval(update, 250);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    nextRef.current?.focus();
    return () => {
      isCurrent = false;
      window.clearInterval(timer);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isTutorialOpen, step, isLast, finish, steps.length]);

  useLayoutEffect(() => {
    if (cardRef.current) setCardHeight(cardRef.current.offsetHeight);
  }, [index, spot?.width, isTutorialOpen]);

  const card = placeCard(spot, cardHeight);
  const hand = spot && step?.tap ? placeHand(spot, card) : null;

  return (
    <dialog
      ref={dialogRef}
      className="tour"
      aria-label={t('Cómo se usa')}
      onCancel={(event) => {
        event.preventDefault();
        finish();
      }}
    >
      {isTutorialOpen && step && (
        <>
          <div
            className="tour-spot"
            aria-hidden="true"
            style={spot
              ? { top: spot.top, left: spot.left, width: spot.width, height: spot.height }
              : { top: '50%', left: '50%', width: 0, height: 0 }}
          />
          {hand && (
            <span className="tour-hand" aria-hidden="true" style={{ top: hand.top, left: hand.left }}>
              <Pointer className="w-6 h-6" />
            </span>
          )}
          <div
            ref={cardRef}
            className="tour-card"
            style={{ top: card.top, left: card.left, width: card.width, visibility: cardHeight ? 'visible' : 'hidden' }}
          >
            <p className="text-meta text-ink-secondary">{t('Paso {step} de {total}', { step: index + 1, total: steps.length })}</p>
            <div aria-live="polite">
              <h2 className="mt-1 text-section font-bold">{t(step.title)}</h2>
              <p className="mt-1 text-secondary">{t(step.text)}</p>
            </div>
            <div className="flex gap-2 pt-4">
              {index > 0 && (
                <button type="button" className="btn btn-secondary flex-1 min-h-12" onClick={() => go(-1)}>
                  {t('Atrás')}
                </button>
              )}
              <button ref={nextRef} type="button" className="btn btn-primary flex-1 min-h-12" onClick={() => go(1)}>
                {isLast ? t('Empezar') : t('Siguiente')}
              </button>
            </div>
            {!isLast && (
              <button type="button" className="mt-2 w-full min-h-12 text-secondary font-bold text-primary underline underline-offset-4" onClick={finish}>
                {t('Saltar la guía')}
              </button>
            )}
          </div>
        </>
      )}
    </dialog>
  );
};
