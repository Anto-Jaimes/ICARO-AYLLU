import React, { useState, useEffect, useId } from 'react';
import QRCode from 'qrcode';
import { 
  HeartPulse, 
  PlusCircle, 
  QrCode, 
  Download, 
  Copy, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Check, 
  ShieldAlert,
  User,
  MapPin,
  Stethoscope
} from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { 
  TriageVictim, 
  TriageTag, 
  TRIAGE_CONFIG, 
  getTriageVictims, 
  saveTriageVictim, 
  updateVictimStatus, 
  deleteTriageVictim, 
  calculateStartTag, 
  buildTacticalQRPayload, 
  generateTriageGeoJSON 
} from '../utils/triageStorage';
import { tapFeedback } from '../lib/native';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../i18n/LanguageContext';

interface TriageSheetProps {
  open: boolean;
  onClose: () => void;
}

export const TriageSheet: React.FC<TriageSheetProps> = ({ open, onClose }) => {
  const { userLocation } = useApp();
  const { lang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'padron' | 'evaluar' | 'qr'>('padron');
  const [victims, setVictims] = useState<TriageVictim[]>([]);
  
  // Evaluation state
  const [canWalk, setCanWalk] = useState<boolean>(false);
  const [breathing, setBreathing] = useState<'normal' | 'rapida' | 'nula'>('rapida');
  const [pulse, setPulse] = useState<'radial_presente' | 'radial_ausente'>('radial_presente');
  const [mentalState, setMentalState] = useState<'obedece' | 'confuso_inconsciente'>('obedece');
  const [identifier, setIdentifier] = useState('');
  const [locationNote, setLocationNote] = useState('');
  const [injuries, setInjuries] = useState('');
  
  // QR state
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Form field IDs for accessibility
  const identifierId = useId();
  const locationId = useId();
  const injuriesId = useId();

  // Load victims when opened
  useEffect(() => {
    if (open) {
      setVictims(getTriageVictims());
    }
  }, [open]);

  // Dynamic calculated START tag
  const calculatedTag: TriageTag = calculateStartTag(
    canWalk,
    breathing,
    pulse,
    mentalState
  );

  const tagConfig = TRIAGE_CONFIG[calculatedTag];

  // Generate QR when viewing QR tab or when victims change
  useEffect(() => {
    if (activeTab === 'qr') {
      const payload = buildTacticalQRPayload(victims);
      QRCode.toDataURL(payload, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000', light: '#ffffff' }
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR', err));
    }
  }, [activeTab, victims, userLocation.lat, userLocation.lng]);

  const handleSaveVictim = (e: React.FormEvent) => {
    e.preventDefault();
    tapFeedback();

    const newVictim: TriageVictim = {
      id: `triage-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tag: calculatedTag,
      identifier: identifier.trim() || `Víctima #${victims.length + 1}`,
      locationNote: locationNote.trim() || 'En la zona vecinal',
      injuries: injuries.trim() || 'Evaluado con protocolo START',
      canWalk,
      breathing,
      pulse,
      mentalState,
      coords: [userLocation.lat, userLocation.lng],
      createdAt: new Date().toISOString(),
      status: 'esperando'
    };

    saveTriageVictim(newVictim);
    setVictims(getTriageVictims());

    // Reset form
    setIdentifier('');
    setLocationNote('');
    setInjuries('');
    setCanWalk(false);
    setBreathing('rapida');
    setPulse('radial_presente');
    setMentalState('obedece');

    setActiveTab('padron');
  };

  const handleStatusChange = (id: string, status: TriageVictim['status']) => {
    tapFeedback();
    updateVictimStatus(id, status);
    setVictims(getTriageVictims());
  };

  const handleDelete = (id: string) => {
    tapFeedback();
    deleteTriageVictim(id);
    setVictims(getTriageVictims());
  };

  const handleDownloadGeoJSON = () => {
    tapFeedback();
    const geojson = generateTriageGeoJSON(victims);
    const blob = new Blob([geojson], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `padron_triage_ayllu_${new Date().toISOString().slice(0, 10)}.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    tapFeedback();
    const counts = {
      rojo: victims.filter((v) => v.tag === 'ROJO').length,
      amarillo: victims.filter((v) => v.tag === 'AMARILLO').length,
      verde: victims.filter((v) => v.tag === 'VERDE').length,
      negro: victims.filter((v) => v.tag === 'NEGRO').length
    };

    const text = `🚨 *REPORTE TÁCTICO DE TRIAGE (START) - AYLLU*\n` +
      `📅 Fecha: ${new Date().toLocaleString('es-PE')}\n` +
      `📍 Coordenadas: ${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}\n\n` +
      `*CENSO DE VÍCTIMAS:*\n` +
      `🔴 Prioridad I (Rojo - Inmediato): ${counts.rojo}\n` +
      `🟡 Prioridad II (Amarillo - Retardado): ${counts.amarillo}\n` +
      `🟢 Prioridad III (Verde - Leve): ${counts.verde}\n` +
      `⚫ Prioridad 0 (Fallecido): ${counts.negro}\n` +
      `Total registradas: ${victims.length}\n\n` +
      `Detalle:\n` +
      victims.map((v) => `- [${v.tag}] ${v.identifier} (${v.locationNote}) - ${v.injuries}`).join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const counts = {
    rojo: victims.filter((v) => v.tag === 'ROJO' && v.status !== 'evacuado').length,
    amarillo: victims.filter((v) => v.tag === 'AMARILLO' && v.status !== 'evacuado').length,
    verde: victims.filter((v) => v.tag === 'VERDE' && v.status !== 'evacuado').length,
    negro: victims.filter((v) => v.tag === 'NEGRO').length
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Triage de Emergencia (START)">
      <div className="flex flex-col gap-4 text-ink pb-6">
        {/* Navigation Tabs */}
        <div className="flex rounded-xl bg-surface border border-line p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('padron')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'padron' ? 'bg-primary text-white shadow-sm' : 'text-ink-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            Padrón ({victims.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('evaluar')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'evaluar' ? 'bg-primary text-white shadow-sm' : 'text-ink-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            + Evaluar (START)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'qr' ? 'bg-primary text-white shadow-sm' : 'text-ink-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            QR Rescatistas
          </button>
        </div>

        {/* TAB 1: PADRÓN DE VÍCTIMAS */}
        {activeTab === 'padron' && (
          <div className="flex flex-col gap-3">
            {/* Metric counters */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-red-950/20 border border-red-500/40 rounded-xl p-2 text-center">
                <span className="block text-2xl font-black text-red-600 dark:text-red-400">{counts.rojo}</span>
                <span className="block text-[11px] font-bold text-red-700 dark:text-red-300">
                  {lang !== 'es' && TRIAGE_CONFIG.ROJO.nativeColor[lang as 'qu' | 'qu-cen' | 'ay' | 'cni']
                    ? `${TRIAGE_CONFIG.ROJO.nativeColor[lang as 'qu' | 'qu-cen' | 'ay' | 'cni']} (Rojo)`
                    : 'ROJO'}
                </span>
              </div>
              <div className="bg-amber-950/20 border border-amber-500/40 rounded-xl p-2 text-center">
                <span className="block text-2xl font-black text-amber-600 dark:text-amber-400">{counts.amarillo}</span>
                <span className="block text-[11px] font-bold text-amber-700 dark:text-amber-300">
                  {lang !== 'es' && TRIAGE_CONFIG.AMARILLO.nativeColor[lang as 'qu' | 'qu-cen' | 'ay' | 'cni']
                    ? `${TRIAGE_CONFIG.AMARILLO.nativeColor[lang as 'qu' | 'qu-cen' | 'ay' | 'cni']} (Amarillo)`
                    : 'AMARILLO'}
                </span>
              </div>
              <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-2 text-center">
                <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400">{counts.verde}</span>
                <span className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  {lang !== 'es' && TRIAGE_CONFIG.VERDE.nativeColor[lang as 'qu' | 'qu-cen' | 'ay' | 'cni']
                    ? `${TRIAGE_CONFIG.VERDE.nativeColor[lang as 'qu' | 'qu-cen' | 'ay' | 'cni']} (Verde)`
                    : 'VERDE'}
                </span>
              </div>
              <div className="bg-neutral-900/10 dark:bg-neutral-900 border border-neutral-400 dark:border-neutral-700 rounded-xl p-2 text-center">
                <span className="block text-2xl font-black text-neutral-700 dark:text-neutral-300">{counts.negro}</span>
                <span className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                  {lang !== 'es' && TRIAGE_CONFIG.NEGRO.nativeColor[lang as 'qu' | 'qu-cen' | 'ay' | 'cni']
                    ? `${TRIAGE_CONFIG.NEGRO.nativeColor[lang as 'qu' | 'qu-cen' | 'ay' | 'cni']} (Negro)`
                    : 'NEGRO'}
                </span>
              </div>
            </div>

            {victims.length === 0 ? (
              <div className="p-8 text-center bg-surface border border-line rounded-2xl flex flex-col items-center gap-2">
                <Stethoscope className="w-10 h-10 text-ink-secondary/50" />
                <p className="text-sm font-bold text-ink">No hay víctimas registradas en este sector</p>
                <p className="text-xs text-ink-secondary max-w-xs">
                  Usa el asistente para clasificar heridos rápidamente con el método internacional START.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('evaluar')}
                  className="mt-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow"
                >
                  Evaluar primera víctima
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1">
                {victims.map((v) => {
                  const cfg = TRIAGE_CONFIG[v.tag];
                  return (
                    <div
                      key={v.id}
                      className={`p-3 rounded-xl border ${cfg.border} ${cfg.bg} flex flex-col gap-2 shadow-xs`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="px-2 py-0.5 rounded text-xs font-black uppercase text-white tracking-wider flex items-center gap-1"
                            style={{ backgroundColor: cfg.color }}
                          >
                            <span>{v.tag}</span>
                            {lang !== 'es' && cfg.nativeColor[lang as 'qu' | 'qu-cen' | 'ay' | 'cni'] && (
                              <span className="opacity-90 text-[10px] lowercase font-semibold">
                                ({cfg.nativeColor[lang as 'qu' | 'qu-cen' | 'ay' | 'cni']})
                              </span>
                            )}
                          </span>
                          <span className="text-sm font-bold text-ink">{v.identifier}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(v.id)}
                          className="p-1 text-ink-secondary hover:text-red-500 rounded"
                          title="Eliminar de la lista"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-xs text-ink-secondary flex flex-col gap-0.5">
                        <span className="flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {v.locationNote}
                        </span>
                        <span><strong>Lesión:</strong> {v.injuries}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-line/30 text-xs">
                        <span className="text-[11px] text-ink-secondary">
                          {new Date(v.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(v.id, 'esperando')}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              v.status === 'esperando' ? 'bg-rojo text-white' : 'bg-surface text-ink-secondary border border-line'
                            }`}
                          >
                            Esperando
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(v.id, 'atendido')}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              v.status === 'atendido' ? 'bg-amarillo text-ink' : 'bg-surface text-ink-secondary border border-line'
                            }`}
                          >
                            Atendido
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(v.id, 'evacuado')}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              v.status === 'evacuado' ? 'bg-verde text-white' : 'bg-surface text-ink-secondary border border-line'
                            }`}
                          >
                            Evacuado
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EVALUAR (ASISTENTE START) */}
        {activeTab === 'evaluar' && (
          <form onSubmit={handleSaveVictim} className="flex flex-col gap-4">
            {/* Visual START banner result */}
            <div className={`p-3.5 rounded-xl border ${tagConfig.border} ${tagConfig.bg} flex items-center justify-between`}>
              <div>
                <span className="block text-xs font-bold text-ink-secondary uppercase tracking-wider">
                  Clasificación Calculada:
                </span>
                <span className="block text-lg font-black text-ink flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tagConfig.color }}
                  />
                  {calculatedTag} - {tagConfig.label}
                </span>
                <span className="block text-xs text-ink-secondary font-medium">
                  {tagConfig.priority}
                </span>
              </div>
            </div>

            {/* Guided START algorithm questions */}
            <div className="flex flex-col gap-3 bg-surface p-3.5 rounded-xl border border-line">
              {/* Question 1: Ambulación */}
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  1. ¿La víctima puede ponerse de pie y caminar?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setCanWalk(true); tapFeedback(); }}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      canWalk ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-surface text-ink border-line'
                    }`}
                  >
                    Sí (Camina por sí solo)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCanWalk(false); tapFeedback(); }}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      !canWalk ? 'bg-rojo text-white border-rojo-press' : 'bg-surface text-ink border-line'
                    }`}
                  >
                    No (Inmovilizado / En suelo)
                  </button>
                </div>
              </div>

              {!canWalk && (
                <>
                  {/* Question 2: Respiración */}
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1.5">
                      2. Respiración tras despejar vía aérea:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => { setBreathing('normal'); tapFeedback(); }}
                        className={`py-2 text-[11px] font-bold rounded-lg border ${
                          breathing === 'normal' ? 'bg-amarillo text-ink border-amber-500' : 'bg-surface text-ink border-line'
                        }`}
                      >
                        Normal (&lt;30 rpm)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setBreathing('rapida'); tapFeedback(); }}
                        className={`py-2 text-[11px] font-bold rounded-lg border ${
                          breathing === 'rapida' ? 'bg-rojo text-white border-rojo-press' : 'bg-surface text-ink border-line'
                        }`}
                      >
                        Rápida (&gt;30 rpm)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setBreathing('nula'); tapFeedback(); }}
                        className={`py-2 text-[11px] font-bold rounded-lg border ${
                          breathing === 'nula' ? 'bg-neutral-800 text-white border-neutral-900' : 'bg-surface text-ink border-line'
                        }`}
                      >
                        No respira
                      </button>
                    </div>
                  </div>

                  {breathing !== 'nula' && (
                    <>
                      {/* Question 3: Pulso */}
                      <div>
                        <label className="block text-xs font-bold text-ink mb-1.5">
                          3. Pulso radial (muñeca) o llenado capilar:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => { setPulse('radial_presente'); tapFeedback(); }}
                            className={`py-2 text-xs font-bold rounded-lg border ${
                              pulse === 'radial_presente' ? 'bg-amarillo text-ink border-amber-500' : 'bg-surface text-ink border-line'
                            }`}
                          >
                            Presente (&lt; 2 seg)
                          </button>
                          <button
                            type="button"
                            onClick={() => { setPulse('radial_ausente'); tapFeedback(); }}
                            className={`py-2 text-xs font-bold rounded-lg border ${
                              pulse === 'radial_ausente' ? 'bg-rojo text-white border-rojo-press' : 'bg-surface text-ink border-line'
                            }`}
                          >
                            Ausente o débil (Shock)
                          </button>
                        </div>
                      </div>

                      {/* Question 4: Estado mental */}
                      <div>
                        <label className="block text-xs font-bold text-ink mb-1.5">
                          4. Estado mental ("Aprieta mi mano", "Abre los ojos"):
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => { setMentalState('obedece'); tapFeedback(); }}
                            className={`py-2 text-xs font-bold rounded-lg border ${
                              mentalState === 'obedece' ? 'bg-verde text-white border-verde' : 'bg-surface text-ink border-line'
                            }`}
                          >
                            Obedece órdenes
                          </button>
                          <button
                            type="button"
                            onClick={() => { setMentalState('confuso_inconsciente'); tapFeedback(); }}
                            className={`py-2 text-xs font-bold rounded-lg border ${
                              mentalState === 'confuso_inconsciente' ? 'bg-rojo text-white border-rojo-press' : 'bg-surface text-ink border-line'
                            }`}
                          >
                            Confuso / Inconsciente
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Victim details form */}
            <div className="flex flex-col gap-2.5">
              <div>
                <label htmlFor={identifierId} className="block text-xs font-bold text-ink mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  Nombre o Identificador Físico:
                </label>
                <input
                  id={identifierId}
                  type="text"
                  placeholder="Ej. Juan Pérez / Mujer ~30 años casaca roja"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface border border-line text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor={locationId} className="block text-xs font-bold text-ink mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  Ubicación exacta / Lugar en los escombros:
                </label>
                <input
                  id={locationId}
                  type="text"
                  placeholder="Ej. Jr. Huancavelica 320, 1er piso debajo de columna"
                  value={locationNote}
                  onChange={(e) => setLocationNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface border border-line text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label htmlFor={injuriesId} className="block text-xs font-bold text-ink mb-1 flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5" />
                  Lesiones observables y soporte aplicado:
                </label>
                <input
                  id={injuriesId}
                  type="text"
                  placeholder="Ej. Traumatismo craneal, torniquete en muslo derecho"
                  value={injuries}
                  onChange={(e) => setInjuries(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-surface border border-line text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <Check className="w-5 h-5" />
              Registrar en Padrón de Emergencia
            </button>
          </form>
        )}

        {/* TAB 3: QR Y EXPORTACIÓN TÁCTICA PARA RESCATISTAS */}
        {activeTab === 'qr' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-3 bg-amber-950/20 border border-amber-600/40 rounded-xl text-left w-full">
              <span className="text-secondary font-bold text-ink flex items-center gap-1.5">
                <ShieldAlert className="w-5 h-5 text-naranja" aria-hidden="true" />
                {t('Para quien llegue a ayudar')}
              </span>
              <p className="text-secondary text-ink-secondary mt-1">
                {t('Muestra este código a los bomberos o al personal de salud: cualquier celular lo lee con la cámara, sin internet, y ve la lista de heridos con su ubicación.')}
              </p>
            </div>

            {/* QR display container */}
            <div className="p-4 bg-white rounded-2xl shadow-md border border-neutral-200">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Código QR de Triage Táctico"
                  className="w-56 h-56 object-contain"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-xs text-neutral-400">
                  Generando QR...
                </div>
              )}
            </div>

            <span className="text-xs font-bold text-ink">
              {victims.length} víctima(s) censadas en el perímetro
            </span>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2 w-full">
              <button
                type="button"
                onClick={handleDownloadGeoJSON}
                className="py-2.5 px-3 bg-surface hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-line text-ink text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Download className="w-4 h-4 text-primary" />
                Descargar GeoJSON
              </button>

              <button
                type="button"
                onClick={handleCopySummary}
                className="py-2.5 px-3 bg-surface hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-line text-ink text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-primary" />
                    Copiar Resumen SMS
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
