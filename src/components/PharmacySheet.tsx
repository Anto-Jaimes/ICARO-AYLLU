import React, { useState } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  Cross, 
  HeartPulse, 
  MapPin, 
  Phone, 
  Pill, 
  Search, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { 
  ESSENTIAL_MEDICINES, 
  getCachedPharmacies, 
  Pharmacy 
} from '../services/pharmacyService';
import { describeDistance } from '../utils/geo';
import { tapFeedback } from '../lib/native';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n/LanguageContext';

interface PharmacySheetProps {
  open: boolean;
  onClose: () => void;
}

export const PharmacySheet: React.FC<PharmacySheetProps> = ({ open, onClose }) => {
  const { userLocation } = useApp();
  const t = useT();
  const [tab, setTab] = useState<'farmacias' | 'precios'>('farmacias');
  const [only24h, setOnly24h] = useState(false);
  const [search, setSearch] = useState('');

  const pharmacies: Pharmacy[] = getCachedPharmacies(userLocation.lat, userLocation.lng);

  const filteredPharmacies = pharmacies.filter((ph) => {
    if (only24h && !ph.isOpen24h && !ph.isOnDuty) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      ph.name.toLowerCase().includes(q) ||
      ph.district.toLowerCase().includes(q) ||
      ph.address.toLowerCase().includes(q)
    );
  });

  const filteredMedicines = ESSENTIAL_MEDICINES.filter((med) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      med.name.toLowerCase().includes(q) ||
      med.genericName.toLowerCase().includes(q) ||
      med.category.toLowerCase().includes(q)
    );
  });

  return (
    <BottomSheet open={open} onClose={onClose} title={t('Farmacias de Turno y DIGEMID')}>
      <div className="flex flex-col gap-3 pb-6 text-ink">
        {/* Banner informativo MINSA / DIGEMID */}
        <div className="p-3 bg-teal-950/20 border border-teal-600/40 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <p className="text-secondary font-bold text-teal-400">
                {t('Observatorio Oficial DIGEMID')}
              </p>
              <p className="text-[11px] text-teal-200/80">
                {t('Precios de genéricos regulados y boticas de guardia 24h')}
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-teal-600/30 text-teal-300 font-bold px-2 py-0.5 rounded border border-teal-500/40 uppercase">
            MINSA
          </span>
        </div>

        {/* Selector de pestañas */}
        <div className="flex bg-sunken p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => {
              tapFeedback();
              setTab('farmacias');
            }}
            className={`flex-1 py-2 text-secondary font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'farmacias'
                ? 'bg-canvas text-ink shadow-sm'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            <Building2 className="w-4 h-4" />
            {t('Boticas de Turno')} ({filteredPharmacies.length})
          </button>
          <button
            type="button"
            onClick={() => {
              tapFeedback();
              setTab('precios');
            }}
            className={`flex-1 py-2 text-secondary font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'precios'
                ? 'bg-canvas text-ink shadow-sm'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            {t('Precios Genéricos')} ({filteredMedicines.length})
          </button>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-ink-2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              tab === 'farmacias'
                ? t('Buscar por nombre o distrito...')
                : t('Buscar medicamento (paracetamol, suero, gasas)...')
            }
            className="field pl-9 py-2 text-secondary rounded-xl w-full"
          />
        </div>

        {/* Pestaña: Farmacias */}
        {tab === 'farmacias' && (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer text-secondary">
                <input
                  type="checkbox"
                  checked={only24h}
                  onChange={(e) => {
                    tapFeedback();
                    setOnly24h(e.target.checked);
                  }}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <span className="font-semibold text-secondary">{t('Solo abiertas 24h / De Turno')}</span>
              </label>
              <span className="text-[11px] text-ink-2">{t('Más cercanas primero')}</span>
            </div>

            <div className="flex flex-col gap-2.5 max-h-[55vh] overflow-y-auto pr-1">
              {filteredPharmacies.map((ph) => {
                const distance = describeDistance(ph.distanceMeters);
                return (
                  <div
                    key={ph.id}
                    className="p-3 bg-canvas border border-line rounded-xl flex flex-col gap-2 hover:border-teal-500/50 transition-colors shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-row truncate text-ink">{ph.name}</h4>
                          {ph.isOnDuty && (
                            <span className="text-[10px] bg-red-950/40 text-red-400 border border-red-600/40 px-1.5 py-0.5 rounded font-black uppercase">
                              {t('De Turno')}
                            </span>
                          )}
                          {ph.isOpen24h && (
                            <span className="text-[10px] bg-teal-950/40 text-teal-400 border border-teal-600/40 px-1.5 py-0.5 rounded font-bold">
                              24 Horas
                            </span>
                          )}
                        </div>
                        <p className="text-secondary text-ink-2 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                          <span>{ph.address}, {ph.district}</span>
                          {distance && <span className="font-bold text-teal-600 dark:text-teal-400">({distance})</span>}
                        </p>
                      </div>

                      {ph.phone && (
                        <a
                          href={`tel:${ph.phone}`}
                          onClick={() => tapFeedback()}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-secondary font-bold shrink-0 flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {t('Llamar')}
                        </a>
                      )}
                    </div>

                    {ph.essentialStock && ph.essentialStock.length > 0 && (
                      <div className="pt-1 border-t border-line/60 flex items-center gap-1 flex-wrap">
                        <span className="text-[11px] text-ink-2 font-semibold">{t('Stock clave')}:</span>
                        {ph.essentialStock.slice(0, 3).map((item, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-sunken text-ink px-1.5 py-0.5 rounded border border-line"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pestaña: Precios Genéricos DIGEMID */}
        {tab === 'precios' && (
          <div className="flex flex-col gap-2.5 max-h-[55vh] overflow-y-auto pr-1">
            <div className="p-2.5 bg-sunken rounded-lg text-secondary text-ink-2">
              <p className="text-[12px]">
                💡 {t('Precios máximos y referenciales del Observatorio DIGEMID para medicamentos genéricos esenciales en farmacias públicas y privadas.')}
              </p>
            </div>

            {filteredMedicines.map((med, idx) => (
              <div
                key={idx}
                className="p-3 bg-canvas border border-line rounded-xl flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-row text-ink truncate">{med.name}</h4>
                    <span className="text-[10px] bg-teal-950/30 text-teal-400 border border-teal-600/30 px-1.5 py-0.2 rounded capitalize">
                      {med.category.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-secondary text-ink-2 text-[12px]">{med.dosage}</p>
                  <p className="text-[11px] text-ink-2 font-mono">DCI: {med.genericName}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="block text-[10px] text-ink-2 uppercase font-bold">{t('Ref. DIGEMID')}</span>
                  <span className="text-row font-black text-emerald-600 dark:text-emerald-400">
                    S/ {med.referencePriceSoles.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
