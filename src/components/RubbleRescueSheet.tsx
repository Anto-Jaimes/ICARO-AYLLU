import React, { useState, useEffect } from 'react';
import { fillNodes, useT } from '../i18n/LanguageContext';
import { Activity, AlertTriangle, Ear, Mic, MicOff, ShieldAlert } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { geophoneDetector, handsFreeSentinel, SurvivalPatternMatch } from '../utils/rubbleRescue';
import { communitySiren } from '../utils/audioAlarm';
import { tapFeedback } from '../lib/native';

interface RubbleRescueSheetProps {
  open: boolean;
  onClose: () => void;
}

const MIC_PROBLEM = 'No se pudo usar el micrófono. Revisa que AYLLU tenga permiso para usarlo.';

export const RubbleRescueSheet: React.FC<RubbleRescueSheetProps> = ({ open, onClose }) => {
  const t = useT();
  const [activeTab, setActiveTab] = useState<'geophone' | 'sentinel'>('geophone');
  const [micProblem, setMicProblem] = useState<string | null>(null);

  // Wall listener
  const [isGeophoneActive, setIsGeophoneActive] = useState<boolean>(false);
  const [vibrationLevel, setVibrationLevel] = useState<number>(0);
  const [knockCount, setKnockCount] = useState<number>(0);
  const [detectedMatch, setDetectedMatch] = useState<SurvivalPatternMatch | null>(null);

  // Hands-free
  const [isSentinelActive, setIsSentinelActive] = useState<boolean>(false);
  const [isAlarmSounding, setIsAlarmSounding] = useState<boolean>(false);

  const stopEverything = () => {
    geophoneDetector.stop();
    handsFreeSentinel.stop();
    communitySiren.stopSiren();
    setIsGeophoneActive(false);
    setIsSentinelActive(false);
    setIsAlarmSounding(false);
    setVibrationLevel(0);
  };

  useEffect(() => {
    if (!open) {
      stopEverything();
      setDetectedMatch(null);
      setKnockCount(0);
      setMicProblem(null);
    }
  }, [open]);

  useEffect(() => () => stopEverything(), []);

  const handleToggleGeophone = async () => {
    tapFeedback();
    setMicProblem(null);
    if (isGeophoneActive) {
      geophoneDetector.stop();
      setIsGeophoneActive(false);
      setVibrationLevel(0);
      return;
    }
    handsFreeSentinel.stop();
    setIsSentinelActive(false);
    setDetectedMatch(null);
    setKnockCount(0);
    const ok = await geophoneDetector.startListening(
      (level, isKnock) => {
        setVibrationLevel(level);
        if (isKnock) {
          tapFeedback();
          setKnockCount((count) => count + 1);
        }
      },
      (match) => {
        tapFeedback();
        setDetectedMatch(match);
      }
    );
    if (ok) setIsGeophoneActive(true);
    else setMicProblem(MIC_PROBLEM);
  };

  const handleToggleSentinel = async () => {
    tapFeedback();
    setMicProblem(null);
    if (isSentinelActive) {
      handsFreeSentinel.stop();
      setIsSentinelActive(false);
      return;
    }
    geophoneDetector.stop();
    setIsGeophoneActive(false);
    const ok = await handsFreeSentinel.startMonitoring(() => {
      // The phone may be out of reach: the alarm is what lets rescuers find it.
      setIsSentinelActive(false);
      setIsAlarmSounding(communitySiren.startSiren());
    });
    if (ok) setIsSentinelActive(true);
    else setMicProblem(MIC_PROBLEM);
  };

  const stopAlarm = () => {
    tapFeedback();
    communitySiren.stopSiren();
    setIsAlarmSounding(false);
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={t('Rescate en Escombros')}>
      <div className="px-4" style={{ paddingBottom: 'calc(24px + var(--safe-bottom))' }}>

        <div className="mb-3 p-3 bg-sunken text-ink rounded-xl border border-border">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />
            <span className="text-secondary font-bold text-ink">{t('Búsqueda de personas atrapadas')}</span>
          </div>
          <p className="text-secondary text-ink-secondary mt-1">
            {t('Escucha golpes detrás de un muro, o pide auxilio con la voz si no puedes mover los brazos. Funciona sin internet.')}
          </p>
        </div>

        <div className="flex bg-border/40 p-1 rounded-xl mb-4">
          <button
            type="button"
            onClick={() => { tapFeedback(); setActiveTab('geophone'); }}
            className={`flex-1 py-2 inline-flex items-center justify-center gap-1.5 text-center text-secondary font-bold rounded-lg transition-all ${
 activeTab === 'geophone' ? 'bg-surface text-ink shadow-sm' : 'text-ink-secondary hover:text-ink'
 }`}
          >
            <Ear className="w-5 h-5 shrink-0" aria-hidden="true" />
            {t('Buscar tras un muro')}
          </button>
          <button
            type="button"
            onClick={() => { tapFeedback(); setActiveTab('sentinel'); }}
            className={`flex-1 py-2 inline-flex items-center justify-center gap-1.5 text-center text-secondary font-bold rounded-lg transition-all ${
 activeTab === 'sentinel' ? 'bg-surface text-ink shadow-sm' : 'text-ink-secondary hover:text-ink'
 }`}
          >
            <Mic className="w-5 h-5 shrink-0" aria-hidden="true" />
            {t("Estoy atrapado")}
          </button>
        </div>

        {micProblem && <p role="alert" className="mb-3 text-secondary font-bold text-status-danger">{t(micProblem)}</p>}

        {activeTab === 'geophone' && (
          <div className="space-y-4">
            <div className="p-4 bg-sunken text-ink rounded-2xl border border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${isGeophoneActive ? 'bg-status-severe' : 'bg-border'}`} aria-hidden="true" />
                <span className="text-secondary font-bold text-ink">
                  {isGeophoneActive ? t('Escuchando golpes...') : t('Geófono en pausa')}
                </span>
              </div>

              {/* What the microphone hears in the low tones, right now. */}
              <div
                className="h-4 bg-border rounded-full overflow-hidden"
                role="meter"
                aria-label={t("Golpes graves que llegan")}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={vibrationLevel}
              >
                <div
                  className={`h-full ${vibrationLevel > 60 ? 'bg-status-danger' : 'bg-status-severe'}`}
                  style={{ width: `${vibrationLevel}%` }}
                />
              </div>

              <div className="mt-2.5 flex items-center justify-between gap-2 text-secondary text-ink-secondary">
                <span>{t("Apoya el celular firme contra la pared, el tubo o el escombro.")}</span>
                <span className="font-mono text-ink shrink-0">{t("Golpes:")} {knockCount}</span>
              </div>

              <button
                type="button"
                onClick={handleToggleGeophone}
                className={`btn mt-3 min-h-12 font-bold ${isGeophoneActive ? 'btn-secondary text-status-danger' : 'btn-danger'}`}
              >
                {isGeophoneActive ? t('Detener Geófono') : t('Activar Geófono de Muro')}
              </button>
            </div>

            {detectedMatch && (
              <div role="alert" className="p-4 bg-surface border-2 border-status-danger rounded-2xl text-ink">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-6 h-6 text-status-danger shrink-0" aria-hidden="true" />
                  <span className="text-section font-black tracking-tight text-status-danger">{t("Alguien golpea al otro lado")}</span>
                </div>
                <p className="text-secondary text-ink font-medium">
                  {fillNodes(
                    t('Se escucharon {knocks}, uno cada {seconds} segundos. Responde con golpes y avisa a los rescatistas.', {
                      seconds: (detectedMatch.intervalMs / 1000).toFixed(1).replace('.', ',')
                    }),
                    { knocks: <strong>{t('3 golpes a ritmo parejo')}</strong> }
                  )}
                </p>
              </div>
            )}

            <div className="p-3 bg-surface-raised border border-border rounded-xl text-secondary text-ink-secondary space-y-1">
              <span className="font-bold text-ink block">{t("¿Cómo funciona?")}</span>
              <p>
                {t('El concreto y los tubos llevan los golpes como un sonido grave. El celular cuenta solo esos golpes graves y cortos: los aplausos, las voces y los ruidos largos no cuentan. Tres golpes a ritmo parejo son alguien llamando.')}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'sentinel' && (
          <div className="space-y-4">
            <div className="p-4 bg-sunken text-ink rounded-2xl border border-border text-center">
              <div className="w-14 h-14 rounded-full bg-surface border border-border flex items-center justify-center mx-auto mb-3">
                {isSentinelActive
                  ? <Mic className="w-7 h-7 text-status-safe" aria-hidden="true" />
                  : <MicOff className="w-7 h-7 text-ink-muted" aria-hidden="true" />}
              </div>

              <h4 className="text-section font-bold text-ink">
                {isSentinelActive ? t('Escuchando tu voz') : t('Manos libres apagado')}
              </h4>
              <p className="text-secondary text-ink max-w-xs mx-auto mt-1">
                {isSentinelActive
                  ? t('Si quedas atrapado, grita fuerte dos veces, en el idioma que sea: "¡Auxilio!", "¡Ayuda!", "¡Yanapay!". El celular hará sonar la alarma.')
                  : t('Para cuando quedas bajo escombros y no alcanzas el celular con las manos. Déjalo encendido cerca de ti.')}
              </p>

              <button
                type="button"
                onClick={handleToggleSentinel}
                className={`btn mt-4 min-h-12 font-bold ${isSentinelActive ? 'btn-secondary text-status-danger' : 'btn-danger'}`}
              >
                {isSentinelActive ? t('Desactivar manos libres') : t('Activar manos libres')}
              </button>
            </div>

            {isAlarmSounding && (
              <div role="alert" className="p-4 bg-surface border-2 border-status-danger rounded-2xl text-ink">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldAlert className="w-6 h-6 text-status-danger shrink-0" aria-hidden="true" />
                  <span className="text-section font-black text-status-danger">{t('Alarma sonando')}</span>
                </div>
                <p className="text-secondary text-ink">{t('Se escucharon tus gritos. La alarma suena para que los rescatistas te encuentren.')}</p>
                <button type="button" onClick={stopAlarm} className="btn btn-secondary mt-3">{t('Detener alarma')}</button>
              </div>
            )}

            <div className="p-3.5 bg-surface border border-border rounded-xl text-secondary text-ink-secondary">
              <span className="font-bold text-ink block mb-1">{t('¿Qué lo activa?')}</span>
              {t('Dos gritos fuertes y largos, de medio segundo o más, en cualquier idioma, o dos silbidos largos. Una conversación normal, los aplausos y los golpes no lo activan.')}
            </div>
          </div>
        )}

      </div>
    </BottomSheet>
  );
};
