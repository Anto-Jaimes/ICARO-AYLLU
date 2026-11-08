import React, { useEffect, useState } from 'react';
import { db, EmptyLine, ErrorLine, formatDate } from './shared';

interface ModeratedComment {
  id: string;
  report_id: string;
  author_name: string;
  body: string;
  created_at: string;
  reports: { kind: string; district: string; description: string } | null;
}

const KIND: Record<string, string> = {
  accidente: 'Accidente', huaico: 'Huaico', inundacion: 'Inundación', incendio: 'Incendio', sismo: 'Sismo', otro: 'Aviso'
};

/** The newest comments on neighbour news. Deleting one is final and goes to the log. */
export const CommentsTab: React.FC = () => {
  const [comments, setComments] = useState<ModeratedComment[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await db.from('report_comments')
      .select('id, report_id, author_name, body, created_at, reports(kind, district, description)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) setProblem('No se pudieron cargar los comentarios.');
    setComments((data ?? []) as unknown as ModeratedComment[]);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (comment: ModeratedComment) => {
    setProblem(null);
    const { data, error } = await db.rpc('moderate_comment', { p_comment_id: comment.id, p_note: comment.body.slice(0, 120) });
    if (error || data !== 'ok') setProblem('No se pudo borrar el comentario.');
    load();
  };

  if (!comments) return <p role="status" className="text-secondary text-ink-secondary">Cargando...</p>;

  return (
    <section aria-labelledby="comments-title" className="space-y-3">
      <h2 id="comments-title" className="text-section font-bold">Comentarios en las noticias</h2>
      <p className="text-secondary text-ink-secondary">Los 100 más recientes. Borra insultos, datos personales de otros, estafas o mentiras que pongan en riesgo.</p>
      <ErrorLine message={problem} />
      {comments.length === 0 && <EmptyLine text="Todavía no hay comentarios." />}
      <ul className="list-plain">
        {comments.map((comment) => (
          <li key={comment.id} className="py-4 flex flex-wrap items-start gap-4 border-b border-border">
            <div className="flex-1 min-w-64 space-y-1">
              {comment.reports && (
                <p className="text-meta font-bold text-ink-secondary">
                  En: {KIND[comment.reports.kind] ?? comment.reports.kind} en {comment.reports.district}. "{comment.reports.description.slice(0, 80)}"
                </p>
              )}
              <p className="text-body">{comment.body}</p>
              <p className="text-secondary text-ink-secondary">{comment.author_name}, {formatDate(comment.created_at)}</p>
            </div>
            <button type="button" className="btn btn-danger w-auto min-h-12" onClick={() => remove(comment)}>Borrar comentario</button>
          </li>
        ))}
      </ul>
    </section>
  );
};
