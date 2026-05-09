import React, { useState } from "react";
import { motion } from "motion/react";
import { Plus, Search, Filter, ClipboardList, Settings, MoreVertical, Trash2 } from "lucide-react";
import { TYPE_META } from "../lib/constants";
import { GaugePHR } from "./RiskIndicators";
import { getMaxPLr } from "../lib/utils";

export function ProjectDashboard({ projects, onSelect, onNew, onDeleteProject }: { projects: any[]; onSelect: any; onNew: any; onDeleteProject?: any }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);

  const filtered = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || p.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="text-[10px] text-amber-600 dark:text-amber-500 font-black uppercase tracking-[0.2em] mb-2">ISO 12100 Assessment Suite</div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Proyectos</h1>
          <p className="text-zinc-500 text-sm mt-1">Gestión centralizada de evaluaciones de riesgo y cumplimiento.</p>
        </div>
        <div className="flex gap-3 items-center">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-sync-settings'))}
            className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 px-4 py-3 rounded-2xl font-bold text-sm shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={onNew}
            className="flex items-center gap-2 bg-zinc-900 dark:bg-amber-500 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-amber-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus size={18} />
            Nuevo Proyecto
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Proyectos", value: projects.length, icon: <ClipboardList size={16} /> },
          { label: "Evaluaciones", value: projects.reduce((s, p) => s + p.evaluations.length, 0), icon: <FileText size={16} /> },
          { label: "Diseños", value: projects.filter(p => p.type === "DISEÑO").length, icon: <Layout size={16} /> },
          { label: "Instaladas", value: projects.filter(p => p.type === "MAQUINA_INSTALADA").length, icon: <Settings size={16} /> },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              {s.icon}
              <span className="text-[10px] font-bold uppercase tracking-widest">{s.label}</span>
            </div>
            <div className="text-2xl font-black font-mono">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-amber-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:ring-1 focus:ring-amber-500 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
          <button 
            onClick={() => setFilterType(null)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!filterType ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500"}`}
          >
            Todos
          </button>
          {Object.entries(TYPE_META).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setFilterType(k)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterType === k ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500"}`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Project Grid */}
      {filtered.length === 0 ? (
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl py-20 flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 mb-6">
            <ClipboardList size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">No se encontraron proyectos</h3>
          <p className="text-zinc-500 max-w-sm mb-8 text-sm">Comienza creando tu primera evaluación técnica o utiliza los filtros para buscar proyectos existentes.</p>
          <button 
            onClick={onNew}
            className="bg-amber-500 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
          >
            Crear Proyecto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => {
            const tm = TYPE_META[p.type as keyof typeof TYPE_META];
            const last = p.evaluations[p.evaluations.length - 1];
            const findings = last ? last.findings : [];
            const maxPHR = findings.length ? Math.max(...findings.map((f: any) => f.phr)) : 0;
            const maxPLr = getMaxPLr(findings);

            return (
              <motion.div
                key={p.id}
                layoutId={p.id}
                whileHover={{ y: -5 }}
                onClick={() => onSelect(p.id)}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm cursor-pointer relative overflow-hidden group"
              >
                {/* Visual Accent */}
                <div 
                  className="absolute top-0 left-0 w-full h-1.5" 
                  style={{ backgroundColor: tm.color }}
                />
                
                <div className="flex justify-between items-start mb-6">
                  <div 
                    className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border"
                    style={{ backgroundColor: tm.bg, color: tm.color, borderColor: tm.border }}
                  >
                    {tm.icon} {tm.label}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onDeleteProject && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteProject(p.id); }}
                        className="text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-1.5 rounded-lg transition-all"
                        title="Eliminar proyecto"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button className="text-zinc-300 hover:text-zinc-500 p-1.5 rounded-lg">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight mb-1 group-hover:text-amber-500 transition-colors">
                  {p.name}
                </h3>
                <p className="text-xs text-zinc-500 mb-6 font-medium">{p.client}</p>

                <div className="flex items-end justify-between pt-6 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Criticidad Máxima</span>
                    <div className="flex items-center gap-3">
                       <GaugePHR phr={maxPHR} label="" size={100} plr={maxPLr !== "-" ? maxPLr : undefined} />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Estatus</div>
                    <div className={`text-xs font-bold ${last?.status === "CERRADA" ? "text-green-600" : "text-amber-500"}`}>
                      {last?.status === "CERRADA" ? "Completado" : "Borrador"}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1 font-mono uppercase">v{p.evaluations.length} EVALS</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Icons
function FileText(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>; }
function Layout(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>; }
