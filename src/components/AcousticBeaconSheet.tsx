import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Volume2, 
  VolumeX, 
  MapPin, 
  ShieldAlert, 
  Waves, 
  CheckCircle2, 
  AlertTriangle, 
  Droplet, 
  HeartPulse, 
  Sparkles,
  Phone,
  Trash2,
  HelpCircle
} from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { useApp } from '../context/AppContext';
import { 
  acousticModem, 
  AcousticBeaconPayload, 
  BeaconType, 
  AcousticMode,
  BEACON_LABELS,
  saveCapturedBeacon,
  getCapturedBeacons
} from '../utils/acousticP2P';
import { tapFeedback } from '../lib/native';

interface AcousticBeaconSheetProps {
  open: boolean;
  onClose: () => void;
}

export const AcousticBeaconSheet: React.FC<AcousticBeaconSheetProps> = ({ open, onClose }) => {
  const { userLocation } = useApp();
  const [activeTab, setActiveTab] = useState<'transmit' | 'listen'>('transmit');

  // Transmission state
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [beaconType, setBeaconType] = useState<BeaconType>('SOS_TRAPPED');
  const [details, setDetails] = useState<string>('Piso 2, puerta verde');
  const [senderName, setSenderName] = useState<string>('Familia Vecina');
  const [acousticMode, setAcousticMode] = useState<AcousticMode>('audible');
  const [transmitProgress, setTransmitProgress] = useState<number>(0);

  // Listening state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [capturedList, setCapturedList] = useState<AcousticBeaconPayload[]>([]);
  const [activeFreqDetected, setActiveFreqDetected] = useState<number | null>(null);
  const [spectrumBars, setSpectrumBars] = useState<number[]>(new Array(16).fill(10));
  const [lastReceivedAlert, setLastReceivedAlert] = useState<AcousticBeaconPayload | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load saved beacons
  useEffect(() => {
    if (open) {
      setCapturedList(getCapturedBeacons());
    }
  }, [open]);

  // Clean up modem on close
  useEffect(() => {
    if (!open) {
      acousticModem.stopTransmission();
      acousticModem.stopListening();
      setIsTransmitting(false);
      setIsListening(false);
      setTransmitProgress(0);
    }
  }, [open]);

  const handleStartTransmit = () => {
    tapFeedback();
    const payload: AcousticBeaconPayload = {
      id: `mine_${Date.now()}`,
      sender: senderName.trim() || 'Vecino',
      type: beaconType,
      details: details.trim() || 'Necesito ayuda',
      lat: userLocation.lat,
      lng: userLocation.lng,
      timestamp: Date.now(),
    };

    setIsTransmitting(true);
    setTransmitProgress(10);

    acousticModem.startBeaconLoop(payload, acousticMode, () => {
      setTransmitProgress(100);
      setTimeout(() => setTransmitProgress(0), 1000);
    });
  };

  const handleStopTransmit = () => {
    tapFeedback();
    acousticModem.stopTransmission();
    setIsTransmitting(false);
    setTransmitProgress(0);
  };

  const handleToggleListening = async () => {
    tapFeedback();
    if (isListening) {
      acousticModem.stopListening();
      setIsListening(false);
      setActiveFreqDetected(null);
    } else {
      const ok = await acousticModem.startListening(
        (beacon) => {
          // Beacon decoded!
          tapFeedback();
          saveCapturedBeacon(beacon);
          setCapturedList(getCapturedBeacons());
          setLastReceivedAlert(beacon);
        },
        (freqData, detectedFreq) => {
          setActiveFreqDetected(detectedFreq);
          // Downsample for visual spectrum bars (16 bars)
          const bars: number[] = [];
          const step = Math.floor(freqData.length / 16);
          for (let i = 0; i < 16; i++) {
            const val = freqData[i * step] || 0;
            bars.push(Math.max(12, Math.round((val / 255) * 60)));
          }
          setSpectrumBars(bars);
        },
        acousticMode
      );
      if (ok) setIsListening(true);
    }
  };

  const handleSimulateReception = () => {
    tapFeedback();
    const demoBeacon: AcousticBeaconPayload = {
      id: `demo_${Date.now()}`,
      sender: 'Don Carlos (Gasfitería)',
      type: 'SOS_TRAPPED',
      details: 'Atrapado con herramientas, puerta trabada',
      lat: userLocation.lat + (Math.random() - 0.5) * 0.002,
      lng: userLocation.lng + (Math.random() - 0.5) * 0.002,
      timestamp: Date.now(),
      rssi: 92
    };
    saveCapturedBeacon(demoBeacon);
    setCapturedList(getCapturedBeacons());
    setLastReceivedAlert(demoBeacon);
  };

  const handleClearHistory = () => {
    tapFeedback();
    localStorage.removeItem('ayllu_acoustic_beacons_v1');
    setCapturedList([]);
    setLastReceivedAlert(null);
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Radar Acústico P2P (Data-over-Sound)">
      <div className="px-4" style={{ paddingBottom: 'calc(24px + var(--safe-bottom))' }}>
        
        {/* Technology Badge & Explanation */}
        <div className="mb-3 p-3 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl shadow-sm border border-indigo-800/40">
          <div className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-cyan-400 shrink-0 animate-pulse" />
            <span className="text-caption font-bold tracking-wide uppercase text-cyan-300">
              Tecnología P2P por Sonido (Inspirada en China y EE.UU.)
            </span>
          </div>
          <p className="text-secondary text-slate-300 mt-1">
            Transmite y recibe fichas de socorro de teléfono a teléfono a través del aire 
            (bocina y micrófono). <strong>Funciona 100% sin internet, sin red móvil y sin Bluetooth.</strong>
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-line/40 p-1 rounded-xl mb-4">
          <button
            type="button"
            onClick={() => {
              tapFeedback();
              setActiveTab('transmit');
            }}
            className={`flex-1 py-2 text-center text-secondary font-bold rounded-lg transition-all ${
              activeTab === 'transmit'
                ? 'bg-surface text-ink shadow-sm'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            Emitir Socorro (Parlante)
          </button>
          <button
            type="button"
            onClick={() => {
              tapFeedback();
              setActiveTab('listen');
            }}
            className={`flex-1 py-2 text-center text-secondary font-bold rounded-lg transition-all ${
              activeTab === 'listen'
                ? 'bg-surface text-ink shadow-sm'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            Escuchar Balizas (Micrófono)
            {capturedList.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-rojo text-white rounded-full">
                {capturedList.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: TRANSMISOR */}
        {activeTab === 'transmit' && (
          <div className="space-y-4">
            {/* Visual Radar Animation */}
            <div className={`relative p-5 rounded-2xl flex flex-col items-center justify-center text-center transition-all ${
              isTransmitting 
                ? 'bg-amber-500/10 border-2 border-amber-500' 
                : 'bg-surface-raised border border-line'
            }`}>
              {isTransmitting ? (
                <div className="relative mb-3 flex items-center justify-center">
                  <div className="absolute w-20 h-20 rounded-full bg-amber-400/20 animate-ping" />
                  <div className="absolute w-14 h-14 rounded-full bg-amber-500/30 animate-pulse" />
                  <div className="relative z-10 w-12 h-12 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-lg">
                    <Radio className="w-6 h-6 animate-spin" />
                  </div>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-line/60 text-ink-2 flex items-center justify-center mb-3">
                  <Volume2 className="w-6 h-6" />
                </div>
              )}

              <h4 className="text-section font-bold text-ink">
                {isTransmitting ? 'EMITIENDO BALIZA ACÚSTICA' : 'Transmisor Desactivado'}
              </h4>
              <p className="text-secondary text-ink-2 max-w-xs mt-0.5">
                {isTransmitting
                  ? 'Tu celular está emitiendo ondas de sonido codificadas cada 7 segundos. Los celulares de vecinos cercanos lo captarán.'
                  : 'Configura tu alerta y presiona el botón para empezar a emitir ondas sonoras de socorro.'}
              </p>
            </div>

            {/* Presets of Emergency */}
            <div>
              <label className="block text-secondary font-bold text-ink mb-1.5">
                Tipo de alerta que deseas emitir:
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {(['SOS_TRAPPED', 'SOS_MEDICAL', 'RESOURCE_WATER', 'CHECKIN_SAFE'] as BeaconType[]).map((type) => {
                  const meta = BEACON_LABELS[type];
                  const selected = beaconType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      disabled={isTransmitting}
                      onClick={() => {
                        tapFeedback();
                        setBeaconType(type);
                      }}
                      className={`flex items-center gap-3 p-2.5 rounded-xl text-left border transition-all ${
                        selected
                          ? 'border-rojo bg-red-50 text-ink shadow-sm'
                          : 'border-line bg-surface hover:bg-surface-raised text-ink-2'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
                        {type === 'SOS_TRAPPED' && <ShieldAlert className="w-4 h-4" />}
                        {type === 'SOS_MEDICAL' && <HeartPulse className="w-4 h-4" />}
                        {type === 'RESOURCE_WATER' && <Droplet className="w-4 h-4" />}
                        {type === 'CHECKIN_SAFE' && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-secondary font-bold text-ink truncate">{meta.title}</div>
                        <div className="text-caption text-ink-2 truncate">{meta.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sender and details inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-caption font-bold text-ink-2 mb-1">Tu Nombre / Familia:</label>
                <input
                  type="text"
                  maxLength={15}
                  disabled={isTransmitting}
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-secondary font-medium"
                  placeholder="Ej. Familia Quispe"
                />
              </div>
              <div>
                <label className="block text-caption font-bold text-ink-2 mb-1">Ubicación / Detalle:</label>
                <input
                  type="text"
                  maxLength={24}
                  disabled={isTransmitting}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-secondary font-medium"
                  placeholder="Ej. Mz C Lote 4"
                />
              </div>
            </div>

            {/* GPS coordinates attached notice */}
            <div className="flex items-center gap-2 p-2.5 bg-line/20 rounded-lg text-caption text-ink-2">
              <MapPin className="w-4 h-4 text-rojo shrink-0" />
              <span>
                Coordenadas GPS adjuntas automáticamente: <strong>{userLocation.lat.toFixed(3)}, {userLocation.lng.toFixed(3)}</strong>
              </span>
            </div>

            {/* Audio Mode Selection */}
            <div className="flex items-center justify-between p-3 bg-surface border border-line rounded-xl">
              <div>
                <span className="block text-secondary font-bold text-ink">Frecuencia de Transmisión:</span>
                <span className="block text-caption text-ink-2">
                  {acousticMode === 'audible' 
                    ? 'Audible (1.8 kHz - 2.8 kHz): Atraviesa paredes y escoria, 20m de alcance' 
                    : 'Ultrasonido (18.5 kHz): Inaudible para humanos adultos'}
                </span>
              </div>
              <button
                type="button"
                disabled={isTransmitting}
                onClick={() => {
                  tapFeedback();
                  setAcousticMode(m => m === 'audible' ? 'ultrasonic' : 'audible');
                }}
                className="px-3 py-1.5 bg-line/60 rounded-lg text-caption font-bold text-ink hover:bg-line shrink-0"
              >
                {acousticMode === 'audible' ? '🔊 Audible' : '🤫 Ultrasonido'}
              </button>
            </div>

            {/* Action CTA */}
            {isTransmitting ? (
              <button
                type="button"
                onClick={handleStopTransmit}
                className="btn btn-secondary w-full min-h-14 font-bold flex items-center justify-center gap-2"
              >
                <VolumeX className="w-5 h-5 text-rojo" />
                Detener Emisión de Baliza
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartTransmit}
                className="btn btn-danger w-full min-h-14 font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                <Waves className="w-5 h-5" />
                EMPEZAR A EMITIR BALIZA POR SONIDO
              </button>
            )}
          </div>
        )}

        {/* TAB 2: RECEPTOR / RADAR */}
        {activeTab === 'listen' && (
          <div className="space-y-4">
            
            {/* Listening Spectrum Visualizer */}
            <div className="p-4 bg-slate-950 text-white rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                  <span className="text-secondary font-bold text-slate-200">
                    {isListening ? 'Escuchando ondas en el ambiente...' : 'Radar de micrófono apagado'}
                  </span>
                </div>
                {activeFreqDetected && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                    {Math.round(activeFreqDetected)} Hz detectados
                  </span>
                )}
              </div>

              {/* Graphic Equalizer Spectrum */}
              <div className="h-16 flex items-end justify-between gap-1.5 px-2 bg-slate-900/80 rounded-lg py-2">
                {spectrumBars.map((h, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 rounded-t transition-all duration-75 ${
                      isListening ? 'bg-gradient-to-t from-cyan-600 to-emerald-400' : 'bg-slate-700'
                    }`}
                    style={{ height: `${isListening ? h : 6}px` }}
                  />
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleToggleListening}
                  className={`btn flex-1 min-h-12 font-bold ${
                    isListening ? 'btn-secondary text-rojo' : 'btn-danger'
                  }`}
                >
                  {isListening ? 'Pausar Escucha' : 'Activar Micrófono de Escucha'}
                </button>
                <button
                  type="button"
                  onClick={handleSimulateReception}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-caption font-bold rounded-lg border border-slate-700"
                  title="Simular recepción de baliza para demostración rápida"
                >
                  Probar Baliza
                </button>
              </div>
            </div>

            {/* Last Received Alert Banner */}
            {lastReceivedAlert && (
              <div className="p-3.5 bg-red-100 border-2 border-red-500 rounded-xl text-red-950 animate-bounce-once">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                  <span className="text-secondary font-bold">¡ALERTA RECIBIDA POR ONDAS DE SONIDO!</span>
                </div>
                <div className="text-row font-bold text-red-900">{lastReceivedAlert.sender}</div>
                <div className="text-secondary text-red-800">{lastReceivedAlert.details}</div>
                {lastReceivedAlert.lat && lastReceivedAlert.lng && (
                  <div className="text-caption text-red-700 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    GPS: {lastReceivedAlert.lat.toFixed(4)}, {lastReceivedAlert.lng.toFixed(4)}
                  </div>
                )}
              </div>
            )}

            {/* History of Received Beacons */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-section font-bold text-ink">
                  Balizas Captadas en tu Zona ({capturedList.length})
                </h4>
                {capturedList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="text-caption text-ink-2 hover:text-rojo flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Limpiar
                  </button>
                )}
              </div>

              {capturedList.length === 0 ? (
                <div className="p-6 bg-surface-raised border border-line rounded-xl text-center text-ink-2 text-secondary">
                  No hay balizas sonoras captadas aún. Mantén el micrófono encendido para escuchar a vecinos cercanos que emitan socorro.
                </div>
              ) : (
                <ul className="space-y-2 list-plain">
                  {capturedList.map((item) => {
                    const meta = BEACON_LABELS[item.type] || BEACON_LABELS.SOS_TRAPPED;
                    return (
                      <li key={item.id} className="p-3 bg-surface border border-line rounded-xl shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${meta.color} mb-1`}>
                              {meta.title}
                            </span>
                            <div className="text-row font-bold text-ink">{item.sender}</div>
                            <div className="text-secondary text-ink-2">{item.details}</div>
                          </div>
                          {item.rssi && (
                            <span className="text-caption px-2 py-0.5 bg-line/40 rounded-full font-mono text-ink-2 shrink-0">
                              Señal: {item.rssi}%
                            </span>
                          )}
                        </div>

                        {item.lat && item.lng && (
                          <div className="mt-2 pt-2 border-t border-line/60 flex items-center justify-between text-caption">
                            <span className="text-ink-2 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-rojo" />
                              {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                            </span>
                            <a
                              href={`https://maps.google.com/?q=${item.lat},${item.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-rojo hover:underline"
                            >
                              Ver en Mapa
                            </a>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

          </div>
        )}

      </div>
    </BottomSheet>
  );
};
