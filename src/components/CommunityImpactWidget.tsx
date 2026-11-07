import React from 'react';
import { useApp } from '../context/AppContext';
import { Footprints, Leaf, PiggyBank, Users } from 'lucide-react';

export const CommunityImpactWidget: React.FC = () => {
  const { items } = useApp();

  // Calculate dynamic stats based on number of items and neighbors
  const totalInteractions = items.length;
  const estimatedKmSaved = totalInteractions * 3.8; // Average round-trip saved per local interaction
  const co2AvoidedKg = (estimatedKmSaved * 0.17).toFixed(1); // 170g CO2 per km avoided
  const estimatedMoneySavedSol = totalInteractions * 25; // S/ 25 average delivery / taxi fee saved

  return (
    <div className="mb-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-4 rounded-2xl border border-emerald-700/60 shadow-md">
      <div className="flex items-center justify-between pb-2 border-b border-emerald-800/60 mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-lg bg-emerald-500 text-slate-950 font-bold">
            <Leaf className="w-3.5 h-3.5" />
          </span>
          <span className="font-extrabold uppercase tracking-wider text-[11px] text-emerald-300">
            Impacto Ecológico y Ahorro Barrial (Proximidad Sin Transporte)
          </span>
        </div>
        <span className="text-[10px] bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
          Economía Circular
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
        <div className="bg-white/5 p-2 rounded-xl border border-white/10">
          <span className="text-base sm:text-lg font-black text-emerald-400">
            {estimatedKmSaved.toFixed(0)} km
          </span>
          <p className="text-[10px] text-slate-300 font-semibold flex items-center justify-center gap-1 mt-0.5">
            <Footprints className="w-3 h-3 text-emerald-400" />
            <span>Viajes en auto evitados</span>
          </p>
        </div>

        <div className="bg-white/5 p-2 rounded-xl border border-white/10">
          <span className="text-base sm:text-lg font-black text-cyan-300">
            {co2AvoidedKg} kg
          </span>
          <p className="text-[10px] text-slate-300 font-semibold flex items-center justify-center gap-1 mt-0.5">
            <Leaf className="w-3 h-3 text-cyan-300" />
            <span>CO₂ no emitido</span>
          </p>
        </div>

        <div className="bg-white/5 p-2 rounded-xl border border-white/10">
          <span className="text-base sm:text-lg font-black text-amber-300">
            S/ {estimatedMoneySavedSol}
          </span>
          <p className="text-[10px] text-slate-300 font-semibold flex items-center justify-center gap-1 mt-0.5">
            <PiggyBank className="w-3 h-3 text-amber-300" />
            <span>Ahorro en fletes/pasajes</span>
          </p>
        </div>
      </div>
    </div>
  );
};
