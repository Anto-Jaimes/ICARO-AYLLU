import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ensureSession } from '../services/postsService';

/** "2026-11-07T14:30" in the visitor's own clock, for the date field. */
const nowForInput = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

/** Anyone who got an AYLLU call can report it here, without installing the app. */
export const ComplaintPage: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [when, setWhen] = useState(nowForInput);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsBusy(true);
    setProblem(null);
    try {
      await ensureSession();
      const { data, error } = await supabase.rpc('submit_call_complaint', {
        p_phone: phone,
        p_called_at: new Date(when).toISOString(),
        p_code: code,
        p_description: description
      });
      if (error) throw error;
      if (data === 'ok') setIsSent(true);
      else if (data === 'too_many') setProblem('Ya enviaste 3 denuncias hoy. Si es urgente, llama a la Policía al 105.');
      else setProblem('Revisa tu número (9 cifras que empiezan con 9) y cuéntanos qué pasó.');
    } catch {
      setProblem('No se pudo enviar. Revisa tu internet y vuelve a intentar.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <main className="max-w-xl mx-auto px-4 py-8 space-y-4">
      <h1 className="text-title font-bold">Denunciar una llamada de AYLLU</h1>
      {isSent ? (
        <div role="status" className="space-y-3">
          <p className="text-body">Recibimos tu denuncia. El equipo de AYLLU revisará la llamada y puede bloquear a quien llamó.</p>
          <p className="text-body font-bold">Si te amenazaron o te pidieron dinero, denúncialo también a la Policía: marca 105 o acude a la comisaría más cercana.</p>
        </div>
      ) : (
        <form onSubmit={send} className="space-y-4">
          <p className="text-body text-ink-2">
            AYLLU da llamadas gratis a sus vecinos. Si alguien te llamó desde AYLLU para amenazarte, pedirte dinero o molestarte, cuéntanos.
            Las llamadas se graban: así podemos revisar qué pasó.
          </p>
          <div>
            <label htmlFor="complaint-phone" className="block pb-1 text-secondary font-bold">Tu número, el que recibió la llamada</label>
            <input id="complaint-phone" className="field" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required placeholder="9XX XXX XXX" />
          </div>
          <div>
            <label htmlFor="complaint-when" className="block pb-1 text-secondary font-bold">Cuándo fue, más o menos</label>
            <input id="complaint-when" className="field" type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} required />
          </div>
          <div>
            <label htmlFor="complaint-code" className="block pb-1 text-secondary font-bold">Código que escuchaste (si lo recuerdas)</label>
            <input id="complaint-code" className="field uppercase" value={code} onChange={(event) => setCode(event.target.value)} maxLength={10} aria-describedby="complaint-code-help" />
            <p id="complaint-code-help" className="pt-1 text-meta text-ink-2">Al contestar se escucha: "de parte del usuario…", seguido de letras y números.</p>
          </div>
          <div>
            <label htmlFor="complaint-description" className="block pb-1 text-secondary font-bold">Qué pasó</label>
            <textarea id="complaint-description" className="field" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} required minLength={5} maxLength={1000} />
          </div>
          {problem && <p role="alert" className="text-secondary font-bold text-rojo">{problem}</p>}
          <button type="submit" className="btn btn-primary" disabled={isBusy}>{isBusy ? 'Enviando...' : 'Enviar denuncia'}</button>
          <p className="text-meta text-ink-2">En una emergencia llama a la Policía al 105.</p>
        </form>
      )}
    </main>
  );
};
