import { useT } from '../i18n/LanguageContext';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { MIN_SEARCH_LENGTH, searchPlaces, type PlaceResult } from '../services/geoService';
import type { MapPoint } from '../services/myPlaces';
import { useBackHandler } from '../hooks/useBackHandler';

// A pause in typing, not every letter, becomes a request (Nominatim allows one per second).
const SEARCH_DEBOUNCE_MS = 700;

type SearchStatus = 'idle' | 'searching' | 'done' | 'error';

interface MapSearchProps {
  near: MapPoint | null;
  isOnline: boolean;
  /** "a 850 m", or null without a real position. */
  distanceTo: (point: MapPoint) => string | null;
  onPick: (place: PlaceResult) => void;
  onClear: () => void;
}

export const MapSearch: React.FC<MapSearchProps> = ({ near, isOnline, distanceTo, onPick, onClear }) => {
  const t = useT();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [resultsFor, setResultsFor] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const boxRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nearRef = useRef(near);
  useEffect(() => {
    nearRef.current = near;
  });
  const controllerRef = useRef<AbortController | null>(null);
  const activeText = useRef('');

  const text = query.trim();
  const isLongEnough = text.length >= MIN_SEARCH_LENGTH;

  useBackHandler(isOpen, () => setIsOpen(false));

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    activeText.current = '';
  }, []);

  const run = useCallback(async (value: string) => {
    if (value === activeText.current) return;
    cancel();
    if (value.length < MIN_SEARCH_LENGTH || !navigator.onLine) return;

    const controller = new AbortController();
    controllerRef.current = controller;
    activeText.current = value;
    setStatus('searching');
    try {
      const found = await searchPlaces(value, nearRef.current, controller.signal);
      if (controller.signal.aborted) return;
      setResults(found);
      setResultsFor(value);
      setStatus('done');
    } catch {
      if (controller.signal.aborted) return;
      activeText.current = '';
      setResults([]);
      setStatus('error');
    }
  }, [cancel]);

  useEffect(() => {
    if (!isLongEnough || !isOnline) {
      cancel();
      setResults([]);
      setStatus('idle');
      return;
    }
    const timer = setTimeout(() => run(text), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, isLongEnough, isOnline, run, cancel]);

  useEffect(() => cancel, [cancel]);

  // Touching the map or anything else outside closes the list, like any search box.
  useEffect(() => {
    if (!isOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [isOpen]);

  const pick = (place: PlaceResult) => {
    setQuery(place.name);
    activeText.current = place.name;
    setIsOpen(false);
    inputRef.current?.blur();
    onPick(place);
  };

  const clear = () => {
    cancel();
    setQuery('');
    setResults([]);
    setStatus('idle');
    setIsOpen(true);
    inputRef.current?.focus();
    onClear();
  };

  const message = (() => {
    if (!isLongEnough) return null;
    if (!isOnline) return t('Buscar lugares necesita internet.');
    if (status === 'searching') return t('Buscando...');
    if (status === 'error') return t('No pudimos buscar. Revisa tu conexión e intenta otra vez.');
    if (status === 'done' && results.length === 0) return t('No encontramos "{query}" en el Perú. Prueba con otra palabra o el distrito.', { query: resultsFor });
    return null;
  })();
  const showList = isOpen && isLongEnough && (message !== null || results.length > 0);

  return (
    <form
      ref={boxRef}
      role="search"
      className="pointer-events-auto"
      onSubmit={(event) => {
        event.preventDefault();
        if (isLongEnough && isOnline) run(text);
      }}
    >
      <label htmlFor="map-search" className="sr-only">{t("Buscar un lugar o dirección")}</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 text-ink-secondary pointer-events-none" aria-hidden="true" />
        <input
          ref={inputRef}
          id="map-search"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
          value={query}
          placeholder={t("Buscar un lugar o dirección")}
          aria-controls="map-search-results"
          aria-expanded={showList}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setIsOpen(false);
          }}
          className="map-search-input w-full min-h-14 pl-12 pr-14 rounded-lg bg-surface text-ink text-body border border-border shadow-sm placeholder:text-ink-secondary"
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            aria-label={t("Borrar búsqueda")}
            className="icon-btn absolute right-1 top-1/2 -translate-y-1/2 text-ink-secondary"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        )}
      </div>

      <div id="map-search-results" hidden={!showList} className="mt-2 rounded-lg bg-surface border border-border shadow-sm overflow-hidden">
        <p role="status" className={message ? 'px-4 py-3 text-secondary text-ink-secondary' : 'sr-only'}>
          {message ?? (results.length > 0 ? t('{count} lugares encontrados', { count: results.length }) : '')}
        </p>
        {results.length > 0 && status !== 'searching' && (
          <ul className={`list-plain ${message ? 'border-t border-border' : ''}`} aria-label={t("Lugares encontrados")}>
            {results.map((place) => {
              const distance = distanceTo(place);
              return (
                <li key={place.id}>
                  <button type="button" onClick={() => pick(place)} className="row min-h-16 py-2">
                    <MapPin className="w-6 h-6 shrink-0 text-primary" aria-hidden="true" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-secondary font-bold truncate">{place.name}</span>
                      {place.address && <span className="block text-meta text-ink-secondary truncate">{place.address}</span>}
                    </span>
                    {distance && <span className="shrink-0 text-meta text-ink-secondary">{distance}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </form>
  );
};
