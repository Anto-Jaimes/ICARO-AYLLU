import React, { useEffect, useState } from 'react';
import { Battery, BatteryCharging, BatteryLow, HeartPulse, MessageSquare, Radio, Sun, Volume2, VolumeX } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MedicalIdSheet } from '../components/MedicalIdSheet';
import { useBackHandler } from '../hooks/useBackHandler';
import { communitySiren } from '../utils/audioAlarm';
import { SOS_OPENING, smsLink } from '../utils/sosMessage';

interface BatterySaverScreenProps {
  onExit: () => void;
}

interface BatteryInfo {
  level: number;
  charging: boolean;
  addEventListener: (event: string, listener: () => void) => void;
  removeEventListener: (event: string, listener: () => void) => void;
}

const CALLS = [
  { number: '116', label: 'Bomberos' },
  { number: '105', label: 'Policía' },
  { number: '106', label: 'Ambulancia' }
];

const TILE = 'min-h-24 p-3 rounded-lg bg-neutral-900 border border-neutral-700 flex flex-col justify-between gap-2 text-left text-white no-underline active:bg-neutral-800';

/** A black screen with only what matters during a blackout: on most phones black pixels use less battery. */
export const BatterySaverScreen: React.FC<BatterySaverScreenProps> = ({ onExit }) => {
  const { userLocation, hasLocation } = useApp();
  const [battery, setBattery] = useState<{ level: number; charging: boolean } | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isSounding, setIsSounding] = useState(false);
  const [isMedicalOpen, setIsMedicalOpen] = useState(false);

  useBackHandler(true, onExit);
  useBackHandler(isTorchOn, () => setIsTorchOn(false));

  useEffect(() => {
    let source: BatteryInfo | null = null;
    const update = () => source && setBattery({ level: Math.round(source.level * 100), charging: source.charging });
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryInfo> };

    nav.getBattery?.().then((info) => {
      source = info;
      update();
      info.addEventListener('levelchange', update);
      info.addEventListener('chargingchange', update);
    }).catch(() => setBattery(null));

    return () => {
      source?.removeEventListener('levelchange', update);
      source?.removeEventListener('chargingchange', update);
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

  if (isTorchOn) {
    return (
      <button
        type="button"
        onClick={() => setIsTorchOn(false)}
        className="fixed inset-0 z-50 w-full bg-white text-black flex flex-col items-center justify-center gap-3"
      >
        <Sun className="w-16 h-16" aria-hidden="true" />
        <span className="text-row font-bold">Toca para apagar la linterna</span>
      </button>
    );
  }

  const BatteryIcon = battery?.charging ? BatteryCharging : battery && battery.level < 20 ? BatteryLow : Battery;

  return (
    <div className="min-h-dvh bg-black text-white px-4 flex flex-col gap-4" style={{ paddingTop: 'calc(12px + var(--safe-top))', paddingBottom: 'calc(16px + var(--safe-bottom))' }}>
      <header className="flex items-center gap-3">
        <h1 className="flex-1 text-title font-bold">Modo apagón</h1>
        <button type="button" onClick={onExit} className="min-h-12 px-4 rounded-lg border border-neutral-600 text-secondary font-bold">
          Salir
        </button>
      </header>

      <div className="flex items-center gap-3 p-3 rounded-lg border border-neutral-800">
        <BatteryIcon className={`w-7 h-7 shrink-0 ${battery && battery.level < 20 && !battery.charging ? 'text-rojo' : 'text-amarillo'}`} aria-hidden="true" />
        <p className="text-secondary">
          {battery ? `Batería: ${battery.level}%${battery.charging ? ', cargando' : ''}. ` : ''}
          La pantalla negra gasta menos batería en la mayoría de celulares.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => setIsTorchOn(true)} className={TILE}>
          <Sun className="w-7 h-7 text-amarillo" aria-hidden="true" />
          <span className="text-row font-bold">Linterna</span>
        </button>
        <button type="button" onClick={toggleSiren} aria-pressed={isSounding} className={`${TILE} ${isSounding ? 'bg-rojo border-rojo' : ''}`}>
          {isSounding ? <VolumeX className="w-7 h-7" aria-hidden="true" /> : <Volume2 className="w-7 h-7 text-rojo" aria-hidden="true" />}
          <span className="text-row font-bold">{isSounding ? 'Detener alarma' : 'Alarma'}</span>
        </button>
        <a href={smsLink(SOS_OPENING, userLocation, hasLocation)} className={TILE}>
          <MessageSquare className="w-7 h-7 text-link-on-ink" aria-hidden="true" />
          <span className="text-row font-bold">SMS de socorro</span>
        </a>
        <button type="button" onClick={() => setIsMedicalOpen(true)} className={TILE}>
          <HeartPulse className="w-7 h-7 text-rojo" aria-hidden="true" />
          <span className="text-row font-bold">Ficha médica</span>
        </button>
      </div>

      <section>
        <h2 className="pb-2 text-secondary font-bold text-neutral-300">Llamadas sin saldo</h2>
        <div className="grid grid-cols-3 gap-2">
          {CALLS.map(({ number, label }) => (
            <a key={number} href={`tel:${number}`} className="min-h-16 p-2 rounded-lg border border-neutral-700 text-center text-white no-underline">
              <span className="block text-section font-bold">{number}</span>
              <span className="block text-meta text-neutral-300">{label}</span>
            </a>
          ))}
        </div>
        <a href="tel:119" className="mt-2 flex items-center gap-3 min-h-14 px-3 rounded-lg border border-neutral-700 text-white no-underline">
          <Radio className="w-6 h-6 shrink-0" aria-hidden="true" />
          <span className="text-secondary font-bold">119: dejar o escuchar un mensaje de voz</span>
        </a>
      </section>

      <MedicalIdSheet open={isMedicalOpen} onClose={() => setIsMedicalOpen(false)} />
    </div>
  );
};
