import React, { useEffect, useState } from 'react';
import { LogOut, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { myVerifiedPhone } from '../services/accountService';
import { formatPhone } from '../services/callService';
import { cachedUserCode } from '../services/userCodeService';
import { BottomSheet } from './BottomSheet';
import { FreeCallSheet } from './FreeCallSheet';
import { useT } from '../i18n/LanguageContext';

type PhoneState = { status: 'loading' } | { status: 'known'; phone: string | null } | { status: 'unknown' };

/**
 * Confirms "Cerrar sesión" in the app. Coming back needs the verified number, so without one the
 * neighbour is told plainly that this account (code and posts) cannot be reached again.
 */
export const SignOutSheet: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { signOut, showNotice, setIsMenuOpen } = useApp();
  const [phoneState, setPhoneState] = useState<PhoneState>({ status: 'loading' });
  const [isVerifying, setIsVerifying] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const t = useT();
  const code = cachedUserCode();

  useEffect(() => {
    if (!open || isVerifying) return;
    let isCurrent = true;
    setPhoneState({ status: 'loading' });
    myVerifiedPhone()
      .then((phone) => isCurrent && setPhoneState({ status: 'known', phone }))
      .catch(() => isCurrent && setPhoneState({ status: 'unknown' }));
    return () => {
      isCurrent = false;
    };
  }, [open, isVerifying]);

  const leave = async () => {
    setIsBusy(true);
    try {
      await signOut();
      onClose();
      setIsMenuOpen(false);
      showNotice(t('Cerraste sesión en este celular. Para volver, toca Ayuda y "Entrar con mi número".'));
    } finally {
      setIsBusy(false);
    }
  };

  const phone = phoneState.status === 'known' ? phoneState.phone : null;
  const hasNoPhone = phoneState.status === 'known' && !phoneState.phone;

  return (
    <>
      <FreeCallSheet open={isVerifying} onClose={() => setIsVerifying(false)} />
      <BottomSheet open={open && !isVerifying} onClose={onClose} title={t('Cerrar sesión')}>
        <div className="px-4 space-y-4" style={{ paddingBottom: 'calc(16px + var(--safe-bottom))' }}>
          {phoneState.status === 'loading' && <p role="status" className="text-secondary text-ink-2">{t('Cargando...')}</p>}

          {phone && (
            <p className="flex gap-3 text-secondary">
              <ShieldCheck className="w-6 h-6 shrink-0 text-verde" aria-hidden="true" />
              <span>
                {t('Para volver a esta cuenta toca "Entrar con mi número": te llamaremos al {phone} y te dictaremos un código.', { phone: formatPhone(phone) })}
              </span>
            </p>
          )}

          {hasNoPhone && (
            <div role="alert" className="flex gap-3 p-3 rounded-lg bg-sunken">
              <TriangleAlert className="w-6 h-6 shrink-0 text-rojo" aria-hidden="true" />
              <p className="text-secondary">
                <strong className="block">{t('Tu número no está verificado.')}</strong>
                {code
                  ? t('Si cierras sesión, no podrás volver a esta cuenta (código {code}) ni a tus publicaciones.', { code })
                  : t('Si cierras sesión, no podrás volver a esta cuenta ni a tus publicaciones.')}
              </p>
            </div>
          )}

          {phoneState.status === 'unknown' && (
            <p role="status" className="p-3 rounded-lg bg-sunken text-secondary">
              {t('Sin internet no podemos revisar si tu número está verificado. Sin un número verificado no podrás volver a esta cuenta.')}
            </p>
          )}

          {hasNoPhone && (
            <button type="button" className="btn btn-primary" onClick={() => setIsVerifying(true)}>
              <ShieldCheck className="w-6 h-6" aria-hidden="true" />
              {t('Verificar mi número primero')}
            </button>
          )}

          {phoneState.status !== 'loading' && (
            <button type="button" className={phone ? 'btn btn-danger' : 'btn btn-secondary'} disabled={isBusy} onClick={leave}>
              <LogOut className="w-6 h-6" aria-hidden="true" />
              {phone ? t('Cerrar sesión') : t('Cerrar sesión igual')}
            </button>
          )}

          <button type="button" className="btn btn-secondary" onClick={onClose}>{t('Cancelar')}</button>
        </div>
      </BottomSheet>
    </>
  );
};
