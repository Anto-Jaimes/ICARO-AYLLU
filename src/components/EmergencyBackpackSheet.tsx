import React, { useEffect, useState } from 'react';
import { useT } from '../i18n/LanguageContext';
import { Check } from 'lucide-react';
import { BottomSheet } from './BottomSheet';

interface EmergencyBackpackSheetProps {
  open: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'ayllu_backpack_items_v1';

const ALL_ITEMS = [
  { id: 'agua', label: 'Agua: 2 litros por persona' },
  { id: 'comida', label: 'Comida que no se malogra: atún, galletas, menestras' },
  { id: 'mascotas', label: 'Comida para tus mascotas, si tienes' },
  { id: 'linterna', label: 'Linterna con pilas de repuesto' },
  { id: 'radio', label: 'Radio a pilas para escuchar las noticias oficiales' },
  { id: 'silbato', label: 'Silbato para que te encuentren' },
  { id: 'botiquin', label: 'Botiquín: gasa, alcohol, vendas y tus medicinas' },
  { id: 'mascarillas', label: 'Mascarillas y toallas húmedas' },
  { id: 'abrigo', label: 'Manta o casaca abrigadora' },
  { id: 'documentos', label: 'Copia del DNI de tu familia y llaves, en una bolsa cerrada' }
];

function loadChecked(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export const EmergencyBackpackSheet: React.FC<EmergencyBackpackSheetProps> = ({ open, onClose }) => {
  const t = useT();
  const [checkedIds, setCheckedIds] = useState<string[]>(loadChecked);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedIds));
    } catch (err) {
      console.warn('No se pudo guardar la mochila:', err);
    }
  }, [checkedIds]);

  const toggleItem = (id: string) => {
    setCheckedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const ready = ALL_ITEMS.filter((item) => checkedIds.includes(item.id)).length;
  const summary = ready === ALL_ITEMS.length
    ? t('Tu mochila está completa.')
    : `Tienes ${ready} de ${ALL_ITEMS.length} cosas. Te faltan ${ALL_ITEMS.length - ready}.`;

  return (
    <BottomSheet open={open} onClose={onClose} title={t("Mochila de emergencia")}>
      <div className="pb-6">
        <p className="px-4 text-secondary text-ink-2">{t('Prepárala antes de un sismo o huaico, y tenla cerca de la puerta. Marca lo que ya tienes.')}</p>
        <p className="px-4 pt-3 text-row font-bold" aria-live="polite">{summary}</p>
        <div
          className="mx-4 mt-2 h-3 rounded-full bg-sunken overflow-hidden"
          role="progressbar"
          aria-label={t("Mochila lista")}
          aria-valuemin={0}
          aria-valuemax={ALL_ITEMS.length}
          aria-valuenow={ready}
        >
          <div className="h-full rounded-full bg-verde" style={{ width: `${(ready / ALL_ITEMS.length) * 100}%` }} />
        </div>

        <ul className="list-plain mt-3">
          {ALL_ITEMS.map((item) => {
            const isChecked = checkedIds.includes(item.id);
            return (
              <li key={item.id}>
                <button type="button" className="row" aria-pressed={isChecked} onClick={() => toggleItem(item.id)}>
                  <span
                    aria-hidden="true"
                    className={`grid place-items-center w-7 h-7 shrink-0 rounded-md border-2 ${isChecked ? 'bg-verde border-verde text-white' : 'border-line'}`}
                  >
                    {isChecked && <Check className="w-5 h-5" />}
                  </span>
                  <span className="flex-1 text-row">{t(item.label)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </BottomSheet>
  );
};
