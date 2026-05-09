import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from "recharts";
import { getRisk, getRiskLabel, pct } from "../lib/utils";
import { C, RISK, PHASE_META } from "../lib/constants";
import { GaugePHR } from "./RiskIndicators";

export function AnalyticsPanel({ project }: { project: any }) {
  const allEvals = project.evaluations || [];
  const lastEv = allEvals.length ? allEvals[allEvals.length - 1] : null;
  const allF = lastEv && lastEv.findings ? lastEv.findings : [];

  const distData = ["MUY ALTO", "ALTO", "SIGNIFICATIVO", "BAJO", "DESPRECIABLE"]
    .map((l) => ({
      name: l,
      count: allF.filter((f: any) => getRiskLabel(f.phr) === l).length,
      fill: RISK[l].dot,
    }))
    .filter((d) => d.count > 0);

  const trendData = allEvals.map((ev: any) => ({
    v: "v" + ev.version,
    phr: ev.findings && ev.findings.length ? Math.max(...ev.findings.map((f: any) => f.phr)) : 0,
  }));

  const cl = lastEv && lastEv.checklist ? lastEv.checklist : [];
  const phaseData = PHASE_META.slice(0, 5).map((pm) => {
    const items = cl.filter((c: any) => c.phase === pm.num);
    return {
      name: "F" + pm.num,
      pct: items.length ? Math.round((items.filter((c: any) => c.status === "CUMPLE").length / items.length) * 100) : 0,
      fill: pm.color,
    };
  });

  if (!allEvals.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Distribución de Riesgo</div>
        {distData.length > 0 ? (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={distData}>
              <XAxis dataKey="name" tick={{ fontSize: 7, fill: "#888" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 7, fill: "#888" }} axisLine={false} tickLine={false} width={16} />
              <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {distData.map((d, i) => (
                  <Cell key={i} fill={d.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[120px] flex items-center justify-center text-xs text-zinc-400 italic">Sin hallazgos</div>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Evolución PHR Máximo</div>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={trendData}>
            <XAxis dataKey="v" tick={{ fontSize: 8, fill: "#888" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 8, fill: "#888" }} axisLine={false} tickLine={false} width={28} />
            <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
            <Line type="monotone" dataKey="phr" stroke="#d97706" strokeWidth={2} dot={{ fill: "#d97706", r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col items-center">
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 self-start ml-2">Riesgo Residual</div>
        <GaugePHR phr={allF.length ? Math.max(...allF.map((f: any) => f.phr)) : 0} label="" size={180} />
      </div>
    </div>
  );
}

export function KanbanBoard({ findings, onUpdate, readOnly, onEdit }: { findings: any[]; onUpdate: any; readOnly?: boolean; onEdit?: (f: any) => void }) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  const sorted = [...findings].sort((a, b) => b.phr - a.phr);

  const COLS = [
    { key: "PENDIENTE", label: "Pendiente", color: "#dc2626", bg: "#fef2f2", icon: "●" },
    { key: "EN_IMPLEMENTACION", label: "En Proceso", color: "#2563eb", bg: "#eff6ff", icon: "◎" },
    { key: "IMPLEMENTADO", label: "Listo", color: "#16a34a", bg: "#f0fdf4", icon: "✓" },
    { key: "VERIFICADO", label: "Verificado", color: "#7c3aed", bg: "#f5f3ff", icon: "★" },
  ];

  const getColItems = (k: string) => sorted.filter((f) => (f.status || "PENDIENTE") === k);

  const handleDrop = (tgt: string) => {
    if (!dragId || readOnly) return;
    onUpdate(findings.map((f) => (f.id === dragId ? { ...f, status: tgt } : f)));
    setDragId(null);
    setOverCol(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {COLS.map((col) => {
        const items = getColItems(col.key);
        const isActive = overCol === col.key;

        return (
          <div
            key={col.key}
            onDragOver={(e) => { e.preventDefault(); setOverCol(col.key); }}
            onDrop={() => handleDrop(col.key)}
            onDragLeave={() => setOverCol(null)}
            className={`rounded-xl border-2 p-3 min-h-[300px] transition-all duration-200 ${
              isActive ? "border-amber-500 bg-amber-50/10" : "border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30"
            }`}
          >
            <div className="flex items-center gap-2 mb-4 px-1">
              <span style={{ color: col.color }} className="text-sm">{col.icon}</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">{col.label}</span>
              <span className="ml-auto bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 rounded-full px-2 py-0.5 text-[9px] font-bold">
                {items.length}
              </span>
            </div>

            {items.map((f) => {
              const r = getRisk(f.phr);
              const rank = sorted.indexOf(f) + 1;
              return (
                <div
                  key={f.id}
                  draggable={!readOnly}
                  onDragStart={() => setDragId(f.id)}
                  onClick={() => !readOnly && onEdit && onEdit(f)}
                  className={`bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 mb-3 shadow-sm ${!readOnly ? "cursor-grab active:cursor-grabbing hover:border-amber-400" : ""} transition-all ${
                    dragId === f.id ? "opacity-40" : "opacity-100"
                  }`}
                  style={{ borderLeftColor: r.dot, borderLeftWidth: "3px" }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-mono text-zinc-400 font-bold">{f.hazardId || `#${rank}`}</span>
                    <span
                      style={{ backgroundColor: r.bg, color: r.text, borderColor: r.border }}
                      className="text-[9px] font-bold border rounded px-1.5 py-0.5"
                    >
                      {getRiskLabel(f.phr)} {f.phr}
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 leading-tight mb-2">
                    {f.title}
                  </div>
                  {f.location && <div className="text-[9px] text-zinc-500 truncate">{f.location}</div>}
                  {f.hasResidual && f.rphr != null && (
                    <div className="mt-2 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span>→ Res: {f.rphr}</span>
                      <span className="opacity-70">({getRiskLabel(f.rphr)})</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
