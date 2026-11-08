import React, { useEffect, useMemo, useState } from 'react';
import { Ban, ChevronDown, CircleCheck, ExternalLink, MapPin, MessageCircle, Phone, TriangleAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  arrangeRoads, fetchRoadEvents, MTC_MAP_URL, NEAR_KM, ROAD_CONTACTS, routeTitle, savedRoads, type RoadEventNear, type SavedRoads
} from '../services/roadsService';
import { formatRelativeTime } from '../utils/time';
import { BottomSheet } from './BottomSheet';
import { useT } from '../i18n/LanguageContext';

const PAGE = 15;

/** 'Hace 25 días' reads 'desde hace 25 días'; an older date stays a date. */
const sinceText = (iso: string) => {
  const text = formatRelativeTime(iso);
  return /^\d/.test(text) ? text : text.charAt(0).toLowerCase() + text.slice(1);
};
/** The MTC updates during the day; a copy younger than this is not asked again. */
const FRESH_MS = 10 * 60_000;

/**
 * "Carreteras": national roads closed or with restricted passage, from the MTC's emergency centre.
 * One sentence answers "can I travel?", then the roads nearest first, then who to call.
 */
export const RoadsSheet: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { userLocation, hasLocation, isOnline } = useApp();
  const t = useT();
  const [data, setData] = useState<SavedRoads | null>(savedRoads);
  const [isLoading, setIsLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [nearOnly, setNearOnly] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    if (!open) return;
    setOpenId(null);
    setShown(PAGE);
    const saved = savedRoads();
    if (saved && Date.now() - new Date(saved.savedAt).getTime() < FRESH_MS) return;
    if (!isOnline) {
      setFailed(true);
      return;
    }
    setIsLoading(true);
    setFailed(false);
    fetchRoadEvents()
      .then(setData)
      .catch(() => setFailed(true))
      .finally(() => setIsLoading(false));
  }, [open, isOnline]);

  const here = hasLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null;
  const near = nearOnly && here !== null;
  const roads = useMemo(() => (data ? arrangeRoads(data.events, here, near) : []), [data, here?.lat, here?.lng, near]);
  const closed = roads.filter((road) => road.status === 'closed').length;
  const restricted = roads.length - closed;

  const summary = (() => {
    if (!data) return null;
    if (roads.length === 0) {
      return near
        ? t('Cerca de ti ({km} km) no hay vías nacionales cerradas ni con paso restringido.', { km: NEAR_KM })
        : t('No hay vías nacionales cerradas ni con paso restringido.');
    }
    const parts = [
      closed === 1 ? t('1 vía cerrada') : closed > 1 ? t('{count} vías cerradas', { count: closed }) : null,
      restricted === 1 ? t('1 con paso restringido') : restricted > 1 ? t('{count} con paso restringido', { count: restricted }) : null
    ].filter(Boolean).join(t(' y '));
    return near ? t('Cerca de ti: {summary}.', { summary: parts }) : t('En todo el Perú: {summary}.', { summary: parts });
  })();

  return (
    <BottomSheet open={open} onClose={onClose} title={t('Carreteras')}>
      <div style={{ paddingBottom: 'calc(16px + var(--safe-bottom))' }}>
        <div role="group" aria-label={t('Qué carreteras ver')} className="flex gap-2 px-4">
          {[true, false].map((value) => (
            <button
              key={String(value)}
              type="button"
              aria-pressed={near === value}
              disabled={value && !hasLocation}
              onClick={() => {
                setNearOnly(value);
                setShown(PAGE);
                setOpenId(null);
              }}
              className={`flex-1 min-h-12 rounded-lg border-2 text-secondary font-bold disabled:opacity-50 ${near === value ? 'bg-primary border-primary text-white' : 'bg-surface border-border text-ink'}`}
            >
              {value ? t('Cerca de ti') : t('Todo el Perú')}
            </button>
          ))}
        </div>
        {!hasLocation && <p className="px-4 pt-2 text-meta text-ink-secondary">{t('Activa tu ubicación para ver solo las de tu zona.')}</p>}

        {isLoading && !data && <p role="status" className="px-4 pt-4 text-secondary text-ink-secondary">{t('Consultando al MTC...')}</p>}
        {!data && failed && !isLoading && (
          <p role="alert" className="mx-4 mt-4 p-3 rounded-lg bg-sunken text-secondary">{t('No se pudo consultar al MTC. Revisa tu internet y vuelve a abrir esta sección.')}</p>
        )}

        {summary && (
          <p role="status" className="mx-4 mt-4 flex gap-3 items-start text-row font-bold">
            {roads.length === 0
              ? <CircleCheck className="w-7 h-7 shrink-0 text-status-safe" aria-hidden="true" />
              : closed > 0
                ? <Ban className="w-7 h-7 shrink-0 text-status-danger" aria-hidden="true" />
                : <span className="status-tile bg-status-severe text-ink w-7 h-7"><TriangleAlert className="w-5 h-5" aria-hidden="true" /></span>}
            <span>{summary}</span>
          </p>
        )}
        {data && failed && (
          <p className="px-4 pt-1 text-meta text-ink-secondary">{t('Sin conexión con el MTC. Datos guardados {time}.', { time: formatRelativeTime(data.savedAt).toLowerCase() })}</p>
        )}

        {roads.length > 0 && (
          <ul className="list-plain pt-2">
            {roads.slice(0, shown).map((road) => (
              <RoadRow key={road.id} road={road} isOpen={openId === road.id} onToggle={() => setOpenId(openId === road.id ? null : road.id)} />
            ))}
          </ul>
        )}
        {roads.length > shown && (
          <div className="px-4 pt-2">
            <button type="button" className="btn btn-secondary" onClick={() => setShown(shown + PAGE)}>
              {t('Ver más ({count})', { count: roads.length - shown })}
            </button>
          </div>
        )}

        <section aria-labelledby="roads-source" className="px-4 pt-5 space-y-2">
          <p id="roads-source" className="text-meta text-ink-secondary">
            {data
              ? t('Fuente: MTC, Centro de Operaciones de Emergencia. Consultado {time}.', { time: formatRelativeTime(data.savedAt).toLowerCase() })
              : t('Fuente: MTC, Centro de Operaciones de Emergencia.')}
          </p>
          <a href={MTC_MAP_URL} target="_blank" rel="noreferrer" className="btn btn-secondary no-underline">
            <ExternalLink className="w-6 h-6" aria-hidden="true" />
            {t('Ver el mapa oficial del MTC')}
          </a>
        </section>

        <section aria-labelledby="roads-help" className="pt-5">
          <h3 id="roads-help" className="px-4 text-row font-bold">{t('¿Pasó algo en la carretera?')}</h3>
          <ul className="list-plain">
            <ContactRow href={`tel:${ROAD_CONTACTS.police}`} icon={Phone} title={t('Policía de Carreteras')} line="110" />
            <ContactRow href={`tel:${ROAD_CONTACTS.sutranFree}`} icon={Phone} title={t('SUTRAN, línea gratuita')} line={ROAD_CONTACTS.sutranFreeLabel} />
            <ContactRow
              href={`https://wa.me/${ROAD_CONTACTS.fiscafonoWhatsapp}`}
              icon={MessageCircle}
              title={t('Denunciar a un bus o camión (Fiscafono de SUTRAN)')}
              line={`WhatsApp ${ROAD_CONTACTS.fiscafonoLabel}`}
              external
            />
          </ul>
        </section>
      </div>
    </BottomSheet>
  );
};

const RoadRow: React.FC<{ road: RoadEventNear; isOpen: boolean; onToggle: () => void }> = ({ road, isOpen, onToggle }) => {
  const t = useT();
  const isClosed = road.status === 'closed';
  const Icon = isClosed ? Ban : TriangleAlert;
  const where = [road.place, road.distanceKm !== null ? t('a {km} km', { km: road.distanceKm }) : null].filter(Boolean).join(', ');
  return (
    <li>
      <button type="button" className="row" aria-expanded={isOpen} onClick={onToggle}>
        {isClosed
          ? <Icon className="w-6 h-6 shrink-0 text-status-danger" aria-hidden="true" />
          : <span className="status-tile bg-status-severe text-ink w-6 h-6"><Icon className="w-4 h-4" aria-hidden="true" /></span>}
        <span className="flex-1 min-w-0">
          <span className="block text-row font-semibold">{routeTitle(road.route)}</span>
          <span className="block text-secondary">
            <strong className={isClosed ? 'text-status-danger' : 'text-ink'}>{isClosed ? t('Cerrada') : t('Paso restringido')}</strong>
            {road.cause ? `. ${road.cause}` : ''}
          </span>
          <span className="block text-secondary text-ink-secondary">{where}. {t('Desde {when}', { when: sinceText(road.date) })}</span>
        </span>
        <ChevronDown className={`w-5 h-5 shrink-0 text-ink-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 -mt-1 space-y-2 text-secondary">
          {road.section && <p>{road.section}</p>}
          {road.facts && <p><strong>{t('Qué pasó:')}</strong> {road.facts}</p>}
          {road.latest && <p><strong>{t('Última novedad:')}</strong> {road.latest}</p>}
          <a href={`https://maps.google.com/?q=${road.lat},${road.lng}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 min-h-12 font-bold text-primary">
            <MapPin className="w-5 h-5" aria-hidden="true" />
            {t('Ver en el mapa')}
          </a>
        </div>
      )}
    </li>
  );
};

const ContactRow: React.FC<{ href: string; icon: typeof Phone; title: string; line: string; external?: boolean }> = ({ href, icon: Icon, title, line, external }) => (
  <li>
    <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className="row no-underline">
      <Icon className="w-6 h-6 shrink-0 text-primary" aria-hidden="true" />
      <span className="flex-1 min-w-0">
        <span className="block text-row font-semibold">{title}</span>
        <span className="block text-secondary text-ink-secondary">{line}</span>
      </span>
    </a>
  </li>
);
