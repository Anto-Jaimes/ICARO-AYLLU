import React from 'react';
import { MapPin, MessageCircle, Play } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { mediaUrl, Report, REPORT_KINDS, reportTitle } from '../services/reportsService';
import { formatRelativeTime } from '../utils/time';
import { useT } from '../i18n/LanguageContext';
import { VerifiedBadge } from './VerifiedBadge';

/** A news item in large: the photo first, then what happened, where and how long ago. Opens the detail. */
export const NewsCard: React.FC<{ report: Report }> = ({ report }) => {
  const { openNewsDetail } = useApp();
  const t = useT();
  const kind = REPORT_KINDS.find((option) => option.id === report.kind) ?? REPORT_KINDS[5];
  const Icon = kind.icon;
  const comments = report.comment_count ?? 0;
  const title = t('{kind} en {place}', { kind: t(reportTitle(report.kind)), place: report.district });

  return (
    <article className="rounded-2xl overflow-hidden border border-line bg-surface">
      <button type="button" className="block w-full text-left" onClick={() => openNewsDetail(report)} aria-label={`${title}. ${report.description}. ${t('Ver la noticia y los comentarios')}`}>
        <div className="relative aspect-[16/9] bg-sunken">
          {report.media_path && report.media_type === 'image' ? (
            <img src={mediaUrl(report.media_path)} alt="" loading="lazy" className="w-full h-full object-cover" />
          ) : report.media_path && report.media_type === 'video' ? (
            <>
              <video src={mediaUrl(report.media_path)} muted playsInline preload="metadata" className="w-full h-full object-cover bg-black" />
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid place-items-center w-14 h-14 rounded-full bg-black/60 text-white">
                  <Play className="w-7 h-7" aria-hidden="true" />
                </span>
              </span>
            </>
          ) : (
            <span className="grid place-items-center w-full h-full text-rojo">
              <Icon className="w-14 h-14" aria-hidden="true" />
            </span>
          )}
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface/95 text-meta font-bold">
            <Icon className="w-4 h-4 text-rojo" aria-hidden="true" />
            {t(reportTitle(report.kind))}
          </span>
        </div>
        <div className="p-4">
          <h3 className="text-row font-bold">{title}</h3>
          <p className="pt-1 text-secondary line-clamp-2">{report.description}</p>
          {report.author_verified && <VerifiedBadge className="pt-1" />}
          <p className="pt-2 flex items-center gap-1.5 text-meta text-ink-2">
            <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{report.district}, {report.province}</span>
            <span className="ml-auto shrink-0">{formatRelativeTime(report.created_at)}</span>
          </p>
          <p className="pt-2 flex items-center gap-1.5 text-meta font-bold text-anil">
            <MessageCircle className="w-4 h-4" aria-hidden="true" />
            {comments === 0 ? t('Comentar') : `${comments} ${t(comments === 1 ? 'comentario' : 'comentarios')}`}
          </p>
        </div>
      </button>
    </article>
  );
};
