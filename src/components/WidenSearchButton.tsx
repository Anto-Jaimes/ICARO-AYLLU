import React from 'react';
import { useApp } from '../context/AppContext';
import { UNLIMITED_RADIUS_M } from '../utils/geo';

/** Shown on empty lists: with real GPS the nearest neighbours may be beyond the radius. */
export const WidenSearchButton: React.FC = () => {
  const { maxDistanceMeters, setMaxDistanceMeters } = useApp();
  if (maxDistanceMeters >= UNLIMITED_RADIUS_M) return null;

  return (
    <button
      onClick={() => setMaxDistanceMeters(UNLIMITED_RADIUS_M)}
      className="mb-3 mx-auto block min-h-11 px-4 bg-slate-900 hover:bg-black text-white font-bold text-sm rounded-xl transition cursor-pointer"
    >
      Ver también los más lejanos
    </button>
  );
};
