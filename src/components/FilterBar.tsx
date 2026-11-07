import React from 'react';
import { useApp } from '../context/AppContext';
import { Search, SlidersHorizontal, MapPin, X } from 'lucide-react';

export const FilterBar: React.FC = () => {
  const { 
    mode, 
    activeTab, 
    maxDistanceMeters, 
    setMaxDistanceMeters,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery
  } = useApp();

  const isEmergency = mode === 'emergency';

  const distances = [
    { label: '500m (A pie)', value: 500 },
    { label: '1 km (Mi barrio)', value: 1000 },
    { label: '3 km (Zonas aledañas)', value: 3000 },
    { label: 'Sin límite', value: 100000 },
  ];

  const serviceCategories = [
    { id: 'all', label: 'Todos los oficios' },
    { id: 'gasfiteria', label: '🔧 Gasfitería' },
    { id: 'electricidad', label: '⚡ Electricidad' },
    { id: 'carpinteria', label: '🪵 Carpintería' },
    { id: 'cerrajeria', label: '🔑 Cerrajería' },
    { id: 'mascotas', label: '🐾 Mascotas' },
    { id: 'clases', label: '📚 Clases / Saberes' },
    { id: 'alimentacion', label: '🍲 Comida / Repostería' },
    { id: 'salud', label: '🩹 Cuidados / Salud' },
  ];

  const favorCategories = [
    { id: 'all', label: 'Todos los favores' },
    { id: 'herramientas', label: '🔨 Préstamo de Herramientas' },
    { id: 'ayuda_temporal', label: '🤝 Ayuda Temporal' },
    { id: 'donacion', label: '📦 Donación de Materiales' },
    { id: 'habilidades', label: '💡 Trueque de Saberes' },
    { id: 'movilidad', label: '🚲 Movilidad Solidaria' },
  ];

  const emergencyCategories = [
    { id: 'all', label: 'Todas las emergencias' },
    { id: 'vulnerabilidad_mayor', label: '👵 Vecinos Vulnerables' },
    { id: 'primeros_auxilios', label: '🚑 Primeros Auxilios / Brigadas' },
    { id: 'agua_alimentos', label: '💧 Agua y Alimentos Críticos' },
    { id: 'energia_luz', label: '⚡ Energía / Luz / Carga' },
    { id: 'rescate_movilidad', label: '🚨 Rescate y Despeje' },
  ];

  let currentCategories = serviceCategories;
  if (isEmergency || activeTab === 'emergency_board') {
    currentCategories = emergencyCategories;
  } else if (activeTab === 'favors') {
    currentCategories = favorCategories;
  }

  return (
    <div className={`p-4 rounded-2xl mb-4 border transition-all ${
      isEmergency 
        ? 'bg-rose-950/40 border-rose-800/80 text-rose-100' 
        : 'bg-white border-slate-200/80 shadow-sm'
    }`}>
      {/* Search Bar + Distance Selector */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
            isEmergency ? 'text-rose-400' : 'text-slate-400'
          }`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isEmergency
                ? 'Buscar ayuda urgente, agua, brigada, medicina o calle...'
                : 'Buscar servicio, oficio, herramienta o vecino...'
            }
            className={`w-full pl-10 pr-9 py-2 rounded-xl text-sm border transition focus:outline-none focus:ring-2 ${
              isEmergency
                ? 'bg-rose-900/40 border-rose-700 text-white placeholder-rose-300 focus:ring-rose-500'
                : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400 focus:ring-amber-500'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Distance Filter (Proximity constraint) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold flex items-center gap-1 shrink-0 opacity-80">
            <MapPin className="w-3.5 h-3.5 text-amber-500" /> Radio:
          </span>
          <div className="flex gap-1">
            {distances.map((dist) => (
              <button
                key={dist.value}
                onClick={() => setMaxDistanceMeters(dist.value)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition cursor-pointer ${
                  maxDistanceMeters === dist.value
                    ? isEmergency
                      ? 'bg-rose-500 text-white font-bold'
                      : 'bg-slate-800 text-white font-bold'
                    : isEmergency
                      ? 'bg-rose-900/50 text-rose-200 hover:bg-rose-800'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {dist.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Chips Scroll */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
        {currentCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 text-xs rounded-xl font-medium whitespace-nowrap transition cursor-pointer shrink-0 ${
              selectedCategory === cat.id
                ? isEmergency
                  ? 'bg-rose-600 text-white font-bold ring-2 ring-rose-400'
                  : 'bg-amber-500 text-white font-bold shadow-sm'
                : isEmergency
                  ? 'bg-rose-900/40 text-rose-200 hover:bg-rose-900/70 border border-rose-800'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
};
