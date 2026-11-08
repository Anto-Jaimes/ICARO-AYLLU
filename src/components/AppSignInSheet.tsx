import React, { useState } from 'react';
import { LogIn, Phone, UserPlus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  finishPhoneLogin,
  isCallCenterOnline,
  PHONE_LOGIN_PROBLEMS,
  PHONE_LOGIN_START_PROBLEMS,
  startNewAccount,
  startPhoneLogin
} from '../services/accountService';
import { cleanPhone, formatPhone, isMobile } from '../services/callService';
import { BUSY_NETWORK_MESSAGE, isBusyNetwork } from '../services/postsService';
import { BottomSheet } from './BottomSheet';
import { useT } from '../i18n/LanguageContext';

type Step = 'phone' | 'code';

/**
 * The app's way back in after "Cerrar sesión", or to bring an account to a new phone: the call center
 * calls the verified number and reads a 4-digit code, and the same account comes back.
 */
export const AppSignInSheet: React.FC = () => {
  const { isAccessOpen, closeAccess, finishSignIn, isOnline, showNotice } = useApp();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const t = useT();
  const digits = cleanPhone(phone);

  const askForCall = async () => {
    setProblem(null);
    if (!isMobile(digits)) {
      setProblem(PHONE_LOGIN_START_PROBLEMS.invalid);
      return;
    }
    setIsBusy(true);
    try {
      // With the exchange off the request would only wait and spend one of the day's 3 calls.
      if (!(await isCallCenterOnline())) {
        setProblem('La central de llamadas está apagada ahora. Inténtalo más tarde. En una emergencia marca 105, 106 o 116.');
        return;
      }
      const result = await startPhoneLogin(digits);
      if (result === 'ok') {
        setCode('');
        setStep('code');
      } else {
        setProblem(PHONE_LOGIN_START_PROBLEMS[result]);
      }
    } catch (err) {
      setProblem(isBusyNetwork(err) ? BUSY_NETWORK_MESSAGE : PHONE_LOGIN_PROBLEMS.error);
    } finally {
      setIsBusy(false);
    }
  };

  const enter = async () => {
    setProblem(null);
    setIsBusy(true);
    try {
      const result = await finishPhoneLogin(digits, code);
      if (result === 'ok') {
        setStep('phone');
        setPhone('');
        setCode('');
        finishSignIn();
        showNotice(t('Volviste a tu cuenta. Ya puedes publicar, comentar y llamar.'));
      } else {
        setProblem(PHONE_LOGIN_PROBLEMS[result]);
      }
    } catch (err) {
      setProblem(isBusyNetwork(err) ? BUSY_NETWORK_MESSAGE : PHONE_LOGIN_PROBLEMS.error);
    } finally {
      setIsBusy(false);
    }
  };

  const beginNewAccount = () => {
    startNewAccount();
    finishSignIn();
    showNotice(t('Empezaste con una cuenta nueva. Tu código nuevo está en Ayuda.'));
  };

  return (
    <BottomSheet open={isAccessOpen} onClose={() => closeAccess()} title={t('Entrar a AYLLU')}>
      <div className="px-4 space-y-6" style={{ paddingBottom: 'calc(24px + var(--safe-bottom))' }}>
        <p role="status" className="p-3 rounded-lg bg-sunken text-row font-semibold">
          {t('Cerraste sesión en este celular. Para publicar, comentar y llamar, vuelve a entrar.')}
        </p>

        <section aria-labelledby="signin-phone-title" className="space-y-3">
          <h3 id="signin-phone-title" className="flex items-center gap-2 text-section font-bold">
            <Phone className="w-6 h-6 text-primary" aria-hidden="true" />
            {t('Entrar con mi número')}
          </h3>

          {step === 'phone' && (
            <>
              <p className="text-secondary text-ink-secondary">
                {t('Escribe el número que verificaste en AYLLU. Te llamamos gratis y te dictamos un código de 4 cifras.')}
              </p>
              <div>
                <label htmlFor="signin-phone" className="block pb-1 text-secondary font-bold">{t('Tu número de celular')}</label>
                <input
                  id="signin-phone"
                  className="field"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="9XX XXX XXX"
                  value={phone}
                  onChange={(event) => {
                    setProblem(null);
                    setPhone(event.target.value);
                  }}
                />
              </div>
              {problem && <p role="alert" className="text-secondary font-bold text-status-danger">{t(problem)}</p>}
              <button type="button" className="btn btn-primary" disabled={isBusy || !isOnline || digits.length < 9} onClick={askForCall}>
                <Phone className="w-6 h-6" aria-hidden="true" />
                {isBusy ? t('Pidiendo...') : t('Llamarme con mi código')}
              </button>
              {!isOnline && <p className="text-secondary text-ink-secondary">{t('Necesitas internet para volver a entrar.')}</p>}
            </>
          )}

          {step === 'code' && (
            <>
              <p className="text-secondary">
                {t('Te estamos llamando al {phone}. Contesta y escribe el código que escuches.', { phone: formatPhone(digits) })}
              </p>
              <div>
                <label htmlFor="signin-code" className="block pb-1 text-secondary font-bold">{t('Código de 4 cifras')}</label>
                <input
                  id="signin-code"
                  className="field text-title tracking-widest"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={4}
                  value={code}
                  onChange={(event) => {
                    setProblem(null);
                    setCode(event.target.value.replace(/\D/g, ''));
                  }}
                />
              </div>
              {problem && <p role="alert" className="text-secondary font-bold text-status-danger">{t(problem)}</p>}
              <button type="button" className="btn btn-primary" disabled={isBusy || code.length !== 4} onClick={enter}>
                <LogIn className="w-6 h-6" aria-hidden="true" />
                {isBusy ? t('Entrando...') : t('Entrar')}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => { setProblem(null); setStep('phone'); }}>
                {t('Cambiar número o pedir otro código')}
              </button>
            </>
          )}
        </section>

        <section aria-labelledby="signin-new-title" className="space-y-2 pt-4 border-t border-border">
          <h3 id="signin-new-title" className="text-row font-bold">{t('¿No verificaste tu número?')}</h3>
          <p className="text-secondary text-ink-secondary">
            {t('Puedes empezar con una cuenta nueva y un código nuevo. Tu cuenta anterior no se borra, pero sin número verificado no hay cómo volver a ella.')}
          </p>
          <button type="button" className="btn btn-secondary" onClick={beginNewAccount}>
            <UserPlus className="w-6 h-6" aria-hidden="true" />
            {t('Empezar con una cuenta nueva')}
          </button>
        </section>

        <section className="space-y-2">
          <button type="button" className="btn btn-secondary" onClick={() => closeAccess()}>{t('Solo mirar')}</button>
          <p className="text-secondary text-ink-secondary">
            {t('Sin entrar puedes ver las publicaciones y leer los comentarios, pero no publicar, comentar, recomendar ni llamar.')}
          </p>
        </section>
      </div>
    </BottomSheet>
  );
};
