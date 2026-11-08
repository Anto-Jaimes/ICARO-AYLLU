import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { BlockedTab, LogTab } from './BlockedTab';
import { CallsTab } from './CallsTab';
import { CommentsTab } from './CommentsTab';
import { ComplaintsTab } from './ComplaintsTab';
import { PostsTab } from './PostsTab';
import { ReportsTab } from './ReportsTab';
import { db, ErrorLine } from './shared';

type Stage = 'checking' | 'signed_out' | 'not_moderator' | 'must_change' | 'ready';
type Tab = 'reports' | 'posts' | 'comments' | 'calls' | 'complaints' | 'blocked' | 'log';

const MIN_PASSWORD = 10;

const LoginView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsBusy(true);
    const { error } = await db.auth.signInWithPassword({ email: email.trim(), password });
    setIsBusy(false);
    if (error) setProblem('Correo o contraseña incorrectos.');
  };

  return (
    <form onSubmit={signIn} className="max-w-sm mx-auto mt-16 space-y-4 px-4">
      <h1 className="text-title font-bold">Moderación AYLLU</h1>
      <p className="text-secondary text-ink-2">Solo para el equipo que revisa noticias y llamadas.</p>
      <div>
        <label htmlFor="mod-email" className="block pb-1 text-secondary font-bold">Correo</label>
        <input id="mod-email" className="field" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </div>
      <div>
        <label htmlFor="mod-password" className="block pb-1 text-secondary font-bold">Contraseña</label>
        <input id="mod-password" className="field" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      </div>
      <ErrorLine message={problem} />
      <button type="submit" className="btn btn-primary" disabled={isBusy}>{isBusy ? 'Entrando...' : 'Entrar'}</button>
    </form>
  );
};

const ChangePasswordView: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < MIN_PASSWORD) return setProblem(`Usa al menos ${MIN_PASSWORD} caracteres.`);
    if (password !== repeat) return setProblem('Las dos contraseñas no coinciden.');
    const { error } = await db.auth.updateUser({ password });
    if (error) return setProblem('No se pudo cambiar. Prueba con otra contraseña.');
    await db.rpc('password_changed');
    onDone();
  };

  return (
    <form onSubmit={save} className="max-w-sm mx-auto mt-16 space-y-4 px-4">
      <h1 className="text-title font-bold">Cambia tu contraseña</h1>
      <p className="text-secondary text-ink-2">
        Es tu primer ingreso. El panel tiene grabaciones y ubicaciones de vecinos: elige una contraseña que nadie más conozca.
      </p>
      <div>
        <label htmlFor="mod-new" className="block pb-1 text-secondary font-bold">Contraseña nueva</label>
        <input id="mod-new" className="field" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      </div>
      <div>
        <label htmlFor="mod-repeat" className="block pb-1 text-secondary font-bold">Repítela</label>
        <input id="mod-repeat" className="field" type="password" autoComplete="new-password" value={repeat} onChange={(event) => setRepeat(event.target.value)} required />
      </div>
      <ErrorLine message={problem} />
      <button type="submit" className="btn btn-primary">Guardar contraseña</button>
    </form>
  );
};

export const ModerationApp: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [stage, setStage] = useState<Stage>('checking');
  const [name, setName] = useState('');
  const [tab, setTab] = useState<Tab>('reports');
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  const [complaintCount, setComplaintCount] = useState<number | null>(null);
  const [postFlagCount, setPostFlagCount] = useState<number | null>(null);

  const evaluate = async (current: Session | null) => {
    setSession(current);
    if (!current) return setStage('signed_out');
    const { data } = await db.from('moderators').select('display_name, must_change_password').eq('user_id', current.user.id).maybeSingle();
    if (!data) return setStage('not_moderator');
    setName(data.display_name);
    setStage(data.must_change_password ? 'must_change' : 'ready');
  };

  useEffect(() => {
    db.auth.getSession().then(({ data }) => evaluate(data.session));
    const { data } = db.auth.onAuthStateChange((event, current) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') evaluate(current);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Reported services and donations show in their tab's name from the start, not only once opened.
  useEffect(() => {
    if (stage !== 'ready') return;
    db.rpc('moderation_posts', { p_limit: 300 }).then(({ data }) => {
      const posts = (data ?? []) as { flags: number; status: string }[];
      setPostFlagCount(posts.filter((post) => post.flags > 0 && post.status !== 'removed').length);
    });
  }, [stage]);

  const signOut = () => db.auth.signOut();

  if (stage === 'checking') return <p role="status" className="p-6 text-secondary text-ink-2">Cargando...</p>;
  if (stage === 'signed_out') return <LoginView />;
  if (stage === 'must_change') return <ChangePasswordView onDone={() => evaluate(session)} />;
  if (stage === 'not_moderator') {
    return (
      <div className="max-w-sm mx-auto mt-16 space-y-4 px-4">
        <h1 className="text-title font-bold">Esta cuenta no es de moderador</h1>
        <button type="button" className="btn btn-secondary" onClick={signOut}>Salir</button>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'reports', label: `Noticias${reviewCount ? ` (${reviewCount})` : ''}` },
    { id: 'posts', label: `Servicios y donaciones${postFlagCount ? ` (${postFlagCount})` : ''}` },
    { id: 'comments', label: 'Comentarios' },
    { id: 'calls', label: 'Llamadas' },
    { id: 'complaints', label: `Denuncias${complaintCount ? ` (${complaintCount})` : ''}` },
    { id: 'blocked', label: 'Bloqueados' },
    { id: 'log', label: 'Registro' }
  ];

  return (
    <div className="min-h-dvh bg-surface">
      <header className="border-b border-line">
        <div className="page px-4 flex flex-wrap items-center gap-3 min-h-16">
          <h1 className="flex-1 text-title font-bold">Moderación AYLLU</h1>
          <p className="text-secondary text-ink-2">{name}</p>
          <button type="button" className="btn btn-secondary w-auto min-h-12" onClick={signOut}>Salir</button>
        </div>
        <nav className="page px-4 flex flex-wrap gap-2 pb-3" aria-label="Secciones del panel">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              className="chip"
              aria-pressed={tab === item.id}
              aria-current={tab === item.id ? 'page' : undefined}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="page px-4 py-6">
        {tab === 'reports' && <ReportsTab onCount={setReviewCount} />}
        {tab === 'posts' && <PostsTab onCount={setPostFlagCount} />}
        {tab === 'comments' && <CommentsTab />}
        {tab === 'calls' && <CallsTab />}
        {tab === 'complaints' && <ComplaintsTab onCount={setComplaintCount} />}
        {tab === 'blocked' && <BlockedTab />}
        {tab === 'log' && <LogTab />}
      </main>
    </div>
  );
};
