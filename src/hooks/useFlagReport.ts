import { useApp } from '../context/AppContext';
import { flagReport } from '../services/reportsService';

/** "Denunciar" a news item: only with the user code, and with internet. Same rules wherever it is offered. */
export function useFlagReport(reportId: string | null, onChanged: () => void): () => Promise<void> {
  const { showNotice, isOnline, canWrite, openAccess } = useApp();

  return async () => {
    if (!reportId) return;
    if (!canWrite) {
      openAccess('Para denunciar una noticia necesitas entrar con tu código de usuario.');
      return;
    }
    if (!isOnline) {
      showNotice('Necesitas internet para denunciar.');
      return;
    }
    try {
      await flagReport(reportId);
      showNotice('Gracias. Lo revisaremos.');
      onChanged();
    } catch (err) {
      console.error('No se pudo denunciar:', err);
      showNotice('No se pudo enviar. Vuelve a intentar.');
    }
  };
}
