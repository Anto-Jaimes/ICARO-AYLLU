import React, { useState, useEffect } from 'react';
import { Backpack, Check, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { BottomSheet } from './BottomSheet';

interface EmergencyBackpackSheetProps {
  open: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'ayllu_backpack_items_v1';

interface BackpackItem {
  id: string;
  label: string;
  category: 'vital' | 'salud' | 'comunicacion' | 'abrigo';
}

const ALL_ITEMS: BackpackItem[] = [
  { id: 'agua', label: '💧 Botellas de agua (2 litros por persona)', category: 'vital' },
  { id: 'comida', label: '🥫 Alimentos no perecibles (atún, galletas, barras)', category: 'vital' },
  { id: 'mascotas', label: '🐾 Alimento para mascotas (si tienes animales)', category: 'vital' },
  { id: 'linterna', label: '🔦 Linterna con pilas de repuesto', category: 'comunicacion' },
  { id: 'radio', label: '📻 Radio portátil a pilas para noticias oficiales', category: 'comunicacion' },
  { id: 'silbato', label: '🗣️ Silbato de rescate para alertar ubicación', category: 'comunicacion' },
  { id: 'botiquin', label: '🩹 Botiquín básico (gasa, alcohol, vendas, analgésico)', category: 'salud' },
  { id: 'mascarillas', label: '😷 Mascarillas y toallas húmedas', category: 'salud' },
  { id: 'abrigo', label: '🧥 Manta polar o chaqueta cortaviento', category: 'abrigo' },
  { id: 'documentos', label: '📁 Fotocopia de DNI familiar y llaves en bolsa hermética', category: 'abrigo' },
];

export const EmergencyBackpackSheet: React.FC<EmergencyBackpackSheetProps> = ({ open, onClose }) => {
  const [checkedIds, setCheckedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : ['linterna', 'silbato'];
    } catch {
      return ['linterna', 'silbato'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedIds));
    } catch (err) {
      console.warn('Could not save backpack items:', err);
    }
  }, [checkedIds]);

  const toggleItem = (id: string) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const percentage = Math.round((checkedIds.length / ALL_ITEMS.length) * 100);

  return (
    <BottomSheet open={open} onClose={onClose} title="Mochila de Emergencia (INDECI)">
      <div className="px-4 pb-6 space-y-4 text-ink">
        <p className="text-secondary text-ink-2">
          Guía interactiva offline para preparar la mochila familiar ante sismos o huaicos.
        </p>

        {/* Progress Bar Card */}
        <div className="p-4 bg-surface rounded-2xl border-2 border-line">
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-bold text-row flex items-center gap-1.5">
              <Backpack className="w-5 h-5 text-anil" />
              <span>Preparación de tu hogar</span>
            </span>
            <span className={`font-black text-section ${
              percentage >= 80 ? 'text-emerald-600' : percentage >= 50 ? 'text-amber-600' : 'text-rojo'
            }`}>
              {percentage}%
            </span>
          </div>

          <div className="w-full h-3 bg-surface-press rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-rojo'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          <p className="text-meta text-ink-2 mt-2">
            {percentage === 100
              ? '🎉 ¡Excelente! Tu familia tiene la mochila completa al 100%.'
              : percentage >= 70
                ? '👍 Vas muy bien. Revisa los elementos que aún te faltan.'
                : '⚠️ Alerta: Te faltan insumos críticos para las primeras 24 horas.'}
          </p>
        </div>

        {/* Checklist */}
        <div className="space-y-2">
          {ALL_ITEMS.map((item) => {
            const isChecked = checkedIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleItem(item.id)}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                  isChecked
                    ? 'bg-emerald-50/60 border-emerald-300 text-ink'
                    : 'bg-surface border-line text-ink hover:bg-surface-press'
                }`}
              >
                <span className={`text-secondary font-medium leading-snug pr-2 ${isChecked ? 'line-through text-ink-2' : ''}`}>
                  {item.label}
                </span>

                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition ${
                  isChecked
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-line bg-surface'
                }`}>
                  {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </BottomSheet>
  );
};
