import React from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { FACILITO_GLP_URL, GAS_SAFETY_TIPS } from '../services/gasService';
import { BottomSheet } from './BottomSheet';
import { useT } from '../i18n/LanguageContext';

interface GasFacilitoSheetProps {
  open: boolean;
  onClose: () => void;
}

/** Where to see the official price of a gas cylinder near you, and how to use gas safely. */
export const GasFacilitoSheet: React.FC<GasFacilitoSheetProps> = ({ open, onClose }) => {
  const t = useT();

  return (
    <BottomSheet open={open} onClose={onClose} title={t('Precio del balón de gas')}>
      <div className="px-4 space-y-4" style={{ paddingBottom: 'calc(16px + var(--safe-bottom))' }}>
        <p className="text-secondary">
          {t('Facilito, de Osinergmin, muestra el precio del balón de gas de 10 kg en los locales formales de tu distrito, con su dirección y teléfono.')}
        </p>
        <p className="text-secondary text-ink-2">{t('Ahí elige "GLP", luego "GLP envasado" y tu distrito.')}</p>
        <a href={FACILITO_GLP_URL} target="_blank" rel="noreferrer" className="btn btn-primary no-underline">
          <ExternalLink className="w-6 h-6" aria-hidden="true" />
          {t('Ver precios en Facilito')}
        </a>

        <section aria-labelledby="gas-safety-title" className="pt-2">
          <h3 id="gas-safety-title" className="text-row font-bold">{t('Para usar el gas con cuidado')}</h3>
          <ul className="pt-2 space-y-3">
            {GAS_SAFETY_TIPS.map((tip) => (
              <li key={tip} className="flex gap-3 text-secondary">
                <ShieldCheck className="w-6 h-6 shrink-0 text-verde" aria-hidden="true" />
                <span>{t(tip)}</span>
              </li>
            ))}
          </ul>
        </section>
        <p className="text-meta text-ink-2">{t('Precios oficiales: Osinergmin (Facilito).')}</p>
      </div>
    </BottomSheet>
  );
};
