import React, { useEffect, useState } from 'react';
import { db, EmptyLine, ErrorLine, formatDate, formatPhone } from './shared';

interface ModeratedPost {
  id: string;
  type: 'service' | 'favor_offer' | 'favor_request';
  category: string;
  title: string;
  description: string;
  author_name: string;
  author_phone: string | null;
  neighborhood: string;
  photos: string[] | null;
  status: string;
  created_at: string;
  flags: number;
}

const TYPE: Record<ModeratedPost['type'], string> = {
  service: 'Servicio',
  favor_offer: 'Donación que regalan',
  favor_request: 'Pedido de donación'
};

type Filter = 'flagged' | 'all' | 'removed';

/**
 * Services and donations: the most reported first. Removing hides the post everywhere (it stays in the
 * database so a mistake can be undone); its author cannot bring it back.
 */
export const PostsTab: React.FC<{ onCount: (count: number) => void }> = ({ onCount }) => {
  const [posts, setPosts] = useState<ModeratedPost[] | null>(null);
  const [filter, setFilter] = useState<Filter>('flagged');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await db.rpc('moderation_posts', { p_limit: 200 });
    if (error) setProblem('No se pudieron cargar las publicaciones.');
    const list = (data ?? []) as ModeratedPost[];
    setPosts(list);
    onCount(list.filter((post) => post.flags > 0 && post.status !== 'removed').length);
  };

  useEffect(() => {
    load();
  }, []);

  const decide = async (post: ModeratedPost, action: 'remove' | 'restore') => {
    setProblem(null);
    const { data, error } = await db.rpc('moderate_post', { p_post_id: post.id, p_action: action, p_note: notes[post.id]?.trim() || null });
    if (error || data !== 'ok') setProblem('No se pudo guardar la decisión.');
    load();
  };

  if (!posts) return <p role="status" className="text-secondary text-ink-secondary">Cargando...</p>;

  const shown = posts.filter((post) =>
    filter === 'removed' ? post.status === 'removed' : post.status !== 'removed' && (filter === 'all' || post.flags > 0)
  );

  return (
    <section aria-labelledby="posts-title" className="space-y-3">
      <h2 id="posts-title" className="text-section font-bold">Servicios y donaciones</h2>
      <p className="text-secondary text-ink-secondary">
        Quita lo que sea estafa, publicidad engañosa, venta de cosas prohibidas o una ofensa. Se oculta para todos y queda en el registro.
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Qué publicaciones ver">
        {([['flagged', 'Denunciadas'], ['all', 'Todas'], ['removed', 'Quitadas']] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
            className={`min-h-12 px-4 rounded-lg text-secondary font-bold ${filter === id ? 'bg-primary text-white' : 'bg-sunken text-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <ErrorLine message={problem} />
      {shown.length === 0 && (
        <EmptyLine text={filter === 'flagged' ? 'Ninguna publicación tiene denuncias.' : filter === 'removed' ? 'No se quitó ninguna publicación.' : 'No hay publicaciones.'} />
      )}
      <ul className="list-plain">
        {shown.map((post) => (
          <li key={post.id} className="py-4 flex flex-wrap gap-4 border-b border-border">
            {post.photos?.[0] && (
              <img
                src={db.storage.from('post-photos').getPublicUrl(post.photos[0]).data.publicUrl}
                alt="Foto de la publicación"
                className="w-40 h-32 object-cover rounded-lg bg-sunken"
              />
            )}
            <div className="flex-1 min-w-64 space-y-1">
              <p className="text-meta font-bold text-ink-secondary">{TYPE[post.type]} ({post.category})</p>
              <p className="text-row font-bold">{post.title}</p>
              {post.description && <p className="text-body">{post.description}</p>}
              <p className="text-secondary text-ink-secondary">
                {post.author_name}{post.author_phone ? `, ${formatPhone(post.author_phone.replace('+51', ''))}` : ''}. {post.neighborhood}. {formatDate(post.created_at)}
              </p>
              <p className={`text-secondary font-bold ${post.flags > 0 ? 'text-status-danger' : 'text-ink-secondary'}`}>
                Denuncias de vecinos: {post.flags}
              </p>
              <label className="block pt-1 text-secondary font-bold" htmlFor={`note-${post.id}`}>Motivo (queda en el registro)</label>
              <input
                id={`note-${post.id}`}
                className="field max-w-md"
                maxLength={300}
                value={notes[post.id] ?? ''}
                onChange={(event) => setNotes({ ...notes, [post.id]: event.target.value })}
                placeholder="Ej.: estafa, publicidad, ofensa"
              />
              <div className="flex flex-wrap gap-2 pt-2">
                {post.status === 'removed' ? (
                  <button type="button" className="btn btn-secondary w-auto min-h-12" onClick={() => decide(post, 'restore')}>Restaurar</button>
                ) : (
                  <button type="button" className="btn btn-danger w-auto min-h-12" onClick={() => decide(post, 'remove')}>Quitar publicación</button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
