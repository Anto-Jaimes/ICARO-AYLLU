import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Flame, 
  MapPin, 
  Phone, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  Sparkles, 
  Truck 
} from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { 
  GasDistributor, 
  getCachedGasDistributors 
} from '../services/gasService';
import { describeDistance } from '../utils/geo';
import { tapFeedback } from '../lib/native';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n/LanguageContext';

interface GasFacilitoSheetProps {
  open: boolean;
  onClose: () => void;
}

export const GasFacilitoSheet: React.FC<GasFacilitoSheetProps> = ({ open, onClose }) => {
  const { userLocation } = useApp();
  const t = useT();
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('todas');

  const vendors: GasDistributor[] = getCachedGasDistributors(userLocation.lat, userLocation.lng);

  const filtered = vendors.filter((v) => {
    if (selectedBrand !== 'todas' && v.brand !== selectedBrand) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.district.toLowerCase().includes(q) ||
      v.brand.toLowerCase().includes(q) ||
      v.address.toLowerCase().includes(q)
    );
  });

  const brands = ['todas', 'Solgas', 'Llamagas', 'Primax Gas', 'Zeta Gas', 'Lima Gas', 'Costagas'];

  return (
    <BottomSheet open={open} onClose={onClose} title={t('Facilito Balón de Gas (OSINERGMIN)')}>
      <div className="flex flex-col gap-3 pb-6 text-ink">
        {/* Banner Osinergmin */}
        <div className="p-3 bg-amber-950/20 border border-amber-600/40 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <p className="text-secondary font-bold text-amber-500">
                {t('Precios Oficiales de Gas GLP 10kg')}
              </p>
              <p className="text-[11px] text-amber-200/80">
                {t('Distribuidores autorizados con precinto de seguridad Osinergmin')}
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-amber-600/30 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/40 uppercase">
            {t('Precios Bajos')}
          </span>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-ink-2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Buscar distribuidora, marca o distrito...')}
            className="field pl-9 py-2 text-secondary rounded-xl w-full"
          />
        </div>

        {/* Filtro de marcas */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-secondary">
          {brands.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => {
                tapFeedback();
                setSelectedBrand(b);
              }}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-bold whitespace-nowrap transition-all ${
                selectedBrand === b
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-sunken text-ink-2 hover:text-ink'
              }`}
            >
              {b === 'todas' ? t('Todas las marcas') : b}
            </button>
          ))}
        </div>

        {/* Lista de distribuidores */}
        <div className="flex flex-col gap-2.5 max-h-[55vh] overflow-y-auto pr-1">
          {filtered.map((v, index) => {
            const distance = describeDistance(v.distanceMeters);
            const isBestPrice = index === 0;

            return (
              <div
                key={v.id}
                className={`p-3 bg-canvas border rounded-xl flex flex-col gap-2 transition-all shadow-sm ${
                  isBestPrice
                    ? 'border-emerald-600/60 bg-emerald-950/10'
                    : 'border-line hover:border-amber-500/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-row truncate text-ink">{v.name}</h4>
                      {isBestPrice && (
                        <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-black uppercase">
                          {t('Mejor Precio')}
                        </span>
                      )}
                      <span className="text-[10px] bg-sunken text-ink-2 px-1.5 py-0.5 rounded font-bold border border-line">
                        {v.brand}
                      </span>
                    </div>

                    <p className="text-secondary text-ink-2 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{v.address}, {v.district}</span>
                      {distance && <span className="font-bold text-amber-600 dark:text-amber-400">({distance})</span>}
                    </p>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-ink-2">
                      <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-3 h-3" />
                        {v.osinergminCode}
                      </span>
                      {v.hasHomeDelivery && (
                        <span className="flex items-center gap-1 text-[10px] text-ink-2">
                          <Truck className="w-3 h-3" />
                          {t('Delivery vecinal')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 gap-1.5">
                    <div className="text-right">
                      <span className="block text-[10px] text-ink-2 font-bold uppercase">{t('10 kg')}</span>
                      <span className="text-base font-black text-amber-600 dark:text-amber-400">
                        S/ {v.price10kg.toFixed(2)}
                      </span>
                    </div>

                    {v.phone && (
                      <a
                        href={`tel:${v.phone}`}
                        onClick={() => tapFeedback()}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-secondary font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {t('Pedir')}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Consejo Osinergmin */}
        <div className="p-2.5 bg-sunken rounded-lg text-secondary text-ink-2 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px]">
            {t('Recomendación OSINERGMIN: Exige que el balón tenga su precinto termoencogible intacto y no aceptes balones con abolladuras o corrosión.')}
          </p>
        </div>
      </div>
    </BottomSheet>
  );
};
