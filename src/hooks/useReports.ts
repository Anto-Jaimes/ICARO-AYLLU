import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { fetchReports, PlaceFilter, Report, subscribeToReports } from '../services/reportsService';

export function useReports(filter: PlaceFilter, limit = 30) {
  const { reportsVersion } = useApp();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const latestLoad = useRef(0);

  const reload = useCallback(async () => {
    const loadId = ++latestLoad.current;
    setIsLoading(true);
    try {
      const data = await fetchReports(filter, limit);
      if (loadId === latestLoad.current) setReports(data);
    } catch (err) {
      console.warn('No se pudieron cargar las noticias:', err);
    } finally {
      if (loadId === latestLoad.current) setIsLoading(false);
    }
  }, [filter.department, filter.province, filter.district, limit]);

  useEffect(() => {
    reload();
    return subscribeToReports(reload);
  }, [reload, reportsVersion]);

  return { reports, isLoading, reload };
}
