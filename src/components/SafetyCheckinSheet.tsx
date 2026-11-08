import React from 'react';
import { CircleCheck, MessageSquareWarning } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n/LanguageContext';
import { SAFE_OPENING, SOS_OPENING, smsLink } from '../utils/sosMessage';
import { BottomSheet } from './BottomSheet';
import { ExactReferenceField } from './ExactReferenceField';
import { placeLabel } from '../services/geoService';

interface SafetyCheckinSheetProps {
  open: boolean;
  onClose: () => void;
}

/** Tells the family by text message: it gets through when calls are jammed and there is no internet. */
export const SafetyCheckinSheet: React.FC<SafetyCheckinSheetProps> = ({ open, onClose }) => {
  const { userLocation, hasLocation } = useApp();
  const t = useT();

  return (
    <BottomSheet open={open} onClose={onClose} title={t('Avisar a tu familia')}>
      <div className="px-4 space-y-3" style={{ paddingBottom: 'calc(16px + var(--safe-bottom))' }}>
        <p className="text-secondary text-ink-secondary">
          {t('Después de un sismo las llamadas se saturan. Un mensaje de texto llega aunque no tengas internet. Se abrirá tu app de mensajes para que elijas a quién enviarlo.')}
        </p>
        <ExactReferenceField />
        <a href={smsLink(SAFE_OPENING, userLocation, hasLocation)} onClick={onClose} className="btn bg-status-safe text-white">
          <CircleCheck className="w-6 h-6" aria-hidden="true" />
          {t('Estoy a salvo')}
        </a>
        <a href={smsLink(SOS_OPENING, userLocation, hasLocation)} onClick={onClose} className="btn btn-danger">
          <MessageSquareWarning className="w-6 h-6" aria-hidden="true" />
          {t('Necesito ayuda')}
        </a>
        <p className="text-meta text-ink-secondary">
          {hasLocation
            ? t('El mensaje lleva tu ubicación: {place}.', { place: placeLabel(userLocation.name) })
            : t('No sabemos dónde estás: el mensaje no llevará tu ubicación.')}
        </p>
      </div>
    </BottomSheet>
  );
};
