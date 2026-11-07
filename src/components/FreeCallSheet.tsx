import React, { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Delete, PhoneCall } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  CallOverview,
  CallStatus,
  FINAL_STATUSES,
  cleanPhone,
  clearQueuedCall,
  confirmVerification,
  formatPhone,
  isMobile,
  loadCallOverview,
  queueCall,
  queuedCall,
  requestCall,
  startVerification,
  watchCall
} from '../services/callService';
import { BUSY_NETWORK_MESSAGE, isBusyNetwork } from '../services/postsService';
import { BottomSheet } from './BottomSheet';

type Step = 'web' | 'loading' | 'error' | 'phone' | 'code' | 'dial' | 'calling';

const STATUS_TEXT: Record<CallStatus, string> = {
  pending: 'Pidiendo tu llamada...',
  calling_caller: 'Te estamos llamando. Contesta tu celular.',
  calling_destination: 'Llamando al número que marcaste...',
  connected: 'Conectados. Tienes un minuto.',
  completed: 'Llamada terminada.',
  caller_no_answer: 'No contestaste. No se descontó tu minuto.',
  destination_no_answer: 'No contestaron. No se descontó tu minuto.',
  failed: 'No se pudo hacer la llamada. Inténtalo otra vez.'
};

const PROBLEMS: Record<string, string> = {
  invalidPhone: 'Escribe un celular de 9 cifras que empiece con 9.',
  tooManyCodes: 'Ya pediste 3 códigos hoy. Inténtalo mañana.',
  wrong: 'Ese código no es. Revísalo y vuelve a escribirlo.',
  expired: 'El código venció. Pide uno nuevo.',
  none: 'Primero pide tu código.',
  too_many_attempts: 'Fallaste 5 veces. Pide un código nuevo.',
  invalid: 'Marca un celular de 9 cifras que empiece con 9.',
  no_phone: 'Primero verifica tu número.',
  same_number: 'Ese es tu propio número.',
  busy: 'Ya tienes una llamada en curso.',
  used_today: 'Ya usaste tu minuto de hoy. Vuelve mañana.',
  too_many: 'Ya pediste 3 llamadas hoy. Vuelve mañana.',
  blocked: 'Este número no puede usar las llamadas gratis por una denuncia. En una emergencia marca 105, 106 o 116.',
  network: 'No hay conexión. Revisa tu internet y vuelve a intentar.'
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'];

export const FreeCallSheet: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { isOnline, hasLocation, userLocation, showNotice } = useApp();
  const [step, setStep] = useState<Step>('loading');
  const [overview, setOverview] = useState<CallOverview | null>(null);
  const [phoneDraft, setPhoneDraft] = useState('');
  const [code, setCode] = useState('');
  const [dialed, setDialed] = useState('');
  const [status, setStatus] = useState<CallStatus | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [queued, setQueued] = useState(queuedCall);
  const stopWatching = useRef<() => void>(() => {});

  const follow = (id: string) => {
    stopWatching.current();
    setStep('calling');
    stopWatching.current = watchCall(id, setStatus);
  };

  const load = async () => {
    setProblem(null);
    try {
      // A weak signal can leave a request hanging: after 10 seconds, stop waiting.
      const next = await Promise.race([
        loadCallOverview(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 10_000))
      ]);
      setOverview(next);
      if (next.activeCall) {
        setDialed(next.activeCall.destination);
        setStatus(next.activeCall.status);
        follow(next.activeCall.id);
      } else {
        setStep(next.phone ? 'dial' : 'phone');
      }
    } catch {
      // Without internet the neighbour can still leave a call ready to go.
      setStep(navigator.onLine ? 'error' : 'dial');
    }
  };

  useEffect(() => {
    if (!open) {
      stopWatching.current();
      return;
    }
    setQueued(queuedCall());
    if (!Capacitor.isNativePlatform()) {
      setStep('web');
      return;
    }
    // Without internet go straight to the keypad, with what was known last, to leave a call ready.
    if (!isOnline) {
      setProblem(null);
      setStep('dial');
      return;
    }
    setStep('loading');
    load();
  }, [open]);

  useEffect(() => () => stopWatching.current(), []);

  const run = async (work: () => Promise<void>) => {
    setIsBusy(true);
    setProblem(null);
    try {
      await work();
    } catch (err) {
      setProblem(isBusyNetwork(err) ? BUSY_NETWORK_MESSAGE : PROBLEMS.network);
    } finally {
      setIsBusy(false);
    }
  };

  const sendCode = () => run(async () => {
    const phone = cleanPhone(phoneDraft);
    if (!isMobile(phone)) {
      setProblem(PROBLEMS.invalidPhone);
      return;
    }
    const result = await startVerification(phone);
    if (result === 'ok') {
      setCode('');
      setStep('code');
    } else {
      setProblem(result === 'too_many' ? PROBLEMS.tooManyCodes : result === 'blocked' ? PROBLEMS.blocked : PROBLEMS.invalidPhone);
    }
  });

  const confirm = () => run(async () => {
    const result = await confirmVerification(code);
    if (result === 'ok') {
      showNotice('Tu número quedó verificado');
      await load();
    } else {
      setProblem(PROBLEMS[result]);
    }
  });

  const call = () => {
    const destination = cleanPhone(dialed);
    if (!isMobile(destination)) {
      setProblem(PROBLEMS.invalid);
      return;
    }
    if (!isOnline) {
      queueCall(destination);
      setQueued(queuedCall());
      setDialed('');
      return;
    }
    run(async () => {
      const place = hasLocation ? { lat: userLocation.lat, lng: userLocation.lng, name: userLocation.name } : null;
      const result = await requestCall(destination, place);
      if (result.status === 'ok' && result.id) {
        setStatus('pending');
        follow(result.id);
      } else {
        setProblem(PROBLEMS[result.status]);
      }
    });
  };

  const press = (key: string) => {
    setProblem(null);
    setDialed((current) => (key === 'delete' ? current.slice(0, -1) : current.length < 9 ? current + key : current));
  };

  const isFinal = status !== null && FINAL_STATUSES.includes(status);
  // With the exchange off a request would only wait and waste one of the day's tries.
  const isCenterOff = isOnline && overview !== null && !overview.isCenterOnline;

  return (
    <BottomSheet open={open} onClose={onClose} title="Llamada gratis">
      <div className="px-4 space-y-4" style={{ paddingBottom: 'calc(16px + var(--safe-bottom))' }}>
        {step === 'web' && (
          <p className="text-secondary">
            Las llamadas gratis funcionan en la app AYLLU para Android. En una emergencia marca 105, 106 o 116 desde cualquier celular: son gratis.
          </p>
        )}

        {step === 'loading' && <p role="status" className="text-secondary text-ink-2">Cargando...</p>}

        {step === 'error' && (
          <>
            <p className="text-secondary">No pudimos revisar tus llamadas. Vuelve a intentar.</p>
            <button type="button" className="btn btn-secondary" onClick={() => { setStep('loading'); load(); }}>Volver a intentar</button>
          </>
        )}

        {overview && !overview.isCenterOnline && step !== 'calling' && (
          <p role="status" className="p-3 rounded-lg bg-sunken text-secondary">
            La central de llamadas está apagada ahora. Inténtalo más tarde. En una emergencia marca 105, 106 o 116.
          </p>
        )}

        {step === 'phone' && (
          <>
            <p className="text-secondary text-ink-2">
              Primero confirma que el número es tuyo: te llamaremos para dictarte un código de 4 cifras.
            </p>
            <div>
              <label htmlFor="call-phone" className="block pb-1 text-secondary font-bold">Tu número de celular</label>
              <input
                id="call-phone"
                className="field"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="9XX XXX XXX"
                value={phoneDraft}
                onChange={(event) => setPhoneDraft(event.target.value)}
              />
            </div>
            <button type="button" className="btn btn-primary" disabled={isBusy || !isOnline || isCenterOff} onClick={sendCode}>
              {isBusy ? 'Pidiendo...' : 'Recibir mi código'}
            </button>
          </>
        )}

        {step === 'code' && (
          <>
            <p className="text-secondary">
              Te estamos llamando al {formatPhone(cleanPhone(phoneDraft))}. Contesta y escribe el código que escuches.
            </p>
            <div>
              <label htmlFor="call-code" className="block pb-1 text-secondary font-bold">Código de 4 cifras</label>
              <input
                id="call-code"
                className="field text-title tracking-widest"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={4}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
              />
            </div>
            <button type="button" className="btn btn-primary" disabled={isBusy || code.length !== 4} onClick={confirm}>
              {isBusy ? 'Revisando...' : 'Confirmar'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => { setProblem(null); setStep('phone'); }}>
              Cambiar número o pedir otro código
            </button>
          </>
        )}

        {step === 'dial' && (
          <>
            {overview?.phone && (
              <div className="flex items-center gap-3">
                <p className="flex-1 text-secondary text-ink-2">
                  Te llamaremos al <strong className="text-ink">{formatPhone(overview.phone)}</strong>
                </p>
                <button type="button" className="btn btn-secondary w-auto min-h-12" onClick={() => { setPhoneDraft(overview.phone ?? ''); setStep('phone'); }}>
                  Cambiar
                </button>
              </div>
            )}

            {overview?.usedToday ? (
              <p className="p-3 rounded-lg bg-sunken text-secondary font-bold">Ya usaste tu minuto de hoy. Vuelve mañana.</p>
            ) : (
              <>
                <p className="min-h-12 text-center text-sign font-bold tracking-wider" aria-live="polite">
                  {dialed ? formatPhone(dialed) : <span className="text-row font-normal text-ink-2">Marca un celular</span>}
                </p>
                <div className="grid grid-cols-3 gap-2" role="group" aria-label="Teclado">
                  {KEYS.map((key, index) => key === '' ? (
                    <span key={index} aria-hidden="true" />
                  ) : (
                    <button
                      key={key}
                      type="button"
                      onClick={() => press(key)}
                      aria-label={key === 'delete' ? 'Borrar' : key}
                      className="grid place-items-center min-h-16 rounded-lg bg-sunken text-title font-bold active:bg-line"
                    >
                      {key === 'delete' ? <Delete className="w-7 h-7" aria-hidden="true" /> : key}
                    </button>
                  ))}
                </div>
                <button type="button" className="btn btn-primary" disabled={isBusy || dialed.length !== 9 || isCenterOff} onClick={call}>
                  <PhoneCall className="w-6 h-6" aria-hidden="true" />
                  {isBusy ? 'Pidiendo...' : isOnline ? 'Llamar gratis' : 'Guardar y llamar cuando haya señal'}
                </button>
              </>
            )}

            {queued && (
              <div className="p-3 rounded-lg bg-sunken space-y-2">
                <p className="text-secondary font-bold">
                  Pedido guardado: llamaremos al {formatPhone(queued.destination)} apenas vuelva la señal.
                </p>
                <button type="button" className="btn btn-secondary" onClick={() => { clearQueuedCall(); setQueued(null); }}>
                  Cancelar pedido
                </button>
              </div>
            )}

            <ul className="pl-5 list-disc space-y-1 text-meta text-ink-2">
              <li>Primero sonará tu celular: contesta. Luego llamamos al número que marcaste.</li>
              <li>Dura 1 minuto al día. Si contesta un buzón de voz, el minuto se gasta.</li>
              <li>Quien contesta escucha tu código de usuario. La llamada se graba por seguridad y se borra a los 30 días.</li>
              <li>En una emergencia marca 105, 106 o 116: son gratis siempre.</li>
            </ul>
          </>
        )}

        {step === 'calling' && (
          <>
            <p role="status" aria-live="polite" className="text-section font-bold">
              {status ? STATUS_TEXT[status] : STATUS_TEXT.pending}
            </p>
            {dialed && <p className="text-secondary text-ink-2">Número: {formatPhone(dialed)}</p>}
            {isFinal && (
              <button type="button" className="btn btn-primary" onClick={() => { setStatus(null); setDialed(''); setStep('loading'); load(); }}>
                Listo
              </button>
            )}
          </>
        )}

        {problem && <p role="alert" className="text-secondary font-bold text-rojo">{problem}</p>}
      </div>
    </BottomSheet>
  );
};
