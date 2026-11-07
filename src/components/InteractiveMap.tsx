import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { CommunityItem } from '../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Compass, Layers, ShieldAlert, Sparkles, MessageCircle } from 'lucide-react';
import { formatDistance, buildWhatsAppLink } from '../utils/geo';

export const InteractiveMap: React.FC = () => {
  const { 
    filteredItems, 
    userLocation, 
    maxDistanceMeters, 
    mode, 
    setSelectedItemForDetail,
    requestCurrentGPS
  } = useApp();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);

  const isEmergency = mode === 'emergency';

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet map
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [userLocation.lat, userLocation.lng],
        zoom: 15,
        zoomControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // OpenStreetMap Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contribuyentes',
        maxZoom: 19
      }).addTo(map);

      // Layers for markers
      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current) return;

    // Pan to user location
    map.setView([userLocation.lat, userLocation.lng], 15);

    // Clear previous markers
    markersLayerRef.current.clearLayers();

    // 1. User Position Marker
    const userIconHtml = `
      <div style="
        background: #f59e0b;
        color: white;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 15px rgba(245, 158, 11, 0.7);
        border: 3px solid white;
        font-weight: bold;
        font-size: 16px;
      ">
        📍
      </div>
    `;

    const userMarkerIcon = L.divIcon({
      html: userIconHtml,
      className: 'custom-user-marker',
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const userMarker = L.marker([userLocation.lat, userLocation.lng], {
      icon: userMarkerIcon
    }).bindPopup(`
      <div style="font-family: inherit; font-size: 12px; text-align: center; padding: 4px;">
        <strong style="color: #d97706;">Estás Aquí</strong>
        <p style="margin: 2px 0 0; color: #475569;">${userLocation.name}</p>
      </div>
    `);

    markersLayerRef.current.addLayer(userMarker);

    // 2. Proximity Radius Circle
    if (radiusCircleRef.current) {
      map.removeLayer(radiusCircleRef.current);
    }

    if (maxDistanceMeters < 50000) {
      radiusCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
        radius: maxDistanceMeters,
        color: isEmergency ? '#ef4444' : '#f59e0b',
        fillColor: isEmergency ? '#f87171' : '#fbbf24',
        fillOpacity: 0.1,
        weight: 1.5,
        dashArray: '4, 6'
      }).addTo(map);
    }

    // 3. Render Item Pins
    filteredItems.forEach((item) => {
      let pinColor = '#10b981'; // green for services
      let pinEmoji = '🔧';

      if (item.type === 'service') {
        pinColor = '#f59e0b'; // amber
        pinEmoji = '🛠️';
      } else if (item.type === 'favor_offer' || item.type === 'favor_request') {
        pinColor = '#10b981'; // emerald
        pinEmoji = '🤝';
      } else if (item.type === 'emergency_need') {
        pinColor = '#ef4444'; // red
        pinEmoji = '🚨';
      } else if (item.type === 'emergency_resource') {
        pinColor = '#06b6d4'; // cyan
        pinEmoji = '💧';
      } else if (item.type === 'support_group') {
        pinColor = '#8b5cf6'; // purple
        pinEmoji = '🚑';
      }

      const markerHtml = `
        <div style="
          background: ${pinColor};
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.25);
          border: 2px solid white;
          font-size: 15px;
          cursor: pointer;
        ">
          ${pinEmoji}
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-item-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const itemMarker = L.marker(item.coordinates, { icon: customIcon });

      const popupContent = document.createElement('div');
      popupContent.style.fontFamily = 'system-ui, sans-serif';
      popupContent.style.padding = '4px';
      popupContent.style.maxWidth = '220px';

      popupContent.innerHTML = `
        <div style="font-size: 10px; font-weight: bold; color: ${pinColor}; text-transform: uppercase;">
          ${item.category} • ${formatDistance(item.distanceMeters)}
        </div>
        <div style="font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 2px; line-height: 1.2;">
          ${item.title}
        </div>
        <div style="font-size: 11px; color: #475569; margin-top: 4px; line-height: 1.3;">
          ${item.neighborhood}
        </div>
        <div style="margin-top: 6px; font-size: 11px; font-weight: 600; color: #047857;">
          🛡️ ${item.vistosBuenos} Vistos Buenos
        </div>
        <div style="margin-top: 8px; display: flex; gap: 4px;">
          <button id="btn-detail-${item.id}" style="
            background: #0f172a;
            color: white;
            border: none;
            padding: 4px 8px;
            font-size: 11px;
            font-weight: bold;
            border-radius: 6px;
            cursor: pointer;
            width: 100%;
          ">
            Ver Ficha
          </button>
        </div>
      `;

      itemMarker.bindPopup(popupContent);

      itemMarker.on('popupopen', () => {
        const btn = document.getElementById(`btn-detail-${item.id}`);
        if (btn) {
          btn.onclick = () => {
            setSelectedItemForDetail(item);
          };
        }
      });

      markersLayerRef.current?.addLayer(itemMarker);
    });

  }, [filteredItems, userLocation, maxDistanceMeters, mode, isEmergency, setSelectedItemForDetail]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-md bg-white">
      {/* Map Floating Toolbar */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2">
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200 text-xs flex items-center gap-2">
          <span className="font-bold text-slate-800">
            {filteredItems.length} puntos cercanos
          </span>
          <span className="text-[11px] text-slate-500">
            (Radio {maxDistanceMeters < 50000 ? `${maxDistanceMeters}m` : 'ilimitado'})
          </span>
        </div>

        <button
          onClick={requestCurrentGPS}
          className="bg-white/95 hover:bg-slate-100 text-slate-800 px-2.5 py-1.5 rounded-xl shadow-md border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition"
          title="Centrar en mi ubicación GPS"
        >
          <Navigation className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">Mi GPS</span>
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-3 z-20 bg-white/95 backdrop-blur-md p-2.5 rounded-xl shadow-md border border-slate-200 text-[11px] flex flex-wrap gap-2.5">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Oficios</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Favores</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>Emergencias SOS</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
          <span>Recursos Críticos</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
          <span>Brigadas</span>
        </div>
      </div>

      {/* Map Canvas */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-[450px] sm:h-[550px] z-10"
      />
    </div>
  );
};
