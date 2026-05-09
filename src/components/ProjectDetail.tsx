import React from "react";
import { motion } from "motion/react";
import { ArrowLeft, Clock, FileBarChart, CheckCircle2, ChevronRight, Plus, Download, ShieldCheck, Trash2 } from "lucide-react";
import { TYPE_META, C } from "../lib/constants";
import { AnalyticsPanel } from "./DashElements";
import { RiskBadge } from "./RiskIndicators";

export function ProjectDetail({ project, onBack, onOpenEvaluation, onCreateEvaluation, onDeleteEvaluation }: { 
  project: any; 
  onBack: any; 
  onOpenEvaluation: any;
  onCreateEvaluation: any;
  onDeleteEvaluation?: any;
}) {
  const tm = TYPE_META[project.type as keyof typeof TYPE_META];
  const last = project.evaluations[project.evaluations.length - 1];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8 items-start mb-10">
        <button 
          onClick={onBack}
          className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:bg-zinc-50 transition-colors"
        >
          <ArrowLeft size={20} className="text-zinc-500" />
        </button>
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span 
              className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border"
              style={{ backgroundColor: tm.bg, color: tm.color, borderColor: tm.border }}
            >
              {tm.icon} {tm.label}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono font-bold">{project.docNum || "ID: REV-001"}</span>
          </div>
          <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">
            {project.name}
          </h1>
          <p className="text-zinc-500 font-medium mt-1">{project.client} • Ref: {project.author}</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => {
              import("../services/pdfExport").then(m => m.generateProjectPDF(project));
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-2xl font-bold text-sm hover:bg-zinc-50 transition-all shadow-sm"
          >
            <Download size={18} /> Exportar Reporte (A4)
          </button>
          <button 
            onClick={onCreateEvaluation}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-amber-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-amber-500/20 hover:scale-[1.02] transition-all"
          >
            <Plus size={18} /> Nueva Evaluación
          </button>
        </div>
      </div>

      {/* Stats & Analytics */}
      <AnalyticsPanel project={project} />

      {/* Timeline */}
      <div className="mt-12">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
          <Clock size={16} /> Historial de Evaluaciones
        </h2>

        <div className="space-y-4 relative">
          {/* Vertical Line */}
          <div className="absolute left-6 top-8 bottom-8 w-1 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
          
          {project.evaluations.length === 0 ? (
            <div className="bg-zinc-50 dark:bg-zinc-900/50 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl py-16 flex flex-col items-center justify-center text-center px-4 ml-6">
               <ShieldCheck className="text-zinc-200 mb-4" size={48} />
               <p className="text-zinc-500 font-medium">Inicia la primera evaluación técnica para este proyecto.</p>
            </div>
          ) : (
            project.evaluations.map((ev: any, i: number) => {
              const findings = ev.findings || [];
              const maxPHR = findings.length ? Math.max(...findings.map((f: any) => f.phr)) : 0;
              const isClosed = ev.status === "CERRADA";

              return (
                <motion.div 
                  key={ev.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative pl-14"
                >
                  {/* Dot */}
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-4 ${
                    isClosed ? "bg-green-500 border-green-100 dark:border-green-900/50" : "bg-amber-500 border-amber-100 dark:border-amber-900/50"
                  } z-10`} />

                  <div 
                    onClick={() => onOpenEvaluation(ev.id)}
                    className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:border-amber-500 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 group-hover:text-amber-500 transition-colors">
                        <FileBarChart size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-extrabold text-zinc-900 dark:text-zinc-100">{ev.label}</h3>
                          {isClosed && <CheckCircle2 size={16} className="text-green-500" />}
                        </div>
                        <div className="text-[10px] uppercase font-black text-zinc-400 tracking-widest">
                          v{ev.version} • {new Date(ev.date).toLocaleDateString()} • {ev.status}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="flex flex-col items-center">
                        <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Riesgo</div>
                        <RiskBadge phr={maxPHR} />
                      </div>
                      <div className="text-center">
                        <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Hallazgos</div>
                        <div className="text-lg font-black font-mono">{findings.length}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {onDeleteEvaluation && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteEvaluation(ev.id); }}
                            className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                            title="Eliminar evaluación"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-400 group-hover:translate-x-1 transition-all">
                          <ChevronRight size={20} />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
