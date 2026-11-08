import React, { useEffect, useState } from 'react';
import { Clock, Flag, MapPin, MessageCircle, Send, Trash2, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useFlagReport } from '../hooks/useFlagReport';
import { supabase } from '../lib/supabase';
import { reverseGeocode } from '../services/geoService';
import {
  addComment,
  COMMENT_PROBLEMS,
  deleteComment,
  fetchComments,
  mediaUrl,
  ReportComment,
  REPORT_KINDS,
  reportTitle
} from '../services/reportsService';
import { formatRelativeTime } from '../utils/time';
import { BottomSheet } from './BottomSheet';
import { useT } from '../i18n/LanguageContext';

const NAME_KEY = 'ayllu_comment_name';

/** One news item in full: photo, what happened, where, when, and the neighbours' comments. */
export const NewsDetailSheet: React.FC = () => {
  const { newsDetail: report, closeNewsDetail, canWrite, openAccess, isOnline, showNotice, refreshReports } = useApp();
  const t = useT();
  const [comments, setComments] = useState<ReportComment[] | null>(null);
  const [street, setStreet] = useState<string | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) ?? '');
  const [body, setBody] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [hasFlagged, setHasFlagged] = useState(false);
  const flag = useFlagReport(report?.id ?? null, () => {
    setHasFlagged(true);
    refreshReports();
  });

  const load = (reportId: string) =>
    fetchComments(reportId)
      .then(setComments)
      .catch(() => setComments((current) => current ?? []));

  useEffect(() => {
    if (!report) return;
    setComments(null);
    setStreet(null);
    setProblem(null);
    setBody('');
    setHasFlagged(report.has_flagged);
    load(report.id);
    supabase.auth.getSession().then(({ data }) => setMyId(data.session?.user.id ?? null));
    if (report.lat != null && report.lng != null && navigator.onLine) {
      reverseGeocode(report.lat, report.lng).then(setStreet).catch(() => {});
    }
  }, [report?.id]);

  if (!report) return <BottomSheet open={false} onClose={closeNewsDetail} title={t('Noticias')}>{null}</BottomSheet>;

  const kind = REPORT_KINDS.find((option) => option.id === report.kind) ?? REPORT_KINDS[5];
  const Icon = kind.icon;
  const hasPlace = report.lat != null && report.lng != null;

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!body.trim()) return;
    setIsSending(true);
    setProblem(null);
    try {
      localStorage.setItem(NAME_KEY, name.trim());
      await addComment(report.id, body.trim(), name.trim());
      setBody('');
      await load(report.id);
      refreshReports();
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      setProblem((COMMENT_PROBLEMS as Record<string, string>)[code] ?? 'No se pudo enviar el comentario. Intenta de nuevo.');
    } finally {
      setIsSending(false);
    }
  };

  const remove = async (comment: ReportComment) => {
    try {
      await deleteComment(comment.id);
      await load(report.id);
      refreshReports();
    } catch {
      showNotice('No se pudo borrar el comentario.');
    }
  };

  return (
    <BottomSheet open={true} onClose={closeNewsDetail} title={t(reportTitle(report.kind))}>
      {report.media_path &&
        (report.media_type === 'video' ? (
          <video src={mediaUrl(report.media_path)} controls playsInline className="w-full max-h-96 bg-black" />
        ) : (
          <img src={mediaUrl(report.media_path)} alt="" className="w-full max-h-96 object-cover bg-sunken" />
        ))}

      <div className="pt-4 pb-6">
        <div className="px-4 space-y-2">
          <p className="flex items-center gap-2 text-row font-bold">
            <Icon className="w-5 h-5 text-anil shrink-0" aria-hidden="true" />
            {t(reportTitle(report.kind))}
          </p>
          <p className="text-body leading-relaxed">{report.description}</p>
          <p className="flex items-start gap-2 text-secondary">
            <MapPin className="w-5 h-5 shrink-0 mt-0.5 text-ink-2" aria-hidden="true" />
            <span>
              {street && <span className="block font-semibold">{street}</span>}
              <span className="block text-ink-2">{report.district}, {report.province}, {report.department}</span>
              {hasPlace && (
                <a href={`https://maps.google.com/?q=${report.lat},${report.lng}`} target="_blank" rel="noreferrer" className="font-bold text-anil">
                  {t('Ver en el mapa')}
                </a>
              )}
            </span>
          </p>
          <p className="flex items-center gap-2 text-secondary text-ink-2">
            <Clock className="w-5 h-5 shrink-0" aria-hidden="true" />
            {formatRelativeTime(report.created_at)}, por {report.author_name}
          </p>
          {!report.is_mine && (
            <button
              type="button"
              disabled={hasFlagged}
              onClick={flag}
              className="min-h-12 inline-flex items-center gap-2 text-secondary font-medium text-ink-2 disabled:opacity-60"
            >
              <Flag className="w-4 h-4" aria-hidden="true" />
              {hasFlagged ? t('Ya la denunciaste') : t('Denunciar')}
            </button>
          )}
        </div>

        <section aria-labelledby="comments-title" className="mt-2 pt-4 border-t border-line">
          <h3 id="comments-title" className="px-4 flex items-center gap-2 text-section font-bold">
            <MessageCircle className="w-6 h-6 text-anil" aria-hidden="true" />
            {t('Comentarios')}
          </h3>
          <p className="px-4 text-secondary text-ink-2">{t('Pregunta qué pasó, dónde, o si alguien necesita ayuda.')}</p>

          {comments === null ? (
            <p className="px-4 pt-3 text-secondary text-ink-2">{t('Cargando comentarios...')}</p>
          ) : comments.length === 0 ? (
            <p className="px-4 pt-3 text-secondary text-ink-2">{t('Todavía no hay comentarios. Sé el primero.')}</p>
          ) : (
            <ul className="list-plain pt-2">
              {comments.map((comment) => (
                <li key={comment.id} className="px-4 py-3 border-b border-line">
                  <p className="flex items-center gap-2 text-secondary">
                    <User className="w-4 h-4 shrink-0 text-ink-2" aria-hidden="true" />
                    <span className="font-bold">{comment.author_id && comment.author_id === myId ? t('Tú') : comment.author_name}</span>
                    <span className="text-meta text-ink-2">{formatRelativeTime(comment.created_at)}</span>
                    {comment.author_id && comment.author_id === myId && (
                      <button type="button" onClick={() => remove(comment)} className="ml-auto icon-btn" aria-label={t('Borrar mi comentario')}>
                        <Trash2 className="w-5 h-5 text-ink-2" aria-hidden="true" />
                      </button>
                    )}
                  </p>
                  <p className="pt-1">{comment.body}</p>
                </li>
              ))}
            </ul>
          )}

          {canWrite ? (
            <form onSubmit={send} className="px-4 pt-3 space-y-2">
              <label htmlFor="comment-name" className="block text-secondary font-bold">{t('Tu nombre')}</label>
              <input id="comment-name" className="field" value={name} onChange={(event) => setName(event.target.value)} maxLength={60} autoComplete="name" />
              <label htmlFor="comment-body" className="block text-secondary font-bold">{t('Tu comentario')}</label>
              <textarea
                id="comment-body"
                className="field min-h-24"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                maxLength={500}
                placeholder={t('¿Qué pasó? ¿Hay heridos? ¿Se puede pasar?')}
              />
              {problem && <p role="alert" className="text-secondary font-bold text-rojo">{problem}</p>}
              <button type="submit" className="btn btn-primary" disabled={isSending || body.trim().length === 0}>
                <Send className="w-5 h-5" aria-hidden="true" />
                {isSending ? t('Enviando...') : t('Comentar')}
              </button>
            </form>
          ) : (
            <div className="px-4 pt-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => openAccess('Para comentar necesitas entrar con tu código de usuario.')}
              >
                {t('Entra con tu código para comentar')}
              </button>
            </div>
          )}
        </section>
      </div>
    </BottomSheet>
  );
};
