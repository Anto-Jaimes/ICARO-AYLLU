import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Backpack, BatteryLow, CircleHelp, HandHeart, LogIn, LogOut, Plus, Printer, Siren, Store, TriangleAlert, type LucideIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BottomSheet } from './BottomSheet';
import { EmergencyBackpackSheet } from './EmergencyBackpackSheet';
import { UserCodeSection } from './UserCodeSection';
import { WebKeySection } from './WebKeySection';
import { signOutOfWeb } from '../services/webLoginService';
import { useT } from '../i18n/LanguageContext';
import { LanguagePicker } from './LanguagePicker';

interface Slide {
  icon: LucideIcon;
  title: string;
  text: string;
}

const SLIDES: Slide[] = [
  {
    icon: TriangleAlert,
    title: 'Mira si tu zona está bien',
    text: 'Arriba verás un color y una frase con las alertas oficiales de tu zona.'
  },
  {
    icon: Store,
    title: 'Encuentra y ayuda a tus vecinos',
    text: 'Busca servicios que otros vecinos recomiendan, y regala o pide donaciones sin dinero.'
  },
  {
    icon: Plus,
    title: 'Publica con 3 toques',
    text: 'Toca Publicar y elige: avisar de un accidente o huaico con foto o video, ofrecer tu trabajo, o pedir un favor.'
  },
  {
    icon: Siren,
    title: 'En una emergencia, toca SOS',
    text: 'Está siempre abajo a la derecha. Llama a los números de auxilio aunque no tengas internet.'
  }
];

export const TutorialSheet: React.FC = () => {
  const t = useT();
  const { isTutorialOpen, setIsTutorialOpen } = useApp();
  const [slide, setSlide] = useState(0);

  const finish = () => {
    localStorage.setItem('icaro_ayllu_tutorial_seen', 'true');
    setIsTutorialOpen(false);
    setSlide(0);
  };

  const { icon: Icon, title, text } = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  return (
    <BottomSheet
      open={isTutorialOpen}
      onClose={finish}
      title={t("Cómo se usa")}
      footer={
        <button type="button" className="btn btn-primary" onClick={() => (isLast ? finish() : setSlide(slide + 1))}>
          {isLast ? t('Empezar') : t('Siguiente')}
        </button>
      }
    >
      <div className="px-4 pb-4">
        <Icon className="w-10 h-10 text-anil" aria-hidden="true" />
        <h3 className="mt-3 text-section font-bold">{t(title)}</h3>
        <p className="mt-1">{t(text)}</p>
        <p className="mt-3 text-meta text-ink-2">{t('Paso {step} de {total}', { step: slide + 1, total: SLIDES.length })}</p>
      </div>
    </BottomSheet>
  );
};

export const MenuSheet: React.FC = () => {
  const { isMenuOpen, setIsMenuOpen, setIsTutorialOpen, setIsMuralOpen, setIsBatterySaver, canWrite, isWebMember, openAccess, showNotice } = useApp();
  const [isBackpackOpen, setIsBackpackOpen] = useState(false);
  const isNative = Capacitor.isNativePlatform();
  const t = useT();

  const leaveWeb = async () => {
    setIsMenuOpen(false);
    await signOutOfWeb();
    showNotice(t('Saliste de la web en esta computadora. Tu celular sigue igual.'));
  };

  return (
    <>
      <EmergencyBackpackSheet open={isBackpackOpen} onClose={() => setIsBackpackOpen(false)} />
      <BottomSheet open={isMenuOpen} onClose={() => setIsMenuOpen(false)} title={t('Ayuda')}>
        <div style={{ paddingBottom: 'calc(16px + var(--safe-bottom))' }}>
          {/* A code comes only from the app: on the web it shows once entered with it, never creates one. */}
          {canWrite && <UserCodeSection isVisible={isMenuOpen} />}
          {isNative && <WebKeySection isVisible={isMenuOpen} />}
          <LanguagePicker />
          <ul className="list-plain">
            {!isNative && (
              <li>
                <button
                  type="button"
                  className="row"
                  onClick={() => {
                    if (isWebMember) {
                      leaveWeb();
                    } else {
                      setIsMenuOpen(false);
                      openAccess();
                    }
                  }}
                >
                  {isWebMember
                    ? <LogOut className="w-6 h-6 shrink-0 text-anil" aria-hidden="true" />
                    : <LogIn className="w-6 h-6 shrink-0 text-anil" aria-hidden="true" />}
                  <span className="flex-1">
                    <span className="block text-row font-semibold">{t(isWebMember ? 'Salir de la web en esta computadora' : 'Entrar con mi código')}</span>
                    <span className="block text-secondary text-ink-2">
                      {t(isWebMember ? 'Tu celular sigue con tu cuenta' : 'Para publicar, comentar y llamar')}
                    </span>
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
