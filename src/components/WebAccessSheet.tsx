import React, { useState } from 'react';
import { Download, LogIn } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BUSY_NETWORK_MESSAGE, isBusyNetwork } from '../services/postsService';
import { signInToWeb, WEB_KEY_MINUTES, WEB_LOGIN_PROBLEMS } from '../services/webLoginService';
import { BottomSheet } from './BottomSheet';

/**
 * The web's door. The code comes from the app (one per phone); with it and the app's key the web can
 * publish, comment and call. Without it, the web is for looking and reading only.
 */
export const WebAccessSheet: React.FC = () => {
  const { isAccessOpen, accessReason, closeAccess, showNotice } = useApp();
  const [code, setCode] = useState('');
  const [key, setKey] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const keyDigits = key.replace(/\D/g, '');

  const enter = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsBusy(true);
    setProblem(null);
    try {
      const result = await signInToWeb(code, keyDigits);
      if (result === 'ok') {
        setCode('');
        setKey('');
        closeAccess('member');
        showNotice('Entraste con tu código. Ya puedes publicar, comentar y llamar.');
      } else {
        setProblem(WEB_LOGIN_PROBLEMS[result]);
      }
    } catch (err) {
      setProblem(isBusyNetwork(err) ? BUSY_NETWORK_MESSAGE : WEB_LOGIN_PROBLEMS.error);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <BottomSheet open={isAccessOpen} onClose={() => closeAccess('viewer')} title="Bienvenido a AYLLU">
      <div className="px-4 space-y-6" style={{ paddingBottom: 'calc(24px + var(--safe-bottom))' }}>
        {accessReason && <p role="status" className="p-3 rounded-lg bg-surface-raised text-row font-semibold">{accessReason}</p>}

        <section aria-labelledby="door-app-title">
          <h3 id="door-app-title" className="text-section font-bold">1. Descarga la app</h3>
          <p className="text-secondary text-ink-2">En la app recibes tu código de usuario: uno por celular.</p>
          <div className="flex items-center gap-4 pt-3">
            <img
              src="/descargar-qr.svg"
              alt="Código QR para descargar AYLLU para Android"
              width={136}
              height={136}
              className="shrink-0 rounded-lg border border-line bg-white"
            />
            <div className="min-w-0 space-y-2">
              <p className="text-secondary">Escanéalo con la cámara de un celular Android.</p>
              <a href="/descargar/AYLLU.apk" download className="btn btn-secondary no-underline">
                <Download className="w-6 h-6" aria-hidden="true" />
                Descargar
              </a>
            </div>
          </div>
        </section>

        <section aria-labelledby="door-code-title">
          <h3 id="door-code-title" className="text-section font-bold">2. Entra con tu código</h3>
          <p className="text-secondary text-ink-2">
            En la app abre Ayuda y toca "Entrar en la web": te da una clave de 6 números que dura {WEB_KEY_MINUTES} minutos.
          </p>
          <form onSubmit={enter} className="pt-3 space-y-3">
            <div>
              <label htmlFor="door-user-code" className="block text-secondary font-bold">Tu código de usuario</label>
              <input
                id="door-user-code"
                className="field uppercase"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                maxLength={10}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
              />
            </div>
            <div>
              <label htmlFor="door-key" className="block text-secondary font-bold">Clave de la app</label>
              <input
                id="door-key"
                className="field tracking-widest"
                value={key}
                onChange={(event) => setKey(event.target.value)}
                inputMode="numeric"
                maxLength={7}
                autoComplete="one-time-code"
              />
            </div>
            {problem && <p role="alert" className="text-secondary font-bold text-rojo">{problem}</p>}
            <button type="submit" className="btn btn-primary" disabled={isBusy || code.trim().length < 4 || keyDigits.length !== 6}>
              <LogIn className="w-6 h-6" aria-hidden="true" />
              {isBusy ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </section>

        <section>
          <button type="button" className="btn btn-secondary" onClick={() => closeAccess('viewer')}>Solo mirar</button>
          <p className="pt-2 text-secondary text-ink-2">
            Sin código puedes ver las publicaciones y leer los comentarios, pero no publicar, comentar, recomendar ni llamar.
          </p>
        </section>
      </div>
    </BottomSheet>
  );
};
