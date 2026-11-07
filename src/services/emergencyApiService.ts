/**
 * Service for real-time hazard detection (Seismic activity & Weather alerts).
 * Integrates USGS Earthquake API and Open-Meteo Weather API.
 * Free, no API keys needed.
 *
 * Both functions throw when their feed fails. Callers must show "no disponible":
 * an alert app must never invent a quake or report calm it could not verify.
 */

export interface SeismicAlert {
  id: string;
  magnitude: number;
  place: string;
  timeFormatted: string;
  isRecent: boolean;
  depthKm: number;
  url: string;
}

export interface WeatherAlert {
  temperature: number;
  precipitation: number; // in mm
  isRaining: boolean;
  weatherCondition: string;
  riskDescription?: string;
}

/**
 * Fetches recent earthquakes in South America / Peru region.
 */
export async function fetchRecentSeismicAlerts(
  centerLat: number = -12.046,
  centerLng: number = -77.042
): Promise<SeismicAlert[]> {
  // USGS returns the last 30 days by default, newest first.
  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${centerLat}&longitude=${centerLng}&maxradiuskm=1200&minmagnitude=4.2&limit=4`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`USGS HTTP ${res.status}`);

  const data = await res.json();
  if (!Array.isArray(data.features)) throw new Error('USGS: respuesta sin lista de sismos');

  return data.features.map((feat: any) => {
    const props = feat.properties;
    const geom = feat.geometry;
    const date = new Date(props.time);
    const diffHours = (Date.now() - props.time) / (1000 * 60 * 60);

    return {
      id: feat.id,
      magnitude: Number(props.mag.toFixed(1)),
      place: props.place || 'Región Central',
      timeFormatted: diffHours < 24 ? `Hace ${Math.round(diffHours)} horas` : date.toLocaleDateString(),
      isRecent: diffHours < 12,
      depthKm: Math.round(geom.coordinates[2] || 0),
      url: props.url
    };
  });
}

/**
 * Fetches current weather and rain risk via Open-Meteo API.
 */
export async function fetchWeatherAlerts(
  lat: number = -12.093,
  lng: number = -77.032
): Promise<WeatherAlert> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation,weather_code&hourly=precipitation_probability&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);

  const data = await res.json();
  const current = data.current;
  // typeof check, not ||: 0 °C is a valid reading in the Peruvian highlands.
  if (typeof current?.temperature_2m !== 'number') {
    throw new Error('Open-Meteo: respuesta sin temperatura');
  }

  const temp = Math.round(current.temperature_2m);
  const precip = current.precipitation || 0;
  const weatherCode = current.weather_code || 0;

  let condition = 'Despejado / Templado';
  let risk = undefined;

  if (precip > 5 || weatherCode >= 61) {
    condition = 'Lluvia persistente';
    risk = 'Riesgo de anegamientos o filtraciones en techos del barrio';
  } else if (temp > 29) {
    condition = 'Ola de calor';
    risk = 'Cuidado especial con hidratación de adultos mayores';
  }

  return {
    temperature: temp,
    precipitation: precip,
    isRaining: precip > 0.5,
    weatherCondition: condition,
    riskDescription: risk
  };
}
