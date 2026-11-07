import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { fetchRecentSeismicAlerts, fetchWeatherAlerts, SeismicAlert, WeatherAlert } from '../services/emergencyApiService';
import { Activity, CloudRain, Sun, AlertTriangle, ShieldCheck, RefreshCw, Radio } from 'lucide-react';

export const LiveTelemetryWidget: React.FC = () => {
  const { userLocation, mode } = useApp();
  const [seismicAlerts, setSeismicAlerts] = useState<SeismicAlert[]>([]);
  const [weather, setWeather] = useState<WeatherAlert | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const isEmergency = mode === 'emergency';

  const loadTelemetry = async () => {
    setLoading(true);
    try {
      const [seismic, weatherData] = await Promise.all([
        fetchRecentSeismicAlerts(userLocation.lat, userLocation.lng),
        fetchWeatherAlerts(userLocation.lat, userLocation.lng)
      ]);
      setSeismicAlerts(seismic);
      setWeather(weatherData);
    } catch (err) {
      console.error('Error loading telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTelemetry();
  }, [userLocation.lat, userLocation.lng]);

  const latestQuake = seismicAlerts[0];

  return (
    <div className={`mb-5 p-4 rounded-3xl border transition-all text-xs duration-300 ${
      isEmergency 
        ? 'bg-slate-900/90 border-red-500/50 text-white shadow-xl shadow-red-950/40 backdrop-blur-md' 
        : 'bg-white/90 border-slate-200/90 shadow-sm text-slate-800 backdrop-blur-md'
    }`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200/40 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className={`p-1.5 rounded-xl font-bold flex items-center justify-center ${
            isEmergency ? 'bg-red-500/20 text-red-400' : 'bg-amber-100 text-amber-700'
          }`}>
            <Radio className="w-4 h-4 animate-pulse" />
          </span>
          <div>
            <span className="font-black uppercase tracking-wider text-[11px] block">
              Telemetría Geofísica en Tiempo Real (USGS & Open-Meteo)
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Vigilancia sísmica y meteorológica hiperlocal para el cuadrante
            </span>
          </div>
        </div>

        <button
          onClick={loadTelemetry}
          disabled={loading}
          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer transition px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Actualizar datos en vivo"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-500' : ''}`} />
          <span>{loading ? 'Sincronizando...' : 'Actualizar'}</span>
        </button>
      </div>

      {/* Grid de Métricas Tácticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3">
        {/* Sensor 1: Actividad Sísmica */}
        <div className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
          latestQuake && latestQuake.magnitude >= 5.0
            ? 'bg-red-500/10 border-red-500/40 text-red-300'
            : isEmergency
            ? 'bg-slate-800/60 border-slate-700 text-slate-200'
            : 'bg-slate-50/80 border-slate-200/80 text-slate-700'
        }`}>
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 font-black">
            <Activity className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide">
              Último Evento Sísmico (USGS)
            </span>
            {latestQuake ? (
              <div>
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  M {latestQuake.magnitude} • {latestQuake.place}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Prof: {latestQuake.depthKm} km • {latestQuake.timeFormatted}
                </span>
              </div>
            ) : (
              <span className="font-bold text-xs text-emerald-600">Sin sismos relevantes recientes</span>
            )}
          </div>
        </div>

        {/* Sensor 2: Clima y Riesgo de Lluvias / Huayco */}
        <div className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
          weather?.isRaining
            ? 'bg-blue-500/10 border-blue-500/40 text-blue-300'
            : isEmergency
            ? 'bg-slate-800/60 border-slate-700 text-slate-200'
            : 'bg-slate-50/80 border-slate-200/80 text-slate-700'
        }`}>
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-600 font-black">
            {weather?.isRaining ? <CloudRain className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide">
              Monitoreo Hidrometeorológico
            </span>
            {weather ? (
              <div>
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {weather.temperature}°C • {weather.weatherCondition}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Precipitación: {weather.precipitation} mm • {weather.riskDescription || 'Riesgo bajo'}
                </span>
              </div>
            ) : (
              <span className="font-bold text-xs">Cargando datos climáticos...</span>
            )}
          </div>
        </div>

        {/* Sensor 3: Estado de Resiliencia del Cuadrante */}
        <div className={`p-3 rounded-2xl border transition-all flex items-center gap-3 sm:col-span-2 lg:col-span-1 ${
          isEmergency
            ? 'bg-red-500/15 border-red-500/50 text-red-200'
            : 'bg-emerald-50/80 border-emerald-200/80 text-emerald-900'
        }`}>
          <div className={`p-2.5 rounded-xl font-black ${
            isEmergency ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
          }`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-bold block tracking-wide opacity-80">
              Red Comunitaria Activa
            </span>
            <span className="font-extrabold text-xs block">
              {isEmergency ? 'Protocolo de Emergencia Activado' : 'Economía de Proximidad Operando'}
            </span>
            <span className="text-[10px] opacity-75 block mt-0.5">
              Radio protegido: 800m • 14 brigadistas en guardia
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
