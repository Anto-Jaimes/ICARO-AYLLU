import React, { useEffect, useState } from 'react';
import { db, EmptyLine, ErrorLine, formatDate } from './shared';

interface ReviewReport {
  id: string;
  kind: string;
  description: string;
  author_name: string;
  media_path: string | null;
  media_type: 'image' | 'video' | null;
  department: string;
  province: string;
  district: string;
  flags: number;
  created_at: string;
}

const KIND: Record<string, string> = {
  accidente: 'Accidente', huaico: 'Huaico', inundacion: 'Inundación', incendio: 'Incendio', sismo: 'Sismo', otro: 'Aviso'
};

/** News that neighbours flagged or the phone's detector could not clear. */
export const ReportsTab: React.FC<{ onCount: (count: number) => void }> = ({ onCount }) => {
  const [reports, setReports] = useState<ReviewReport[] | null>(null);
  const [view, setView] = useState<'review' | 'published'>('review');
  const [problem, setProblem] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await db.from('reports')
      .select('id, kind, description, author_name, media_path, media_type, department, province, district, flags, created_at')
      .eq('status', view).order('created_at', { ascending: false }).limit(50);
    if (error) setProblem('No se pudieron cargar las noticias.');
    setReports((data ?? []) as ReviewReport[]);
    if (view === 'review') onCount(data?.length ?? 0);
  };

  useEffect(() => {
    setReports(null);
    load();
  }, [view]);

  const decide = async (report: ReviewReport, action: 'publish' | 'remove') => {
    setProblem(null);
    // Removed content must stop being reachable: the file goes first, then the record.
    if (action === 'remove' && report.media_path) {
      // Storage can answer without an error and still delete nothing: check what it removed.
      const { data, error } = await db.storage.from('reports').remove([report.media_path]);
      if (error || !data?.length) {
        setProblem('No se pudo borrar el archivo. No se quitó la noticia.');
        return;
      }
    }
    const { data, error } = await db.rpc('moderate_report', { p_report_id: report.id, p_action: action });
    if (error || data !== 'ok') setProblem('No se pudo guardar la decisión.');
    load();
  };

  if (!reports) return <p role="status" className="text-secondary text-ink-2">Cargando...</p>;

  return (
    <section aria-labelledby="reports-title" className="space-y-3">
      <h2 id="reports-title" className="text-section font-bold">{view === 'review' ? 'Noticias en revisión' : 'Noticias publicadas'}</h2>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Qué noticias ver">
        {([['review', 'En revisión'], ['published', 'Publicadas']] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={view === id}
            onClick={() => setView(id)}
            className={`min-h-12 px-4 rounded-lg text-secondary font-bold ${view === id ? 'bg-anil text-white' : 'bg-sunken text-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-secondary text-ink-2">
        Llegan aquí cuando tres vecinos las denuncian o cuando el detector del celular no pudo revisar la foto o el video.
      </p>
      <ErrorLine message={problem} />
      {reports.length === 0 && <EmptyLine text={view === 'review' ? 'No hay noticias por revisar.' : 'No hay noticias publicadas.'} />}
      <ul className="list-plain">
        {reports.map((report) => {
          const media = report.media_path ? db.storage.from('reports').getPublicUrl(report.media_path).data.publicUrl : null;
          return (
            <li key={report.id} className="py-4 flex flex-wrap gap-4">
              {media && (report.media_type === 'video'
                ? <video src={media} controls className="w-72 max-h-48 rounded-lg bg-black" />
                : <img src={media} alt="Foto de la noticia" className="w-72 max-h-48 object-contain rounded-lg bg-sunken" />)}
              <div className="flex-1 min-w-64 space-y-1">
                <p className="text-row font-bold">{KIND[report.kind] ?? report.kind} en {report.district}, {report.province}</p>
                <p className="text-body">{report.description}</p>
                <p className="text-secondary text-ink-2">
                  Denuncias de vecinos: {report.flags}. Enviada por {report.author_name} el {formatDate(report.created_at)}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {view === 'review' && (
                    <button type="button" className="btn btn-primary w-auto min-h-12" onClick={() => decide(report, 'publish')}>Publicar</button>
                  )}
                  <button type="button" className="btn btn-danger w-auto min-h-12" onClick={() => decide(report, 'remove')}>Quitar y borrar archivo</button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
