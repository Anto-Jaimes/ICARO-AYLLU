import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CloudOff, LocateFixed, Minus, Plus } from 'lucide-react';
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

// Colours come from the constants above: user text never reaches this HTML.
const pinIcon = (color: string) =>
  L.divIcon({
    html: `<span style="display:block;width:28px;height:28px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 1px 4px #12182680"></span>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });

const USER_ICON = L.divIcon({
  html: '<span style="display:block;width:20px;height:20px;border-radius:50%;background:#121826;border:4px solid #fff;box-shadow:0 0 0 2px #121826"></span>',
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const MAP_BUTTON = 'grid place-items-center w-12 h-12 rounded-lg bg-surface text-ink border border-line';

export const MapScreen: React.FC = () => {
  const { items, mode, userLocation, hasLocation, isOnline, openItem, requestCurrentGPS, setTab, homeTab } = useApp();
  const layers = mode === 'emergency' ? EMERGENCY_LAYERS : NORMAL_LAYERS;
  const [hiddenLayers, setHiddenLayers] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pinsRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !isOnline) return;

    const map = L.map(containerRef.current, {
      center: [userLocation.lat, userLocation.lng],
      zoom: 15,
      zoomControl: false
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19
    }).addTo(map);

    pinsRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      pinsRef.current = null;
    };
  }, [isOnline]);

  useEffect(() => {
    mapRef.current?.setView([userLocation.lat, userLocation.lng]);
  }, [userLocation.lat, userLocation.lng]);

  const visibleLayers = useMemo(
    () => layers.filter((layer) => !hiddenLayers.includes(layer.id)),
    [layers, hiddenLayers]
  );

  useEffect(() => {
    const pins = pinsRef.current;
    if (!pins) return;

    pins.clearLayers();
    if (hasLocation) L.marker([userLocation.lat, userLocation.lng], { icon: USER_ICON, interactive: false }).addTo(pins);

    for (const layer of visibleLayers) {
      const icon = pinIcon(layer.color);
      for (const item of items) {
        if (!layer.types.includes(item.type) || item.status === 'resolved') continue;
        L.marker(item.coordinates, { icon, title: item.title, alt: item.title })
          .on('click', () => openItem(item.id))
          .addTo(pins);
      }
    }
  }, [items, visibleLayers, hasLocation, userLocation.lat, userLocation.lng, openItem, isOnline]);

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

  return (
    <div className="relative" style={{ height: 'calc(100dvh - var(--nav-height) - var(--safe-bottom) - var(--top-bar))' }}>
      <div ref={containerRef} className="absolute inset-0 z-0" />

      <div
        className="absolute inset-x-0 top-0 z-10 flex gap-2 px-4 overflow-x-auto pb-1"
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
              className="inline-flex items-center gap-2 shrink-0 min-h-12 px-3 rounded-lg bg-surface border border-line text-secondary font-bold"
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

      <div className="absolute right-4 bottom-6 z-10 flex flex-col gap-2">
        <button type="button" aria-label="Ir a mi ubicación" onClick={requestCurrentGPS} className={MAP_BUTTON}>
          <LocateFixed className="w-6 h-6" aria-hidden="true" />
        </button>
        <button type="button" aria-label="Acercar" onClick={() => mapRef.current?.zoomIn()} className={MAP_BUTTON}>
          <Plus className="w-6 h-6" aria-hidden="true" />
        </button>
        <button type="button" aria-label="Alejar" onClick={() => mapRef.current?.zoomOut()} className={MAP_BUTTON}>
          <Minus className="w-6 h-6" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
