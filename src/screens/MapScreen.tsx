import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LngLatBounds, Map as MapLibreMap, Marker, setWorkerUrl, type ExpressionSpecification, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { CloudOff, LocateFixed, Minus, Navigation2, Plus, RotateCcw, RotateCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/EmptyState';
import { PostType } from '../types';

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
  const [isReady, setIsReady] = useState(false);
  const [bearing, setBearing] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const pinsRef = useRef<Marker[]>([]);
  const userMarkerRef = useRef<Marker | null>(null);
  const hasFramedPins = useRef(false);
  const isWaitingForFix = useRef(false);

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

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady || !hasLocation) return;

    const marker = userMarkerRef.current ?? new Marker({ element: createUserDot() }).setLngLat([userLocation.lng, userLocation.lat]).addTo(map);
    marker.setLngLat([userLocation.lng, userLocation.lat]);
    userMarkerRef.current = marker;
  }, [userLocation.lat, userLocation.lng, hasLocation, isReady]);

  // A neighbour far from every post would otherwise open an empty map.
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

  // Centring must work every time, not only when the position changes.
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
      <EmptyState
        icon={CloudOff}
        title="El mapa necesita internet"
        line="Tus vecinos siguen disponibles en la lista."
        action={<button type="button" className="btn btn-primary" onClick={() => setTab(homeTab)}>Ver lista</button>}
      />
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

      <div
        className="absolute inset-x-0 top-0 z-10 flex gap-2 px-4 pb-1 overflow-x-auto pointer-events-none"
        style={{ paddingTop: 'calc(8px + var(--map-top-inset))', scrollbarWidth: 'none' }}
        role="group"
        aria-label="Qué mostrar en el mapa"
      >
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
    </div>
  );
};

export default MapScreen;
