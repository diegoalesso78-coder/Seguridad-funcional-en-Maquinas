import React from "react";
import { ShieldCheck } from "lucide-react";
import { getRisk, getRiskLabel } from "../lib/utils";

interface RiskBadgeProps {
  phr: number;
  large?: boolean;
  className?: string;
  isResidual?: boolean;
}

export function RiskBadge({ phr, large, className = "", isResidual }: RiskBadgeProps) {
  const r = getRisk(phr);
  const l = getRiskLabel(phr);

  if (large) {
    return (
      <div 
        className={`inline-flex flex-col items-center rounded-xl border-2 px-5 py-2.5 min-w-[120px] ${className}`}
        style={{ backgroundColor: r.bg, borderColor: r.border }}
      >
        <span 
          className="text-4xl font-black font-mono leading-none"
          style={{ color: r.dot }}
        >
          {phr}
        </span>
        <span 
          className="text-[10px] font-bold mt-1 uppercase tracking-widest"
          style={{ color: r.text }}
        >
          {l}
        </span>
      </div>
    );
  }

  return (
    <span 
      className={`inline-flex items-center gap-1.5 border rounded-md px-2.5 py-0.5 text-[10px] font-medium font-mono whitespace-nowrap tracking-tight ${className}`}
      style={{ backgroundColor: r.bg, borderColor: r.border, color: r.text }}
    >
      {isResidual ? <ShieldCheck size={10} style={{ color: r.dot }} /> : <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: r.dot }} />}
      {l} {phr}
    </span>
  );
}

interface GaugePHRProps {
  phr: number;
  label?: string;
  size?: number;
  plr?: string;
}

export function GaugePHR({ phr = 0, label = "PHR Máximo", size = 200, plr }: GaugePHRProps) {
  const SCALE_MAX = 2000;
  const pct = Math.min(Math.max(phr / SCALE_MAX, 0), 1);
  const r = getRisk(phr);

  const CX = 100, CY = 88, R = 72, SW = 14;
  const startX = CX - R, startY = CY;
  const endX = CX + R, endY = CY;

  const trackD = `M ${startX} ${startY} A ${R} ${R} 0 0 1 ${endX} ${endY}`;
  
  let fillD = "";
  if (pct > 0) {
    if (pct >= 1) {
      fillD = trackD;
    } else {
      const phi = (180 - pct * 180) * Math.PI / 180;
      const fx = Math.round((CX + R * Math.cos(phi)) * 100) / 100;
      const fy = Math.round((CY - R * Math.sin(phi)) * 100) / 100;
      fillD = `M ${startX} ${startY} A ${R} ${R} 0 0 1 ${fx} ${fy}`;
    }
  }

  return (
    <div className="text-center inline-block">
      <svg width={size} height={Math.round(size * 0.58)} viewBox="0 0 200 117" className="overflow-visible">
        <ellipse cx={CX} cy={CY} rx={40} ry={30} fill={r.dot} className={phr > 0 ? "opacity-10" : "opacity-0"} />
        <path d={trackD} fill="none" stroke="currentColor" strokeWidth={SW} strokeLinecap="round" className="text-zinc-200 dark:text-zinc-800" />
        {pct > 0 && (
          <path 
            d={fillD} 
            fill="none" 
            stroke={r.dot} 
            strokeWidth={SW} 
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        )}
        <text x={CX} y={CY + 6} textAnchor="middle" fontSize="30" fontWeight="700" fill={phr > 0 ? r.dot : "#d0d5da"} className="font-mono">
          {phr || "—"}
        </text>
        <text x={CX} y={CY + 22} textAnchor="middle" fontSize="9" fontWeight="700" fill={phr > 0 ? r.text : "#8c959f"} className="font-sans tracking-wide">
          {phr ? getRiskLabel(phr) : "SIN DATOS"}
        </text>
      </svg>
      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1 font-sans">{label}</div>
      {plr && <div className="text-xs font-black text-amber-600 mt-0.5 bg-amber-50 dark:bg-amber-950/30 inline-block px-2 py-0.5 rounded-lg border border-amber-200/50">PLr Requerido: {plr.toUpperCase()}</div>}
    </div>
  );
}
