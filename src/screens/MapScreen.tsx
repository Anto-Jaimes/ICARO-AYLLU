import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LngLatBounds, Map as MapLibreMap, Marker, setWorkerUrl, type ExpressionSpecification, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { 
  CloudOff, 
  LocateFixed, 
  Minus, 
  Navigation2, 
  Plus, 
  RotateCcw, 
  RotateCw, 
  ShieldCheck, 
  Phone, 
  ExternalLink, 
  X,
  Droplets,
  Hospital,
  Flame,
  Shield,
  MapPin
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/EmptyState';
import { PostType } from '../types';
import { SafePlace, fetchNearbySafePlaces, getCachedSafePlaces } from '../services/safePlacesService';
import { SafePlacesSheet } from '../components/SafePlacesSheet';
import { describeDistance } from '../utils/geo';

interface Layer {
  id: string;
  label: string;
  color: string;
  types: PostType[];
}

const NORMAL_LAYERS: Layer[] = [
  { id: 'services', label: 'Servicios', color: '#1e3f8f', types: ['service'] },
  { id: 'favors', label: 'Favores', color: '#0b5a3c', types: ['favor_offer', 'favor_request'] }
];

const EMERGENCY_LAYERS: Layer[] = [
  { id: 'needs', label: 'Piden ayuda', color: '#a90f1c', types: ['emergency_need'] },
  { id: 'resources', label: 'Recursos', color: '#0b5a3c', types: ['emergency_resource'] },
  { id: 'groups', label: 'Grupos', color: '#1e3f8f', types: ['support_group'] }
];

// MapLibre looks for its worker next to its own file, a path the build does not keep.
// Without this the map opens with no streets at all.
setWorkerUrl(mapWorkerUrl);

const VECTOR_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

// Used when the vector map does not answer: still rotates, only the labels turn with it.
const RASTER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© OpenStreetMap'
    }
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
};

const START_ZOOM = 15;
const ROTATE_STEP = 45;
const NEAR_ENOUGH_M = 2000;
const NEAREST_TO_SHOW = 3;

const LOCAL_NAME: ExpressionSpecification = ['coalesce', ['get', 'name:es'], ['get', 'name']];

// The published style prefers English ("Arequipa Avenue"). Road shields use "ref" and stay as they are.
function withLocalNames(style: StyleSpecification): StyleSpecification {
  return {
    ...style,
    layers: style.layers.map((layer) => {
      if (layer.type !== 'symbol' || !JSON.stringify(layer.layout?.['text-field'] ?? '').includes('name_en')) return layer;
      return { ...layer, layout: { ...layer.layout, 'text-field': LOCAL_NAME } };
    })
  };
}

async function loadMapStyle(): Promise<StyleSpecification> {
  try {
    const response = await fetch(VECTOR_STYLE_URL, { signal: AbortSignal.timeout(4000) });
    return response.ok ? withLocalNames(await response.json()) : RASTER_STYLE;
  } catch {
    return RASTER_STYLE;
  }
}

// Text goes only through attributes, so user content can never run as HTML here.
function createPin(color: string, label: string, onOpen: () => void): HTMLButtonElement {
  const pin = document.createElement('button');
  pin.type = 'button';
  pin.className = 'map-pin';
  pin.title = label;
  pin.setAttribute('aria-label', label);
  pin.style.setProperty('--pin-color', color);
  pin.addEventListener('click', (event) => {
    event.stopPropagation();
    onOpen();
  });
  return pin;
}

function createSafePlacePin(place: SafePlace, onOpen: () => void): HTMLButtonElement {
  const pin = document.createElement('button');
  pin.type = 'button';
  pin.className = 'grid place-items-center cursor-pointer p-0';
  pin.title = `${place.name} (${place.category})`;
  pin.setAttribute('aria-label', place.name);

  const icon =
    place.category === 'salud'
      ? '🏥'
      : place.category === 'agua'
      ? '💧'
      : place.category === 'bomberos'
      ? '🚒'
      : place.category === 'policia'
      ? '👮'
      : '⛺';

  const color =
    place.category === 'salud'
      ? '#dc2626'
      : place.category === 'agua'
      ? '#0284c7'
      : place.category === 'bomberos'
      ? '#ea580c'
      : place.category === 'policia'
      ? '#4f46e5'
      : '#059669';

  pin.innerHTML = `
    <span style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.4);font-size:15px;color:white;transform:scale(1);transition:transform 0.15s ease;">
      ${icon}
    </span>
  `;

  pin.addEventListener('click', (event) => {
    event.stopPropagation();
    onOpen();
  });
  return pin;
}

function createUserDot(): HTMLDivElement {
  const dot = document.createElement('div');
  dot.className = 'map-me';
  dot.setAttribute('aria-label', 'Tu ubicación');
  return dot;
}

const MAP_BUTTON = 'grid place-items-center w-12 h-12 rounded-lg bg-surface text-ink border border-line shadow-sm active:bg-sunken';

const MapScreen: React.FC = () => {
  const {
    items, mode, userLocation, hasLocation, locationStatus, isOnline, openItem, requestCurrentGPS, setTab, homeTab, showNotice
  } = useApp();
  const layers = mode === 'emergency' ? EMERGENCY_LAYERS : NORMAL_LAYERS;
  const [hiddenLayers, setHiddenLayers] = useState<string[]>([]);
  const [showSafePlaces, setShowSafePlaces] = useState<boolean>(true);
  const [safePlaces, setSafePlaces] = useState<SafePlace[]>([]);
  const [selectedSafePlace, setSelectedSafePlace] = useState<SafePlace | null>(null);
  const [isSafeSheetOpen, setIsSafeSheetOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [bearing, setBearing] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const pinsRef = useRef<Marker[]>([]);
  const safePinsRef = useRef<Marker[]>([]);
  const userMarkerRef = useRef<Marker | null>(null);
  const hasFramedPins = useRef(false);
  const isWaitingForFix = useRef(false);

  // Load safe places (offline cache first, then Overpass if online)
  useEffect(() => {
    const cached = getCachedSafePlaces(userLocation.lat, userLocation.lng);
    setSafePlaces(cached);

    if (isOnline) {
      fetchNearbySafePlaces(userLocation.lat, userLocation.lng)
        .then((fresh) => setSafePlaces(fresh))
        .catch(() => {});
    }
  }, [userLocation.lat, userLocation.lng, isOnline]);

  useEffect(() => {
    if (!containerRef.current || !isOnline) return;

    let isCancelled = false;

    loadMapStyle().then((style) => {
      if (isCancelled || !containerRef.current) return;

      const map = new MapLibreMap({
        container: containerRef.current,
        style,
        center: [userLocation.lng, userLocation.lat],
        zoom: START_ZOOM,
        pitchWithRotate: false,
        attributionControl: { compact: true }
      });
      map.on('rotate', () => setBearing(map.getBearing()));
      mapRef.current = map;
      // Pins do not depend on the tiles: on a slow connection they must not wait for them.
      setIsReady(true);
    });

    return () => {
      isCancelled = true;
      pinsRef.current = [];
      safePinsRef.current = [];
      userMarkerRef.current = null;
      hasFramedPins.current = false;
      mapRef.current?.remove();
      mapRef.current = null;
      setIsReady(false);
    };
  }, [isOnline]);

  const visibleLayers = useMemo(
    () => layers.filter((layer) => !hiddenLayers.includes(layer.id)),
    [layers, hiddenLayers]
  );

  const visibleItems = useMemo(() => {
    const types = visibleLayers.flatMap((layer) => layer.types);
    return items.filter((item) => types.includes(item.type) && item.status !== 'resolved');
  }, [items, visibleLayers]);

  // Render normal/emergency pins
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;

    pinsRef.current.forEach((pin) => pin.remove());
    pinsRef.current = visibleItems.map((item) => {
      const color = visibleLayers.find((layer) => layer.types.includes(item.type))?.color ?? '#1e3f8f';
      return new Marker({ element: createPin(color, item.title, () => openItem(item.id)) })
        .setLngLat([item.coordinates[1], item.coordinates[0]])
        .addTo(map);
    });
  }, [visibleItems, visibleLayers, isReady, openItem]);

  // Render safe places pins (OSM/INDECI)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;

    safePinsRef.current.forEach((pin) => pin.remove());
    if (!showSafePlaces) {
      safePinsRef.current = [];
      return;
    }

    safePinsRef.current = safePlaces.map((place) => {
      return new Marker({
        element: createSafePlacePin(place, () => {
          setSelectedSafePlace(place);
        })
      })
        .setLngLat([place.lng, place.lat])
        .addTo(map);
    });
  }, [safePlaces, showSafePlaces, isReady]);

  // User location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady || !hasLocation) return;

    const marker = userMarkerRef.current ?? new Marker({ element: createUserDot() }).setLngLat([userLocation.lng, userLocation.lat]).addTo(map);
    marker.setLngLat([userLocation.lng, userLocation.lat]);
    userMarkerRef.current = marker;
  }, [userLocation.lat, userLocation.lng, hasLocation, isReady]);

  // Initial frame
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady || hasFramedPins.current || visibleItems.length === 0) return;
    hasFramedPins.current = true;

    const nearest = [...visibleItems]
      .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0))
      .slice(0, NEAREST_TO_SHOW);
    if (hasLocation && (nearest[0].distanceMeters ?? 0) <= NEAR_ENOUGH_M) return;

    const bounds = new LngLatBounds();
    nearest.forEach((item) => bounds.extend([item.coordinates[1], item.coordinates[0]]));
    if (hasLocation) bounds.extend([userLocation.lng, userLocation.lat]);
    map.fitBounds(bounds, { padding: 96, maxZoom: START_ZOOM, duration: 0 });
  }, [visibleItems, isReady, hasLocation, userLocation.lat, userLocation.lng]);

  const flyToUser = useCallback(() => {
    mapRef.current?.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: START_ZOOM, bearing: 0, essential: true });
  }, [userLocation.lat, userLocation.lng]);

  const centerOnMe = () => {
    if (hasLocation) flyToUser();
    isWaitingForFix.current = true;
    requestCurrentGPS();
  };

  useEffect(() => {
    if (!isWaitingForFix.current || locationStatus === 'locating') return;
    isWaitingForFix.current = false;

    if (locationStatus === 'ready') flyToUser();
    else showNotice('No pudimos ubicarte. Activa la ubicación de tu celular.');
  }, [locationStatus, flyToUser, showNotice]);

  if (!isOnline) {
    return (
      <div className="app-nav-offset page px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={CloudOff}
          title="Mapa gráfico sin conexión"
          line="La red de Puntos Seguros (Salud, Agua, Refugio INDECI) está guardada en tu teléfono para emergencias."
          action={
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <button
                type="button"
                className="btn btn-primary flex items-center justify-center gap-2"
                onClick={() => setIsSafeSheetOpen(true)}
              >
                <ShieldCheck className="w-5 h-5" />
                Ver Puntos Seguros Offline
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setTab(homeTab)}
              >
                Ver lista de vecinos
              </button>
            </div>
          }
        />
        <SafePlacesSheet
          open={isSafeSheetOpen}
          onClose={() => setIsSafeSheetOpen(false)}
        />
      </div>
    );
  }

  const toggleLayer = (id: string) => {
    setHiddenLayers((hidden) => (hidden.includes(id) ? hidden.filter((layer) => layer !== id) : [...hidden, id]));
  };

  const rotateBy = (degrees: number) => {
    const map = mapRef.current;
    map?.rotateTo(map.getBearing() + degrees, { duration: 300 });
  };

  const isRotated = Math.round(bearing) !== 0;

  return (
    <div className="map-screen relative">
      <div ref={containerRef} className="w-full h-full" data-testid="map" />

      {/* Top Filter Pills */}
      <div
        className="absolute inset-x-0 top-0 z-10 flex gap-2 px-4 pb-1 overflow-x-auto pointer-events-none"
        style={{ paddingTop: 'calc(8px + var(--map-top-inset))', scrollbarWidth: 'none' }}
        role="group"
        aria-label="Qué mostrar en el mapa"
      >
        {/* Toggle Puntos Seguros (OSM / INDECI) */}
        <button
          type="button"
          aria-pressed={showSafePlaces}
          onClick={() => setShowSafePlaces((prev) => !prev)}
          className="pointer-events-auto inline-flex items-center gap-1.5 shrink-0 min-h-12 px-3 rounded-lg bg-surface border border-line text-secondary font-bold shadow-sm"
        >
          <span
            aria-hidden="true"
            className="w-4 h-4 rounded-full border-2"
            style={{
              background: showSafePlaces ? '#059669' : 'transparent',
              borderColor: '#059669'
            }}
          />
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Puntos Seguros ({safePlaces.length})
        </button>

        {layers.map((layer) => {
          const isVisible = !hiddenLayers.includes(layer.id);
          return (
            <button
              key={layer.id}
              type="button"
              aria-pressed={isVisible}
              onClick={() => toggleLayer(layer.id)}
              className="pointer-events-auto inline-flex items-center gap-2 shrink-0 min-h-12 px-3 rounded-lg bg-surface border border-line text-secondary font-bold shadow-sm"
            >
              <span
                aria-hidden="true"
                className="w-4 h-4 rounded-full border-2"
                style={{ background: isVisible ? layer.color : 'transparent', borderColor: layer.color }}
              />
              {layer.label}
            </button>
          );
        })}
      </div>

      {/* Floating Card for Selected Safe Place */}
      {selectedSafePlace && (
        <div className="absolute left-4 right-16 bottom-8 z-20 bg-surface/95 backdrop-blur-md border border-line p-3.5 rounded-2xl shadow-lg flex flex-col gap-2 max-w-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="block text-xs font-bold text-ink leading-snug">
                {selectedSafePlace.name}
              </span>
              <span className="block text-[11px] text-ink-secondary">
                {selectedSafePlace.category.toUpperCase()} • a {describeDistance(selectedSafePlace.distanceMeters) || 'cerca'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSafePlace(null)}
              className="p-1 text-ink-secondary hover:text-ink rounded-lg"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedSafePlace.address && (
            <span className="text-[11px] text-ink-secondary flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {selectedSafePlace.address}
            </span>
          )}

          <div className="flex items-center gap-2 pt-1 border-t border-line/40">
            {selectedSafePlace.phone && (
              <a
                href={`tel:${selectedSafePlace.phone}`}
                className="py-1 px-3 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                Llamar ({selectedSafePlace.phone})
              </a>
            )}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedSafePlace.lat},${selectedSafePlace.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1 px-3 bg-surface border border-line text-ink hover:bg-neutral-100 text-xs font-bold rounded-lg flex items-center gap-1.5 ml-auto"
            >
              <ExternalLink className="w-3.5 h-3.5 text-primary" />
              Ruta GPS
            </a>
          </div>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute right-4 bottom-8 z-10 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => mapRef.current?.easeTo({ bearing: 0, duration: 300 })}
          aria-label={isRotated ? `Apuntar al norte. Mapa girado ${Math.round(bearing)} grados` : 'El mapa apunta al norte'}
          title="Apuntar al norte"
          className={MAP_BUTTON}
        >
          <Navigation2
            className={`w-6 h-6 ${isRotated ? 'text-rojo fill-current' : ''}`}
            style={{ transform: `rotate(${-bearing}deg)` }}
            aria-hidden="true"
          />
        </button>
        <div className="hidden lg:flex flex-col gap-2">
          <button type="button" aria-label="Girar a la izquierda" title="Girar a la izquierda" onClick={() => rotateBy(-ROTATE_STEP)} className={MAP_BUTTON}>
            <RotateCcw className="w-6 h-6" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Girar a la derecha" title="Girar a la derecha" onClick={() => rotateBy(ROTATE_STEP)} className={MAP_BUTTON}>
            <RotateCw className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>
        <button type="button" aria-label="Centrar en mi ubicación" title="Centrar en mi ubicación" onClick={centerOnMe} className={MAP_BUTTON}>
          <LocateFixed className="w-6 h-6" aria-hidden="true" />
        </button>
        <button type="button" aria-label="Acercar" title="Acercar" onClick={() => mapRef.current?.zoomIn()} className={MAP_BUTTON}>
          <Plus className="w-6 h-6" aria-hidden="true" />
        </button>
        <button type="button" aria-label="Alejar" title="Alejar" onClick={() => mapRef.current?.zoomOut()} className={MAP_BUTTON}>
          <Minus className="w-6 h-6" aria-hidden="true" />
        </button>
      </div>

      <SafePlacesSheet
        open={isSafeSheetOpen}
        onClose={() => setIsSafeSheetOpen(false)}
        onSelectOnMap={(p) => {
          setSelectedSafePlace(p);
          mapRef.current?.flyTo({ center: [p.lng, p.lat], zoom: 16 });
        }}
      />
    </div>
  );
};

export default MapScreen;
