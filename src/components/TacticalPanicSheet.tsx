import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertOctagon, 
  Copy, 
  ExternalLink, 
  Heart, 
  MapPin, 
  MessageSquare, 
  Phone, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Zap, 
  Check,
  BellRing,
  Share2,
  Save,
  Radio,
  Edit3
} from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { getLocalPlusCode } from '../utils/plusCodes';
import { tapFeedback } from '../lib/native';
import { useApp } from '../context/AppContext';
import { ExactReferenceField } from './ExactReferenceField';
import { locationSentence } from '../utils/exactLocation';
import { rescueText, SOS_OPENING } from '../utils/sosMessage';
import { useLanguage } from '../i18n/LanguageContext';
import { speak, stopSpeaking } from '../utils/audioGuide';

interface TacticalPanicSheetProps {
  open: boolean;
  onClose: () => void;
}

interface MedicalProfile {
  fullName: string;
  bloodType: string;
  allergies: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export const TacticalPanicSheet: React.FC<TacticalPanicSheetProps> = ({ open, onClose }) => {
  const { userLocation, hasLocation, showNotice } = useApp();
  const { lang, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'pluscode' | 'silbato'>('pluscode');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isReadingCode, setIsReadingCode] = useState(false);

  // Community whistle & strobe state
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<number | null>(null);
  const torchTrackRef = useRef<MediaStreamTrack | null>(null);
  const strobeIntervalRef = useRef<number | null>(null);

  // Medical profile loaded from localStorage
  const [profile, setProfile] = useState<MedicalProfile>({
    fullName: '',
    bloodType: '',
    allergies: '',
    emergencyContactName: 'Familiar',
    emergencyContactPhone: ''
  });

  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');

  const plus = getLocalPlusCode(userLocation.lat, userLocation.lng, userLocation.name || 'Perú');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ayllu_medical_id_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        setProfile((prev) => ({ ...prev, ...parsed }));
        setPhoneInput(parsed.emergencyContactPhone || '');
      }
    } catch {}
  }, [open]);

  useEffect(() => {
    return () => {
      stopAlarm();
      stopStrobeTorch();
    };
  }, []);

  const handleSaveContactPhone = (e?: React.FormEvent) => {
    e?.preventDefault();
    tapFeedback();
    const clean = phoneInput.trim();
    const updated = { ...profile, emergencyContactPhone: clean };
    setProfile(updated);
    try {
      localStorage.setItem('ayllu_medical_id_v1', JSON.stringify(updated));
      showNotice(t('Contacto de auxilio guardado'));
    } catch {}
    setIsEditingPhone(false);
  };

  // 1. Voice read out Plus Code in active language
  const handleDictateCode = () => {
    if (isReadingCode) {
      stopSpeaking();
      setIsReadingCode(false);
      return;
    }
    // Without a real position the code would be of another place.
    if (!hasLocation) {
      showNotice(t('Activa tu ubicación para ver tu código.'));
      return;
    }

    setIsReadingCode(true);
    let spokenText = '';
    switch (lang) {
      case 'qu':
        spokenText = `Kaymi tarinakuy Plus Code qillqayki: ${plus.spellOut}. Llaqta: ${userLocation.name || 'Perú'}. Kayta qillqay Bomberosman utaq Policiaman.`;
        break;
      case 'qu-cen':
        spokenText = `Kaymi kikin Plus Code qillqayki: ${plus.spellOut}. Marka: ${userLocation.name || 'Perú'}. Kayta qillqay Bomberosman manaqa Policiaman.`;
        break;
      case 'ay':
        spokenText = `Aka Plus Code sutichataxa: ${plus.spellOut}. Marka: ${userLocation.name || 'Perú'}. Bomberos ukat Policiarux aka yatiyawimpi yatiyama.`;
        break;
      case 'cni':
        spokenText = `Aka Plus Code pisankinate: ${plus.spellOut}. Nampitsi: ${userLocation.name || 'Perú'}. Pikenkithatake Bomberos aisati Policía.`;
        break;
      default:
        spokenText = `Tu código de ubicación exacta Plus Code es: ${plus.spellOut}. En ${userLocation.name || 'Perú'}. Díctale este código a la Policía ciento cinco o Bomberos ciento dieciséis para que lleguen a tu puerta exacta.`;
        break;
    }

    speak(spokenText, lang).finally(() => setIsReadingCode(false));
  };

  const handleCopyCode = async () => {
    tapFeedback();
    try {
      await navigator.clipboard.writeText(locationSentence(userLocation, hasLocation));
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      showNotice(t('Código de ubicación copiado'));
    } catch {
      showNotice(plus.shortCode);
    }
  };

  // 2. 1-Touch Emergency Rescue SMS (No balance / No internet required)
  const handleSendRescueSMS = () => {
    tapFeedback();
    const phone = profile.emergencyContactPhone || '';
    const message = encodeURIComponent(rescueText(SOS_OPENING, userLocation, hasLocation));
    window.location.href = `sms:${phone}?body=${message}`;
  };

  // 3. 1-Touch Emergency Rescue WhatsApp
  const handleSendRescueWhatsApp = () => {
    tapFeedback();
    const digits = profile.emergencyContactPhone ? profile.emergencyContactPhone.replace(/\D/g, '') : '';
    const phoneParam = digits.length >= 9 ? (digits.startsWith('51') ? digits : `51${digits}`) : '';
    const message = encodeURIComponent(rescueText(SOS_OPENING, userLocation, hasLocation));
    const url = phoneParam ? `https://wa.me/${phoneParam}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(url, '_blank');
  };

  // 4. Community Alarm & Strobe Torch
  const startAlarm = async () => {
    tapFeedback();
    setIsAlarmActive(true);

    // Audio frequency oscillator (dual tone disuasivo: 2900Hz / 1850Hz)
    try {
      audioCtxRef.current ??= new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      let toggle = false;
      const playTone = () => {
        if (!ctx || ctx.state === 'closed') return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(toggle ? 2900 : 1850, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.85, ctx.currentTime + 0.04);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
        toggle = !toggle;
      };

      playTone();
      alarmIntervalRef.current = window.setInterval(playTone, 350);
    } catch (e) {
      console.warn('Audio alarm could not start', e);
    }

    // Hardware camera torch strobe (if supported)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const track = stream.getVideoTracks()[0];
      const capabilities = (track.getCapabilities?.() as any) || {};

      if (capabilities.torch) {
        torchTrackRef.current = track;
        let torchOn = true;
        await (track as any).applyConstraints({ advanced: [{ torch: true }] });
        strobeIntervalRef.current = window.setInterval(async () => {
          torchOn = !torchOn;
          try {
            await (track as any).applyConstraints({ advanced: [{ torch: torchOn }] });
          } catch {}
        }, 200);
      }
    } catch {}
  };

  const stopStrobeTorch = () => {
    if (strobeIntervalRef.current) {
      clearInterval(strobeIntervalRef.current);
      strobeIntervalRef.current = null;
    }
    if (torchTrackRef.current) {
      try {
        (torchTrackRef.current as any).applyConstraints({ advanced: [{ torch: false }] });
      } catch {}
      torchTrackRef.current.stop();
      torchTrackRef.current = null;
    }
  };

  const stopAlarm = () => {
    tapFeedback();
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
      audioCtxRef.current = null;
    }
    stopStrobeTorch();
    setIsAlarmActive(false);
  };

  return (
    <BottomSheet open={open} onClose={() => { stopAlarm(); onClose(); }} title={t('Auxilio Rápido y Plus Code de Rescate')}>
      <div className="flex flex-col gap-3 pb-6 text-ink">
        {/* Navigation tabs */}
        <div className="flex rounded-xl bg-surface border border-border p-1 gap-1">
          <button
            type="button"
            onClick={() => { setActiveTab('pluscode'); tapFeedback(); }}
            className={`flex-1 min-h-12 py-2 text-meta font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
 activeTab === 'pluscode' ? 'bg-primary text-white shadow-xs' : 'text-ink-secondary hover:bg-sunken'
 }`}
          >
            <MapPin className="w-4 h-4" />
            {t('Plus Code & Rescate')}
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('silbato'); tapFeedback(); }}
            className={`flex-1 min-h-12 py-2 text-meta font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
 activeTab === 'silbato' ? 'bg-status-danger text-white shadow-xs' : 'text-ink-secondary hover:bg-sunken'
 }`}
          >
            <BellRing className="w-4 h-4" />
            {t('Silbato Antirrobo (200m)')}
          </button>
        </div>

        {/* TAB 1: PLUS CODES OFFLINE & RESCATE RÁPIDO */}
        {activeTab === 'pluscode' && (
          <div className="flex flex-col gap-3">
            {/* Main Big Code Card */}
            <div className="p-4 bg-primary rounded-2xl text-white flex flex-col items-center text-center gap-2">
              <span className="text-meta font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-white" />
                {t('Tu código de ubicación exacta (sin internet)')}
              </span>

              <div className="my-1">
                <span className="block text-4xl font-black tracking-wider text-white font-mono ">
                  {hasLocation ? plus.shortCode : '—'}
                </span>
                <span className="block text-meta font-bold text-white mt-1">
                  {hasLocation ? userLocation.name : t('Activa tu ubicación para ver tu código.')}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full pt-2 border-t border-white/30">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex-1 min-h-12 py-2 px-3 bg-white hover:bg-primary-subtle active:scale-95 text-primary text-meta font-bold rounded-xl flex items-center justify-center gap-1.5 shadow transition-all"
                >
                  {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedCode ? t('¡Copiado!') : t('Copiar')}
                </button>

                <button
                  type="button"
                  onClick={handleDictateCode}
                  className="flex-1 min-h-12 py-2 px-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white text-meta font-bold rounded-xl flex items-center justify-center gap-1.5 border border-white/20 transition-all"
                >
                  {isReadingCode ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                  {isReadingCode ? t('Detener') : t('Dictar en voz alta')}
                </button>

                <a
                  href={plus.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-12 min-w-12 grid place-items-center bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20"
                  aria-label={t('Ver en el mapa')}
                >
                  <ExternalLink className="w-4 h-4 text-white" />
                </a>
              </div>
            </div>

            <ExactReferenceField />

            {/* Phonetic spelled-out aid for dictating to 116/105 */}
            <div className="p-3 bg-surface border border-border rounded-xl flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="text-left min-w-0">
                <span className="block text-meta font-bold text-ink">
                  {t('Para dictar por teléfono a Bomberos (116) o Policía (105):')}
                </span>
                <span className="block text-meta font-semibold text-primary mt-0.5 tracking-wide">
                  « {hasLocation ? plus.spellOut : '—'} »
                </span>
              </div>
            </div>

            {/* Dual 1-Touch Rescue Buttons: SMS & WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSendRescueSMS}
                className="w-full min-h-12 py-3 px-3 bg-status-danger hover:bg-status-danger-press active:scale-98 text-white rounded-xl font-bold text-meta flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span>{t('SMS de Rescate (Sin saldo)')}</span>
              </button>

              <button
                type="button"
                onClick={handleSendRescueWhatsApp}
                className="w-full min-h-12 py-3 px-3 bg-status-safe hover:brightness-110 active:scale-98 text-white rounded-xl font-bold text-meta flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Share2 className="w-4 h-4 shrink-0" />
                <span>{t('Auxilio por WhatsApp')}</span>
              </button>
            </div>

            {/* Medical ICE snapshot with quick inline phone configuration */}
            <div className="p-3 bg-surface border border-border rounded-xl flex flex-col gap-2 text-meta">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-status-danger shrink-0" />
                  <div>
                    <span className="block font-bold text-ink">{t('Ficha médica de rescate')}</span>
                    <span className="block text-ink-secondary text-meta">
                      {t('Sangre')}: <strong>{profile.bloodType || t('sin completar')}</strong>. {t('Alergias')}: {profile.allergies || t('sin completar')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingPhone(!isEditingPhone)}
                  className="min-h-12 px-2 text-primary hover:bg-sunken rounded-lg flex items-center gap-1 font-semibold text-meta"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {profile.emergencyContactPhone ? t('Cambiar') : t('Configurar')}
                </button>
              </div>

              {isEditingPhone ? (
                <form onSubmit={handleSaveContactPhone} className="flex gap-2 pt-1 border-t border-border">
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder={t('Celular de un familiar (ej. 987654321)')}
                    maxLength={15}
                    className="flex-1 field"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="min-h-12 px-3 bg-primary text-white font-bold rounded-lg text-meta flex items-center gap-1 shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {t('Guardar')}
                  </button>
                </form>
              ) : profile.emergencyContactPhone ? (
                <div className="flex items-center justify-between pt-1 border-t border-border text-meta">
                  <span className="text-ink-secondary">
                    {t('Contacto guardado:')} <strong>{profile.emergencyContactPhone}</strong> ({profile.emergencyContactName || t('Familiar')})
                  </span>
                  <a
                    href={`tel:${profile.emergencyContactPhone}`}
                    className="min-h-12 px-3 bg-sunken text-ink font-bold rounded-lg flex items-center gap-1 hover:bg-border"
                  >
                    <Phone className="w-3 h-3 text-status-safe" />
                    {t('Llamar')}
                  </a>
                </div>
              ) : (
                <p className="text-meta font-semibold text-ink pt-1 border-t border-border">
                  {t('No tienes un número de familiar guardado. Toca «Configurar» para agregarlo.')}
                </p>
              )}
            </div>

            {/* Official 119 Voice Message Banner (Ley Telecomunicaciones MTC Perú) */}
            <div className="p-2.5 bg-primary-subtle border border-primary/30 rounded-xl flex items-center justify-between text-meta">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-primary shrink-0" />
                <span className="text-ink text-meta font-medium leading-tight">
                  <strong>{t('Línea 119:')}</strong> {t('deja o escucha mensajes de voz si las llamadas colapsan por un sismo.')}
                </span>
              </div>
              <a
                href="tel:119"
                className="min-h-12 min-w-12 px-3 grid place-items-center bg-primary hover:bg-primary-press text-white font-bold rounded-lg text-meta shrink-0 ml-2"
              >
                119
              </a>
            </div>
          </div>
        )}

        {/* TAB 2: SILBATO VECINAL ANTIRROBO (200 METROS) */}
        {activeTab === 'silbato' && (
          <div className="flex flex-col gap-3 text-center">
            <div className="p-3 bg-status-danger/10 border border-status-danger/30 rounded-xl text-left flex items-start gap-2">
              <ShieldAlert className="w-5 h-5 text-status-danger shrink-0 mt-0.5" />
              <div>
                <span className="block text-meta font-bold text-ink">
                  {t('Silbato fuerte y linterna intermitente')}
                </span>
                <span className="block text-meta text-ink-secondary">
                  {t('Suena un silbato fuerte e intermitente y parpadea la linterna para alertar a toda la cuadra y ahuyentar a sospechosos.')}
                </span>
              </div>
            </div>

            {/* Giant Panic / Whistle Action Button */}
            <div className="py-4 flex flex-col items-center justify-center">
              <button
                type="button"
                onClick={isAlarmActive ? stopAlarm : startAlarm}
                className={`w-36 h-36 rounded-full flex flex-col items-center justify-center gap-1 text-white shadow-2xl transition-all transform active:scale-95 ${
 isAlarmActive
 ? 'bg-status-danger ring-8 ring-status-danger/40 animate-pulse'
 : 'bg-gradient-to-br from-status-danger to-status-danger-press hover:brightness-110 shadow-status-danger/30'
 }`}
              >
                {isAlarmActive ? (
                  <>
                    <VolumeX className="w-12 h-12" />
                    <span className="text-meta font-black uppercase tracking-wider">{t('Detener')}</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-12 h-12" />
                    <span className="text-meta font-black uppercase tracking-wider">{t('¡Activar!')}</span>
                    <span className="text-meta font-semibold opacity-90">{t('Silbato vecinal')}</span>
                  </>
                )}
              </button>
              <span className="text-meta font-bold text-ink-secondary mt-3">
                {isAlarmActive ? t('¡Alarma comunitaria sonando a máximo volumen!') : t('Presiona para activar el silbato vecinal')}
              </span>
            </div>

            {/* Emergency fast dialers: 4 official lines of the Peruvian State */}
            <div className="pt-2 border-t border-border grid grid-cols-2 gap-2">
              <a
                href="tel:105"
                className="min-h-12 py-2.5 px-3 bg-surface border border-border rounded-xl text-meta font-bold text-ink flex items-center justify-center gap-2 hover:bg-sunken"
              >
                <Phone className="w-4 h-4 text-primary" />
                {t('Policía (105)')}
              </a>
              <a
                href="tel:116"
                className="min-h-12 py-2.5 px-3 bg-surface border border-border rounded-xl text-meta font-bold text-ink flex items-center justify-center gap-2 hover:bg-sunken"
              >
                <Phone className="w-4 h-4 text-status-danger" />
                {t('Bomberos (116)')}
              </a>
              <a
                href="tel:106"
                className="min-h-12 py-2.5 px-3 bg-surface border border-border rounded-xl text-meta font-bold text-ink flex items-center justify-center gap-2 hover:bg-sunken"
              >
                <Phone className="w-4 h-4 text-primary" />
                {t('Ambulancia SAMU (106)')}
              </a>
              <a
                href="tel:115"
                className="min-h-12 py-2.5 px-3 bg-surface border border-border rounded-xl text-meta font-bold text-ink flex items-center justify-center gap-2 hover:bg-sunken"
              >
                <Phone className="w-4 h-4 text-primary" />
                {t('Defensa Civil (115)')}
              </a>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
