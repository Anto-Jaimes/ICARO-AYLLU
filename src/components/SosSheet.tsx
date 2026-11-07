import React, { useEffect, useState } from 'react';
import { 
  BellRing, 
  Camera, 
  ChevronRight, 
  HandHeart, 
  Phone, 
  Siren, 
  Square, 
  Volume2, 
  MessageSquare, 
  HeartPulse, 
  ShieldCheck, 
  Radio
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { HELP_REQUEST_PRESET } from '../data/categories';
import { communitySiren } from '../utils/audioAlarm';
import { BottomSheet } from './BottomSheet';
import { MedicalIdSheet } from './MedicalIdSheet';
import { SafetyCheckinSheet } from './SafetyCheckinSheet';
import { EmergencyBackpackSheet } from './EmergencyBackpackSheet';
import { FirstAidSheet } from './FirstAidSheet';

const EMERGENCY_NUMBERS = [
  { label: 'Policía', number: '105' },
  { label: 'Bomberos', number: '116' },
  { label: 'Ambulancia', number: '106' },
  { label: 'Defensa Civil', number: '115' }
];

export const SosSheet: React.FC = () => {
  const { isSosOpen, setIsSosOpen, mode, setMode, openPublish, openReport, userLocation, setIsBatterySaver } = useApp();
  const isEmergency = mode === 'emergency';
  const [isAlarmOpen, setIsAlarmOpen] = useState(false);
  const [isSounding, setIsSounding] = useState(false);
  const [isMedicalOpen, setIsMedicalOpen] = useState(false);
  const [isFirstAidOpen, setIsFirstAidOpen] = useState(false);
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [isBackpackOpen, setIsBackpackOpen] = useState(false);

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

  // SMS SOS with GPS coordinates for extreme offline situations
  const smsBody = encodeURIComponent(
    `S.O.S. AUXILIO URGENTE. Mi ubicacion aproximada es: ${userLocation.name} (Lat: ${userLocation.lat.toFixed(4)}, Lng: ${userLocation.lng.toFixed(4)}). Por favor envien ayuda.`
  );
  const smsUrl = `sms:?body=${smsBody}`;

  return (
    <>
      <BottomSheet open={isSosOpen} onClose={close} title="SOS Emergencia">
        <div style={{ paddingBottom: 'calc(16px + var(--safe-bottom))' }}>
          <p className="px-4 pb-2 text-secondary text-ink-2">
            Llama o envía mensaje de auxilio aunque no tengas internet ni saldo.
          </p>

          {/* Emergency Direct Numbers Grid */}
          <ul className="grid grid-cols-2 gap-2 px-4">
            {EMERGENCY_NUMBERS.map(({ label, number }) => (
              <li key={number}>
                <a
                  href={`tel:${number}`}
                  className="flex items-center gap-3 min-h-[64px] px-3 rounded-lg bg-rojo active:bg-rojo-press text-white no-underline"
                >
                  <Phone className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-section font-bold">{number}</span>
                    <span className="block text-secondary truncate">{label}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>

          {/* Servicio Oficial 119 MTC Perú (Mensajes de voz sin internet ni saldo) */}
          <div className="mx-4 mt-2 p-3 bg-red-50 rounded-xl border border-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-rojo shrink-0" />
                <span className="text-secondary font-bold text-rojo">Línea 119 (MTC Perú)</span>
              </div>
              <a
                href="tel:119"
                className="px-2.5 py-1 bg-rojo text-white text-[11px] font-bold rounded-md no-underline"
              >
                Marcar 119
              </a>
            </div>
            <p className="text-[11px] text-ink-2 mt-1">
              Servicio de voz gratuito cuando las redes colapsan. Graba un mensaje para familiares o escucha si te dejaron uno.
            </p>
          </div>

          {/* Action List */}
          <ul className="list-plain mt-3">
            {/* SMS with GPS Coordinates (Extreme offline protocol) */}
            <li>
              <a href={smsUrl} className="row no-underline" onClick={close}>
                <MessageSquare className="w-6 h-6 shrink-0 text-rojo" aria-hidden="true" />
                <span className="flex-1">
                  <span className="block text-row font-semibold">SMS de socorro con GPS</span>
                  <span className="block text-secondary text-ink-2">Envía tus coordenadas por texto sin internet</span>
                </span>
                <ChevronRight className="w-5 h-5 text-ink-2" aria-hidden="true" />
              </a>
            </li>

            {/* Medical ID ICE */}
            <li>
              <button
                type="button"
                className="row"
                onClick={() => {
                  close();
                  setIsMedicalOpen(true);
                }}
              >
                <HeartPulse className="w-6 h-6 shrink-0 text-rojo" aria-hidden="true" />
                <span className="flex-1">
                  <span className="block text-row font-semibold">Ficha médica de emergencia (ICE)</span>
                  <span className="block text-secondary text-ink-2">Grupo sanguíneo, alergias y contacto familiar</span>
                </span>
                <ChevronRight className="w-5 h-5 text-ink-2" aria-hidden="true" />
              </button>
            </li>

            {/* First Aid Survival Guide */}
            <li>
              <button
                type="button"
                className="row"
                onClick={() => {
                  close();
                  setIsFirstAidOpen(true);
                }}
              >
                <ShieldCheck className="w-6 h-6 shrink-0 text-rojo" aria-hidden="true" />
                <span className="flex-1">
                  <span className="block text-row font-semibold">Primeros auxilios offline</span>
                  <span className="block text-secondary text-ink-2">Guía paso a paso para salvar vidas</span>
                </span>
                <ChevronRight className="w-5 h-5 text-ink-2" aria-hidden="true" />
              </button>
            </li>

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
                <span className="flex-1 text-row font-semibold">Hacer sonar la alarma de rescate</span>
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

      {/* Alarm Sheet */}
      <BottomSheet open={isAlarmOpen} onClose={closeAlarm} title="Alarma de Rescate">
        <div className="px-4" style={{ paddingBottom: 'calc(24px + var(--safe-bottom))' }}>
          <p className="pb-4 text-secondary text-ink-2">
            Emite una sirena estridente por el altavoz del celular para que los rescatistas y vecinos te encuentren en la oscuridad o bajo escombros.
          </p>
          <button
            type="button"
            className={`btn ${isSounding ? 'btn-secondary' : 'btn-danger'} min-h-24`}
            onClick={toggleSiren}
          >
            {isSounding ? <Square className="w-6 h-6" aria-hidden="true" /> : <Volume2 className="w-6 h-6" aria-hidden="true" />}
            {isSounding ? 'Detener sirena' : 'Hacer sonar sirena'}
          </button>
        </div>
      </BottomSheet>

      {/* Medical ID Sheet */}
      <MedicalIdSheet
        open={isMedicalOpen}
        onClose={() => setIsMedicalOpen(false)}
      />

      {/* First Aid Sheet */}
      <FirstAidSheet
        open={isFirstAidOpen}
        onClose={() => setIsFirstAidOpen(false)}
      />

      {/* Safety Checkin Sheet */}
      <SafetyCheckinSheet
        open={isCheckinOpen}
        onClose={() => setIsCheckinOpen(false)}
      />

      {/* Emergency Backpack Sheet */}
      <EmergencyBackpackSheet
        open={isBackpackOpen}
        onClose={() => setIsBackpackOpen(false)}
      />
    </>
  );
};
