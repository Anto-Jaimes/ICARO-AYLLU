import React from 'react';
import { ExternalLink, Radio } from 'lucide-react';
import { RADIO_NACIONAL_APP_URL, RADIO_NACIONAL_INFO_URL } from '../services/emergencyRadioService';
import { BottomSheet } from './BottomSheet';
import { useT } from '../i18n/LanguageContext';

/** Radio Nacional: the official app with internet, a battery radio without it. */
export const RadioSheet: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const t = useT();
  return (
    <BottomSheet open={open} onClose={onClose} title={t('Radio Nacional')}>
      <div className="px-4 space-y-4" style={{ paddingBottom: 'calc(16px + var(--safe-bottom))' }}>
        <p className="text-secondary">
          {t('Radio Nacional (IRTP) es la radio del Estado: en una emergencia transmite los comunicados oficiales.')}
        </p>
        <p className="flex gap-3 p-3 rounded-lg bg-sunken text-secondary">
          <Radio className="w-6 h-6 shrink-0 text-primary" aria-hidden="true" />
          {t('Sin internet, sintonízala en una radio a pilas. En Lima es 103.9 FM.')}
        </p>
        <a href={RADIO_NACIONAL_APP_URL} target="_blank" rel="noreferrer" className="btn btn-primary no-underline">
          <ExternalLink className="w-6 h-6" aria-hidden="true" />
          {t('Abrir la app oficial')}
        </a>
        <a href={RADIO_NACIONAL_INFO_URL} target="_blank" rel="noreferrer" className="btn btn-secondary no-underline">
          {t('Otras formas de escucharla (gob.pe)')}
        </a>
      </div>
    </BottomSheet>
  );
};
