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

/** The part of the browser's Battery Status API used here (not in TypeScript's own types). */
interface BatteryInfo extends EventTarget {
  level: number;
  charging: boolean;
}

export const BatterySaverScreen: React.FC<BatterySaverScreenProps> = ({ onExit }) => {
  const { userLocation } = useApp();
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [hoursLeft, setHoursLeft] = useState<number | null>(null);

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
  const [isCompassOn, setIsCompassOn] = useState(false);
  const [hasCompass, setHasCompass] = useState(true);

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

  // Battery level, and how many hours are left at the pace this phone is really spending while this
  // screen is open. No formula: a made-up figure could make someone plan their night around it.
  useEffect(() => {
    let battery: BatteryInfo | null = null;
    let start: { level: number; at: number } | null = null;
    const levelNow = () => Math.round((battery?.level ?? 0) * 100);
    const restart = () => {
      start = { level: levelNow(), at: Date.now() };
      setHoursLeft(null);
    };
    const onLevelChange = () => {
      const level = levelNow();
      setBatteryLevel(level);
      if (!start || battery?.charging) return;
      const spent = start.level - level;
      const hours = (Date.now() - start.at) / 3_600_000;
      // At least 2 points spent, so one rounding of the level does not decide the estimate.
      if (spent >= 2 && hours > 0) setHoursLeft(Math.round(level / (spent / hours)));
    };
    const onChargingChange = () => {
      setIsCharging(Boolean(battery?.charging));
      restart();
    };

    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryInfo> };
    nav.getBattery?.()
      .then((found) => {
        battery = found;
        setBatteryLevel(levelNow());
        setIsCharging(found.charging);
        restart();
        found.addEventListener('levelchange', onLevelChange);
        found.addEventListener('chargingchange', onChargingChange);
      })
      .catch(() => setBatteryLevel(null));

    return () => {
      battery?.removeEventListener('levelchange', onLevelChange);
      battery?.removeEventListener('chargingchange', onChargingChange);
      communitySiren.stopSiren();
      stopWhistle();
      stopHardwareTorch();
    };
  }, []);

  // The compass works only on request and for 30 s: the sensor spends battery, and every reading
  // redraws the screen. Android gives true north only through "deviceorientationabsolute"; the plain
  // event is relative to how the phone was held, so it could point to a wrong "north".
  useEffect(() => {
    if (!isCompassOn) return;
    let hasReading = false;
    const show = (degrees: number) => {
      hasReading = true;
      setHeading((Math.round(degrees / 5) * 5) % 360);
    };
    const onAbsolute = (event: Event) => {
      const { alpha } = event as DeviceOrientationEvent;
      if (alpha !== null) show(360 - alpha);
    };
    const onApple = (event: Event) => {
      const value = (event as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading;
      if (typeof value === 'number') show(value);
    };
    window.addEventListener('deviceorientationabsolute', onAbsolute);
    window.addEventListener('deviceorientation', onApple);
    const noSensor = window.setTimeout(() => {
      if (hasReading) return;
      setHasCompass(false);
      setIsCompassOn(false);
    }, 3000);
    const turnOff = window.setTimeout(() => setIsCompassOn(false), 30000);
    return () => {
      window.removeEventListener('deviceorientationabsolute', onAbsolute);
      window.removeEventListener('deviceorientation', onApple);
      window.clearTimeout(noSensor);
      window.clearTimeout(turnOff);
    };
  }, [isCompassOn]);

  const toggleCompass = () => {
    setHeading(null);
    setHasCompass(true);
    setIsCompassOn((on) => !on);
  };

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
          // One audio engine for the whole night: a new one every 12 s piled up and was never closed.
          whistleCtxRef.current ??= new (window.AudioContext || (window as any).webkitAudioContext)();
          const ctx = whistleCtxRef.current;
          if (ctx.state === 'suspended') ctx.resume().catch(() => {});

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

  const isLow = batteryLevel !== null && batteryLevel < 20;

  const getCardinal = (deg: number): string => {
    const directions = ['N (Norte)', 'NE (Noreste)', 'E (Este)', 'SE (Sureste)', 'S (Sur)', 'SO (Suroeste)', 'O (Oeste)', 'NO (Noroeste)'];
    return directions[Math.round(deg / 45) % 8];
  };

  // SMS SOS coordinates
  const smsBody = encodeURIComponent(
    `S.O.S. AUXILIO URGENTE.${batteryLevel !== null ? ` Bateria: ${batteryLevel}%.` : ''} Mi ubicacion es: ${userLocation.name} (Lat: ${userLocation.lat.toFixed(4)}, Lng: ${userLocation.lng.toFixed(4)}).${medicalProfile?.bloodType ? ` Sangre: ${medicalProfile.bloodType}.` : ''}`
  );
  const smsUrl = `sms:?body=${smsBody}`;

  // Fallback White screen flashlight
  if (torchMode === 'screen') {
    return (
      <div
        onClick={() => setTorchMode('off')}
        className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-between p-6 cursor-pointer"
      >
        <span className="text-black font-black text-meta uppercase tracking-widest bg-black/10 px-3 py-1 rounded-full">
          Linterna Pantalla Máxima (Toca para apagar)
        </span>
        <div className="text-center">
          <Sun className="w-16 h-16 text-black/80 mx-auto" />
          <p className="text-black font-black text-secondary mt-3">Toca cualquier parte para volver al Modo Negro OLED</p>
        </div>
        <span className="text-black/50 text-meta">AYLLU • Modo Supervivencia</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 font-mono select-none flex flex-col justify-between">
      {/* 1. TOP HEADER & BATTERY ESTIMATE BANNER */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
            <h1 className="text-meta font-black tracking-wider text-emerald-400 uppercase">
              Modo apagón
            </h1>
          </div>

          <button
            type="button"
            onClick={onExit}
            className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-meta font-bold text-neutral-300 hover:text-white cursor-pointer active:scale-95"
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
                  <BatteryCharging className="w-6 h-6 text-emerald-400" />
                ) : isLow ? (
                  <BatteryLow className="w-6 h-6 text-rojo" />
                ) : (
                  <Battery className="w-6 h-6 text-amber-400" />
                )}
              </div>
              <div>
                <span className="text-2xl font-black block leading-none">
                  {batteryLevel !== null ? `${batteryLevel}%` : 'Sin dato'}
                </span>
                <span className="text-meta text-neutral-400 font-sans">
                  {isCharging ? 'Cargando' : batteryLevel !== null ? 'de batería' : 'Este celular no informa su batería'}
                </span>
              </div>
            </div>

            {batteryLevel !== null && !isCharging && (
              <div className="text-right">
                <span className="text-meta text-emerald-400 font-bold block">Te queda</span>
                <span className="text-xl font-black text-emerald-400 block font-mono">
                  {hoursLeft !== null ? `~${hoursLeft} h` : 'Midiendo...'}
                </span>
                <span className="text-meta text-neutral-500 block">
                  {hoursLeft !== null ? 'a tu ritmo de ahora' : 'con tu consumo real'}
                </span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-neutral-900 flex items-center gap-1 text-meta font-sans text-neutral-400">
            <Zap className="w-3.5 h-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
            Baja el brillo y apaga datos, wifi y Bluetooth si no los usas.
          </div>
        </div>

        {/* 2. ALWAYS-ON MEDICAL & LOCATION IDENTITY CARD */}
        <div className="mb-3 p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-meta font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <HeartPulse className="w-3.5 h-3.5 text-rojo" /> Ficha de Identidad & Ubicación (Siempre Visible)
            </span>
            <button
              type="button"
              onClick={() => setIsMedicalOpen(true)}
              className="text-meta text-cyan-400 font-bold hover:underline"
            >
              Editar ICE
            </button>
          </div>

          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-secondary font-bold text-white">
                {medicalProfile?.fullName || 'Sin nombre en tu ficha'}
              </div>
              <div className="text-meta text-neutral-400 mt-0.5">
                {/* "None registered" could be read by a rescuer as "no allergies": it says it was not filled in. */}
                Alergias: <strong className="text-neutral-200">{medicalProfile?.allergies || 'sin registrar'}</strong>
              </div>
              {medicalProfile?.conditions && (
                <div className="text-meta text-neutral-400">
                  Condición: <strong className="text-amber-300">{medicalProfile.conditions}</strong>
                </div>
              )}
            </div>

            <div className="text-right shrink-0">
              {/* Never a made-up blood type: a rescuer could act on it. */}
              {medicalProfile?.bloodType ? (
                <span className="px-2 py-0.5 bg-red-950 text-red-400 border border-red-800 rounded font-black text-meta inline-block mb-1">
                  {medicalProfile.bloodType}
                </span>
              ) : (
                <span className="text-meta text-neutral-400 inline-block mb-1">Sin tipo de sangre</span>
              )}
              <div className="text-meta text-neutral-400 font-mono">
                {medicalProfile?.emergencyContactPhone || 'Sin contacto'}
              </div>
            </div>
          </div>

          {/* Location and GPS */}
          <div className="mt-2 pt-2 border-t border-neutral-900 flex items-center justify-between text-meta font-sans text-neutral-400">
            <span className="flex items-center gap-1 truncate max-w-[200px]">
              <MapPin className="w-3.5 h-3.5 text-rojo shrink-0" />
              {userLocation.name}
            </span>
            <span className="font-mono text-neutral-300 text-meta shrink-0">
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
              <span className="text-meta uppercase px-1.5 py-0.5 rounded bg-black/30 font-bold">
                {torchMode === 'hardware' ? 'ENCENDIDA' : 'LED TRASERO'}
              </span>
            </div>
            <div>
              <span className="font-bold text-meta block leading-tight">Linterna Flash LED</span>
              <span className={`text-meta ${torchMode === 'hardware' ? 'text-black/80' : 'text-neutral-400'}`}>
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
                ? 'bg-red-600 text-white border-red-400 font-bold'
                : 'bg-neutral-900 border-neutral-800 text-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <Sun className={`w-5 h-5 ${torchMode === 'morse' ? 'text-white' : 'text-rojo'}`} />
              <span className="text-meta uppercase px-1.5 py-0.5 rounded bg-black/30 font-bold">
                {torchMode === 'morse' ? 'PARPADEANDO' : 'MORSE'}
              </span>
            </div>
            <div>
              <span className="font-bold text-meta block leading-tight">Luz S.O.S. Morse</span>
              <span className={`text-meta ${torchMode === 'morse' ? 'text-white/80' : 'text-neutral-400'}`}>
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
                ? 'bg-emerald-600 text-white border-emerald-400'
                : 'bg-neutral-900 border-neutral-800 text-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <Volume2 className={`w-5 h-5 ${isWhistleActive ? 'text-white' : 'text-emerald-400'}`} />
              <span className="text-meta uppercase px-1.5 py-0.5 rounded bg-black/30 font-bold">
                {isWhistleActive ? 'ACTIVO' : 'BAJO GASTO'}
              </span>
            </div>
            <div>
              <span className="font-bold text-meta block leading-tight">Silbato Cada 12s</span>
              <span className={`text-meta ${isWhistleActive ? 'text-white/80' : 'text-neutral-400'}`}>
                Suena 1 segundo de cada 12
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
              <span className="text-meta uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                P2P SONIDO
              </span>
            </div>
            <div>
              <span className="font-bold text-meta block leading-tight">Baliza Acústica</span>
              <span className="text-meta text-neutral-400">Emite socorro por ondas</span>
            </div>
          </button>

          {/* Continuous Siren */}
          <button
            type="button"
            onClick={toggleSiren}
            className={`min-h-[70px] p-3 rounded-2xl border flex flex-col justify-between text-left transition cursor-pointer ${
              isSounding
                ? 'bg-rojo border-red-500 text-white'
                : 'bg-neutral-900 border-neutral-800 text-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              {isSounding ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-rojo" />}
              <span className="text-meta uppercase px-1.5 py-0.5 rounded bg-black/30 font-bold">
                {isSounding ? 'SONANDO' : 'ESTRUENDO'}
              </span>
            </div>
            <div>
              <span className="font-bold text-meta block leading-tight">Sirena Continua</span>
              <span className="text-meta text-neutral-400">
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
              <span className="text-meta uppercase px-1.5 py-0.5 rounded bg-black/30 font-bold">
                2G SMS
              </span>
            </div>
            <div>
              <span className="font-bold text-meta block leading-tight">SMS con GPS</span>
              <span className="text-meta text-neutral-400">Sin internet</span>
            </div>
          </a>

        </div>

        {/* 4. COMPASS & OFFLINE RESCUE CALLS */}
        <div className="pt-2 border-t border-neutral-900">
          
          {/* Survival Compass */}
          <button
            type="button"
            onClick={toggleCompass}
            className="mb-2 w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-left"
          >
            <span className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <span className="text-meta font-bold text-neutral-300">Brújula</span>
            </span>
            <span className="text-meta font-mono font-bold text-emerald-400">
              {!hasCompass
                ? 'Este celular no tiene brújula'
                : !isCompassOn
                  ? 'Toca para ver el norte'
                  : heading === null
                    ? 'Buscando el norte...'
                    : `${heading}° ${getCardinal(heading)}`}
            </span>
          </button>

          {/* Emergency 1-tap calls */}
          <div className="grid grid-cols-4 gap-1.5">
            <a
              href="tel:116"
              className="p-2 rounded-xl bg-neutral-900 border border-red-900/60 text-center no-underline text-white"
            >
              <span className="text-base font-black text-rojo block">116</span>
              <span className="text-meta text-neutral-400 font-sans block">Bomberos</span>
            </a>

            <a
              href="tel:105"
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-center no-underline text-white"
            >
              <span className="text-base font-black text-white block">105</span>
              <span className="text-meta text-neutral-400 font-sans block">Policía</span>
            </a>

            <a
              href="tel:106"
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-center no-underline text-white"
            >
              <span className="text-base font-black text-cyan-400 block">106</span>
              <span className="text-meta text-neutral-400 font-sans block">SAMU</span>
            </a>

            <a
              href="tel:119"
              className="p-2 rounded-xl bg-neutral-900 border border-emerald-900/60 text-center no-underline text-white"
            >
              <span className="text-base font-black text-emerald-400 block">119</span>
              <span className="text-meta text-neutral-400 font-sans block">MTC Voz</span>
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 pb-1 border-t border-neutral-900 text-center">
        <p className="text-meta text-neutral-500 font-sans">
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
