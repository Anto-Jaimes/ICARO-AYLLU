import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LngLatBounds, Map as MapLibreMap, Marker, setWorkerUrl, type ExpressionSpecification, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { CloudOff, LocateFixed, MapPin, Minus, Navigation2, Plus, RotateCcw, RotateCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/EmptyState';
import { MapSearch } from '../components/MapSearch';
import { MyPlacesPanel, PickBar, SpotCard, TripCard, type SpotKind } from '../components/MapPanel';
import { HomeSheet, PlacesSheet, SavePlaceSheet, type PlaceDraft } from '../components/MyPlacesSheets';
import { useBackHandler } from '../hooks/useBackHandler';
import {
  aboutMinutes, describePoint, estimateWalkingMinutes, fetchRoute, formatMeters, formatMinutes, isWalkable, walkingMinutesAlong,
  type PlaceResult, type Route, type TravelMode
} from '../services/geoService';
import {
  clearHome, loadHome, loadPlaces, MAX_PLACES, newPlace, saveHome, savePlaces, type Home, type MapPoint, type MyPlace
} from '../services/myPlaces';
import { calculateDistanceMeters } from '../utils/geo';
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
const SPOT_ZOOM = 16;
const ROTATE_STEP = 45;
const NEAR_ENOUGH_M = 2000;
const NEAREST_TO_SHOW = 3;
/** Closer than this, the neighbour is already there. */
const AT_PLACE_M = 40;
const LONG_PRESS_MS = 600;

const ROUTE_SOURCE = 'ayllu-route';
const ROUTE_CASING = 'ayllu-route-casing';
const ROUTE_LINE = 'ayllu-route-line';
const ROUTE_COLOR = '#1e3f8f';
// Room for the search box and the layer buttons above, the map buttons on the right and the credits below.
const ROUTE_PADDING = { top: 150, bottom: 72, left: 40, right: 80 };

const CANNOT_SAVE = 'No se pudo guardar en este celular. Libera espacio e intenta otra vez.';

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

// Lucide's house and star, as fixed markup: markers live outside React.
const SVG_OPEN = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
const HOUSE_ICON = `${SVG_OPEN} fill="none"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`;
const STAR_ICON = `${SVG_OPEN} fill="currentColor"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>`;

function createSpotPin(kind: 'home' | 'place', label: string, onOpen: () => void): HTMLButtonElement {
  const pin = document.createElement('button');
  pin.type = 'button';
  pin.className = `map-spot map-spot-${kind}`;
  pin.title = label;
  pin.setAttribute('aria-label', label);
  // Only the fixed icon goes in as markup; the neighbour's own name goes through the attributes above.
  pin.innerHTML = `<span class="map-spot-badge">${kind === 'home' ? HOUSE_ICON : STAR_ICON}</span>`;
  pin.addEventListener('click', (event) => {
    event.stopPropagation();
    onOpen();
  });
  return pin;
}

/** A long press on a phone, or a right click on a computer, picks that point of the map. */
function listenForLongPress(map: MapLibreMap, onPress: (point: MapPoint) => void) {
  let timer: number | undefined;
  let start: { x: number; y: number } | null = null;
  let lastPressAt = 0;

  const press = (lngLat: { lat: number; lng: number }) => {
    // Some phones also report the same long press as a context menu.
    if (Date.now() - lastPressAt < 1000) return;
    lastPressAt = Date.now();
    onPress({ lat: lngLat.lat, lng: lngLat.lng });
  };
  const cancel = () => {
    window.clearTimeout(timer);
    timer = undefined;
    start = null;
  };

  map.on('touchstart', (event) => {
    cancel();
    if (event.originalEvent.touches.length !== 1) return;
    start = { x: event.point.x, y: event.point.y };
    const lngLat = event.lngLat;
    timer = window.setTimeout(() => {
      timer = undefined;
      press(lngLat);
    }, LONG_PRESS_MS);
  });
  map.on('touchmove', (event) => {
    if (start && Math.hypot(event.point.x - start.x, event.point.y - start.y) > 12) cancel();
  });
  map.on('touchend', cancel);
  map.on('touchcancel', cancel);
  map.on('dragstart', cancel);
  map.on('contextmenu', (event) => {
    cancel();
    press(event.lngLat);
  });
}

function removeRoute(map: MapLibreMap) {
  try {
    if (map.getLayer(ROUTE_LINE)) map.removeLayer(ROUTE_LINE);
    if (map.getLayer(ROUTE_CASING)) map.removeLayer(ROUTE_CASING);
    if (map.getSource(ROUTE_SOURCE)) map.removeSource(ROUTE_SOURCE);
  } catch {
    // the map is already gone
  }
}

interface Spot extends MapPoint {
  kind: SpotKind;
  name: string;
  address: string;
  placeId?: string;
}

interface Trip {
  target: Spot;
  from: MapPoint;
  straightMeters: number;
  status: 'loading' | 'streets' | 'straight';
  /** A straight line because there is no connection, not because the servers failed. */
  isOffline: boolean;
  foot: Route | null;
  car: Route | null;
}

type FixPurpose = 'center' | 'home' | 'place';

const homeSpot = (home: Home): Spot => ({ kind: 'home', name: 'Mi casa', address: home.address, lat: home.lat, lng: home.lng });
const placeSpot = (place: MyPlace): Spot => ({ kind: 'place', name: place.name, address: place.address, lat: place.lat, lng: place.lng, placeId: place.id });

/** Minutes on foot along a route; a car route only gives its length, walked at the usual pace. */
const walkMinutesOf = (foot: Route | null, car: Route | null) =>
  foot ? foot.minutes : car ? walkingMinutesAlong(car.distanceMeters) : null;

interface RouteSummary {
  foot: Route | null;
  car: Route | null;
}

/**
 * Real times along the streets from here to a place, so a card can say how long it takes.
 * Null while offline, while waiting, or when no router answered.
 */
function useRouteSummary(from: MapPoint | null, to: MapPoint | null, isOnline: boolean): RouteSummary | null {
  // About 10 m of GPS drift must not ask again.
  const key = from && to ? `${to.lat},${to.lng}>${from.lat.toFixed(4)},${from.lng.toFixed(4)}` : '';
  const [result, setResult] = useState<(RouteSummary & { key: string }) | null>(null);
  const points = useRef({ from, to });
  useEffect(() => {
    points.current = { from, to };
  });

  useEffect(() => {
    const { from: start, to: end } = points.current;
    if (!key || !isOnline || !start || !end) return;
    if (calculateDistanceMeters(start.lat, start.lng, end.lat, end.lng) < AT_PLACE_M) return;
    const controller = new AbortController();
    Promise.all([fetchRoute('foot', start, end, controller.signal), fetchRoute('car', start, end, controller.signal)])
      .then(([foot, car]) => {
        if (!controller.signal.aborted && (foot || car)) setResult({ key, foot, car });
      });
    return () => controller.abort();
  }, [key, isOnline]);

  return result?.key === key ? result : null;
}

/** "A 3,3 km: unos 44 minutos caminando o 7 minutos en auto." or, without a route, the honest straight line. */
function describeWay(straightMeters: number | null, routes: RouteSummary | null, hereText: string, ofYou: string): string {
  if (straightMeters === null) return 'Activa tu ubicación para saber a cuánto estás.';
  if (straightMeters < AT_PLACE_M) return hereText;

  const street = routes?.foot ?? routes?.car ?? null;
  if (routes && street) {
    const walk = walkMinutesOf(routes.foot, routes.car) ?? 0;
    const pieces: string[] = [];
    if (isWalkable(walk)) pieces.push(`${aboutMinutes(walk)} caminando`);
    // For a short walk the car time is only noise.
    if (routes.car && (walk > 10 || pieces.length === 0)) {
      pieces.push(`${pieces.length ? formatMinutes(routes.car.minutes) : aboutMinutes(routes.car.minutes)} en auto`);
    }
    return `A ${formatMeters(street.distanceMeters)}${ofYou}${pieces.length ? `: ${pieces.join(' o ')}` : ''}.`;
  }
  const walk = estimateWalkingMinutes(straightMeters);
  return `A ${formatMeters(straightMeters)}${ofYou} en línea recta${isWalkable(walk) ? `, ${aboutMinutes(walk)} caminando` : ''}.`;
}

const MAP_BUTTON = 'grid place-items-center w-12 h-12 rounded-lg bg-surface text-ink border border-line shadow-sm active:bg-sunken';

const MapScreen: React.FC = () => {
  const {
    items, mode, userLocation, hasLocation, locationStatus, isOnline, openItem, requestCurrentGPS, setTab, homeTab, showNotice
  } = useApp();
  const layers = mode === 'emergency' ? EMERGENCY_LAYERS : NORMAL_LAYERS;
  const [hiddenLayers, setHiddenLayers] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isStyleReady, setIsStyleReady] = useState(false);
  const [bearing, setBearing] = useState(0);
  // Once drawn, the map stays when the signal drops: the streets already seen keep showing.
  const [canShowMap, setCanShowMap] = useState(isOnline);
  if (isOnline && !canShowMap) setCanShowMap(true);

  const [home, setHome] = useState<Home | null>(loadHome);
  const [places, setPlaces] = useState<MyPlace[]>(loadPlaces);
  const [selected, setSelected] = useState<Spot | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripMode, setTripMode] = useState<TravelMode>('foot');
  const [picking, setPicking] = useState<'home' | 'place' | null>(null);
  const [sheet, setSheet] = useState<'home' | 'places' | null>(null);
  const [draft, setDraft] = useState<PlaceDraft | null>(null);
  const [locatingFor, setLocatingFor] = useState<FixPurpose | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const pinsRef = useRef<Marker[]>([]);
  const userMarkerRef = useRef<Marker | null>(null);
  const hasFramedPins = useRef(false);
  const pendingFix = useRef<FixPurpose | null>(null);
  const tripRun = useRef(0);

  const me: MapPoint | null = hasLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null;
  const metersFromMe = useCallback(
    (point: MapPoint) => (hasLocation ? calculateDistanceMeters(userLocation.lat, userLocation.lng, point.lat, point.lng) : null),
    [hasLocation, userLocation.lat, userLocation.lng]
  );
  const distanceTo = useCallback((point: MapPoint) => {
    const meters = metersFromMe(point);
    return meters === null ? null : `a ${formatMeters(meters)}`;
  }, [metersFromMe]);

  // ---- Everything the map's own listeners call goes through refs, so they always see fresh state.
  const onLongPressRef = useRef<(point: MapPoint) => void>(() => {});
  const selectSpotRef = useRef<(spot: Spot, fly?: boolean) => void>(() => {});

  useEffect(() => {
    if (!containerRef.current || !canShowMap) return;

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
      // Lines can be added once the style is read; tiles may still be on their way.
      map.once('style.load', () => setIsStyleReady(true));
      listenForLongPress(map, (point) => onLongPressRef.current(point));
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
      setIsStyleReady(false);
    };
  }, [canShowMap]);

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

  // ---- Home and saved places on the map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;

    const markers: Marker[] = places.map((place) =>
      new Marker({ element: createSpotPin('place', place.name, () => selectSpotRef.current(placeSpot(place))) })
        .setLngLat([place.lng, place.lat])
        .addTo(map)
    );
    if (home) {
      markers.push(
        new Marker({ element: createSpotPin('home', 'Mi casa', () => selectSpotRef.current(homeSpot(home))) })
          .setLngLat([home.lng, home.lat])
          .addTo(map)
      );
    }
    return () => markers.forEach((marker) => marker.remove());
  }, [home, places, isReady]);

  // A searched or pressed point gets a red marker until something else is chosen.
  const focusSpot = selected ?? trip?.target ?? null;
  const hasFocusMarker = focusSpot !== null && (focusSpot.kind === 'result' || focusSpot.kind === 'point');
  const focusLat = hasFocusMarker ? focusSpot.lat : null;
  const focusLng = hasFocusMarker ? focusSpot.lng : null;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady || focusLat === null || focusLng === null) return;
    const marker = new Marker({ color: '#a90f1c', className: 'map-focus' }).setLngLat([focusLng, focusLat]).addTo(map);
    return () => {
      marker.remove();
    };
  }, [focusLat, focusLng, isReady]);

  // ---- The route line
  const routeLine = useMemo<[number, number][] | null>(() => {
    if (!trip || trip.status === 'loading') return null;
    if (trip.status === 'straight') return [[trip.from.lng, trip.from.lat], [trip.target.lng, trip.target.lat]];
    const route = tripMode === 'car' ? trip.car ?? trip.foot : trip.foot ?? trip.car;
    return route?.line ?? null;
  }, [trip, tripMode]);
  const isStraightLine = trip?.status === 'straight';

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isStyleReady) return;
    removeRoute(map);
    if (!routeLine) return;

    map.addSource(ROUTE_SOURCE, {
      type: 'geojson',
      data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: routeLine } }
    });
    const layout = { 'line-cap': isStraightLine ? 'butt' : 'round', 'line-join': 'round' } as const;
    map.addLayer({ id: ROUTE_CASING, type: 'line', source: ROUTE_SOURCE, layout, paint: { 'line-color': '#ffffff', 'line-width': 10 } });
    map.addLayer({
      id: ROUTE_LINE,
      type: 'line',
      source: ROUTE_SOURCE,
      layout,
      // A dashed line says "not a real path" without words.
      paint: { 'line-color': ROUTE_COLOR, 'line-width': 6, ...(isStraightLine ? { 'line-dasharray': [2, 1.5] } : {}) }
    });

    const bounds = new LngLatBounds();
    routeLine.forEach((point) => bounds.extend(point));
    map.resize(); // the route card may have just changed the map's height
    map.fitBounds(bounds, { padding: ROUTE_PADDING, maxZoom: 17, duration: 600 });

    return () => {
      if (mapRef.current === map) removeRoute(map);
    };
  }, [routeLine, isStraightLine, isStyleReady]);

  // ---- How far home and the chosen place are, along the streets when a router answers.
  const homeRoutes = useRouteSummary(me, home, isOnline);
  const selectedRoutes = useRouteSummary(me, selected && selected.kind !== 'home' ? selected : null, isOnline);
  const homeLine = home ? describeWay(metersFromMe(home), homeRoutes, 'Estás en tu casa.', '') : '';
  const spotDistanceLine = (spot: Spot) => spot.kind === 'home'
    ? describeWay(metersFromMe(spot), homeRoutes, 'Estás en tu casa.', ' de ti')
    : describeWay(metersFromMe(spot), selectedRoutes, 'Estás aquí.', ' de ti');

  // ---- Actions
  // The card under the map changes height with what is chosen, so the map flies only after the
  // new card is on screen and the map knows its new size; otherwise the place lands off centre.
  const pendingFly = useRef<MapPoint | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    const point = pendingFly.current;
    if (!map || !point) return;
    pendingFly.current = null;
    map.resize();
    map.flyTo({ center: [point.lng, point.lat], zoom: Math.max(map.getZoom(), SPOT_ZOOM), essential: true });
  }, [selected]);

  const clearTrip = () => {
    tripRun.current += 1;
    setTrip(null);
  };

  const selectSpot = (spot: Spot, fly = true) => {
    clearTrip();
    setPicking(null);
    setSelected(spot);
    pendingFly.current = fly ? spot : null;
  };

  const pickPressedPoint = (point: MapPoint) => {
    if (picking) return;
    selectSpot({ kind: 'point', name: 'Punto elegido', address: '', ...point }, false);
    if (!navigator.onLine) return;
    describePoint(point.lat, point.lng).then((name) => {
      if (!name) return;
      setSelected((current) => (current?.kind === 'point' && current.lat === point.lat && current.lng === point.lng ? { ...current, address: name } : current));
    });
  };

  const flyToUser = useCallback(() => {
    mapRef.current?.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: START_ZOOM, bearing: 0, essential: true });
  }, [userLocation.lat, userLocation.lng]);

  // A fresh position, not the one from when the app opened: the neighbour may have walked since.
  const askFix = (purpose: FixPurpose) => {
    if (!('geolocation' in navigator)) {
      showNotice('Este celular no puede darnos tu ubicación.');
      return;
    }
    pendingFix.current = purpose;
    setLocatingFor(purpose);
    requestCurrentGPS();
  };

  // Centring must work every time, not only when the position changes.
  const centerOnMe = () => {
    if (hasLocation) flyToUser();
    askFix('center');
  };

  const saveHomeAt = (point: MapPoint, address: string) => {
    const next: Home = { lat: point.lat, lng: point.lng, address };
    if (!saveHome(next)) {
      showNotice(CANNOT_SAVE);
      return;
    }
    const hadHome = home !== null;
    setHome(next);
    setSheet(null);
    setSelected(null);
    clearTrip();
    showNotice(hadHome ? 'Cambiamos tu casa a este lugar.' : 'Guardamos tu casa en este celular.');
    if (address || !navigator.onLine) return;
    describePoint(point.lat, point.lng).then((name) => {
      const current = loadHome();
      if (!name || !current || current.lat !== point.lat || current.lng !== point.lng) return;
      const named = { ...current, address: name };
      saveHome(named);
      setHome(named);
    });
  };

  const openDraft = (point: MapPoint, name: string, address: string) => {
    if (places.length >= MAX_PLACES) {
      showNotice(`Tienes ${MAX_PLACES} lugares, el máximo. Borra uno para agregar otro.`);
      return;
    }
    setSheet(null);
    setDraft({ lat: point.lat, lng: point.lng, name, address });
    if (address || !navigator.onLine) return;
    describePoint(point.lat, point.lng).then((found) => {
      if (!found) return;
      setDraft((current) => (current && current.lat === point.lat && current.lng === point.lng ? { ...current, address: found } : current));
    });
  };

  const addPlace = (name: string) => {
    if (!draft) return;
    const place = newPlace(name, draft, draft.address);
    const next = [...places, place];
    if (!savePlaces(next)) {
      showNotice(CANNOT_SAVE);
      return;
    }
    setPlaces(next);
    setDraft(null);
    setSelected(null);
    showNotice(`Guardamos "${place.name}" en tus lugares.`);
  };

  const deletePlace = (place: MyPlace) => {
    const next = places.filter((candidate) => candidate.id !== place.id);
    if (!savePlaces(next)) {
      showNotice(CANNOT_SAVE);
      return;
    }
    setPlaces(next);
    if (selected?.placeId === place.id) setSelected(null);
    if (trip?.target.placeId === place.id) clearTrip();
    showNotice(`Borramos "${place.name}" de tus lugares.`);
  };

  const removeHome = () => {
    if (!clearHome()) {
      showNotice(CANNOT_SAVE);
      return;
    }
    setHome(null);
    setSheet(null);
    if (selected?.kind === 'home') setSelected(null);
    if (trip?.target.kind === 'home') clearTrip();
    showNotice('Quitamos tu casa de este celular.');
  };

  // Runs when the position asked for above arrives (or does not).
  const applyFix = (purpose: FixPurpose) => {
    const here = { lat: userLocation.lat, lng: userLocation.lng };
    if (purpose === 'center') flyToUser();
    if (purpose === 'home') saveHomeAt(here, '');
    if (purpose === 'place') openDraft(here, '', '');
  };

  const onFixRef = useRef<(purpose: FixPurpose) => void>(() => {});
  // Declared before the effect below, so it always hands over this render's handlers.
  useEffect(() => {
    selectSpotRef.current = selectSpot;
    onLongPressRef.current = pickPressedPoint;
    onFixRef.current = applyFix;
  });

  useEffect(() => {
    const purpose = pendingFix.current;
    if (!purpose || locationStatus === 'locating') return;
    pendingFix.current = null;
    setLocatingFor(null);

    if (locationStatus === 'ready') onFixRef.current(purpose);
    else showNotice('No pudimos ubicarte. Activa la ubicación de tu celular.');
  }, [locationStatus, showNotice]);

  const goTo = async (target: Spot) => {
    if (!me) {
      showNotice('Activa tu ubicación para ver el camino.');
      askFix('center');
      return;
    }
    const straightMeters = calculateDistanceMeters(me.lat, me.lng, target.lat, target.lng);
    if (straightMeters < AT_PLACE_M) {
      showNotice(target.kind === 'home' ? 'Ya estás en tu casa.' : 'Ya estás en ese lugar.');
      return;
    }

    const run = ++tripRun.current;
    setSelected(null);
    setPicking(null);
    setTripMode('foot');
    const base = { target, from: me, straightMeters, foot: null, car: null, isOffline: false };
    if (!navigator.onLine) {
      setTrip({ ...base, status: 'straight', isOffline: true });
      return;
    }

    setTrip({ ...base, status: 'loading' });
    const [foot, car] = await Promise.all([fetchRoute('foot', me, target), fetchRoute('car', me, target)]);
    if (run !== tripRun.current) return;
    setTrip(foot || car
      ? { ...base, status: 'streets', foot, car }
      : { ...base, status: 'straight', isOffline: !navigator.onLine });
  };

  const routeHome = () => {
    if (home) goTo(homeSpot(home));
  };

  const pickSearchResult = (place: PlaceResult) => {
    selectSpot({ kind: 'result', name: place.name, address: place.address, lat: place.lat, lng: place.lng });
  };

  const startPicking = (purpose: 'home' | 'place') => {
    setSheet(null);
    setSelected(null);
    clearTrip();
    setPicking(purpose);
  };

  const confirmPick = () => {
    const center = mapRef.current?.getCenter();
    const purpose = picking;
    setPicking(null);
    if (!center || !purpose) return;
    const point = { lat: center.lat, lng: center.lng };
    if (purpose === 'home') saveHomeAt(point, '');
    else openDraft(point, '', '');
  };

  useBackHandler(selected !== null, () => setSelected(null));
  useBackHandler(trip !== null, clearTrip);
  useBackHandler(picking !== null, () => setPicking(null));

  const toggleLayer = (id: string) => {
    setHiddenLayers((hidden) => (hidden.includes(id) ? hidden.filter((layer) => layer !== id) : [...hidden, id]));
  };

  const rotateBy = (degrees: number) => {
    const map = mapRef.current;
    map?.rotateTo(map.getBearing() + degrees, { duration: 300 });
  };

  const isRotated = Math.round(bearing) !== 0;

  // ---- The card under the map
  const tripSummary = (() => {
    if (!trip) return '';
    if (trip.status === 'straight') {
      const walk = estimateWalkingMinutes(trip.straightMeters);
      return `A ${formatMeters(trip.straightMeters)}${isWalkable(walk) ? `, ${aboutMinutes(walk)} caminando` : ''}.`;
    }
    if (tripMode === 'car' && trip.car) {
      return `${formatMeters(trip.car.distanceMeters)} en auto, ${aboutMinutes(trip.car.minutes)}. No cuenta el tráfico.`;
    }
    const street = trip.foot ?? trip.car;
    const walk = walkMinutesOf(trip.foot, trip.car);
    if (!street || walk === null) return '';
    return `${formatMeters(street.distanceMeters)} por la calle, ${aboutMinutes(walk)} caminando.`;
  })();

  const panel = (() => {
    if (picking) return <PickBar purpose={picking} onCancel={() => setPicking(null)} onConfirm={confirmPick} />;
    if (trip) {
      return (
        <TripCard
          title={trip.target.kind === 'home' ? 'Camino a tu casa' : `Camino a ${trip.target.name}`}
          address={trip.target.address}
          status={trip.status}
          isOffline={trip.isOffline}
          mode={tripMode}
          walkMinutes={walkMinutesOf(trip.foot, trip.car)}
          carMinutes={trip.car?.minutes ?? null}
          summary={tripSummary}
          onMode={setTripMode}
          onClose={clearTrip}
          onRetry={() => goTo(trip.target)}
        />
      );
    }
    if (selected) {
      return (
        <SpotCard
          key={`${selected.kind}:${selected.lat},${selected.lng}`}
          kind={selected.kind}
          name={selected.name}
          address={selected.address}
          distanceLine={spotDistanceLine(selected)}
          onClose={() => setSelected(null)}
          onRoute={() => goTo(selected)}
          onSaveAsHome={() => saveHomeAt(selected, selected.kind === 'result' ? [selected.name, selected.address].filter(Boolean).join(', ') : selected.address)}
          onSaveAsPlace={() => openDraft(selected, selected.kind === 'result' ? selected.name : '', selected.address)}
          onChangeHome={() => setSheet('home')}
          onDeletePlace={() => {
            const place = places.find((candidate) => candidate.id === selected.placeId);
            if (place) deletePlace(place);
          }}
        />
      );
    }
    return (
      <MyPlacesPanel
        hasHome={home !== null}
        homeLine={homeLine}
        placesCount={places.length}
        onOpenHome={() => home && selectSpot(homeSpot(home))}
        onRouteHome={routeHome}
        onSetHome={() => setSheet('home')}
        onOpenPlaces={() => setSheet('places')}
      />
    );
  })();

  const showMap = canShowMap;

  return (
    <div
      className="map-screen relative flex flex-col"
      style={{ '--map-strip': isOnline ? '0px' : '48px' } as React.CSSProperties}
    >
      <div className="relative flex-1 min-h-0">
        {showMap ? (
          <div ref={containerRef} className="w-full h-full" data-testid="map" />
        ) : (
          <div className="h-full overflow-y-auto">
            <EmptyState
              icon={CloudOff}
              title="El mapa necesita internet"
              line="Tu casa y tus lugares siguen aquí abajo. Para buscar lugares o ver el camino por las calles, conéctate."
              action={<button type="button" className="btn btn-secondary" onClick={() => setTab(homeTab)}>Ver lista de vecinos</button>}
            />
          </div>
        )}

        {showMap && (
          <>
            <div
              className="absolute inset-x-0 top-0 z-20 flex flex-col gap-2 px-4 pointer-events-none lg:max-w-md"
              style={{ paddingTop: 'calc(8px + var(--map-top-inset))' }}
            >
              <MapSearch
                near={me}
                isOnline={isOnline}
                distanceTo={distanceTo}
                onPick={pickSearchResult}
                onClear={() => {
                  if (selected?.kind === 'result') setSelected(null);
                }}
              />
              <div
                className="flex gap-2 -mx-4 px-4 pb-1 overflow-x-auto"
                style={{ scrollbarWidth: 'none' }}
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
            </div>

            {picking && (
              <div className="map-crosshair absolute left-1/2 top-1/2 z-10 pointer-events-none" aria-hidden="true">
                <MapPin className="w-10 h-10 text-rojo fill-white" />
              </div>
            )}

            <div className="absolute right-4 bottom-8 z-10 flex flex-col gap-2 lg:bottom-[calc(32px+var(--map-strip))]">
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
          </>
        )}
      </div>

      <div
        className="map-panel shrink-0 bg-surface border-t border-line pb-[var(--map-strip)] lg:absolute lg:z-20 lg:left-4 lg:bottom-[calc(16px+var(--map-strip))] lg:w-[400px] lg:pb-0 lg:border lg:rounded-lg lg:shadow-md lg:overflow-hidden"
        data-testid="map-panel"
      >
        {panel}
      </div>

      <HomeSheet
        open={sheet === 'home'}
        onClose={() => setSheet(null)}
        home={home}
        isLocating={locatingFor === 'home'}
        canPickOnMap={isReady}
        onUseMyLocation={() => askFix('home')}
        onPickOnMap={() => startPicking('home')}
        onRemove={removeHome}
      />
      <PlacesSheet
        open={sheet === 'places'}
        onClose={() => setSheet(null)}
        places={places}
        distanceTo={distanceTo}
        isLocating={locatingFor === 'place'}
        canPickOnMap={isReady}
        onOpenPlace={(place) => {
          setSheet(null);
          selectSpot(placeSpot(place));
        }}
        onDelete={deletePlace}
        onAddHere={() => askFix('place')}
        onAddOnMap={() => startPicking('place')}
      />
      <SavePlaceSheet draft={draft} onClose={() => setDraft(null)} onSave={addPlace} />
    </div>
  );
};

export default MapScreen;
