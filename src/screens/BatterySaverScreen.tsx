import React, { useState, useEffect } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { communitySiren } from '../utils/audioAlarm';
import { MedicalIdSheet } from '../components/MedicalIdSheet';
import { FirstAidSheet } from '../components/FirstAidSheet';

interface BatterySaverScreenProps {
  onExit: () => void;
}

export const BatterySaverScreen: React.FC<BatterySaverScreenProps> = ({ onExit }) => {
  const { userLocation } = useApp();
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [isWhiteTorch, setIsWhiteTorch] = useState<boolean>(false);
  const [isSounding, setIsSounding] = useState<boolean>(false);
  const [isMedicalOpen, setIsMedicalOpen] = useState<boolean>(false);
  const [isFirstAidOpen, setIsFirstAidOpen] = useState<boolean>(false);

  // Monitor real battery level via Battery Status API if supported
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

    return () => {
      communitySiren.stopSiren();
    };
  }, []);

  const toggleSiren = () => {
    if (isSounding) {
      communitySiren.stopSiren();
      setIsSounding(false);
    } else if (communitySiren.startSiren()) {
      setIsSounding(true);
    }
  };

  // SMS SOS coordinates
  const smsBody = encodeURIComponent(
    `S.O.S. AUXILIO URGENTE. Bateria critica. Mi ubicacion es: ${userLocation.name} (Lat: ${userLocation.lat.toFixed(4)}, Lng: ${userLocation.lng.toFixed(4)}).`
  );
  const smsUrl = `sms:?body=${smsBody}`;

  // Full white screen flashlight mode
  if (isWhiteTorch) {
    return (
      <div
        onClick={() => setIsWhiteTorch(false)}
        className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-between p-6 cursor-pointer"
      >
        <span className="text-black font-black text-xs uppercase tracking-widest bg-black/10 px-3 py-1 rounded-full">
          Linterna Pantalla Máxima
        </span>
        <div className="text-center">
          <Sun className="w-16 h-16 text-black/80 mx-auto animate-pulse" />
          <p className="text-black font-black text-sm mt-2">Toca cualquier parte para apagar</p>
        </div>
        <span className="text-black/50 text-xs">AYLLU • Modo Supervivencia</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 font-mono select-none flex flex-col justify-between">
      {/* Top Battery Status Bar */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-black tracking-wider text-emerald-400 uppercase">
              MODO BATERÍA CRÍTICA
            </span>
          </div>

          <button
            type="button"
            onClick={onExit}
            className="px-3 py-1 rounded-lg bg-neutral-900 border border-neutral-700 text-xs font-bold text-neutral-300 hover:text-white cursor-pointer"
          >
            Salir del modo
          </button>
        </div>

        {/* Battery Info Banner */}
        <div className="my-4 p-3 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-neutral-900 text-amber-400">
              {isCharging ? (
                <BatteryCharging className="w-6 h-6 text-emerald-400 animate-pulse" />
              ) : (batteryLevel ?? 50) < 20 ? (
                <BatteryLow className="w-6 h-6 text-rojo animate-bounce" />
              ) : (
                <Battery className="w-6 h-6 text-amber-400" />
              )}
            </div>
            <div>
              <span className="text-xl font-black block">
                {batteryLevel !== null ? `${batteryLevel}%` : 'Ahorro Activo'}
              </span>
              <span className="text-[11px] text-neutral-400">
                {isCharging ? 'Cargando dispositivo' : 'Píxeles OLED apagados para durar días'}
              </span>
            </div>
          </div>

          <span className="text-[10px] font-bold uppercase px-2 py-1 bg-neutral-900 text-neutral-400 rounded-md border border-neutral-800">
            AMOLED 0% LUZ
          </span>
        </div>

        {/* Essential Survival Actions Grid */}
        <div className="grid grid-cols-2 gap-2.5 my-3">
          {/* Torch */}
          <button
            type="button"
            onClick={() => setIsWhiteTorch(true)}
            className="min-h-[80px] p-3 rounded-2xl bg-neutral-900 border border-neutral-700 flex flex-col justify-between text-left active:bg-neutral-800 cursor-pointer"
          >
            <Sun className="w-6 h-6 text-amber-400" />
            <div>
              <span className="font-bold text-sm block">Linterna</span>
              <span className="text-[10px] text-neutral-400">Pantalla blanca</span>
            </div>
          </button>

          {/* Siren */}
          <button
            type="button"
            onClick={toggleSiren}
            className={`min-h-[80px] p-3 rounded-2xl border flex flex-col justify-between text-left transition cursor-pointer ${
              isSounding
                ? 'bg-rojo border-red-500 text-white animate-pulse'
                : 'bg-neutral-900 border-neutral-700 text-neutral-200'
            }`}
          >
            {isSounding ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6 text-rojo" />}
            <div>
              <span className="font-bold text-sm block">Sirena SOS</span>
              <span className="text-[10px] text-neutral-400">
                {isSounding ? 'Detener' : 'Altavoz máximo'}
              </span>
            </div>
          </button>

          {/* SMS GPS */}
          <a
            href={smsUrl}
            className="min-h-[80px] p-3 rounded-2xl bg-neutral-900 border border-neutral-700 flex flex-col justify-between text-left no-underline text-white active:bg-neutral-800"
          >
            <MessageSquare className="w-6 h-6 text-cyan-400" />
            <div>
              <span className="font-bold text-sm block">SMS con GPS</span>
              <span className="text-[10px] text-neutral-400">Sin internet 2G</span>
            </div>
          </a>

          {/* Medical ID */}
          <button
            type="button"
            onClick={() => setIsMedicalOpen(true)}
            className="min-h-[80px] p-3 rounded-2xl bg-neutral-900 border border-neutral-700 flex flex-col justify-between text-left active:bg-neutral-800 cursor-pointer"
          >
            <HeartPulse className="w-6 h-6 text-rojo" />
            <div>
              <span className="font-bold text-sm block">Ficha Médica</span>
              <span className="text-[10px] text-neutral-400">ICE sin clave</span>
            </div>
          </button>
        </div>

        {/* 1-Tap Emergency Calling */}
        <div className="mt-4 pt-3 border-t border-neutral-800">
          <span className="text-[11px] font-bold uppercase text-neutral-500 block mb-2 tracking-wider">
            Llamadas Gratuitas de Emergencia (Sin Saldo)
          </span>

          <div className="grid grid-cols-3 gap-2">
            <a
              href="tel:116"
              className="p-3 rounded-xl bg-neutral-900 border border-red-900/60 text-center no-underline text-white"
            >
              <span className="text-lg font-black text-rojo block">116</span>
              <span className="text-[10px] text-neutral-400 font-sans">Bomberos</span>
            </a>

            <a
              href="tel:105"
              className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-center no-underline text-white"
            >
              <span className="text-lg font-black text-white block">105</span>
              <span className="text-[10px] text-neutral-400 font-sans">Policía</span>
            </a>

            <a
              href="tel:106"
              className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-center no-underline text-white"
            >
              <span className="text-lg font-black text-cyan-400 block">106</span>
              <span className="text-[10px] text-neutral-400 font-sans">Ambulancia</span>
            </a>
          </div>

          <div className="mt-2 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-neutral-300">119 Mensajería MTC</span>
            </div>
            <a
              href="tel:119"
              className="px-2.5 py-1 bg-neutral-800 border border-neutral-700 text-xs font-bold rounded text-white no-underline"
            >
              Llamar 119
            </a>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 pb-2 border-t border-neutral-900 text-center">
        <p className="text-[11px] text-neutral-500 font-sans">
          AYLLU • Sistema de Telecomunicación y Resiliencia en Apagones
        </p>
      </div>

      {/* Medical ID Sheet */}
      <MedicalIdSheet
        open={isMedicalOpen}
        onClose={() => setIsMedicalOpen(false)}
      />
    </div>
  );
};
