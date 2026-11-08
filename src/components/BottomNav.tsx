import React from 'react';
import { Boxes, Gift, HandHeart, Home, Map, Plus, Siren, Store, UsersRound, type LucideIcon } from 'lucide-react';
import { Tab, useApp } from '../context/AppContext';
import { useLanguage } from '../i18n/LanguageContext';
import { translateShort } from '../i18n/translate';
import { tapFeedback } from '../lib/native';

interface NavItem {
  tab: Tab;
  label: string;
  icon: LucideIcon;
}

const NORMAL_ITEMS: NavItem[] = [
  { tab: 'home', label: 'Inicio', icon: Home },
  { tab: 'services', label: 'Servicios', icon: Store },
  { tab: 'favors', label: 'Donaciones', icon: Gift },
  { tab: 'map', label: 'Mapa', icon: Map }
];

const EMERGENCY_ITEMS: NavItem[] = [
  { tab: 'neighbors', label: 'Vecinos', icon: HandHeart },
  { tab: 'resources', label: 'Recursos', icon: Boxes },
  { tab: 'groups', label: 'Grupos', icon: UsersRound },
  { tab: 'map', label: 'Mapa', icon: Map }
];

const CELL = 'flex-1 min-w-0 flex flex-col items-center justify-center gap-1 h-[72px] text-meta lg:flex-none lg:flex-row lg:justify-start lg:gap-3 lg:h-14 lg:px-4 lg:text-secondary lg:w-full';

export const BottomNav: React.FC = () => {
  const { mode, tab, setTab, setIsSosOpen, isAlertsOpen, isNewsOpen, openPublish } = useApp();
  const { lang, t } = useLanguage();
  const isEmergency = mode === 'emergency';
  const items = isEmergency ? EMERGENCY_ITEMS : NORMAL_ITEMS;

  return (
    <nav
      aria-label={t('Principal')}
      className={`fixed z-30 bottom-0 inset-x-0 flex lg:top-0 lg:right-auto lg:w-60 lg:flex-col lg:gap-1 lg:p-3 ${
        isEmergency ? 'bg-rojo text-white' : 'bg-surface border-t border-line lg:border-t-0 lg:border-r'
      }`}
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      <p className="hidden lg:flex items-center gap-3 px-4 pt-3 pb-4 text-title font-bold">
        <img src="/logo.png" alt="" className="w-9 h-9" />
        AYLLU
      </p>

      <button
        type="button"
        data-tour="publish"
        onClick={() => openPublish()}
        className={`hidden lg:flex items-center justify-center gap-2 min-h-14 mb-3 rounded-lg font-bold text-row ${
          isEmergency ? 'bg-white text-rojo' : 'bg-anil active:bg-anil-press text-white'
        }`}
      >
        <Plus className="w-6 h-6" aria-hidden="true" />
        {t(isEmergency ? 'Reportar' : 'Publicar')}
      </button>

      {items.map(({ tab: target, label, icon: Icon }) => {
        const isActive = tab === target && !isAlertsOpen && !isNewsOpen;
        const activeStyle = isEmergency
          ? 'bg-white text-rojo font-bold'
          : 'text-anil font-bold shadow-[inset_0_3px_0_var(--color-anil)] lg:shadow-none lg:bg-sunken lg:rounded-lg';
        const idleStyle = isEmergency ? 'font-medium' : 'text-ink-2 font-medium';

        return (
          <button
            key={target}
            type="button"
            data-tour={`tab-${target}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => setTab(target)}
            className={`${CELL} ${isActive ? activeStyle : idleStyle}`}
          >
            <Icon className="w-6 h-6 shrink-0" aria-hidden="true" />
            {translateShort(lang, label) === t(label) ? (
              <span className="max-w-full truncate">{t(label)}</span>
            ) : (
              <>
                {/* The phone's bar is narrow: a shorter word there, the whole one in the computer's side bar. */}
                <span className="max-w-full truncate lg:hidden">{translateShort(lang, label)}</span>
                <span className="hidden lg:inline max-w-full truncate">{t(label)}</span>
              </>
            )}
          </button>
        );
      })}

      <button
        type="button"
        data-tour="sos"
        onClick={() => {
          tapFeedback();
          setIsSosOpen(true);
        }}
        className={`${CELL} lg:mt-auto lg:rounded-lg font-bold text-white ${isEmergency ? 'bg-black' : 'bg-rojo active:bg-rojo-press'}`}
      >
        <Siren className="w-6 h-6 shrink-0" aria-hidden="true" />
        <span>SOS</span>
      </button>
    </nav>
  );
};
