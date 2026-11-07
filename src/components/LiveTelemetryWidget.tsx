import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { fetchRecentSeismicAlerts, fetchWeatherAlerts, SeismicAlert, WeatherAlert } from '../services/emergencyApiService';
import { Activity, CloudOff, CloudRain, Sun, AlertTriangle, RefreshCw } from 'lucide-react';

export const LiveTelemetryWidget: React.FC = () => {
  const { userLocation, mode, setMode } = useApp();
  // null means "no data" (still loading or the feed failed); [] means the feed answered with no quakes.
  const [seismicAlerts, setSeismicAlerts] = useState<SeismicAlert[] | null>(null);
  const [weather, setWeather] = useState<WeatherAlert | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const isEmergency = mode === 'emergency';

  const loadTelemetry = async () => {
    setLoading(true);
    // allSettled: if one feed fails, the other one still shows.
    const [seismic, weatherData] = await Promise.allSettled([
      fetchRecentSeismicAlerts(userLocation.lat, userLocation.lng),
      fetchWeatherAlerts(userLocation.lat, userLocation.lng)
    ]);

    if (seismic.status === 'rejected') console.warn('Sismos no disponibles:', seismic.reason);
    if (weatherData.status === 'rejected') console.warn('Clima no disponible:', weatherData.reason);

    setSeismicAlerts(seismic.status === 'fulfilled' ? seismic.value : null);
    setWeather(weatherData.status === 'fulfilled' ? weatherData.value : null);
    setLoading(false);
  };

  useEffect(() => {
    loadTelemetry();
  }, [userLocation.lat, userLocation.lng]);

  const latestQuake = seismicAlerts?.[0];

  return (
    <div className={`mb-4 p-3.5 rounded-2xl border transition-all text-xs ${
      isEmergency 
        ? 'bg-rose-950/60 border-rose-800 text-rose-100' 
        : 'bg-white border-slate-200/90 shadow-sm text-slate-700'
    }`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200/50">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-lg bg-amber-500/20 text-amber-600 font-bold">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
          </span>
          <span className="font-extrabold uppercase tracking-wider text-[11px]">
            Telemetría Barrial en Tiempo Real (APIs Integradas)
          </span>
        </div>

        <button
          onClick={loadTelemetry}
          disabled={loading}
          className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer transition"
          title="Actualizar datos en vivo"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5">
        {/* Weather API Feed */}
        <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50/70 border border-slate-200/60">
          <div className="p-2 rounded-lg bg-sky-100 text-sky-700 shrink-0">
            {!weather ? (
              <CloudOff className="w-4 h-4 text-slate-500" />
            ) : weather.isRaining ? (
              <CloudRain className="w-4 h-4 text-sky-600" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
          </div>
          <div>
            {weather ? (
              <>
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <span>{weather.temperature}°C</span>
                  <span className="text-[11px] font-medium text-slate-500">
                    • {weather.weatherCondition}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {weather.riskDescription ? (
                    <span className="text-amber-700 font-semibold">{weather.riskDescription}</span>
                  ) : (
                    'Condiciones estables en el barrio (Open-Meteo API)'
                  )}
                </p>
              </>
            ) : (
              <>
                <div className="font-bold text-slate-900">
                  {loading ? 'Consultando el clima...' : 'Clima no disponible'}
                </div>
                {!loading && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    No pudimos consultar el clima. Toca Actualizar.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* USGS Earthquake API Feed */}
        <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50/70 border border-slate-200/60">
          <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="min-w-0 flex-1">
            {latestQuake ? (
              <>
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-slate-900 flex items-center gap-1 truncate">
                    <span>Sismo M{latestQuake.magnitude}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({latestQuake.timeFormatted})
                    </span>
                  </span>

                  {latestQuake.isRecent && latestQuake.magnitude >= 5.0 && !isEmergency && (
                    <button
                      onClick={() => setMode('emergency')}
                      className="text-[10px] bg-rose-600 text-white font-extrabold px-1.5 py-0.5 rounded cursor-pointer animate-pulse shrink-0"
                    >
                      Activar SOS
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {latestQuake.place} (USGS API)
                </p>
              </>
            ) : (
              <>
                <div className="font-bold text-slate-900">
                  {loading ? 'Consultando sismos...' : seismicAlerts ? 'Sin sismos recientes' : 'Sismos no disponibles'}
                </div>
                {!loading && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {seismicAlerts
                      ? 'Ningún sismo M4.2+ cerca en los últimos 30 días (USGS API)'
                      : 'No pudimos consultar los sismos. Toca Actualizar.'}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
