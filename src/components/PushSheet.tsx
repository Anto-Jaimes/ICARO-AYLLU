import React, { useEffect, useRef, useState } from 'react';
import { Activity, Bell, BellOff, CircleCheck, CloudRain, MessageCircle, Waves, type LucideIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  declinePush,
  disablePush,
  enablePush,
  isPushAvailable,
  listenToPushes,
  pushChoice,
  requestTestPush,
  resumePush,
  syncPushDevice
} from '../services/pushService';
import { BottomSheet } from './BottomSheet';
import { useLanguage } from '../i18n/LanguageContext';

const WHAT: { icon: LucideIcon; text: string }[] = [
  { icon: Activity, text: 'Sismos fuertes cerca de ti' },
  { icon: CloudRain, text: 'Lluvias y huaicos de nivel naranja o rojo en tu zona (SENAMHI)' },
  { icon: Waves, text: 'Posible tsunami, si estás en la costa' },
  { icon: MessageCircle, text: 'Comentarios en tus noticias' }
];

type State = 'off' | 'on' | 'denied';

/**
 * Keeps the phone's alerts working in the background of the app: refreshes the token and the zone,
 * shows an alert that arrives with the app open, and opens the right screen when one is tapped.
 * Offers the alerts once: after the first guide, or at the first start of an updated app.
 */
export const PushSetup: React.FC = () => {
  const { canWrite, isTutorialOpen, setIsPushOpen, showNotice, setIsAlertsOpen, setIsNewsOpen, userLocation, hasLocation } = useApp();
  const { lang } = useLanguage();
  const wasTutorialOpen = useRef(isTutorialOpen);
  const place = hasLocation ? `${userLocation.lat.toFixed(2)},${userLocation.lng.toFixed(2)}` : '';

  useEffect(() => {
    return listenToPushes(
      (title, body) => showNotice([title, body].filter(Boolean).join('. ')),
      ({ kind }) => (kind === 'comment' ? setIsNewsOpen(true) : setIsAlertsOpen(true))
    );
  }, [showNotice, setIsAlertsOpen, setIsNewsOpen]);

  // A fresh token and the current zone, at start and whenever the zone, language or account changes.
  useEffect(() => {
    if (!isPushAvailable() || !canWrite || pushChoice() !== 'on') return;
    resumePush()
      .then(() => syncPushDevice(hasLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null, lang))
      .catch(() => {});
  }, [canWrite, place, lang]);

  // Offered once, never over the guide.
  useEffect(() => {
    const finishedGuide = wasTutorialOpen.current && !isTutorialOpen;
    wasTutorialOpen.current = isTutorialOpen;
    if (!isPushAvailable() || !canWrite || isTutorialOpen || pushChoice() !== null) return;
    const timer = setTimeout(() => setIsPushOpen(true), finishedGuide ? 600 : 3_000);
    return () => clearTimeout(timer);
  }, [isTutorialOpen, canWrite, setIsPushOpen]);

  return null;
};

export const PushSheet: React.FC = () => {
  const { isPushOpen, setIsPushOpen, userLocation, hasLocation, isOnline } = useApp();
  const { lang, t } = useLanguage();
  const [state, setState] = useState<State>('off');
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; isProblem: boolean } | null>(null);

  useEffect(() => {
    if (!isPushOpen) return;
    setMessage(null);
    setState(pushChoice() === 'on' ? 'on' : 'off');
  }, [isPushOpen]);

  const close = () => {
    // Closing the first offer without choosing counts as "Ahora no": it is not offered again by itself.
    if (pushChoice() === null) declinePush();
    setIsPushOpen(false);
  };

  const turnOn = async () => {
    setIsBusy(true);
    setMessage(null);
    try {
      const result = await enablePush();
      if (result === 'denied') {
        setState('denied');
        return;
      }
      if (result === 'error') {
        setMessage({ text: 'No se pudo activar. Revisa tu internet y vuelve a intentar.', isProblem: true });
        return;
      }
      await syncPushDevice(hasLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null, lang);
      setState('on');
      setMessage({ text: 'Listo: AYLLU te avisará aunque la app esté cerrada.', isProblem: false });
    } catch {
      setState('on');
      setMessage({ text: 'Quedó activado. Terminará de configurarse cuando tengas internet.', isProblem: false });
    } finally {
      setIsBusy(false);
    }
  };

  const test = async () => {
    setIsBusy(true);
    setMessage(null);
    try {
      await syncPushDevice(hasLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null, lang);
      const result = await requestTestPush();
      setMessage(
        result === 'ok'
          ? { text: 'Te llegará en menos de un minuto. Puedes cerrar la app para verlo.', isProblem: false }
          : result === 'too_many'
            ? { text: 'Ya pediste 3 pruebas en esta hora. Vuelve a intentar más tarde.', isProblem: true }
            : { text: 'No se pudo activar. Revisa tu internet y vuelve a intentar.', isProblem: true }
      );
    } catch {
      setMessage({ text: 'No se pudo activar. Revisa tu internet y vuelve a intentar.', isProblem: true });
    } finally {
      setIsBusy(false);
    }
  };

  const turnOff = async () => {
    setIsBusy(true);
    try {
      await disablePush();
    } catch {
      // the phone stops listening anyway; the server forgets it when Firebase says it is gone
    } finally {
      setIsBusy(false);
      setState('off');
      setMessage({ text: 'Avisos desactivados.', isProblem: false });
    }
  };

  return (
    <BottomSheet open={isPushOpen} onClose={close} title={t('Avisos en tu celular')}>
      <div className="px-4 space-y-4" style={{ paddingBottom: 'calc(16px + var(--safe-bottom))' }}>
        <p className="text-secondary">{t('AYLLU te avisa aunque la app esté cerrada:')}</p>
        <ul className="space-y-3">
          {WHAT.map(({ icon: Icon, text }) => (
            <li key={text} className="flex gap-3 text-secondary">
              <Icon className="w-6 h-6 shrink-0 text-primary" aria-hidden="true" />
              <span>{t(text)}</span>
            </li>
          ))}
        </ul>
        <p className="text-meta text-ink-secondary">{t('Solo guardamos tu zona aproximada (1 km), no tu casa.')}</p>

        {state === 'on' && (
          <p role="status" className="flex gap-3 p-3 rounded-lg bg-sunken text-secondary font-semibold">
            <CircleCheck className="w-6 h-6 shrink-0 text-status-safe" aria-hidden="true" />
            {t('Los avisos están activados.')}
          </p>
        )}

        {state === 'denied' && (
          <p role="alert" className="p-3 rounded-lg bg-sunken text-secondary">
            {t('Tu celular no deja que AYLLU te avise. Actívalo en Ajustes > Aplicaciones > AYLLU > Notificaciones, y vuelve a intentar.')}
          </p>
        )}

        {message && (
          <p role={message.isProblem ? 'alert' : 'status'} className={`text-secondary font-bold ${message.isProblem ? 'text-status-danger' : 'text-status-safe'}`}>
            {t(message.text)}
          </p>
        )}

        {state !== 'on' && (
          <>
            <button type="button" className="btn btn-primary" disabled={isBusy || !isOnline} onClick={turnOn}>
              <Bell className="w-6 h-6" aria-hidden="true" />
              {isBusy ? t('Activando...') : state === 'denied' ? t('Volver a intentar') : t('Sí, avísame')}
            </button>
            <button type="button" className="btn btn-secondary" onClick={close}>{t('Ahora no')}</button>
          </>
        )}

        {state === 'on' && (
          <>
            <button type="button" className="btn btn-secondary" disabled={isBusy || !isOnline} onClick={test}>
              <Bell className="w-6 h-6" aria-hidden="true" />
              {t('Enviar un aviso de prueba')}
            </button>
            <button type="button" className="btn btn-secondary" disabled={isBusy} onClick={turnOff}>
              <BellOff className="w-6 h-6" aria-hidden="true" />
              {t('Desactivar avisos')}
            </button>
          </>
        )}
      </div>
    </BottomSheet>
  );
};
