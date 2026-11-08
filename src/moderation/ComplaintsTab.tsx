import React, { useEffect, useState } from 'react';
import { CALL_COLUMNS, CallRow, CallSummary } from './CallsTab';
import { db, EmptyLine, ErrorLine, formatDate, formatPhone } from './shared';

interface Complaint {
  id: string;
  phone: string;
  heard_code: string | null;
  called_at: string;
  description: string;
  call_id: string | null;
  status: 'new' | 'reviewed' | 'dismissed';
  created_at: string;
}

const STATUS: Record<Complaint['status'], string> = { new: 'Nueva', reviewed: 'Revisada', dismissed: 'Descartada' };

/** Complaints from people who received a call, joined to that call when it was found. */
export const ComplaintsTab: React.FC<{ onCount: (count: number) => void }> = ({ onCount }) => {
  const [complaints, setComplaints] = useState<Complaint[] | null>(null);
  const [calls, setCalls] = useState<Record<string, CallRow>>({});
  const [problem, setProblem] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await db.from('call_complaints')
      .select('id, phone, heard_code, called_at, description, call_id, status, created_at')
      .order('created_at', { ascending: false }).limit(50);
    if (error) setProblem('No se pudieron cargar las denuncias.');
    const list = (data ?? []) as Complaint[];
    const callIds = [...new Set(list.map((complaint) => complaint.call_id).filter(Boolean))] as string[];
    if (callIds.length) {
      const { data: callRows } = await db.from('call_requests').select(CALL_COLUMNS).in('id', callIds);
      setCalls(Object.fromEntries(((callRows ?? []) as CallRow[]).map((call) => [call.id, call])));
    }
    setComplaints(list);
    onCount(list.filter((complaint) => complaint.status === 'new').length);
  };

  useEffect(() => {
    load();
  }, []);

  const review = async (id: string, status: Complaint['status']) => {
    await db.rpc('review_complaint', { p_complaint_id: id, p_status: status });
    load();
  };

  if (!complaints) return <p role="status" className="text-secondary text-ink-secondary">Cargando...</p>;

  return (
    <section aria-labelledby="complaints-title" className="space-y-3">
      <h2 id="complaints-title" className="text-section font-bold">Denuncias de llamadas</h2>
      <p className="text-secondary text-ink-secondary">
        Las envía quien recibió una llamada desde la página pública /denuncia. Si la llamada aparece, se une sola y su grabación se conserva.
      </p>
      <ErrorLine message={problem} />
      {complaints.length === 0 && <EmptyLine text="No hay denuncias." />}
      <ul className="list-plain">
        {complaints.map((complaint) => {
          const call = complaint.call_id ? calls[complaint.call_id] : null;
          return (
            <li key={complaint.id} className="py-4 space-y-2">
              <p className="text-row font-bold">
                {STATUS[complaint.status]}: el {formatPhone(complaint.phone)} denuncia una llamada del {formatDate(complaint.called_at)}
              </p>
              <p className="text-body">{complaint.description}</p>
              <p className="text-secondary text-ink-secondary">
                Código que escuchó: {complaint.heard_code ?? 'no lo anotó'}. Enviada el {formatDate(complaint.created_at)}
              </p>
              <div className="p-3 rounded-lg bg-sunken">
                {call ? <CallSummary call={call} onChange={load} /> : <p className="text-secondary">No se encontró una llamada de AYLLU a ese número en esa fecha.</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                {complaint.status !== 'reviewed' && <button type="button" className="btn btn-primary w-auto min-h-12" onClick={() => review(complaint.id, 'reviewed')}>Marcar revisada</button>}
                {complaint.status !== 'dismissed' && <button type="button" className="btn btn-secondary w-auto min-h-12" onClick={() => review(complaint.id, 'dismissed')}>Descartar</button>}
                {complaint.status !== 'new' && <button type="button" className="btn btn-secondary w-auto min-h-12" onClick={() => review(complaint.id, 'new')}>Volver a nueva</button>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
