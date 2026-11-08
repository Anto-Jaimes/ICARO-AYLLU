import React, { useEffect, useState } from 'react';
import {
  Activity,
  BellRing,
  Camera,
  ChevronRight,
  HandHeart,
  HeartPulse,
  MessageSquare,
  Phone,
  PhoneCall,
  Radio,
  ShieldPlus,
  Siren,
  Square,
  Volume2,
  Waves,
  type LucideIcon
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n/LanguageContext';
import { HELP_REQUEST_PRESET } from '../data/categories';
import { communitySiren } from '../utils/audioAlarm';
import { AcousticBeaconSheet } from './AcousticBeaconSheet';
import { BottomSheet } from './BottomSheet';
import { FirstAidSheet } from './FirstAidSheet';
import { FreeCallSheet } from './FreeCallSheet';
import { MedicalIdSheet } from './MedicalIdSheet';
import { NearbyHelp } from './NearbyHelp';
import { SafetyCheckinSheet } from './SafetyCheckinSheet';
import { RubbleRescueSheet } from './RubbleRescueSheet';

const EMERGENCY_NUMBERS = [
  { label: 'Policía', number: '105' },
  { label: 'Bomberos', number: '116' },
  { label: 'Ambulancia', number: '106' },
  { label: 'Defensa Civil', number: '115' }
];

type Panel = 'alarm' | 'family' | 'medical' | 'firstAid' | 'freeCall' | 'acoustic' | 'rubble' | null;

const ActionRow: React.FC<{ icon: LucideIcon; title: string; line?: string; onClick: () => void }> = ({ icon: Icon, title, line, onClick }) => {
  const t = useT();
  return (
  <li>
    <button type="button" className="row" onClick={onClick}>
      <Icon className="w-6 h-6 shrink-0 text-rojo" aria-hidden="true" />
      <span className="flex-1">
        <span className="block text-row font-semibold">{t(title)}</span>
        {line && <span className="block text-secondary text-ink-2">{t(line)}</span>}
      </span>
      <ChevronRight className="w-5 h-5 text-ink-2" aria-hidden="true" />
    </button>
  </li>
  );
};

export const SosSheet: React.FC = () => {
  const { isSosOpen, setIsSosOpen, mode, setMode, openPublish, openReport } = useApp();
  const t = useT();
  const isEmergency = mode === 'emergency';
  const [panel, setPanel] = useState<Panel>(null);
  const [isSounding, setIsSounding] = useState(false);

  const close = () => setIsSosOpen(false);
  const openPanel = (next: Panel) => {
    close();
    setPanel(next);
  };

  const closeAlarm = () => {
    communitySiren.stopSiren();
    setIsSounding(false);
    setPanel(null);
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
          <p className="px-4 pb-2 text-secondary text-ink-2">{t('Estos números no necesitan saldo ni internet.')}</p>

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
                    <span className="block text-secondary truncate">{t(label)}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <NearbyHelp isVisible={isSosOpen} />

          <ul className="list-plain mt-3">
            <li>
              <a href="tel:119" className="row no-underline">
                <Radio className="w-6 h-6 shrink-0 text-rojo" aria-hidden="true" />
                <span className="flex-1">
                  <span className="block text-row font-semibold">{t('Línea 119: mensajes de voz')}</span>
                  <span className="block text-secondary text-ink-2">{t('Deja o escucha un mensaje de tu familia cuando las líneas colapsan')}</span>
                </span>
                <ChevronRight className="w-5 h-5 text-ink-2" aria-hidden="true" />
              </a>
            </li>
            <ActionRow icon={PhoneCall} title="Llamada gratis" line="Un minuto al día, sin saldo: primero te llamamos a ti" onClick={() => openPanel('freeCall')} />
            <ActionRow icon={MessageSquare} title="Avisar a mi familia por SMS" line="Estoy a salvo o necesito ayuda, sin internet" onClick={() => openPanel('family')} />
            <ActionRow icon={HandHeart} title="Pedir ayuda a vecinos" onClick={() => { close(); openPublish(HELP_REQUEST_PRESET); }} />
            <ActionRow icon={Camera} title="Avisar con foto o video" onClick={() => { close(); openReport('otro'); }} />
            <ActionRow icon={BellRing} title="Hacer sonar la alarma" line="Para que te encuentren" onClick={() => openPanel('alarm')} />
            <ActionRow icon={Waves} title="Radar por sonido" line="Pide o escucha socorro con el parlante y el micrófono, sin internet" onClick={() => openPanel('acoustic')} />
            <ActionRow icon={Activity} title="Rescate en escombros" line="Geófono de muro y auxilio manos libres por voz" onClick={() => openPanel('rubble')} />
            <ActionRow icon={ShieldPlus} title="Primeros auxilios" line="Pasos sencillos, sin internet" onClick={() => openPanel('firstAid')} />
            <ActionRow icon={HeartPulse} title="Mi ficha médica" line="Tipo de sangre, alergias y a quién llamar" onClick={() => openPanel('medical')} />
            {!isEmergency && (
              <ActionRow icon={Siren} title="Activar modo emergencia" line="Coordina ayuda con tus vecinos" onClick={() => { close(); setMode('emergency'); }} />
            )}
          </ul>
        </div>
      </BottomSheet>

      <BottomSheet open={panel === 'alarm'} onClose={closeAlarm} title="Alarma">
        <div className="px-4" style={{ paddingBottom: 'calc(24px + var(--safe-bottom))' }}>
          <p className="pb-4 text-secondary text-ink-2">
            Suena fuerte para que tus vecinos o los rescatistas te encuentren, incluso de noche o bajo escombros. Úsala solo en una emergencia real.
          </p>
          <button type="button" className={`btn ${isSounding ? 'btn-secondary' : 'btn-danger'} min-h-24`} onClick={toggleSiren}>
            {isSounding ? <Square className="w-6 h-6" aria-hidden="true" /> : <Volume2 className="w-6 h-6" aria-hidden="true" />}
            {isSounding ? 'Detener alarma' : 'Hacer sonar'}
          </button>
        </div>
      </BottomSheet>

      <FreeCallSheet open={panel === 'freeCall'} onClose={() => setPanel(null)} />
      <AcousticBeaconSheet open={panel === 'acoustic'} onClose={() => setPanel(null)} />
      <SafetyCheckinSheet open={panel === 'family'} onClose={() => setPanel(null)} />
      <FirstAidSheet open={panel === 'firstAid'} onClose={() => setPanel(null)} />
      <MedicalIdSheet open={panel === 'medical'} onClose={() => setPanel(null)} />
      <RubbleRescueSheet open={panel === 'rubble'} onClose={() => setPanel(null)} />
    </>
  );
};
