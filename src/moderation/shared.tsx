import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** Its own session, apart from the anonymous one the app keeps in the same browser. */
export const db = createClient(url, publishableKey, {
  auth: { storageKey: 'ayllu-moderacion', persistSession: true, autoRefreshToken: true }
});

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Lima' });

export const formatPhone = (phone: string) => phone.replace(/^(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3');

export const mapsLink = (lat: number, lng: number) => `https://www.google.com/maps?q=${lat},${lng}`;

export const CALL_STATUS: Record<string, string> = {
  pending: 'En cola',
  calling_caller: 'Llamando a quien pidió',
  calling_destination: 'Llamando al destino',
  connected: 'Conectados',
  completed: 'Completada',
  caller_no_answer: 'No contestó quien pidió',
  destination_no_answer: 'No contestó el destino',
  failed: 'Falló'
};

export const ErrorLine: React.FC<{ message: string | null }> = ({ message }) =>
  message ? <p role="alert" className="text-secondary font-bold text-rojo">{message}</p> : null;

export const EmptyLine: React.FC<{ text: string }> = ({ text }) => <p className="py-6 text-secondary text-ink-2">{text}</p>;

/** Listens to a private recording through a link that expires in ten minutes. */
export const RecordingPlayer: React.FC<{ path: string }> = ({ path }) => {
  const [src, setSrc] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await db.storage.from('call-recordings').createSignedUrl(path, 600);
    if (error || !data?.signedUrl) setProblem('No se pudo abrir la grabación.');
    else setSrc(data.signedUrl);
  };

  if (src) {
    return (
      <div className="space-y-1">
        <audio controls src={src} className="w-full max-w-md" />
        <p className="text-meta text-ink-2">Lado izquierdo: quien llamó. Lado derecho: quien contestó.</p>
      </div>
    );
  }
  return (
    <div>
      <button type="button" className="btn btn-secondary w-auto min-h-12" onClick={load}>Escuchar grabación</button>
      <ErrorLine message={problem} />
    </div>
  );
};

/** Asks for a reason inline, so blocking someone is never a single accidental click. */
export const BlockButton: React.FC<{ phone: string; onDone: () => void }> = ({ phone, onDone }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  const block = async (event: React.FormEvent) => {
    event.preventDefault();
    const { data, error } = await db.rpc('block_phone', { p_phone: phone, p_reason: reason });
    if (error || data !== 'ok') {
      setProblem('No se pudo bloquear. Escribe el motivo.');
      return;
    }
    setIsOpen(false);
    onDone();
  };

  if (!isOpen) {
    return <button type="button" className="btn btn-danger w-auto min-h-12" onClick={() => setIsOpen(true)}>Bloquear a {formatPhone(phone)}</button>;
  }
  return (
    <form onSubmit={block} className="flex flex-wrap items-end gap-2">
      <div className="flex-1 min-w-56">
        <label htmlFor={`block-${phone}`} className="block pb-1 text-secondary font-bold">Motivo del bloqueo</label>
        <input id={`block-${phone}`} className="field" value={reason} onChange={(event) => setReason(event.target.value)} required maxLength={300} />
      </div>
      <button type="submit" className="btn btn-danger w-auto min-h-12">Confirmar bloqueo</button>
      <button type="button" className="btn btn-secondary w-auto min-h-12" onClick={() => setIsOpen(false)}>Cancelar</button>
      <ErrorLine message={problem} />
    </form>
  );
};
