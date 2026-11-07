import React from 'react';

interface IcaroBrandLogoProps {
  className?: string;
  size?: number;
  isEmergency?: boolean;
}

/**
 * Logotipo Vectorial Institucional ICARO-AYLLU (Zero-CORS, SVG puro).
 * Simbología:
 * - Silueta de refugio comunitario / hogar andino.
 * - Sol Inti radiante de solidaridad comunitaria.
 * - Faro / sirena sutil de respuesta inmediata ante sismos y huaicos.
 * - Escudo protector de proximidad vecinal.
 */
export const IcaroBrandLogo: React.FC<IcaroBrandLogoProps> = ({ 
  className = '', 
  size = 36,
  isEmergency = false 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 hover:scale-105 ${className}`}
      aria-label="Isotipo Oficial ICARO-AYLLU"
      role="img"
    >
      {/* Base / Escudo contenedor con bordes suaves */}
      <rect 
        x="2" 
        y="2" 
        width="44" 
        height="44" 
        rx="12" 
        className={isEmergency ? "fill-red-900 stroke-red-700" : "fill-slate-900 stroke-slate-800"} 
        strokeWidth="1.5"
      />

      {/* Rayos sutiles del Sol Inti en la parte superior */}
      <circle 
        cx="24" 
        cy="15" 
        r="6" 
        className={isEmergency ? "fill-amber-400 opacity-90" : "fill-amber-500"} 
      />
      <path 
        d="M24 6V8M17 9L18.5 10.5M31 9L29.5 10.5" 
        stroke={isEmergency ? "#F59E0B" : "#FBBF24"} 
        strokeWidth="2" 
        strokeLinecap="round" 
      />

      {/* Silueta del Refugio Comunitario / Casa del Ayllu */}
      <path 
        d="M12 26L24 16L36 26V36C36 37.1 35.1 38 34 38H14C12.9 38 12 37.1 12 36V26Z" 
        className={isEmergency ? "fill-slate-950 stroke-red-500" : "fill-slate-800 stroke-slate-600"} 
        strokeWidth="2" 
        strokeLinejoin="round"
      />

      {/* Núcleo de Ayuda Mutua / Eslabón solidario */}
      <path 
        d="M20 31C20 28.7909 21.7909 27 24 27C26.2091 27 28 28.7909 28 31V38H20V31Z" 
        className={isEmergency ? "fill-red-500" : "fill-amber-500"} 
      />

      {/* Señal de Alerta en Modo Emergencia */}
      {isEmergency && (
        <circle 
          cx="24" 
          cy="11" 
          r="2.5" 
          className="fill-red-400 animate-ping" 
        />
      )}
    </svg>
  );
};
