import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Capacitor } from '@capacitor/core';
import { Printer, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useBackHandler } from '../hooks/useBackHandler';
import { CommunityItem } from '../types';

interface PrintableMuralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OFFICIAL_NUMBERS = [
  { number: '105', label: 'Policía' },
  { number: '106', label: 'Ambulancia (SAMU)' },
  { number: '116', label: 'Bomberos' },
  { number: '115', label: 'Defensa Civil' },
  { number: '119', label: 'Mensajes de voz en emergencias' }
];

const EMERGENCY_TYPES = ['emergency_need', 'emergency_resource', 'support_group'];

/** A sheet to stick on the wall of a shop or a tambo, for neighbours without a smartphone or during a blackout. */
export const PrintableMuralModal: React.FC<PrintableMuralModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  // Drawn outside the app so that printing leaves the app's own screens out.
  return createPortal(<Mural onClose={onClose} />, document.body);
};

const MuralSection: React.FC<{ title: string; items: CommunityItem[]; showVotes?: boolean }> = ({ title, items, showVotes }) => {
  if (items.length === 0) return null;
  return (
    <section className="break-inside-avoid">
      <h3 className="pb-2 text-section font-bold border-b-2 border-ink">{title}</h3>
      <ul className="list-plain">
        {items.map((item) => (
          <li key={item.id} className="py-2 break-inside-avoid">
            <p className="text-row font-bold">{item.title}</p>
            <p className="text-secondary text-ink-2">
              {item.authorName}{item.neighborhood ? `, ${item.neighborhood}` : ''}
              {showVotes && item.vistosBuenos > 0 ? `. Recomendado por ${item.vistosBuenos} vecinos` : ''}
            </p>
            {item.authorPhone && <p className="text-row font-bold">{item.authorPhone}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
};

const Mural: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { items, userLocation, hasLocation } = useApp();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const isNative = Capacitor.isNativePlatform();

  useBackHandler(true, () => close.current());

  useEffect(() => {
    document.body.classList.add('printing-mural');
    titleRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('printing-mural');
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const services = items.filter((item) => item.type === 'service').slice(0, 6);
  const favors = items.filter((item) => item.type === 'favor_offer').slice(0, 4);
  const emergencies = items.filter((item) => EMERGENCY_TYPES.includes(item.type)).slice(0, 4);
  const today = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="mural fixed inset-0 z-50 overflow-y-auto bg-surface text-ink" role="dialog" aria-modal="true" aria-labelledby="mural-title">
      <div className="print:hidden sticky top-0 z-10 bg-surface border-b border-line" style={{ paddingTop: 'var(--safe-top)' }}>
        <div className="page flex items-center gap-2 min-h-14 pl-4 pr-1">
          <h2 id="mural-title" ref={titleRef} tabIndex={-1} className="flex-1 text-title font-bold outline-none">Mural para imprimir</h2>
          {!isNative && (
            <button type="button" onClick={() => window.print()} className="btn btn-primary w-auto min-h-12">
              <Printer className="w-5 h-5" aria-hidden="true" />
              Imprimir
            </button>
          )}
          <button type="button" onClick={() => close.current()} aria-label="Cerrar" className="icon-btn">
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>
        <p className="page px-4 pb-3 text-secondary text-ink-2">
          {isNative
            ? 'Para imprimirlo, abre ayllu-five.vercel.app en una computadora y entra a Ayuda.'
            : 'Pégalo en una bodega o en el tambo para los vecinos sin celular o cuando no haya luz.'}
        </p>
      </div>

      <article className="page px-4 py-5 space-y-6">
        <header className="pb-3 border-b-4 border-ink">
          <h1 className="text-sign font-bold">Mural del barrio</h1>
          <p className="text-secondary text-ink-2">
            Red de vecinos AYLLU. {hasLocation ? `Zona: ${userLocation.name}. ` : ''}Actualizado el {today}.
          </p>
        </header>

        <section className="break-inside-avoid p-4 rounded-lg border-2 border-rojo">
          <h3 className="pb-2 text-section font-bold text-rojo">En una emergencia llama gratis, sin saldo</h3>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
            {OFFICIAL_NUMBERS.map(({ number, label }) => (
              <li key={number} className="flex items-baseline gap-2">
                <span className="text-title font-bold">{number}</span>
                <span className="text-secondary">{label}</span>
              </li>
            ))}
          </ul>
        </section>

        <MuralSection title="Pedidos y ofertas de ayuda" items={emergencies} />
        <MuralSection title="Oficios recomendados por vecinos" items={services} showVotes />
        <MuralSection title="Préstamos y favores" items={favors} />

        <p className="pt-3 border-t border-line text-secondary text-ink-2 text-center">
          La verdadera riqueza del barrio es la ayuda entre vecinos.
        </p>
      </article>
    </div>
  );
};
