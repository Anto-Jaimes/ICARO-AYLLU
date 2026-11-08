import React, { useMemo, useState } from 'react';
import { Activity, Boxes, Flame, HandHeart, HeartPulse, Phone, Radio, Pill, ShieldAlert, ShieldCheck, TrafficCone, UsersRound, Waves, type LucideIcon } from 'lucide-react';
import { Tab, useApp } from '../context/AppContext';
import { useHazards } from '../context/HazardContext';
import { EmptyState, LoadingRow } from '../components/EmptyState';
import { CommunityItem, PostType } from '../types';
import { describeDistance } from '../utils/geo';
import { AcousticBeaconSheet } from '../components/AcousticBeaconSheet';
import { RubbleRescueSheet } from '../components/RubbleRescueSheet';
import { TriageSheet } from '../components/TriageSheet';
import { SafePlacesSheet } from '../components/SafePlacesSheet';
import { SutranAlertsSheet } from '../components/SutranAlertsSheet';
import { TacticalPanicSheet } from '../components/TacticalPanicSheet';
import { PharmacySheet } from '../components/PharmacySheet';
import { GasFacilitoSheet } from '../components/GasFacilitoSheet';
import { RadioSheet } from '../components/RadioSheet';
import { useT } from '../i18n/LanguageContext';

interface EmergencyView {
  type: PostType;
  heading: string;
  empty: string;
  icon: LucideIcon;
}

const VIEWS: Partial<Record<Tab, EmergencyView>> = {
  neighbors: { type: 'emergency_need', heading: 'Vecinos que piden ayuda', empty: 'Nadie ha pedido ayuda cerca', icon: HandHeart },
  resources: { type: 'emergency_resource', heading: 'Recursos para compartir', empty: 'Todavía no hay recursos cerca', icon: Boxes },
  groups: { type: 'support_group', heading: 'Grupos de ayuda', empty: 'Todavía no hay grupos cerca', icon: UsersRound }
};

const URGENCY_ORDER = ['critica', 'alta', 'media', 'baja'];

const EmergencyRow: React.FC<{ item: CommunityItem }> = ({ item }) => {
  const { openItem, updateItemStatus } = useApp();
  const t = useT();
  const distance = describeDistance(item.distanceMeters);
  const isNeed = item.type === 'emergency_need';
  const isOnTheWay = item.status === 'in_progress';

  return (
    <div className="px-4 py-3">
      <button type="button" onClick={() => openItem(item.id)} className="block w-full min-h-12 text-left">
        <span className="block text-row font-bold">{item.title}</span>
        <span className="block text-secondary">
          {[item.neighborhood, distance].filter(Boolean).join(', ')}
        </span>
        {isOnTheWay && <span className="block text-secondary font-bold">{t('Un vecino ya va en camino')}</span>}
      </button>

      <div className="flex gap-2 mt-2">
        {isNeed && !isOnTheWay && (
          <button type="button" className="btn btn-danger" onClick={() => updateItemStatus(item.id, 'in_progress')}>
            {t('Voy a ayudar')}
          </button>
        )}
        {item.authorPhone && (
          <a href={`tel:${item.authorPhone}`} className="btn btn-secondary">
            <Phone className="w-5 h-5" aria-hidden="true" />
            {t('Llamar')}
          </a>
        )}
      </div>
    </div>
  );
};

export const EmergencyScreen: React.FC = () => {
  const { items, tab, hasLocation, isLoadingItems } = useApp();
  const { verdict } = useHazards();
  const t = useT();
  const [isAcousticOpen, setIsAcousticOpen] = useState(false);
  const [isRubbleOpen, setIsRubbleOpen] = useState(false);
  const [isTriageOpen, setIsTriageOpen] = useState(false);
  const [isSafePlacesOpen, setIsSafePlacesOpen] = useState(false);
  const [isPharmacyOpen, setIsPharmacyOpen] = useState(false);
  const [isGasOpen, setIsGasOpen] = useState(false);
  const [isRadioOpen, setIsRadioOpen] = useState(false);
  const [isSutranOpen, setIsSutranOpen] = useState(false);
  const [isPanicOpen, setIsPanicOpen] = useState(false);
  const view = VIEWS[tab] ?? VIEWS.neighbors!;

  const posts = useMemo(() => {
    return items
      .filter((item) => item.type === view.type && item.status !== 'resolved')
      .sort(
        (a, b) =>
          URGENCY_ORDER.indexOf(a.urgencyLevel ?? 'baja') - URGENCY_ORDER.indexOf(b.urgencyLevel ?? 'baja') ||
          (hasLocation ? (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0) : 0)
      );
  }, [items, view.type, hasLocation]);

  return (
    <div className="app-nav-offset page">
      {/* Banner de Auxilio 1-Toque / Plus Code / Silbato Antirrobo */}
      <div className="mx-4 mt-2 p-3 bg-gradient-to-r from-red-950 via-rose-950 to-indigo-950 text-white rounded-2xl shadow-sm border border-red-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 border border-red-400 shadow-md">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-secondary font-bold text-slate-100 flex flex-wrap items-center gap-x-1.5 gap-y-1">
              {t('Plus Code & Silbato Vecinal')}
              <span className="text-meta whitespace-nowrap bg-red-600 text-white px-1.5 py-0.5 rounded font-black uppercase">
                1-Toque
              </span>
            </span>
            <span className="block text-caption text-slate-300 truncate">
              {t('Ubicación exacta sin internet, SMS de rescate y alarma disuasiva')}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsPanicOpen(true)}
          className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-secondary font-bold rounded-xl shrink-0 shadow transition-all active:scale-95"
        >
          {t('Abrir')}
        </button>
      </div>

      {/* In an emergency, hearing a trapped neighbour by sound can matter more than anything else. */}
      <button type="button" className="row border-b border-line" onClick={() => setIsAcousticOpen(true)}>
        <Waves className="w-6 h-6 shrink-0 text-rojo" aria-hidden="true" />
        <span className="flex-1">
          <span className="block text-row font-semibold">{t('Radar por sonido')}</span>
          <span className="block text-secondary text-ink-2">{t('Pide o escucha socorro con el parlante y el micrófono, sin internet')}</span>
        </span>
      </button>

      {/* Radio Nacional carries the official statements: the app with internet, a battery radio without it. */}
      <button type="button" className="row border-b border-line" onClick={() => setIsRadioOpen(true)}>
        <Radio className="w-6 h-6 shrink-0 text-rojo" aria-hidden="true" />
        <span className="flex-1">
          <span className="block text-row font-semibold">{t('Radio Nacional')}</span>
          <span className="block text-secondary text-ink-2">{t('Comunicados oficiales: en la app o en una radio a pilas')}</span>
        </span>
      </button>

      {/* Banner de Rescate en Escombros (Geófono y Manos Libres) */}
      <div className="mx-4 mt-2 p-3 bg-gradient-to-r from-neutral-950 to-amber-950 text-white rounded-2xl shadow-sm border border-amber-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-10 h-10 rounded-xl bg-amber-950/80 text-amber-400 flex items-center justify-center shrink-0 border border-amber-800/60 shadow-inner">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <span className="text-secondary font-bold text-slate-100 flex flex-wrap items-center gap-x-1.5 gap-y-1">
              {t('Rescate en Escombros')}
              <span className="text-meta whitespace-nowrap bg-amber-900/80 text-amber-300 px-1.5 py-0.5 rounded border border-amber-700/60 font-bold uppercase">
                {t('Geófono')}
              </span>
            </span>
            <span className="block text-caption text-slate-300 truncate">
              {t('Detecta golpes en muros y activa auxilio con la voz')}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsRubbleOpen(true)}
          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-secondary font-bold rounded-xl shrink-0 shadow transition-all active:scale-95"
        >
          {t('Abrir')}
        </button>
      </div>

      {/* Banner de Triage START & QR Rescatistas */}
      <div className="mx-4 mt-2 p-3 bg-gradient-to-r from-rose-950 to-red-950 text-white rounded-2xl shadow-sm border border-red-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-10 h-10 rounded-xl bg-red-950/80 text-red-400 flex items-center justify-center shrink-0 border border-red-800/60 shadow-inner">
            <HeartPulse className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <span className="text-secondary font-bold text-slate-100 flex flex-wrap items-center gap-x-1.5 gap-y-1">
              {t('Triage START y QR Táctico')}
              <span className="text-meta whitespace-nowrap bg-red-900/80 text-red-300 px-1.5 py-0.5 rounded border border-red-700/60 font-bold uppercase">
                {t('Bomberos 116')}
              </span>
            </span>
            <span className="block text-caption text-slate-300 truncate">
              {t('Clasifica víctimas y entrega informe en QR sin internet')}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsTriageOpen(true)}
          className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-secondary font-bold rounded-xl shrink-0 shadow transition-all active:scale-95"
        >
          {t('Abrir')}
        </button>
      </div>

      {/* Banner de Puntos Seguros y Recursos de Supervivencia */}
      <div className="mx-4 mt-2 p-3 bg-gradient-to-r from-emerald-950 to-teal-950 text-white rounded-2xl shadow-sm border border-emerald-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-800/60 shadow-inner">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-secondary font-bold text-slate-100 flex flex-wrap items-center gap-x-1.5 gap-y-1">
              {t('Puntos Seguros y Refugios')}
              <span className="text-meta whitespace-nowrap bg-emerald-900/80 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-700/60 font-bold uppercase">
                {t('Agua / Salud / Tambos')}
              </span>
            </span>
            <span className="block text-caption text-slate-300 truncate">
              {t('Hospitales, postas RENAES, tambos MIDIS y agua potable')}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsSafePlacesOpen(true)}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-secondary font-bold rounded-xl shrink-0 shadow transition-all active:scale-95"
        >
          {t('Abrir')}
        </button>
      </div>

      {/* Banner de Estado de Carreteras (SUTRAN) */}
      <div className="mx-4 mt-2 p-3 bg-gradient-to-r from-amber-950 to-orange-950 text-white rounded-2xl shadow-sm border border-amber-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-10 h-10 rounded-xl bg-amber-950/80 text-amber-400 flex items-center justify-center shrink-0 border border-amber-800/60 shadow-inner">
            <TrafficCone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-secondary font-bold text-slate-100 flex flex-wrap items-center gap-x-1.5 gap-y-1">
              {t('Estado de Carreteras')}
              <span className="text-meta whitespace-nowrap bg-amber-900/80 text-amber-300 px-1.5 py-0.5 rounded border border-amber-700/60 font-bold uppercase">
                SUTRAN
              </span>
            </span>
            <span className="block text-caption text-slate-300 truncate">
              {t('Bloqueos, huaicos y rutas transitables en carreteras')}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsSutranOpen(true)}
          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-secondary font-bold rounded-xl shrink-0 shadow transition-all active:scale-95"
        >
          {t('Abrir')}
        </button>
      </div>

      {/* Pharmacies near you (map) and medicines in DIGEMID: never "de turno", which is not published */}
      <div className="mx-4 mt-2 p-3 bg-gradient-to-r from-teal-950 to-cyan-950 text-white rounded-2xl shadow-sm border border-teal-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-10 h-10 rounded-xl bg-teal-950/80 text-teal-400 flex items-center justify-center shrink-0 border border-teal-800/60 shadow-inner">
            <Pill className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-secondary font-bold text-slate-100 flex flex-wrap items-center gap-x-1.5 gap-y-1">
              {t('Farmacias cerca')}
            </span>
            <span className="block text-caption text-slate-300 truncate">
              {t('Las del mapa, y medicinas en DIGEMID')}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsPharmacyOpen(true)}
          className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-secondary font-bold rounded-xl shrink-0 shadow transition-all active:scale-95"
        >
          {t('Abrir')}
        </button>
      </div>

      {/* The official price of gas, in Osinergmin's Facilito */}
      <div className="mx-4 mt-2 p-3 bg-gradient-to-r from-orange-950 to-amber-950 text-white rounded-2xl shadow-sm border border-amber-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-10 h-10 rounded-xl bg-amber-950/80 text-amber-400 flex items-center justify-center shrink-0 border border-amber-800/60 shadow-inner">
            <Flame className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-secondary font-bold text-slate-100 flex flex-wrap items-center gap-x-1.5 gap-y-1">
              {t('Precio del balón de gas')}
              <span className="text-meta whitespace-nowrap bg-amber-900/80 text-amber-300 px-1.5 py-0.5 rounded border border-amber-700/60 font-bold uppercase">
                OSINERGMIN
              </span>
            </span>
            <span className="block text-caption text-slate-300 truncate">
              {t('Precios oficiales en Facilito')}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsGasOpen(true)}
          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-secondary font-bold rounded-xl shrink-0 shadow transition-all active:scale-95"
        >
          {t('Abrir')}
        </button>
      </div>

      <p className="px-4 pt-3 text-secondary font-bold">{t(verdict.title)}</p>
      <h2 className="px-4 pt-3 pb-1 text-section font-bold">{t(view.heading)}</h2>

      {posts.length === 0 ? (
        isLoadingItems ? (
          <LoadingRow text={t('Buscando reportes...')} />
        ) : (
          <EmptyState icon={view.icon} title={t(view.empty)} line={t('Toca Reportar si necesitas ayuda o puedes darla.')} />
        )
      ) : (
        <ul className="list-plain grid-wide">
          {posts.map((item) => (
            <li key={item.id}><EmergencyRow item={item} /></li>
          ))}
        </ul>
      )}

      {/* Sheet de Plus Code & Silbato 1-Toque */}
      <TacticalPanicSheet
        open={isPanicOpen}
        onClose={() => setIsPanicOpen(false)}
      />

      {/* Sheet de Radar Acústico */}
      <AcousticBeaconSheet
        open={isAcousticOpen}
        onClose={() => setIsAcousticOpen(false)}
      />

      {/* Sheet de Rescate en Escombros */}
      <RubbleRescueSheet
        open={isRubbleOpen}
        onClose={() => setIsRubbleOpen(false)}
      />

      {/* Sheet de Triage START & QR Rescatistas */}
      <TriageSheet
        open={isTriageOpen}
        onClose={() => setIsTriageOpen(false)}
      />

      {/* Sheet de Puntos Seguros y Recursos */}
      <SafePlacesSheet
        open={isSafePlacesOpen}
        onClose={() => setIsSafePlacesOpen(false)}
      />

      {/* Sheet de Carreteras SUTRAN */}
      <SutranAlertsSheet
        open={isSutranOpen}
        onClose={() => setIsSutranOpen(false)}
      />

      <RadioSheet open={isRadioOpen} onClose={() => setIsRadioOpen(false)} />

      {/* Pharmacies near you */}
      <PharmacySheet
        open={isPharmacyOpen}
        onClose={() => setIsPharmacyOpen(false)}
      />

      {/* Price of gas */}
      <GasFacilitoSheet
        open={isGasOpen}
        onClose={() => setIsGasOpen(false)}
      />
    </div>
  );
};
