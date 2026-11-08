import React, { useEffect, useState } from 'react';
import { db, EmptyLine, ErrorLine, formatDate, formatPhone } from './shared';

interface Lookup {
  status: 'ok' | 'not_found';
  code?: string;
  phone?: string | null;
  posts?: number;
  reports?: number;
  removed?: number;
  badge?: { note: string; granted_at: string } | null;
}

interface Badge {
  code: string | null;
  phone: string | null;
  note: string;
  granted_at: string;
  granted_by: string | null;
  active: boolean;
}

const RESULTS: Record<string, string> = {
  not_found: 'No hay ninguna cuenta con ese código.',
  no_phone: 'Esa cuenta no tiene su celular verificado por la central. Primero debe verificarlo en Llamada gratis.',
  no_note: 'Escribe cómo lo comprobaste.'
};

/**
 * "Celular verificado": only moderators give it, to a neighbour whose phone they checked. It shows on
 * that neighbour's services, donations and news, and stops showing if the number is blocked.
 */
export const BadgesTab: React.FC = () => {
  const [code, setCode] = useState('');
  const [found, setFound] = useState<Lookup | null>(null);
  const [note, setNote] = useState('');
  const [badges, setBadges] = useState<Badge[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const loadList = async () => {
    const { data, error } = await db.rpc('verified_badges_list');
    if (error) setProblem('No se pudo cargar la lista.');
    setBadges((data ?? []) as Badge[]);
  };

  useEffect(() => {
    loadList();
  }, []);

  const lookup = async (value = code) => {
    setProblem(null);
    setFound(null);
    const { data, error } = await db.rpc('badge_lookup', { p_code: value });
    if (error) {
      setProblem('No se pudo buscar. Revisa tu internet.');
      return;
    }
    setFound(data as Lookup);
    setNote('');
  };

  const decide = async (target: string, grant: boolean, reason: string) => {
    setIsBusy(true);
    setProblem(null);
    const { data, error } = await db.rpc('set_verified_badge', { p_code: target, p_grant: grant, p_note: reason });
    setIsBusy(false);
    if (error || data !== 'ok') {
      setProblem(error ? 'No se pudo guardar. Revisa tu internet.' : RESULTS[data as string] ?? 'No se pudo guardar.');
      return;
    }
    await loadList();
    if (found?.code === target) await lookup(target);
  };

  return (
    <section aria-labelledby="badges-title" className="space-y-4">
      <div>
        <h2 id="badges-title" className="text-section font-bold">Celular verificado</h2>
        <p className="text-secondary text-ink-2">
          El distintivo aparece junto al nombre en los servicios, donaciones y noticias del vecino. Solo se puede dar a una cuenta
          que ya verificó su celular con la central. Si su número se bloquea, deja de verse. No significa que se revisó su DNI.
        </p>
      </div>

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          lookup();
        }}
      >
        <div className="min-w-56">
          <label htmlFor="badge-code" className="block pb-1 text-secondary font-bold">Código de usuario del vecino</label>
          <input id="badge-code" className="field uppercase" value={code} maxLength={10} autoComplete="off" onChange={(event) => setCode(event.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary w-auto min-h-12" disabled={code.trim().length < 4}>Buscar</button>
      </form>

      <ErrorLine message={problem} />
      {found?.status === 'not_found' && <p className="text-secondary font-bold text-rojo">{RESULTS.not_found}</p>}

      {found?.status === 'ok' && found.code && (
        <article className="p-4 rounded-lg border border-line space-y-2" aria-label={`Cuenta ${found.code}`}>
          <p className="text-row font-bold">Cuenta {found.code}</p>
          <p className="text-secondary">
            {found.phone ? <>Celular verificado: <strong>{formatPhone(found.phone)}</strong></> : <strong className="text-rojo">Sin celular verificado</strong>}
          </p>
          <p className="text-secondary text-ink-2">
            {found.posts} servicios o donaciones, {found.reports} noticias publicadas, {found.removed} quitadas por moderación.
          </p>
          {found.badge ? (
            <>
              <p className="text-secondary">
                Tiene el distintivo desde el {formatDate(found.badge.granted_at)}. Cómo se comprobó: {found.badge.note}
              </p>
              <button type="button" className="btn btn-secondary w-auto min-h-12" disabled={isBusy} onClick={() => decide(found.code!, false, '')}>
                Quitar distintivo
              </button>
            </>
          ) : !found.phone ? (
            <p className="text-secondary">{RESULTS.no_phone}</p>
          ) : (
            <div className="space-y-2">
              <label htmlFor="badge-note" className="block text-secondary font-bold">Cómo lo comprobaste</label>
              <input
                id="badge-note"
                className="field"
                value={note}
                maxLength={300}
                placeholder="Por ejemplo: lo llamé a su número y confirmó lo que publica"
                onChange={(event) => setNote(event.target.value)}
              />
              <button
                type="button"
                className="btn btn-primary w-auto min-h-12"
                disabled={isBusy || note.trim().length === 0}
                onClick={() => decide(found.code!, true, note)}
              >
                Dar distintivo
              </button>
            </div>
          )}
        </article>
      )}

      <h3 className="pt-2 text-row font-bold">Con el distintivo</h3>
      {badges?.length === 0 && <EmptyLine text="Todavía nadie tiene el distintivo." />}
      <ul className="list-plain">
        {badges?.map((badge) => (
          <li key={`${badge.code}-${badge.granted_at}`} className="py-3 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-64">
              <p className="text-row font-bold">
                {badge.code ?? 'Cuenta borrada'}
                {badge.phone ? `, ${formatPhone(badge.phone)}` : ''}
              </p>
              <p className="text-secondary text-ink-2">
                {badge.note}. Desde el {formatDate(badge.granted_at)}{badge.granted_by ? `, por ${badge.granted_by}` : ''}.
              </p>
              {!badge.active && <p className="text-secondary font-bold text-rojo">No se ve: su número ya no está verificado.</p>}
            </div>
            {badge.code && (
              <button type="button" className="btn btn-secondary w-auto min-h-12" disabled={isBusy} onClick={() => decide(badge.code!, false, '')}>
                Quitar
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};
