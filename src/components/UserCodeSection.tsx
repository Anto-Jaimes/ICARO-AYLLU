import React, { useEffect, useState } from 'react';
import { CODE_CHANGE_PROBLEMS, cachedUserCode, changeUserCode, fetchUserCode } from '../services/userCodeService';

/** Shows the neighbour's code and lets them pick another one that nobody else has. */
export const UserCodeSection: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  const [code, setCode] = useState<string | null>(cachedUserCode);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setIsEditing(false);
      setProblem(null);
      return;
    }
    fetchUserCode()
      .then(setCode)
      .catch(() => {
        if (!cachedUserCode()) setProblem('Necesitas internet para ver tu código la primera vez.');
      });
  }, [isVisible]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setProblem(null);
    try {
      const result = await changeUserCode(draft);
      if (result === 'ok') {
        setCode(draft.trim().toUpperCase());
        setIsEditing(false);
      } else {
        setProblem(CODE_CHANGE_PROBLEMS[result]);
      }
    } catch {
      setProblem('Necesitas internet para cambiar tu código.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="px-4 pb-4 border-b border-line" aria-labelledby="user-code-title">
      <h3 id="user-code-title" className="text-secondary text-ink-2">Tu código de usuario</h3>
      {isEditing ? (
        <form onSubmit={save} className="pt-2 space-y-2">
          <label htmlFor="user-code-input" className="block text-secondary font-bold">Nuevo código</label>
          <input
            id="user-code-input"
            className="field uppercase"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={10}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-describedby="user-code-help"
          />
          <p id="user-code-help" className="text-meta text-ink-2">De 4 a 10 letras o números. Solo puedes cambiarlo una vez al día.</p>
          {problem && <p role="alert" className="text-secondary font-bold text-rojo">{problem}</p>}
          <div className="flex gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => { setIsEditing(false); setProblem(null); }}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving || draft.trim().length < 4}>
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-3 pt-1">
          <p className="flex-1 text-sign font-bold tracking-widest" aria-live="polite">{code ?? '······'}</p>
          {code && (
            <button type="button" className="btn btn-secondary w-auto min-h-12" onClick={() => { setDraft(code); setIsEditing(true); }}>
              Cambiar
            </button>
          )}
        </div>
      )}
      {!isEditing && problem && <p role="status" className="pt-1 text-secondary text-ink-2">{problem}</p>}
      <p className="pt-1 text-meta text-ink-2">Te distingue de los demás vecinos. Se anuncia cuando llamas desde AYLLU.</p>
    </section>
  );
};
