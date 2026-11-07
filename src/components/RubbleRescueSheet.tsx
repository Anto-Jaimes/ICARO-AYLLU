import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Radio, 
  AlertTriangle, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle,
  Play,
  RotateCcw
} from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { 
  geophoneDetector, 
  handsFreeSentinel, 
  SurvivalPatternMatch 
} from '../utils/rubbleRescue';
import { tapFeedback } from '../lib/native';

interface RubbleRescueSheetProps {
  open: boolean;
  onClose: () => void;
}

export const RubbleRescueSheet: React.FC<RubbleRescueSheetProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState<'geophone' | 'sentinel'>('geophone');

  // Geophone state
  const [isGeophoneActive, setIsGeophoneActive] = useState<boolean>(false);
  const [vibrationLevel, setVibrationLevel] = useState<number>(10);
  const [knockHistory, setKnockHistory] = useState<number[]>([]);
  const [detectedMatch, setDetectedMatch] = useState<SurvivalPatternMatch | null>(null);

  // Sentinel state
  const [isSentinelActive, setIsSentinelActive] = useState<boolean>(false);
  const [sentinelTriggeredText, setSentinelTriggeredText] = useState<string | null>(null);

  // Clean up when sheet closes
  useEffect(() => {
    if (!open) {
      geophoneDetector.stop();
      handsFreeSentinel.stop();
      setIsGeophoneActive(false);
      setIsSentinelActive(false);
      setDetectedMatch(null);
      setSentinelTriggeredText(null);
    }
  }, [open]);

  // Toggle Geophone
  const handleToggleGeophone = async () => {
    tapFeedback();
    if (isGeophoneActive) {
      geophoneDetector.stop();
      setIsGeophoneActive(false);
    } else {
      setDetectedMatch(null);
      const ok = await geophoneDetector.startListening(
        (level, isKnock) => {
          setVibrationLevel(level);
          if (isKnock) {
            tapFeedback();
            setKnockHistory((prev) => [Date.now(), ...prev].slice(0, 10));
          }
        },
        (match) => {
          tapFeedback();
          setDetectedMatch(match);
        }
      );
      if (ok) setIsGeophoneActive(true);
    }
  };

  // Simulate 3 Knocks for presentation demo
  const handleSimulateKnocks = () => {
    tapFeedback();
    setKnockHistory([Date.now(), Date.now() - 500, Date.now() - 1000]);
    setDetectedMatch({
      timestamp: Date.now(),
      tapCount: 3,
      confidence: 96,
      intervalMs: 520
    });
  };

  // Toggle Hands-Free Sentinel
  const handleToggleSentinel = () => {
    tapFeedback();
    if (isSentinelActive) {
      handsFreeSentinel.stop();
      setIsSentinelActive(false);
    } else {
      setSentinelTriggeredText(null);
      const ok = handsFreeSentinel.startMonitoring((phrase) => {
        tapFeedback();
        setSentinelTriggeredText(phrase);
      });
      if (ok) setIsSentinelActive(true);
    }
  };

  const handleSimulateVoice = () => {
    tapFeedback();
    setSentinelTriggeredText('¡AUXILIO, ESTOY ATRAPADO!');
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Rescate en Escombros">
      <div className="px-4" style={{ paddingBottom: 'calc(24px + var(--safe-bottom))' }}>
        
        {/* Technology Header Badge */}
        <div className="mb-3 p-3 bg-gradient-to-r from-neutral-900 to-amber-950 text-white rounded-xl shadow-sm border border-amber-800/40">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
            <span className="text-caption font-bold tracking-wide uppercase text-amber-300">
              Protocolo Topo USAR • Búsqueda Acústica de Supervivientes
            </span>
          </div>
          <p className="text-secondary text-neutral-300 mt-1">
            Detecta personas con vida bajo derrumbes escuchando golpes en muros, o activa auxilio con la voz si tus brazos están inmovilizados.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-line/40 p-1 rounded-xl mb-4">
          <button
            type="button"
            onClick={() => {
              tapFeedback();
              setActiveTab('geophone');
            }}
            className={`flex-1 py-2 text-center text-secondary font-bold rounded-lg transition-all ${
              activeTab === 'geophone'
                ? 'bg-surface text-ink shadow-sm'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            🎧 Geófono de Muro (Buscar)
          </button>
          <button
            type="button"
            onClick={() => {
              tapFeedback();
              setActiveTab('sentinel');
            }}
            className={`flex-1 py-2 text-center text-secondary font-bold rounded-lg transition-all ${
              activeTab === 'sentinel'
                ? 'bg-surface text-ink shadow-sm'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            🗣️ Manos Libres (Atrapado)
          </button>
        </div>

        {/* TAB 1: GEÓFONO DIGITAL DE MURO */}
        {activeTab === 'geophone' && (
          <div className="space-y-4">
            
            {/* Real-time Oscilloscope Spectrum */}
            <div className="p-4 bg-slate-950 text-white rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isGeophoneActive ? 'bg-amber-400 animate-pulse' : 'bg-slate-700'}`} />
                  <span className="text-secondary font-bold text-slate-200">
                    {isGeophoneActive ? 'Geófono Escuchando Vibraciones...' : 'Geófono en Pausa'}
                  </span>
                </div>
                <span className="text-caption font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                  Filtro Pasa-Bajo 450Hz
                </span>
              </div>

              {/* Seismic Wave Level Bar */}
              <div className="h-20 bg-slate-900 rounded-xl p-2.5 flex flex-col justify-end">
                <div className="flex items-end justify-between gap-1 h-full">
                  {Array.from({ length: 24 }).map((_, i) => {
                    const barHeight = isGeophoneActive 
                      ? Math.min(100, Math.max(12, vibrationLevel * (0.5 + (Math.sin(i + Date.now() / 200) * 0.5))))
                      : 8;
                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-t transition-all duration-75 ${
                          vibrationLevel > 60 
                            ? 'bg-red-500' 
                            : isGeophoneActive 
                            ? 'bg-amber-400' 
                            : 'bg-slate-800'
                        }`}
                        style={{ height: `${barHeight}%` }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-2.5 flex items-center justify-between text-caption text-slate-400">
                <span>Instrucción: Apoya el celular firme contra la pared o tubo.</span>
                <span className="font-mono text-slate-300">Nivel: {Math.round(vibrationLevel)}%</span>
              </div>

              {/* Controls */}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleToggleGeophone}
                  className={`btn flex-1 min-h-12 font-bold ${
                    isGeophoneActive ? 'btn-secondary text-rojo' : 'btn-danger'
                  }`}
                >
                  {isGeophoneActive ? 'Detener Geófono' : 'Activar Geófono de Muro'}
                </button>
                <button
                  type="button"
                  onClick={handleSimulateKnocks}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-caption font-bold rounded-lg border border-slate-700"
                  title="Demostración: Simula el patrón de 3 golpes para el jurado"
                >
                  Simular 3 Golpes
                </button>
              </div>
            </div>

            {/* Pattern Detected Alert */}
            {detectedMatch && (
              <div className="p-4 bg-red-100 border-2 border-red-500 rounded-2xl text-red-950 animate-bounce-once">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 animate-pulse" />
                  <span className="text-section font-black tracking-tight text-red-900">
                    ¡PATRÓN DE VIDA HUMANA DETECTADO!
                  </span>
                </div>
                <p className="text-secondary text-red-800 font-medium">
                  Se registraron <strong>3 golpes rítmicos consecutivos</strong> detrás de esta superficie.
                </p>
                <div className="mt-2 pt-2 border-t border-red-300/60 flex items-center justify-between text-caption text-red-900">
                  <span>Confianza del patrón: <strong>{detectedMatch.confidence}%</strong></span>
                  <span className="font-mono">Cadencia: ~{Math.round(60000 / detectedMatch.intervalMs)} BPM</span>
                </div>
              </div>
            )}

            {/* Scientific Explanation Card */}
            <div className="p-3 bg-surface-raised border border-line rounded-xl text-caption text-ink-2 space-y-1">
              <span className="font-bold text-ink block">¿Cómo funciona la búsqueda acústica?</span>
              <p>
                El concreto y las tuberías transmiten ondas mecánicas de baja frecuencia mucho mejor que el aire. Cuando una persona atrapada golpea con una piedra o fierro, los sensores del celular aíslan ese impacto del ruido ambiental.
              </p>
            </div>

          </div>
        )}

        {/* TAB 2: CENTINELA MANOS LIBRES */}
        {activeTab === 'sentinel' && (
          <div className="space-y-4">
            
            <div className="p-4 bg-slate-950 text-white rounded-2xl border border-slate-800 text-center">
              <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center mx-auto mb-3">
                {isSentinelActive ? (
                  <Mic className="w-7 h-7 text-emerald-400 animate-pulse" />
                ) : (
                  <MicOff className="w-7 h-7 text-slate-500" />
                )}
              </div>

              <h4 className="text-section font-bold text-slate-100">
                {isSentinelActive ? 'Centinela Escuchando en Espera' : 'Centinela Apagado'}
              </h4>
              <p className="text-secondary text-slate-300 max-w-xs mx-auto mt-1">
                {isSentinelActive
                  ? 'Si estás atrapado y no puedes mover los brazos, solo grita fuerte: "¡AUXILIO!", "¡AYUDA!" o en Quechua "¡YANAPAY!".'
                  : 'Diseñado para cuando quedas inmovilizado bajo una viga o escombros sin poder alcanzar el celular con las manos.'}
              </p>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={handleToggleSentinel}
                  className={`btn flex-1 min-h-12 font-bold ${
                    isSentinelActive ? 'btn-secondary text-rojo' : 'btn-danger'
                  }`}
                >
                  {isSentinelActive ? 'Desactivar Centinela' : 'Activar Centinela Manos Libres'}
                </button>
                <button
                  type="button"
                  onClick={handleSimulateVoice}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-caption font-bold rounded-lg border border-slate-700"
                  title="Demostración: Simula el grito de auxilio"
                >
                  Probar Grito
                </button>
              </div>
            </div>

            {/* Triggered Alert */}
            {sentinelTriggeredText && (
              <div className="p-4 bg-red-100 border-2 border-red-500 rounded-2xl text-red-950 animate-bounce-once">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
                  <span className="text-section font-black text-red-900">
                    ¡SOCORRO ACTIVADO POR VOZ!
                  </span>
                </div>
                <p className="text-secondary text-red-800">
                  Palabra captada: <strong>"{sentinelTriggeredText}"</strong>
                </p>
                <div className="mt-2 pt-2 border-t border-red-300 flex items-center justify-between text-caption text-red-900">
                  <span>Linterna LED y Baliza Acústica encendidas</span>
                  <button
                    type="button"
                    onClick={() => setSentinelTriggeredText(null)}
                    className="font-bold underline"
                  >
                    Restablecer
                  </button>
                </div>
              </div>
            )}

            {/* List of triggers recognized */}
            <div className="p-3.5 bg-surface border border-line rounded-xl">
              <span className="text-secondary font-bold text-ink block mb-2">
                Palabras de auxilio reconocidas offline:
              </span>
              <div className="grid grid-cols-2 gap-2 text-caption">
                <div className="p-2 bg-surface-raised rounded-lg font-bold text-rojo">
                  🇵🇪 ¡AUXILIO! / ¡AYUDA!
                </div>
                <div className="p-2 bg-surface-raised rounded-lg font-bold text-rojo">
                  🏔️ ¡YANAPAY! (Quechua)
                </div>
                <div className="p-2 bg-surface-raised rounded-lg font-bold text-rojo">
                  🚨 ¡SOCORRO!
                </div>
                <div className="p-2 bg-surface-raised rounded-lg font-bold text-rojo">
                  📢 3 Gritos o Silbidos fuertes
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </BottomSheet>
  );
};
