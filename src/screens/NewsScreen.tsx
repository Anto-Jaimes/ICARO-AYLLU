import React, { useEffect, useMemo, useState } from 'react';
import { Flag, Newspaper } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useHazards } from '../context/HazardContext';
import { departmentName } from '../data/ubigeo';
import { EmptyState, LoadingRow } from '../components/EmptyState';
import { EMPTY_PLACE, PlacePicker, PlaceValue } from '../components/PlacePicker';
import { TopBar } from '../components/TopBar';
import { useBackHandler } from '../hooks/useBackHandler';
import { useReports } from '../hooks/useReports';
import { flagReport, mediaUrl, Report, REPORT_KINDS, reportTitle } from '../services/reportsService';
import { formatRelativeTime } from '../utils/time';

export const ReportItem: React.FC<{ report: Report; onChanged: () => void }> = ({ report, onChanged }) => {
  const { showNotice, isOnline, canWrite, openAccess } = useApp();
  const kind = REPORT_KINDS.find((option) => option.id === report.kind) ?? REPORT_KINDS[5];
  const Icon = kind.icon;

  const flag = async () => {
    if (!canWrite) {
      openAccess('Para denunciar una noticia necesitas entrar con tu código de usuario.');
      return;
    }
    if (!isOnline) {
      showNotice('Necesitas internet para denunciar.');
      return;
    }
    try {
      await flagReport(report.id);
      showNotice('Gracias. Lo revisaremos.');
      onChanged();
    } catch (err) {
      console.error('No se pudo denunciar:', err);
      showNotice('No se pudo enviar. Vuelve a intentar.');
    }
  };

  return (
    <article className="py-3">
      <div className="flex items-center gap-2 px-4">
        <Icon className="w-5 h-5 text-anil shrink-0" aria-hidden="true" />
        <h3 className="text-row font-bold">{reportTitle(report.kind)}</h3>
        {report.status === 'review' && (
          <span className="px-2 py-0.5 rounded bg-sunken text-meta font-bold">En revisión</span>
        )}
      </div>

      {report.media_path &&
        (report.media_type === 'video' ? (
          <video src={mediaUrl(report.media_path)} controls playsInline preload="metadata" className="mt-2 w-full max-h-80 bg-black" />
        ) : (
          <img src={mediaUrl(report.media_path)} alt={report.description} loading="lazy" className="mt-2 w-full max-h-80 object-cover bg-sunken" />
        ))}

      <p className="px-4 pt-2">{report.description}</p>
      <p className="px-4 pt-1 text-secondary text-ink-2">
        {report.district}, {report.province}, {report.department}
      </p>
      <p className="px-4 text-meta text-ink-2">
        {report.author_name}, {formatRelativeTime(report.created_at).toLowerCase()}
      </p>

      {!report.is_mine && (
        <div className="px-4">
          <button
            type="button"
            disabled={report.has_flagged}
            onClick={flag}
            className="mt-1 min-h-12 inline-flex items-center gap-2 text-secondary font-medium text-ink-2 disabled:opacity-60"
          >
            <Flag className="w-4 h-4" aria-hidden="true" />
            {report.has_flagged ? 'Ya la denunciaste' : 'Denunciar'}
          </button>
        </div>
      )}
    </article>
  );
};

export const NewsScreen: React.FC = () => {
  const { setIsNewsOpen, openReport } = useApp();
  const { feed } = useHazards();
  const [place, setPlace] = useState<PlaceValue>(EMPTY_PLACE);

  const close = () => setIsNewsOpen(false);
  useBackHandler(true, close);

  // Start on the neighbour's department; they can widen or narrow from there.
  useEffect(() => {
    if (feed?.department) setPlace((current) => (current.departmentId ? current : { ...EMPTY_PLACE, departmentId: feed.department!.id }));
  }, [feed?.department?.id]);

  const filter = useMemo(
    () => ({
      department: place.departmentId ? departmentName(place.departmentId) : null,
      province: place.province || null,
      district: place.district || null
    }),
    [place]
  );
  const { reports, isLoading, reload } = useReports(filter);

  return (
    <div className="app-nav-offset">
      <TopBar title="Noticias" onBack={close} />

      <div className="page">
      <div className="px-4 pt-3">
        <PlacePicker idPrefix="news-place" anyLabel="Todos" value={place} onChange={setPlace} />
      </div>

      {reports.length === 0 ? (
        isLoading ? (
          <LoadingRow text="Buscando noticias..." />
        ) : (
          <EmptyState
            icon={Newspaper}
            title="Todavía no hay noticias aquí"
            line="Avisa a tus vecinos si pasa algo en tu zona."
            action={<button type="button" className="btn btn-primary" onClick={() => openReport('otro')}>Avisar a mis vecinos</button>}
          />
        )
      ) : (
        <ul className="list-plain grid-wide pt-2">
          {reports.map((report) => (
            <li key={report.id}><ReportItem report={report} onChanged={reload} /></li>
          ))}
        </ul>
      )}
      </div>
    </div>
  );
};
