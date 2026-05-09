import React, { useState } from "react";
import { X, Sparkles, HelpCircle, ShieldCheck } from "lucide-react";
import { calcPHR, getRiskLabel, DPH_OPTIONS, PO_OPTIONS, PA_OPTIONS, FE_OPTIONS, uid } from "../lib/utils";
import { GaugePHR } from "./RiskIndicators";
import { askAria } from "../services/aiService";

function FieldGuide({ desc, ej, norm }: { desc: string; ej: string; norm: string }) {
  return (
    <div className="hidden peer-focus:block mt-1.5 p-2.5 bg-amber-50/50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-lg animate-in fade-in slide-in-from-top-1">
      <p className="text-[10px] text-zinc-700 dark:text-zinc-300 leading-relaxed mb-1.5">{desc}</p>
      <div className="flex flex-wrap gap-x-2 gap-y-1 mb-1.5">
        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">Ejemplo:</span>
        <span className="text-[10px] text-zinc-600 dark:text-zinc-400 italic">{ej}</span>
      </div>
      <div className="text-[8px] font-mono text-zinc-400 text-right">{norm}</div>
    </div>
  );
}

export function FindingForm({ initial, onSave, onCancel }: { initial?: any; onSave: any; onCancel: any }) {
  const [f, setF] = useState({
    id: uid(),
    hazardId: "1.0",
    title: "",
    location: "",
    target: "",
    activity: "",
    task: "",
    subTask: "",
    taskType: "Mecánico",
    hazardSubtype: "",
    description: "",
    dph: 40,
    po: 6,
    pa: 2.5,
    fe: 3,
    norms: [],
    mitigation: "",
    status: "PENDIENTE",
    
    // Residual Values Defaults
    hasResidual: false,
    rdph: 15,
    rpo: 1.25,
    rpa: 2.5,
    rfe: 3,
    
    ...(initial || {})
  });

  const phr = calcPHR(f.dph, f.po, f.pa, f.fe);
  const label = getRiskLabel(phr);
  
  const rphr = f.hasResidual ? calcPHR(f.rdph, f.rpo, f.rpa, f.rfe) : null;
  const rlabel = f.hasResidual ? getRiskLabel(rphr!) : null;

  const update = (key: string, val: any) => setF({ ...f, [key]: val });

  const [isAiLoading, setIsAiLoading] = useState(false);

  const aiAssist = async () => {
    if (!f.title) return;
    setIsAiLoading(true);
    try {
      const prompt = `Como experto en ISO 12100, sugiere 3 medidas técnicas de reducción de riesgo para el siguiente peligro: "${f.title}" (${f.taskType}) ubicado en "${f.location}". Usa la jerarquía de: 1. Diseño seguro, 2. Protecciones, 3. Información.`;
      const res = await askAria(prompt);
      update("mitigation", res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
          <div>
            <h2 className="text-xl font-black tracking-tight">{initial ? "Editar Hallazgo" : "Nuevo Peligro"}</h2>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Metodología PHR • ISO 12100</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1 border-r border-zinc-100 dark:border-zinc-800 pr-4">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Peligro Nro.</label>
                  <input 
                    value={f.hazardId}
                    onChange={(e) => update("hazardId", e.target.value)}
                    placeholder="Ej: 1.0"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl p-4 text-sm font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div className="col-span-1 pl-4">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Título del Peligro</label>
                  <input 
                    value={f.title}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder="Ej: Acceso a zona de prensado"
                    className="peer w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <FieldGuide 
                    desc="Nombre corto pero descriptivo del peligro y la zona."
                    ej="Atrapamiento en cadena transportadora"
                    norm="ISO 12100 §5.4"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Ubicación</label>
                  <input 
                    value={f.location}
                    onChange={(e) => update("location", e.target.value)}
                    placeholder="Ej: Ingreso laterales de inyectora 1 y 2"
                    className="peer w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <FieldGuide 
                    desc="Lugar físico exacto en la máquina donde se encuentra la zona de peligro."
                    ej="Parte posterior, línea de laminado"
                    norm="ISO 12100 Zonas de peligro"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Objetivo</label>
                  <input 
                    value={f.target}
                    onChange={(e) => update("target", e.target.value)}
                    placeholder="Ej: Extremidades superiores"
                    className="peer w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <FieldGuide 
                    desc="Qué parte del usuario está en riesgo (Cuerpo entero, mano, cabeza)."
                    ej="Extremidades superiores e inferiores"
                    norm="ISO 12100 §5.4"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Actividad</label>
                  <input 
                    value={f.activity}
                    onChange={(e) => update("activity", e.target.value)}
                    placeholder="Ej: Extracción de fuelle por operario."
                    className="peer w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <FieldGuide 
                    desc="Qué realiza el usuario al exponerse al peligro."
                    ej="Retiro manual de piezas terminadas"
                    norm="ISO 12100 §5.4"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Tarea</label>
                  <input 
                    value={f.task}
                    onChange={(e) => update("task", e.target.value)}
                    placeholder="Ej: Peligro de colisión de robot con el operario..."
                    className="peer w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <FieldGuide 
                    desc="Operación macro que desencadena el acercamiento al riesgo."
                    ej="Mantenimiento preventivo mensual"
                    norm="ISO 12100 §5.4"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Subtarea</label>
                  <input 
                    value={f.subTask}
                    onChange={(e) => update("subTask", e.target.value)}
                    placeholder="Ej: Extracción de fuelle y puesta a punto"
                    className="peer w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <FieldGuide 
                    desc="Acción puntual dentro de la tarea. (Opcional)"
                    ej="Lubricación de rodamientos axiales"
                    norm="-"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Tipo de Peligro</label>
                  <select 
                    value={f.taskType}
                    onChange={(e) => update("taskType", e.target.value)}
                    className="peer w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none appearance-none"
                  >
                    <option value="Mecánico">Peligro mecánico con consecuencia</option>
                    <option value="Eléctrico">Peligro eléctrico con consecuencia</option>
                    <option value="Combinación">Combinación de peligros</option>
                    <option value="Otros">Otros Peligros</option>
                  </select>
                  <FieldGuide 
                    desc="Categoría del peligro según anexo ISO."
                    ej="Mecánico"
                    norm="ISO 12100 Anexo B"
                  />
                </div>
                
                <div>
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Subtipo</label>
                  <input 
                    value={f.hazardSubtype}
                    onChange={(e) => update("hazardSubtype", e.target.value)}
                    placeholder="Ej: Aplastamiento e impacto"
                    className="peer w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <FieldGuide 
                    desc="Detalle específico del peligro o tipo de daño resultante."
                    ej="Corte, cizallamiento, atrapamiento, quemadura"
                    norm="ISO 12100 Anexo B"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Descripción</label>
                  <textarea 
                    value={f.description}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder="Descripción detallada del peligro y componentes faltantes..."
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none h-24 resize-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2 mt-4">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block">Disminución de Riesgo</label>
                  <button 
                    onClick={aiAssist}
                    disabled={isAiLoading || !f.title}
                    className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
                  >
                    <Sparkles size={10} className={isAiLoading ? "animate-spin" : ""} /> {isAiLoading ? "Pensando..." : "AI Sugerir"}
                  </button>
                </div>
                <textarea 
                  value={f.mitigation}
                  onChange={(e) => update("mitigation", e.target.value)}
                  placeholder="Descripción de protecciones técnicas requeridas..."
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none h-32 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Calculator */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-[2rem] p-6 border border-zinc-100 dark:border-zinc-800 flex flex-col items-center">
              <div className="mb-4 flex items-center gap-2">
                <HelpCircle size={14} className="text-zinc-400" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Cálculo de Criticidad Inicial</span>
              </div>
              
              <GaugePHR phr={phr} label="Resultado PHR Inicial" size={180} />

              <div className="grid grid-cols-2 gap-x-4 gap-y-3 w-full mt-6">
                {[
                  { id: "dph", label: "DPH", options: DPH_OPTIONS },
                  { id: "po", label: "PO", options: PO_OPTIONS },
                  { id: "pa", label: "PA", options: PA_OPTIONS },
                  { id: "fe", label: "FE", options: FE_OPTIONS },
                ].map((row) => (
                  <div key={row.id}>
                    <label className="text-[9px] font-black text-zinc-400 uppercase mb-1.5 block tracking-widest">{row.label}</label>
                    <select 
                      value={f[row.id]}
                      onChange={(e) => update(row.id, parseFloat(e.target.value))}
                      className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2 py-1.5 text-[10px] font-bold focus:ring-1 focus:ring-amber-500 outline-none"
                    >
                      {row.options.map(opt => (
                        <option key={opt.v} value={opt.v}>{opt.v} • {opt.l.split("—")[1]}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Residual Risk Toggle & Calculator */}
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-[2rem] p-6 border border-zinc-100 dark:border-zinc-800 flex flex-col items-center relative overflow-hidden transition-all">
              <div className="w-full flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2">
                   <ShieldCheck size={14} className={f.hasResidual ? "text-emerald-500" : "text-zinc-400"} />
                   <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Cálculo de Riesgo Residual</span>
                 </div>
                 
                 <label className="flex items-center cursor-pointer relative z-10 w-10 h-6">
                    <input type="checkbox" className="sr-only" checked={f.hasResidual} onChange={(e) => update("hasResidual", e.target.checked)} />
                    <div className={`block w-10 h-6 rounded-full transition-colors absolute inset-0 ${f.hasResidual ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${f.hasResidual ? 'transform translate-x-4' : ''}`}></div>
                 </label>
              </div>

              {f.hasResidual && (
                <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-500">
                  <GaugePHR phr={rphr!} label="Resultado PHR Residual" size={180} />
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 w-full mt-6">
                    {[
                      { id: "rdph", label: "DPH Residual", options: DPH_OPTIONS },
                      { id: "rpo", label: "PO Residual", options: PO_OPTIONS },
                      { id: "rpa", label: "PA Residual", options: PA_OPTIONS },
                      { id: "rfe", label: "FE Residual", options: FE_OPTIONS },
                    ].map((row) => (
                      <div key={row.id}>
                        <label className="text-[9px] font-black text-emerald-600/70 dark:text-emerald-500/70 uppercase mb-1.5 block tracking-widest">{row.label}</label>
                        <select 
                          value={f[row.id as keyof typeof f]}
                          onChange={(e) => update(row.id, parseFloat(e.target.value))}
                          className="w-full bg-emerald-50/50 dark:bg-zinc-800 border border-emerald-200/50 dark:border-emerald-900/40 rounded-xl px-2 py-1.5 text-[10px] font-bold focus:ring-1 focus:ring-emerald-500 outline-none"
                        >
                          {row.options.map(opt => (
                            <option key={opt.v} value={opt.v}>{opt.v} • {opt.l.split("—")[1]}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-6 py-3 rounded-2xl font-bold text-sm text-zinc-500 hover:bg-zinc-100 transition-all"
          >
            Descartar
          </button>
          <button 
            onClick={() => onSave({ ...f, phr, riskLevel: label, rphr, rRiskLevel: rlabel })}
            disabled={!f.title}
            className="px-8 py-3 rounded-2xl bg-zinc-900 dark:bg-amber-500 text-white font-bold text-sm shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
          >
            {initial ? "Actualizar" : "Guardar Hallazgo"}
          </button>
        </div>
      </div>
    </div>
  );
}
