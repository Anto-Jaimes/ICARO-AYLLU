import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Backpack, BatteryLow, Bell, BellOff, CircleHelp, HandHeart, LogIn, LogOut, Printer } from 'lucide-react';
import { pushChoice } from '../services/pushService';
import { useApp } from '../context/AppContext';
import { BottomSheet } from './BottomSheet';
import { EmergencyBackpackSheet } from './EmergencyBackpackSheet';
import { UserCodeSection } from './UserCodeSection';
import { WebKeySection } from './WebKeySection';
import { SignOutSheet } from './SignOutSheet';
import { signOutOfWeb } from '../services/webLoginService';
import { useT } from '../i18n/LanguageContext';
import { LanguagePicker } from './LanguagePicker';

export const MenuSheet: React.FC = () => {
  const { isMenuOpen, setIsMenuOpen, setIsTutorialOpen, setIsMuralOpen, setIsBatterySaver, setIsPushOpen, canWrite, openAccess, showNotice } = useApp();
  const [isBackpackOpen, setIsBackpackOpen] = useState(false);
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const isNative = Capacitor.isNativePlatform();
  const t = useT();

  const leaveWeb = async () => {
    setIsMenuOpen(false);
    await signOutOfWeb();
    showNotice(t('Cerraste sesión en esta computadora. Tu celular sigue con tu cuenta.'));
  };

  return (
    <>
      <EmergencyBackpackSheet open={isBackpackOpen} onClose={() => setIsBackpackOpen(false)} />
      {isNative && <SignOutSheet open={isSignOutOpen} onClose={() => setIsSignOutOpen(false)} />}
      <BottomSheet open={isMenuOpen} onClose={() => setIsMenuOpen(false)} title={t('Ayuda')}>
        <div style={{ paddingBottom: 'calc(16px + var(--safe-bottom))' }}>
          {/* A code comes only from the app: on the web it shows once entered with it, never creates one. */}
          {canWrite && <UserCodeSection isVisible={isMenuOpen} />}
          {isNative && canWrite && <WebKeySection isVisible={isMenuOpen} />}
          <LanguagePicker />
          <ul className="list-plain">
            <li>
              <button
                type="button"
                className="row"
                onClick={() => {
                  if (canWrite) {
                    if (isNative) {
                      setIsMenuOpen(false);
                      setIsSignOutOpen(true);
                    } else {
                      leaveWeb();
                    }
                  } else {
                    setIsMenuOpen(false);
                    openAccess();
                  }
                }}
              >
                {canWrite
                  ? <LogOut className="w-6 h-6 shrink-0 text-anil" aria-hidden="true" />
                  : <LogIn className="w-6 h-6 shrink-0 text-anil" aria-hidden="true" />}
                <span className="flex-1">
                  <span className="block text-row font-semibold">
                    {t(canWrite ? 'Cerrar sesión' : isNative ? 'Entrar con mi número' : 'Entrar con mi código')}
                  </span>
                  <span className="block text-secondary text-ink-2">
                    {t(canWrite
                      ? (isNative ? 'Para volver, entras con tu número' : 'Solo en esta computadora. Tu celular sigue con tu cuenta')
                      : 'Para publicar, comentar y llamar')}
                  </span>
                </span>
              </button>
            </li>
            {isNative && canWrite && (
              <li>
                <button
                  type="button"
                  className="row"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsPushOpen(true);
                  }}
                >
                  {pushChoice() === 'on'
                    ? <Bell className="w-6 h-6 shrink-0 text-anil" aria-hidden="true" />
                    : <BellOff className="w-6 h-6 shrink-0 text-anil" aria-hidden="true" />}
                  <span className="flex-1">
                    <span className="block text-row font-semibold">{t('Avisos en tu celular')}</span>
                    <span className="block text-secondary text-ink-2">{t(pushChoice() === 'on' ? 'Activados' : 'Desactivados')}</span>
                  </span>
                </button>
              </li>
            )}
            <li>
              <button
                type="button"
                className="row"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsTutorialOpen(true);
                }}
              >
                <CircleHelp className="w-6 h-6 shrink-0 text-anil" aria-hidden="true" />
                <span className="flex-1 text-row font-semibold">{t('Cómo se usa')}</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="row"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsMuralOpen(true);
                }}
              >
                <Printer className="w-6 h-6 shrink-0 text-anil" aria-hidden="true" />
                <span className="flex-1 text-row font-semibold">{t('Imprimir mural comunal')}</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="row"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsBatterySaver(true);
                }}
              >
                <BatteryLow className="w-6 h-6 shrink-0 text-anil" aria-hidden="true" />
                <span className="flex-1">
                  <span className="block text-row font-semibold">{t('Modo apagón')}</span>
                  <span className="block text-secondary text-ink-2">{t('Pantalla negra para cuidar la batería')}</span>
                </span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="row"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsBackpackOpen(true);
                }}
              >
                <Backpack className="w-6 h-6 shrink-0 text-anil" aria-hidden="true" />
                <span className="flex-1">
                  <span className="block text-row font-semibold">{t('Mochila de emergencia')}</span>
                  <span className="block text-secondary text-ink-2">{t('Revisa qué te falta antes de un sismo')}</span>
                </span>
              </button>
            </li>
          </ul>
          <section className="px-4 pt-4 border-t border-line">
            <h3 className="flex items-center gap-2 text-row font-bold">
              <HandHeart className="w-5 h-5 text-anil" aria-hidden="true" />
              {t('Qué es el ayllu')}
            </h3>
            <p className="mt-1 text-secondary text-ink-2">
              {t('Es la comunidad andina que se ayuda entre sí. Esta app conecta a los vecinos de tu barrio.')}
            </p>
            <h3 className="mt-4 text-row font-bold">{t('De dónde vienen las alertas')}</h3>
            <p className="mt-1 text-secondary text-ink-2">
              {t('Sismos del IGP. Huaicos, lluvias y avisos de SENAMHI. Son datos oficiales del Perú. Ante una emergencia, sigue a las autoridades.')}
            </p>
          </section>
        </div>
      </BottomSheet>
    </>
  );
};
