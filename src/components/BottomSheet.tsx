import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useBackHandler } from '../hooks/useBackHandler';
import { useT } from '../i18n/LanguageContext';

const CLOSE_MS = 200;
const DISMISS_DISTANCE = 0.3; // of the sheet's height
const DISMISS_VELOCITY = 0.11; // px per ms

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ open, onClose, title, children, footer }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dragStart = useRef<{ y: number; time: number } | null>(null);
  const [isRendered, setIsRendered] = useState(open);
  const [isClosing, setIsClosing] = useState(false);
  const t = useT();

  useBackHandler(open, onClose);

  useEffect(() => {
    if (open) {
      setIsRendered(true);
      setIsClosing(false);
      return;
    }
    if (!isRendered) return;

    // Drag leaves animation off so the sheet can follow the finger; closing needs it back.
    if (dialogRef.current) dialogRef.current.style.animation = '';
    setIsClosing(true);
    const timer = setTimeout(() => {
      dialogRef.current?.close(); // close() also returns focus to the trigger
      setIsRendered(false);
      setIsClosing(false);
    }, CLOSE_MS);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isRendered && dialog && !dialog.open) dialog.showModal();
  }, [isRendered]);

  if (!isRendered) return null;

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    dragStart.current = { y: event.clientY, time: performance.now() };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const dialog = dialogRef.current;
    if (!dragStart.current || !dialog) return;
    const distance = Math.max(0, event.clientY - dragStart.current.y);
    dialog.style.animation = 'none';
    dialog.style.transition = 'none';
    dialog.style.transform = `translateY(${distance}px)`;
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const dialog = dialogRef.current;
    const start = dragStart.current;
    dragStart.current = null;
    if (!start || !dialog) return;

    const distance = Math.max(0, event.clientY - start.y);
    const velocity = distance / Math.max(1, performance.now() - start.time);
    if (distance > dialog.offsetHeight * DISMISS_DISTANCE || (distance > 24 && velocity > DISMISS_VELOCITY)) {
      onClose();
      return;
    }
    dialog.style.transition = 'transform 200ms cubic-bezier(0.32, 0.72, 0, 1)';
    dialog.style.transform = '';
  };

  return (
    <dialog
      ref={dialogRef}
      className="sheet"
      aria-label={t(title)}
      data-closing={isClosing ? '' : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div
        className="shrink-0 pt-2 lg:pt-0"
        style={{ touchAction: 'none' }}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <span aria-hidden="true" className="block lg:hidden mx-auto w-10 h-1 rounded-full bg-line" />
        <div className="flex items-center gap-2 pl-4 pr-1 min-h-14">
          {/* autoFocus keeps the focus ring off the close button and reads the title aloud. */}
          <h2 tabIndex={-1} autoFocus className="flex-1 min-w-0 text-title font-bold outline-none">{t(title)}</h2>
          <button
            type="button"
            onClick={onClose}
            onPointerDown={(event) => event.stopPropagation()}
            aria-label={t('Cerrar')}
            className="icon-btn"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="sheet-body">{children}</div>

      {footer && (
        <div
          className="shrink-0 px-4 pt-3 border-t border-line bg-surface"
          style={{ paddingBottom: 'calc(12px + var(--safe-bottom))' }}
        >
          {footer}
        </div>
      )}
    </dialog>
  );
};
