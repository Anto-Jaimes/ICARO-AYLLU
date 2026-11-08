import React, { useEffect, useState } from 'react';
import { BlockButton, db, EmptyLine, ErrorLine, formatDate, formatPhone } from './shared';

interface Blocked {
  phone: string;
  reason: string;
  created_at: string;
}

export const BlockedTab: React.FC = () => {
  const [blocked, setBlocked] = useState<Blocked[] | null>(null);
  const [phone, setPhone] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await db.from('blocked_phones').select('phone, reason, created_at').order('created_at', { ascending: false });
    setProblem(error ? 'No se pudieron cargar los bloqueos.' : null);
    setBlocked((data ?? []) as Blocked[]);
  };

  useEffect(() => {
    load();
  }, []);

  const unblock = async (number: string) => {
    await db.rpc('unblock_phone', { p_phone: number });
    load();
  };

  const digits = phone.replace(/\D/g, '').slice(-9);

  return (
    <section aria-labelledby="blocked-title" className="space-y-3">
      <h2 id="blocked-title" className="text-section font-bold">Números bloqueados</h2>
      <p className="text-secondary text-ink-2">Un número bloqueado ya no puede verificarse ni pedir llamadas gratis.</p>
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-56">
          <label htmlFor="block-new" className="block pb-1 text-secondary font-bold">Bloquear otro número</label>
          <input id="block-new" className="field" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="9XX XXX XXX" />
        </div>
        {/^9\d{8}$/.test(digits) && <BlockButton phone={digits} onDone={() => { setPhone(''); load(); }} />}
      </div>
      <ErrorLine message={problem} />
      {blocked?.length === 0 && <EmptyLine text="No hay números bloqueados." />}
      <ul className="list-plain">
        {blocked?.map((item) => (
          <li key={item.phone} className="py-3 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-64">
              <p className="text-row font-bold">{formatPhone(item.phone)}</p>
              <p className="text-secondary text-ink-2">{item.reason}. Desde el {formatDate(item.created_at)}</p>
            </div>
            <button type="button" className="btn btn-secondary w-auto min-h-12" onClick={() => unblock(item.phone)}>Desbloquear</button>
          </li>
        ))}
      </ul>
    </section>
  );
};

interface LogEntry {
  id: number;
  moderator_id: string | null;
  action: string;
  target_id: string | null;
  note: string | null;
  created_at: string;
}

const ACTIONS: Record<string, string> = {
  report_publish: 'publicó una noticia',
  report_remove: 'quitó una noticia',
  post_removed: 'quitó un servicio o donación',
  post_restored: 'restauró un servicio o donación',
  comment_removed: 'borró un comentario',
  call_mark: 'marcó una llamada con denuncia',
  call_unmark: 'quitó la marca de denuncia de una llamada',
  phone_block: 'bloqueó un número',
  phone_unblock: 'desbloqueó un número',
  badge_grant: 'dio el distintivo de celular verificado',
  badge_revoke: 'quitó el distintivo de celular verificado',
  complaint_reviewed: 'revisó una denuncia',
  complaint_dismissed: 'descartó una denuncia',
  complaint_new: 'reabrió una denuncia'
};

/** Who did what: every decision in the panel is written down. */
export const LogTab: React.FC = () => {
  const [entries, setEntries] = useState<LogEntry[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      db.from('moderation_log').select('id, moderator_id, action, target_id, note, created_at').order('created_at', { ascending: false }).limit(100),
      db.from('moderators').select('user_id, display_name')
    ]).then(([log, team]) => {
      setNames(Object.fromEntries((team.data ?? []).map((member) => [member.user_id, member.display_name])));
      setEntries((log.data ?? []) as LogEntry[]);
    });
  }, []);

  return (
    <section aria-labelledby="log-title" className="space-y-3">
      <h2 id="log-title" className="text-section font-bold">Registro de decisiones</h2>
      {entries === null && <p role="status" className="text-secondary text-ink-2">Cargando...</p>}
      {entries?.length === 0 && <EmptyLine text="Todavía no hay decisiones." />}
      <ul className="list-plain">
        {entries?.map((entry) => (
          <li key={entry.id} className="py-2">
            <p className="text-secondary">
              <strong>{entry.moderator_id ? names[entry.moderator_id] ?? 'Un moderador' : 'Un moderador'}</strong> {ACTIONS[entry.action] ?? entry.action}
              {entry.action.startsWith('phone') && entry.target_id ? ` (${formatPhone(entry.target_id)})` : ''}
              {entry.note ? `: ${entry.note}` : ''}.
            </p>
            <p className="text-meta text-ink-2">{formatDate(entry.created_at)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};
