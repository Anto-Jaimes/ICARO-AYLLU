import React, { useEffect, useState } from 'react';
import { closeWebSessions, createWebLoginKey, lastWebLogin, WEB_KEY_MINUTES } from '../services/webLoginService';
import { formatRelativeTime } from '../utils/time';

/**
 * In the app: a key to enter the web as this same neighbour, when the web was last entered, and a way
 * to close it everywhere (for a borrowed computer, or a web sign-in that was not yours).
 */
export const WebKeySection: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  const [key, setKey] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const secondsLeft = Math.max(0, Math.round((expiresAt - now) / 1000));

  useEffect(() => {
    if (!isVisible) {
      setKey(null);
      setMessage(null);
      return;
    }
    lastWebLogin().then(setLastLogin).catch(() => {});
  }, [isVisible]);

  useEffect(() => {
    if (!key) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [key]);

  useEffect(() => {
    if (key && secondsLeft === 0) setKey(null);
  }, [key, secondsLeft]);

  const create = async () => {
    setIsBusy(true);
    setMessage(null);
    try {
      const created = await createWebLoginKey();
      if (!created) {
        setMessage('Tu código todavía no está listo. Vuelve a abrir Ayuda con internet.');
        return;
      }
      setKey(created);
      setExpiresAt(Date.now() + WEB_KEY_MINUTES * 60_000);
      setNow(Date.now());
    } catch {
      setMessage('Necesitas internet para entrar en la web.');
    } finally {
      setIsBusy(false);
    }
  };

  const closeEverywhere = async () => {
    setIsBusy(true);
    try {
      await closeWebSessions();
      setMessage('Listo: la web tendrá que entrar de nuevo con una clave.');
    } catch {
      setMessage('Necesitas internet para cerrar la web.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <section className="px-4 py-4 border-b border-line" aria-labelledby="web-key-title">
      <h3 id="web-key-title" className="text-secondary text-ink-2">Entrar en la web</h3>
      {key ? (
        <div className="pt-1 space-y-1">
          <p className="text-sign font-bold tracking-widest" aria-live="polite">{`${key.slice(0, 3)} ${key.slice(3)}`}</p>
          <p className="text-secondary">
            En ayllu-five.vercel.app escribe tu código y esta clave. Vence en {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}.
          </p>
          <p className="text-secondary font-bold">No se la des a nadie: con ella entran como tú.</p>
        </div>
      ) : (
        <>
          <p className="pt-1 text-secondary">Para publicar, comentar y llamar desde una computadora, con tu mismo código.</p>
          <button type="button" className="btn btn-secondary mt-2" onClick={create} disabled={isBusy}>
            {isBusy ? 'Preparando...' : 'Entrar en la web'}
          </button>
        </>
      )}
      {message && <p role="status" className="pt-2 text-secondary font-bold">{message}</p>}
      {lastLogin && (
        <div className="pt-3">
          <p className="text-secondary text-ink-2">Última entrada a la web: {formatRelativeTime(lastLogin).toLowerCase()}.</p>
          <button type="button" className="btn btn-secondary mt-2" onClick={closeEverywhere} disabled={isBusy}>
            Cerrar la web en otros equipos
          </button>
        </div>
      )}
    </section>
  );
};
