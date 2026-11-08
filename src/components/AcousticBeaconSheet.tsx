import React, { useEffect, useState } from 'react';
import { MapPin, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Translate, useT } from '../i18n/LanguageContext';
import { tapFeedback } from '../lib/native';
import {
  acousticModem,
  AcousticBeaconPayload,
  AcousticMode,
  BEACON_LABELS,
  BeaconType,
  clearCapturedBeacons,
  getCapturedBeacons,
  saveCapturedBeacon
} from '../utils/acousticP2P';
import { loadContact } from '../utils/storage';
import { BottomSheet } from './BottomSheet';
import { placeLabel } from '../services/geoService';

interface AcousticBeaconSheetProps {
  open: boolean;
  onClose: () => void;
}

const TYPES: BeaconType[] = ['SOS_TRAPPED', 'SOS_MEDICAL', 'RESOURCE_WATER', 'RESOURCE_FIRSTAID', 'CHECKIN_SAFE'];

// The default name a beacon carries when the sender wrote none; shown in the reader's language.
const DEFAULT_SENDER = 'Vecino';

const timeAgo = (timestamp: number, t: Translate) => {
  const minutes = Math.round((Date.now() - timestamp) / 60_000);
  return minutes < 1
    ? t('hace un momento')
    : minutes < 60
      ? t('hace {minutes} min', { minutes })
      : t('hace {hours} h', { hours: Math.round(minutes / 60) });
};

/** Sends or hears a help request through the speaker and microphone, with no network at all. */
export const AcousticBeaconSheet: React.FC<AcousticBeaconSheetProps> = ({ open, onClose }) => {
  const { userLocation, hasLocation } = useApp();
  const t = useT();
  const senderName = (name: string) => (name === DEFAULT_SENDER ? t(DEFAULT_SENDER) : name);
  const [tab, setTab] = useState<'send' | 'listen'>('send');
  const [type, setType] = useState<BeaconType>('SOS_TRAPPED');
  const [sender, setSender] = useState(() => loadContact().name ?? '');
  const [details, setDetails] = useState('');
  const [mode, setMode] = useState<AcousticMode>('audible');
  const [isSending, setIsSending] = useState(false);
  const [timesSent, setTimesSent] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [micProblem, setMicProblem] = useState<string | null>(null);
  const [levels, setLevels] = useState<number[]>([]);
  const [isHearingTone, setIsHearingTone] = useState(false);
  const [heard, setHeard] = useState<AcousticBeaconPayload[]>([]);
  const [latest, setLatest] = useState<AcousticBeaconPayload | null>(null);

  useEffect(() => {
    if (open) {
      setHeard(getCapturedBeacons());
      return;
    }
    acousticModem.stopTransmission();
    acousticModem.stopListening();
    setIsSending(false);
    setIsListening(false);
  }, [open]);

  const startSending = () => {
    tapFeedback();
    setTimesSent(0);
    setIsSending(true);
    acousticModem.startBeaconLoop(
      {
        id: `propia-${Date.now()}`,
        sender: sender.trim() || DEFAULT_SENDER,
        type,
        details: details.trim(),
        // A guessed place would send rescuers to the wrong street.
        lat: hasLocation ? userLocation.lat : undefined,
        lng: hasLocation ? userLocation.lng : undefined,
        timestamp: Date.now()
      },
      mode,
      () => setTimesSent((count) => count + 1)
    );
  };

  const stopSending = () => {
    tapFeedback();
    acousticModem.stopTransmission();
    setIsSending(false);
  };

  const toggleListening = async () => {
    tapFeedback();
    if (isListening) {
      acousticModem.stopListening();
      setIsListening(false);
      setIsHearingTone(false);
      return;
    }
    setMicProblem(null);
    const ok = await acousticModem.startListening(
      (beacon) => {
        tapFeedback();
        setHeard(saveCapturedBeacon(beacon));
        setLatest(beacon);
      },
      (bandLevels, freq) => {
        const step = Math.max(1, Math.floor(bandLevels.length / 16));
        setLevels(Array.from({ length: 16 }, (_, i) => bandLevels[i * step] ?? 0));
        setIsHearingTone(freq !== null);
      },
      mode
    );
    if (ok) setIsListening(true);
    else setMicProblem(t('No se pudo usar el micrófono. Revisa el permiso del micrófono en los ajustes del celular.'));
  };

  const clearList = () => {
    clearCapturedBeacons();
    setHeard([]);
    setLatest(null);
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={t('Radar por sonido')}>
      <div className="px-4 space-y-4" style={{ paddingBottom: 'calc(24px + var(--safe-bottom))' }}>
        <p className="text-secondary text-ink-2">
          {t('Un celular emite tonos con tu pedido de ayuda y otro cercano lo escucha con su micrófono. Funciona sin internet, sin señal y sin Bluetooth. Mientras más cerca y en silencio, mejor se escucha.')}
        </p>

        <div className="chip-row !px-0" role="group" aria-label={t('Qué quieres hacer')}>
          <button type="button" className="chip" aria-pressed={tab === 'send'} onClick={() => setTab('send')}>{t('Pedir ayuda')}</button>
          <button type="button" className="chip" aria-pressed={tab === 'listen'} onClick={() => setTab('listen')}>
            {t('Escuchar')}{heard.length > 0 ? ` (${heard.length})` : ''}
          </button>
        </div>

        <fieldset className="border-0 p-0 m-0">
          <legend className="pb-1 text-secondary font-bold">{t('Sonido')}</legend>
          <div className="chip-row !px-0">
            <button type="button" className="chip" aria-pressed={mode === 'audible'} disabled={isSending || isListening} onClick={() => setMode('audible')}>{t('Se escucha')}</button>
            <button type="button" className="chip" aria-pressed={mode === 'ultrasonic'} disabled={isSending || isListening} onClick={() => setMode('ultrasonic')}>{t('Muy agudo')}</button>
          </div>
          <p className="pt-1 text-meta text-ink-2">
            {mode === 'audible'
              ? t('Tonos que las personas escuchan. Funciona en casi todos los celulares.')
              : t('Casi no se oye, pero muchos celulares no pueden emitirlo ni captarlo. Los dos celulares deben elegir el mismo.')}
          </p>
        </fieldset>

        {tab === 'send' && (
          <>
            <fieldset className="border-0 p-0 m-0">
              <legend className="pb-1 text-secondary font-bold">{t('Qué pasa')}</legend>
              <ul className="list-plain">
                {TYPES.map((option) => (
                  <li key={option}>
                    <button type="button" className="row" aria-pressed={type === option} disabled={isSending} onClick={() => setType(option)}>
                      <span aria-hidden="true" className={`w-5 h-5 shrink-0 rounded-full border-2 ${type === option ? 'bg-anil border-anil' : 'border-line'}`} />
                      <span className="flex-1">
                        <span className="block text-row font-semibold">{t(BEACON_LABELS[option].title)}</span>
                        <span className="block text-secondary text-ink-2">{t(BEACON_LABELS[option].desc)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </fieldset>

            <div>
              <label htmlFor="beacon-sender" className="block pb-1 text-secondary font-bold">{t('Tu nombre o familia')}</label>
              <input id="beacon-sender" className="field" maxLength={20} disabled={isSending} value={sender} onChange={(event) => setSender(event.target.value)} placeholder={t('Por ejemplo: Familia Quispe')} />
            </div>
            <div>
              <label htmlFor="beacon-details" className="block pb-1 text-secondary font-bold">{t('Dónde estás exactamente')}</label>
              <input id="beacon-details" className="field" maxLength={30} disabled={isSending} value={details} onChange={(event) => setDetails(event.target.value)} placeholder={t('Por ejemplo: Mz C Lote 4, segundo piso')} />
            </div>
            <p className="flex items-start gap-2 text-secondary text-ink-2">
              <MapPin className="w-5 h-5 shrink-0 text-anil" aria-hidden="true" />
              {hasLocation
                ? t('Se enviará tu ubicación: {place}.', { place: placeLabel(userLocation.name) })
                : t('No sabemos dónde estás: no se enviará ubicación. Escribe tu dirección arriba.')}
            </p>

            {isSending ? (
              <>
                <p role="status" className="p-3 rounded-lg bg-sunken text-secondary font-bold">
                  {timesSent === 0
                    ? t('Emitiendo tu pedido por el parlante. Se repite cada pocos segundos. Sube el volumen al máximo.')
                    : timesSent === 1
                      ? t('Emitiendo tu pedido por el parlante. Se repite cada pocos segundos: va 1 vez. Sube el volumen al máximo.')
                      : t('Emitiendo tu pedido por el parlante. Se repite cada pocos segundos: va {count} veces. Sube el volumen al máximo.', { count: timesSent })}
                </p>
                <button type="button" className="btn btn-secondary" onClick={stopSending}>
                  <VolumeX className="w-6 h-6" aria-hidden="true" />
                  {t('Dejar de emitir')}
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-danger" onClick={startSending}>
                <Volume2 className="w-6 h-6" aria-hidden="true" />
                {t('Emitir por sonido')}
              </button>
            )}
          </>
        )}

        {tab === 'listen' && (
          <>
            <div className="p-3 rounded-lg bg-sunken space-y-2">
              <p role="status" className="text-secondary font-bold">
                {!isListening
                  ? t('El micrófono está apagado.')
                  : isHearingTone
                    ? t('Escuchando tonos de AYLLU...')
                    : t('Escuchando. Acerca los celulares si hay un pedido cerca.')}
              </p>
              <div className="h-12 flex items-end gap-1" aria-hidden="true">
                {(levels.length ? levels : new Array(16).fill(0)).map((level, index) => (
                  <span key={index} className={`flex-1 rounded-t ${isHearingTone ? 'bg-anil' : 'bg-line'}`} style={{ height: `${isListening ? Math.max(8, (level / 255) * 100) : 8}%` }} />
                ))}
              </div>
            </div>
            <button type="button" className={`btn ${isListening ? 'btn-secondary' : 'btn-primary'}`} onClick={toggleListening}>
              {isListening ? <MicOff className="w-6 h-6" aria-hidden="true" /> : <Mic className="w-6 h-6" aria-hidden="true" />}
              {isListening ? t('Apagar micrófono') : t('Escuchar con el micrófono')}
            </button>
            {micProblem && <p role="alert" className="text-secondary font-bold text-rojo">{micProblem}</p>}

            {latest && (
              <div role="alert" className={`p-3 rounded-lg border-2 ${BEACON_LABELS[latest.type].isUrgent ? 'border-rojo' : 'border-anil'}`}>
                <p className="text-row font-bold">{t(BEACON_LABELS[latest.type].title)}: {senderName(latest.sender)}</p>
                {latest.details && <p className="text-secondary">{latest.details}</p>}
              </div>
            )}

            <section aria-labelledby="beacons-title" className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 id="beacons-title" className="flex-1 text-section font-bold">{t('Pedidos escuchados')}</h3>
                {heard.length > 0 && <button type="button" className="btn btn-secondary w-auto min-h-12" onClick={clearList}>{t('Borrar lista')}</button>}
              </div>
              {heard.length === 0 ? (
                <p className="text-secondary text-ink-2">{t('Todavía no se escuchó ningún pedido. Deja el micrófono encendido cerca de donde pueda haber alguien.')}</p>
              ) : (
                <ul className="list-plain">
                  {heard.map((item) => (
                    <li key={item.id} className="py-3 space-y-1">
                      <p className={`text-row font-bold ${BEACON_LABELS[item.type].isUrgent ? 'text-rojo' : ''}`}>{t(BEACON_LABELS[item.type].title)}</p>
                      <p className="text-secondary">{senderName(item.sender)}{item.details ? `: ${item.details}` : ''}</p>
                      <p className="text-meta text-ink-2">
                        {item.rssi
                          ? t('Escuchado {time}, sonido al {level}%', { time: timeAgo(item.timestamp, t), level: item.rssi })
                          : t('Escuchado {time}', { time: timeAgo(item.timestamp, t) })}
                      </p>
                      {item.lat !== undefined && item.lng !== undefined && (
                        <a href={`https://maps.google.com/?q=${item.lat},${item.lng}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 min-h-12 text-secondary font-bold text-anil underline">
                          <MapPin className="w-5 h-5" aria-hidden="true" />
                          {t('Ver dónde está')}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </BottomSheet>
  );
};
