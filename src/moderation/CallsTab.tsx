import React, { useEffect, useState } from 'react';
import { BlockButton, CALL_STATUS, db, EmptyLine, ErrorLine, formatDate, formatPhone, mapsLink, RecordingPlayer } from './shared';

export interface CallRow {
  id: string;
  user_code: string;
  caller_phone: string;
  destination: string;
  caller_lat: number | null;
  caller_lng: number | null;
  caller_place: string | null;
  status: string;
  talk_seconds: number | null;
  recording_path: string | null;
  has_complaint: boolean;
  created_at: string;
}

export const CALL_COLUMNS = 'id, user_code, caller_phone, destination, caller_lat, caller_lng, caller_place, status, talk_seconds, recording_path, has_complaint, created_at';

export const CallSummary: React.FC<{ call: CallRow; onChange: () => void }> = ({ call, onChange }) => {
  const toggleComplaint = async () => {
    await db.rpc('set_call_complaint', { p_call_id: call.id, p_has_complaint: !call.has_complaint });
    onChange();
  };

  return (
    <div className="space-y-2">
      <p className="text-row font-bold">
        Usuario {call.user_code}: {formatPhone(call.caller_phone)} llamó a {formatPhone(call.destination)}
      </p>
      <p className="text-secondary text-ink-2">
        {CALL_STATUS[call.status] ?? call.status}
        {call.talk_seconds !== null ? `, ${call.talk_seconds} s de conversación` : ''}, el {formatDate(call.created_at)}
        {call.has_complaint && <strong className="block text-rojo">Con denuncia: la grabación se conserva.</strong>}
      </p>
      <p className="text-secondary text-ink-2">
        Ubicación de quien llamó:{' '}
        {call.caller_lat !== null && call.caller_lng !== null
          ? <a href={mapsLink(call.caller_lat, call.caller_lng)} target="_blank" rel="noreferrer" className="text-anil underline">{call.caller_place || 'ver en el mapa'}</a>
          : 'no la compartió'}
      </p>
      {call.recording_path ? <RecordingPlayer path={call.recording_path} /> : <p className="text-secondary text-ink-2">Sin grabación.</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-secondary w-auto min-h-12" onClick={toggleComplaint}>
          {call.has_complaint ? 'Quitar marca de denuncia' : 'Marcar con denuncia'}
        </button>
        <BlockButton phone={call.caller_phone} onDone={onChange} />
      </div>
    </div>
  );
};

export const CallsTab: React.FC = () => {
  const [calls, setCalls] = useState<CallRow[] | null>(null);
  const [search, setSearch] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  const load = async (term = search) => {
    let query = db.from('call_requests').select(CALL_COLUMNS).order('created_at', { ascending: false }).limit(50);
    const clean = term.trim();
    const digits = clean.replace(/\D/g, '');
    if (digits.length === 9) query = query.or(`caller_phone.eq.${digits},destination.eq.${digits}`);
    else if (/^[A-Za-z0-9]{4,10}$/.test(clean)) query = query.eq('user_code', clean.toUpperCase());
    const { data, error } = await query;
    setProblem(error ? 'No se pudieron cargar las llamadas.' : null);
    setCalls((data ?? []) as CallRow[]);
  };

  useEffect(() => {
    load('');
  }, []);

  return (
    <section aria-labelledby="calls-title" className="space-y-3">
      <h2 id="calls-title" className="text-section font-bold">Llamadas gratis</h2>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          load();
        }}
      >
        <div className="flex-1 min-w-64">
          <label htmlFor="calls-search" className="block pb-1 text-secondary font-bold">Buscar por código de usuario o número</label>
          <input id="calls-search" className="field" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ej.: 36YM7Q o 912345678" />
        </div>
        <button type="submit" className="btn btn-primary w-auto min-h-12">Buscar</button>
        {search && <button type="button" className="btn btn-secondary w-auto min-h-12" onClick={() => { setSearch(''); load(''); }}>Ver todas</button>}
      </form>
      <ErrorLine message={problem} />
      {calls === null && <p role="status" className="text-secondary text-ink-2">Cargando...</p>}
      {calls?.length === 0 && <EmptyLine text="No hay llamadas que coincidan." />}
      <ul className="list-plain">
        {calls?.map((call) => (
          <li key={call.id} className="py-4">
            <CallSummary call={call} onChange={() => load()} />
          </li>
        ))}
      </ul>
    </section>
  );
};
