import React from 'react';
import { useApp } from '../context/AppContext';
import { Search, MapPin, SlidersHorizontal, X } from 'lucide-react';

export const FilterBar: React.FC = () => {
  const { 
    searchQuery, 
    setSearchQuery, 
    selectedCategory, 
    setSelectedCategory, 
    maxDistanceMeters, 
    setMaxDistanceMeters,
    mode,
    activeTab
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
    { id: 'gasfiteria', label: 'Gasfitería' },
    { id: 'electricidad', label: 'Electricidad' },
    { id: 'carpinteria', label: 'Carpintería' },
    { id: 'cerrajeria', label: 'Cerrajería' },
    { id: 'mascotas', label: 'Mascotas' },
    { id: 'clases', label: 'Clases / Saberes' },
    { id: 'comida', label: 'Comida / Repostería' },
    { id: 'salud', label: 'Cuidados / Salud' },
  ];

  const favorCategories = [
    { id: 'all', label: 'Todos los favores' },
    { id: 'herramientas', label: 'Préstamo de Herramientas' },
    { id: 'salud', label: 'Insumos Médicos / Muletas' },
    { id: 'ayuda_temporal', label: 'Ayuda Temporal' },
    { id: 'donacion', label: 'Donación de Materiales' },
    { id: 'habilidades', label: 'Trueque de Saberes' },
    { id: 'movilidad', label: 'Movilidad Solidaria' },
  ];

  const emergencyCategories = [
    { id: 'all', label: 'Todas las emergencias' },
    { id: 'vulnerabilidad_mayor', label: 'Vecinos Vulnerables' },
    { id: 'primeros_auxilios', label: 'Primeros Auxilios / Brigadas' },
    { id: 'agua_alimentos', label: 'Agua y Alimentos Críticos' },
    { id: 'energia_luz', label: 'Energía / Luz / Carga' },
    { id: 'rescate_movilidad', label: 'Rescate y Despeje' },
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
        ? 'bg-slate-900/60 border-slate-800 text-slate-100' 
        : 'bg-white border-slate-200/80 shadow-xs'
    }`}>
      {/* Search Bar + Distance Selector */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isEmergency
                ? "Buscar alertas de auxilio, agua, brigadas..."
                : "Buscar gasfitero, muletas, lasaña, taladro..."
            }
            className={`w-full pl-10 pr-9 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition focus:outline-none focus:ring-2 ${
              isEmergency
                ? 'bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:ring-red-600'
                : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-slate-800 focus:bg-white'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Distance Filter Selector */}
        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 px-1">
            <MapPin className="w-3.5 h-3.5 text-amber-600" /> Radio:
          </span>
          <div className="flex items-center gap-1">
            {distances.map((d) => (
              <button
                key={d.value}
                onClick={() => setMaxDistanceMeters(d.value)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  maxDistanceMeters === d.value
                    ? isEmergency 
                      ? 'bg-red-800 text-white shadow-xs' 
                      : 'bg-slate-800 text-white shadow-xs'
                    : isEmergency
                      ? 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
        {currentCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
              selectedCategory === cat.id
                ? isEmergency
                  ? 'bg-red-800 text-white'
                  : 'bg-slate-800 text-white'
                : isEmergency
                  ? 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
};
