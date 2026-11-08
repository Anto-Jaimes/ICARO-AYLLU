import { useApp } from '../context/AppContext';
import { useT } from '../i18n/LanguageContext';
import { flagReport } from '../services/reportsService';

/** "Denunciar" a news item: only with the user code, and with internet. Same rules wherever it is offered. */
export function useFlagReport(reportId: string | null, onChanged: () => void): () => Promise<void> {
  const { showNotice, isOnline, canWrite, openAccess } = useApp();
  const t = useT();

  return async () => {
    if (!reportId) return;
    if (!canWrite) {
      openAccess(t('Para denunciar una noticia necesitas entrar con tu código de usuario.'));
      return;
    }
    if (!isOnline) {
      showNotice(t('Necesitas internet para denunciar.'));
      return;
    }
    try {
      await flagReport(reportId);
      showNotice(t('Gracias. Lo revisaremos.'));
      onChanged();
    } catch (err) {
      console.error('No se pudo denunciar:', err);
      showNotice(t('No se pudo enviar. Vuelve a intentar.'));
    }
  };
}
