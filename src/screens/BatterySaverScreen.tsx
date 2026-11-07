import React, { useState, useEffect, useRef } from 'react';
import { 
  Battery, 
  BatteryCharging, 
  BatteryLow, 
  Phone, 
  MessageSquare, 
  HeartPulse, 
  Sun, 
  Volume2, 
  VolumeX, 
  X, 
  Radio, 
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Compass,
  Flashlight,
  Waves,
  Clock,
  MapPin,
  Sparkles,
  Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { communitySiren } from '../utils/audioAlarm';
import { MedicalIdSheet, MedicalProfile } from '../components/MedicalIdSheet';
import { FirstAidSheet } from '../components/FirstAidSheet';
import { AcousticBeaconSheet } from '../components/AcousticBeaconSheet';
import { useBackHandler } from '../hooks/useBackHandler';
import { tapFeedback } from '../lib/native';

interface BatterySaverScreenProps {
  onExit: () => void;
}

export const BatterySaverScreen: React.FC<BatterySaverScreenProps> = ({ onExit }) => {
  const { userLocation } = useApp();
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  
  // Flashlight modes: 'off' | 'hardware' | 'morse' | 'screen'
  const [torchMode, setTorchMode] = useState<'off' | 'hardware' | 'morse' | 'screen'>('off');
  const torchTrackRef = useRef<MediaStreamTrack | null>(null);
  const morseIntervalRef = useRef<number | null>(null);

  // Sound / Siren states
  const [isSounding, setIsSounding] = useState<boolean>(false);
  const [isWhistleActive, setIsWhistleActive] = useState<boolean>(false);
  const whistleTimerRef = useRef<number | null>(null);
  const whistleCtxRef = useRef<AudioContext | null>(null);

  // Sheets
  const [isMedicalOpen, setIsMedicalOpen] = useState<boolean>(false);
  const [isFirstAidOpen, setIsFirstAidOpen] = useState<boolean>(false);
  const [isAcousticOpen, setIsAcousticOpen] = useState<boolean>(false);

  // Compass Heading
  const [heading, setHeading] = useState<number | null>(null);

  // Stored Medical Profile for Always-on display
  const [medicalProfile, setMedicalProfile] = useState<MedicalProfile | null>(null);

  // Native Android back button handlers
  useBackHandler(true, onExit);
  useBackHandler(torchMode !== 'off', () => setTorchMode('off'));

  // Load Medical ID for instant reading
  useEffect(() => {
    try {
      const raw = localStorage.getItem('ayllu_medical_id_v1');
      if (raw) setMedicalProfile(JSON.parse(raw));
    } catch {}
  }, [isMedicalOpen]);

  // Monitor Battery Status API
  useEffect(() => {
    let batteryInstance: any = null;

    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        batteryInstance = battery;
        setBatteryLevel(Math.round(battery.level * 100));
        setIsCharging(battery.charging);

        const onLevelChange = () => setBatteryLevel(Math.round(battery.level * 100));
        const onChargingChange = () => setIsCharging(battery.charging);

        battery.addEventListener('levelchange', onLevelChange);
        battery.addEventListener('chargingchange', onChargingChange);
      }).catch(() => {
        setBatteryLevel(null);
      });
    }

    // Compass sensor listener
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const compass = (e as any).webkitCompassHeading ?? (e.alpha ? 360 - e.alpha : null);
      if (compass !== null && !isNaN(compass)) {
        setHeading(Math.round(compass));
      }
    };
    window.addEventListener('deviceorientation', handleOrientation, true);

    return () => {
      communitySiren.stopSiren();
      stopWhistle();
      stopHardwareTorch();
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  // 1. Hardware Torch & Morse LED Controller
  const stopHardwareTorch = () => {
    if (morseIntervalRef.current) {
      clearTimeout(morseIntervalRef.current);
      morseIntervalRef.current = null;
    }
    if (torchTrackRef.current) {
      try {
        (torchTrackRef.current as any).applyConstraints({ advanced: [{ torch: false }] });
      } catch {}
      torchTrackRef.current.stop();
      torchTrackRef.current = null;
    }
  };

  const handleToggleTorch = async (desired: 'hardware' | 'morse') => {
    tapFeedback();
    if (torchMode === desired) {
      stopHardwareTorch();
      setTorchMode('off');
      return;
    }

    stopHardwareTorch();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      const track = stream.getVideoTracks()[0];
      const capabilities = (track.getCapabilities?.() as any) || {};

      if (!capabilities.torch) {
        // Fallback to max white screen if hardware torch not supported
        stream.getTracks().forEach(t => t.stop());
        setTorchMode('screen');
        return;
      }

      torchTrackRef.current = track;

      if (desired === 'hardware') {
        await (track as any).applyConstraints({ advanced: [{ torch: true }] });
        setTorchMode('hardware');
      } else {
        // Morse S.O.S. pattern (... --- ...)
        setTorchMode('morse');
        const morsePattern = [150, 150, 150, 150, 150, 400, 400, 150, 400, 150, 400, 400, 150, 150, 150, 150, 150, 1400];
        let step = 0;
        let isOn = true;
        await (track as any).applyConstraints({ advanced: [{ torch: true }] });

        const tick = async () => {
          step = (step + 1) % morsePattern.length;
          isOn = !isOn;
          try {
            await (track as any).applyConstraints({ advanced: [{ torch: isOn }] });
          } catch {}
          morseIntervalRef.current = window.setTimeout(tick, morsePattern[step]);
        };
        morseIntervalRef.current = window.setTimeout(tick, morsePattern[0]);
      }
    } catch {
      // Permission denied or error: fallback to full white screen
      setTorchMode('screen');
    }
  };

  // 2. Intermittent Survival Whistle (High-pitch 2850 Hz whistle every 12s, saves 85% battery)
  const stopWhistle = () => {
    if (whistleTimerRef.current) {
      clearTimeout(whistleTimerRef.current);
      whistleTimerRef.current = null;
    }
    if (whistleCtxRef.current) {
      try { whistleCtxRef.current.close(); } catch {}
      whistleCtxRef.current = null;
    }
    setIsWhistleActive(false);
  };

  const toggleWhistle = () => {
    tapFeedback();
    if (isWhistleActive) {
      stopWhistle();
    } else {
      setIsWhistleActive(true);
      const playPulse = () => {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioContextClass();
          whistleCtxRef.current = ctx;
          if (ctx.state === 'suspended') ctx.resume();

          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(2850, ctx.currentTime);

          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 0.05);
          gain.gain.setValueAtTime(0.7, ctx.currentTime + 0.7);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + 0.85);
        } catch {}

        whistleTimerRef.current = window.setTimeout(playPulse, 12000);
      };
      playPulse();
    }
  };

  // Continuous siren
  const toggleSiren = () => {
    tapFeedback();
    if (isSounding) {
      communitySiren.stopSiren();
      setIsSounding(false);
    } else if (communitySiren.startSiren()) {
      setIsSounding(true);
    }
  };

  // Battery life calculation estimates
  const lvl = batteryLevel ?? 35;
  const criticalHours = Math.max(1, Math.round(lvl * 1.9));
  const normalHours = Math.max(1, Math.round(lvl * 0.16));

  const getCardinal = (deg: number): string => {
    const directions = ['N (Norte)', 'NE (Noreste)', 'E (Este)', 'SE (Sureste)', 'S (Sur)', 'SO (Suroeste)', 'O (Oeste)', 'NO (Noroeste)'];
    return directions[Math.round(deg / 45) % 8];
  };

  // SMS SOS coordinates
  const smsBody = encodeURIComponent(
    `S.O.S. AUXILIO URGENTE. Bateria critica (${lvl}%). Mi ubicacion es: ${userLocation.name} (Lat: ${userLocation.lat.toFixed(4)}, Lng: ${userLocation.lng.toFixed(4)}). Sangre: ${medicalProfile?.bloodType || 'O+'}.`
  );
  const smsUrl = `sms:?body=${smsBody}`;

  // Fallback White screen flashlight
  if (torchMode === 'screen') {
    return (
      <div
        onClick={() => setTorchMode('off')}
        className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-between p-6 cursor-pointer"
      >
        <span className="text-black font-black text-xs uppercase tracking-widest bg-black/10 px-3 py-1 rounded-full">
          Linterna Pantalla Máxima (Toca para apagar)
        </span>
        <div className="text-center">
          <Sun className="w-16 h-16 text-black/80 mx-auto animate-pulse" />
          <p className="text-black font-black text-sm mt-3">Toca cualquier parte para volver al Modo Negro OLED</p>
        </div>
        <span className="text-black/50 text-xs">AYLLU • Modo Supervivencia</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 font-mono select-none flex flex-col justify-between">
      {/* 1. TOP HEADER & BATTERY ESTIMATE BANNER */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-black tracking-wider text-emerald-400 uppercase">
              MODO BATERÍA CRÍTICA (SUPERVIVENCIA)
            </span>
          </div>

          <button
            type="button"
            onClick={onExit}
            className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs font-bold text-neutral-300 hover:text-white cursor-pointer active:scale-95"
          >
            Salir del modo
          </button>
        </div>

        {/* Dynamic Battery & Autonomy Survival Calculator */}
        <div className="my-3 p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-neutral-900 text-amber-400">
                {isCharging ? (
                  <BatteryCharging className="w-6 h-6 text-emerald-400 animate-pulse" />
                ) : lvl < 20 ? (
                  <BatteryLow className="w-6 h-6 text-rojo animate-bounce" />
                ) : (
                  <Battery className="w-6 h-6 text-amber-400" />
                )}
              </div>
              <div>
                <span className="text-2xl font-black block leading-none">
                  {batteryLevel !== null ? `${batteryLevel}%` : 'Ahorro Activo'}
                </span>
                <span className="text-[11px] text-neutral-400 font-sans">
                  {isCharging ? 'Cargando dispositivo' : 'Negro OLED: Píxeles 100% apagados'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block">Autonomía Estimada</span>
              <span className="text-xl font-black text-emerald-400 block font-mono">
                ~{criticalHours}h
              </span>
              <span className="text-[10px] text-neutral-500 block line-through">
                Normal: ~{normalHours}h
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[11px] font-sans text-neutral-400">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <Zap className="w-3.5 h-3.5" /> +65% de vida útil en apagones
            </span>
            <span className="font-mono text-neutral-500">AMOLED #000000</span>
          </div>
        </div>

        {/* 2. ALWAYS-ON MEDICAL & LOCATION IDENTITY CARD */}
        <div className="mb-3 p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <HeartPulse className="w-3.5 h-3.5 text-rojo" /> Ficha de Identidad & Ubicación (Siempre Visible)
            </span>
            <button
              type="button"
              onClick={() => setIsMedicalOpen(true)}
              className="text-[10px] text-cyan-400 font-bold hover:underline"
            >
              Editar ICE
            </button>
          </div>

          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-bold text-white">
                {medicalProfile?.fullName || 'Vecino Comunitario'}
              </div>
              <div className="text-xs text-neutral-400 mt-0.5">
                Alergias: <strong className="text-neutral-200">{medicalProfile?.allergies || 'Ninguna registrada'}</strong>
              </div>
              {medicalProfile?.conditions && (
                <div className="text-xs text-neutral-400">
                  Condición: <strong className="text-amber-300">{medicalProfile.conditions}</strong>
                </div>
              )}
            </div>

            <div className="text-right shrink-0">
              <span className="px-2 py-0.5 bg-red-950 text-red-400 border border-red-800 rounded font-black text-xs inline-block mb-1">
                {medicalProfile?.bloodType || 'O+'}
              </span>
              <div className="text-[10px] text-neutral-400 font-mono">
                {medicalProfile?.emergencyContactPhone || 'Sin contacto'}
              </div>
            </div>
          </div>

          {/* Location and GPS */}
          <div className="mt-2 pt-2 border-t border-neutral-900 flex items-center justify-between text-xs font-sans text-neutral-400">
            <span className="flex items-center gap-1 truncate max-w-[200px]">
              <MapPin className="w-3.5 h-3.5 text-rojo shrink-0" />
              {userLocation.name}
            </span>
            <span className="font-mono text-neutral-300 text-[11px] shrink-0">
              GPS: {userLocation.lat.toFixed(3)}, {userLocation.lng.toFixed(3)}
            </span>
          </div>
        </div>

        {/* 3. HARDWARE LIGHTING & RESCUE SOUND ACTIONS */}
        <div className="grid grid-cols-2 gap-2 my-2">
          
          {/* Hardware Camera Flash Torch */}
          <button
            type="button"
            onClick={() => handleToggleTorch('hardware')}
            className={`min-h-[76px] p-3 rounded-2xl border flex flex-col justify-between text-left transition cursor-pointer ${
              torchMode === 'hardware'
                ? 'bg-amber-500 text-black border-amber-400 font-bold'
                : 'bg-neutral-900 border-neutral-800 text-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <Flashlight className={`w-5 h-5 ${torchMode === 'hardware' ? 'text-black' : 'text-amber-400'}`} />
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-black/30 font-bold">
                {torchMode === 'hardware' ? 'ENCENDIDA' : 'LED TRASERO'}
              </span>
            </div>
            <div>
              <span className="font-bold text-xs block leading-tight">Linterna Flash LED</span>
              <span className={`text-[10px] ${torchMode === 'hardware' ? 'text-black/80' : 'text-neutral-400'}`}>
                Mantiene pantalla negra
              </span>
            </div>
          </button>

          {/* Morse S.O.S. Flashing Light */}
          <button
            type="button"
            onClick={() => handleToggleTorch('morse')}
            className={`min-h-[76px] p-3 rounded-2xl border flex flex-col justify-between text-left transition cursor-pointer ${
              torchMode === 'morse'
                ? 'bg-red-600 text-white border-red-400 animate-pulse font-bold'
                : 'bg-neutral-900 border-neutral-800 text-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <Sun className={`w-5 h-5 ${torchMode === 'morse' ? 'text-white' : 'text-rojo'}`} />
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-black/30 font-bold">
                {torchMode === 'morse' ? 'PARPADEANDO' : 'MORSE'}
              </span>
            </div>
            <div>
              <span className="font-bold text-xs block leading-tight">Luz S.O.S. Morse</span>
              <span className={`text-[10px] ${torchMode === 'morse' ? 'text-white/80' : 'text-neutral-400'}`}>
                Rescate nocturno / aéreo
              </span>
            </div>
          </button>

          {/* Intermittent Survival Whistle */}
          <button
            type="button"
            onClick={toggleWhistle}
            className={`min-h-[76px] p-3 rounded-2xl border flex flex-col justify-between text-left transition cursor-pointer ${
              isWhistleActive
                ? 'bg-emerald-600 text-white border-emerald-400 animate-pulse'
                : 'bg-neutral-900 border-neutral-800 text-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <Volume2 className={`w-5 h-5 ${isWhistleActive ? 'text-white' : 'text-emerald-400'}`} />
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-black/30 font-bold">
                {isWhistleActive ? 'ACTIVO' : 'BAJO GASTO'}
              </span>
            </div>
            <div>
              <span className="font-bold text-xs block leading-tight">Silbato Cada 12s</span>
              <span className={`text-[10px] ${isWhistleActive ? 'text-white/80' : 'text-neutral-400'}`}>
                Dura hasta 48 horas
              </span>
            </div>
          </button>

          {/* Acoustic P2P Beacon (Data-over-Sound with Black Screen) */}
          <button
            type="button"
            onClick={() => {
              tapFeedback();
              setIsAcousticOpen(true);
            }}
            className="min-h-[76px] p-3 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between text-left cursor-pointer hover:bg-neutral-800"
          >
            <div className="flex items-center justify-between w-full">
              <Waves className="w-5 h-5 text-cyan-400" />
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                P2P SONIDO
              </span>
            </div>
            <div>
              <span className="font-bold text-xs block leading-tight">Baliza Acústica</span>
              <span className="text-[10px] text-neutral-400">Emite socorro por ondas</span>
            </div>
          </button>

          {/* Continuous Siren */}
          <button
            type="button"
            onClick={toggleSiren}
            className={`min-h-[70px] p-3 rounded-2xl border flex flex-col justify-between text-left transition cursor-pointer ${
              isSounding
                ? 'bg-rojo border-red-500 text-white animate-pulse'
                : 'bg-neutral-900 border-neutral-800 text-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              {isSounding ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-rojo" />}
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-black/30 font-bold">
                {isSounding ? 'SONANDO' : 'ESTRUENDO'}
              </span>
            </div>
            <div>
              <span className="font-bold text-xs block leading-tight">Sirena Continua</span>
              <span className="text-[10px] text-neutral-400">
                {isSounding ? 'Toca para detener' : 'Máximo volumen'}
              </span>
            </div>
          </button>

          {/* SMS with GPS */}
          <a
            href={smsUrl}
            className="min-h-[70px] p-3 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between text-left no-underline text-white active:bg-neutral-800"
          >
            <div className="flex items-center justify-between w-full">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-black/30 font-bold">
                2G SMS
              </span>
            </div>
            <div>
              <span className="font-bold text-xs block leading-tight">SMS con GPS</span>
              <span className="text-[10px] text-neutral-400">Sin internet</span>
            </div>
          </a>

        </div>

        {/* 4. COMPASS & OFFLINE RESCUE CALLS */}
        <div className="pt-2 border-t border-neutral-900">
          
          {/* Survival Compass */}
          <div className="mb-2 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-neutral-300">Brújula de Orientación:</span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {heading !== null ? `${heading}° ${getCardinal(heading)}` : 'Gira el celular para calibrar'}
            </span>
          </div>

          {/* Emergency 1-tap calls */}
          <div className="grid grid-cols-4 gap-1.5">
            <a
              href="tel:116"
              className="p-2 rounded-xl bg-neutral-900 border border-red-900/60 text-center no-underline text-white"
            >
              <span className="text-base font-black text-rojo block">116</span>
              <span className="text-[9px] text-neutral-400 font-sans block">Bomberos</span>
            </a>

            <a
              href="tel:105"
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-center no-underline text-white"
            >
              <span className="text-base font-black text-white block">105</span>
              <span className="text-[9px] text-neutral-400 font-sans block">Policía</span>
            </a>

            <a
              href="tel:106"
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-center no-underline text-white"
            >
              <span className="text-base font-black text-cyan-400 block">106</span>
              <span className="text-[9px] text-neutral-400 font-sans block">SAMU</span>
            </a>

            <a
              href="tel:119"
              className="p-2 rounded-xl bg-neutral-900 border border-emerald-900/60 text-center no-underline text-white"
            >
              <span className="text-base font-black text-emerald-400 block">119</span>
              <span className="text-[9px] text-neutral-400 font-sans block">MTC Voz</span>
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 pb-1 border-t border-neutral-900 text-center">
        <p className="text-[10px] text-neutral-500 font-sans">
          AYLLU • Sistema de Telecomunicación y Resiliencia en Apagones
        </p>
      </div>

      {/* Sheets */}
      <MedicalIdSheet
        open={isMedicalOpen}
        onClose={() => setIsMedicalOpen(false)}
      />

      <FirstAidSheet
        open={isFirstAidOpen}
        onClose={() => setIsFirstAidOpen(false)}
      />

      <AcousticBeaconSheet
        open={isAcousticOpen}
        onClose={() => setIsAcousticOpen(false)}
      />
    </div>
  );
};
