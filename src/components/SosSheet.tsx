import React, { useEffect, useState } from 'react';
import { BellRing, Camera, ChevronRight, HandHeart, Phone, Siren, Square, Volume2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { HELP_REQUEST_PRESET } from '../data/categories';
import { communitySiren } from '../utils/audioAlarm';
import { BottomSheet } from './BottomSheet';

const EMERGENCY_NUMBERS = [
  { label: 'Policía', number: '105' },
  { label: 'Bomberos', number: '116' },
  { label: 'Ambulancia', number: '106' },
  { label: 'Defensa Civil', number: '115' }
];

export const SosSheet: React.FC = () => {
  const { isSosOpen, setIsSosOpen, mode, setMode, openPublish, openReport } = useApp();
  const isEmergency = mode === 'emergency';
  const [isAlarmOpen, setIsAlarmOpen] = useState(false);
  const [isSounding, setIsSounding] = useState(false);

  const close = () => setIsSosOpen(false);

  const closeAlarm = () => {
    communitySiren.stopSiren();
    setIsSounding(false);
    setIsAlarmOpen(false);
  };

  const toggleSiren = () => {
    if (isSounding) {
      communitySiren.stopSiren();
      setIsSounding(false);
    } else if (communitySiren.startSiren()) {
      setIsSounding(true);
    }
  };

  useEffect(() => () => communitySiren.stopSiren(), []);

  return (
    <>
      <BottomSheet open={isSosOpen} onClose={close} title="SOS">
        <div style={{ paddingBottom: 'calc(16px + var(--safe-bottom))' }}>
          <p className="px-4 pb-2 text-secondary text-ink-2">Llama aunque no tengas internet.</p>

          <ul className="grid grid-cols-2 gap-2 px-4">
            {EMERGENCY_NUMBERS.map(({ label, number }) => (
              <li key={number}>
                <a
                  href={`tel:${number}`}
                  className="flex items-center gap-3 min-h-[72px] px-3 rounded-lg bg-rojo active:bg-rojo-press text-white no-underline"
                >
                  <Phone className="w-6 h-6 shrink-0" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-section font-bold">{number}</span>
                    <span className="block text-secondary truncate">{label}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <ul className="list-plain mt-3">
            <li>
              <button
                type="button"
                className="row"
                onClick={() => {
                  close();
                  openPublish(HELP_REQUEST_PRESET);
                }}
              >
                <HandHeart className="w-6 h-6 shrink-0 text-rojo" aria-hidden="true" />
                <span className="flex-1 text-row font-semibold">Pedir ayuda a vecinos</span>
                <ChevronRight className="w-5 h-5 text-ink-2" aria-hidden="true" />
              </button>
            </li>
            <li>
              <button
                type="button"
                className="row"
                onClick={() => {
                  close();
                  openReport('otro');
                }}
              >
                <Camera className="w-6 h-6 shrink-0 text-rojo" aria-hidden="true" />
                <span className="flex-1 text-row font-semibold">Avisar con foto o video</span>
                <ChevronRight className="w-5 h-5 text-ink-2" aria-hidden="true" />
              </button>
            </li>
            <li>
              <button
                type="button"
                className="row"
                onClick={() => {
                  close();
                  setIsAlarmOpen(true);
                }}
              >
                <BellRing className="w-6 h-6 shrink-0 text-rojo" aria-hidden="true" />
                <span className="flex-1 text-row font-semibold">Hacer sonar la alarma</span>
                <ChevronRight className="w-5 h-5 text-ink-2" aria-hidden="true" />
              </button>
            </li>
            {!isEmergency && (
              <li>
                <button
                  type="button"
                  className="row"
                  onClick={() => {
                    close();
                    setMode('emergency');
                  }}
                >
                  <Siren className="w-6 h-6 shrink-0 text-rojo" aria-hidden="true" />
                  <span className="flex-1">
                    <span className="block text-row font-semibold">Activar modo emergencia</span>
                    <span className="block text-secondary text-ink-2">Coordina ayuda con tus vecinos</span>
                  </span>
                  <ChevronRight className="w-5 h-5 text-ink-2" aria-hidden="true" />
                </button>
              </li>
            )}
          </ul>
        </div>
      </BottomSheet>

      <BottomSheet open={isAlarmOpen} onClose={closeAlarm} title="Alarma">
        <div className="px-4" style={{ paddingBottom: 'calc(24px + var(--safe-bottom))' }}>
          <p className="pb-4 text-secondary text-ink-2">
            Suena fuerte para que tus vecinos te encuentren. Úsala solo en una emergencia real.
          </p>
          <button type="button" className={`btn ${isSounding ? 'btn-secondary' : 'btn-danger'} min-h-24`} onClick={toggleSiren}>
            {isSounding ? <Square className="w-6 h-6" aria-hidden="true" /> : <Volume2 className="w-6 h-6" aria-hidden="true" />}
            {isSounding ? 'Detener alarma' : 'Hacer sonar'}
          </button>
        </div>
      </BottomSheet>
    </>
  );
};
