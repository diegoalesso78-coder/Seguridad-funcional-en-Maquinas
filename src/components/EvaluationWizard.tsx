import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { uid, calcPHR, getRisk, getRiskLabel, getSFP, getPLr, pct } from "../lib/utils";
import { C, RFQ, NR12, PHASE_META, STATUS_CFG } from "../lib/constants";
import { RiskBadge, GaugePHR } from "./RiskIndicators";
import { KanbanBoard } from "./DashElements";
import { Check, ChevronRight, LayoutGrid, AlertTriangle, FileCheck, BarChart3, Save, ArrowLeft, Plus, HelpCircle } from "lucide-react";

import { FindingForm } from "./FindingForm";

export function EvaluationWizard({ project, evalId, onSave, onBack }: { project: any; evalId: string; onSave: any; onBack: any }) {
  const ev0 = project.evaluations.find((e: any) => e.id === evalId);
  const [ev, setEv] = useState(ev0 || { findings: [], checklist: [] });
  // Make sure we merge project and evaluation setup data
  if (!ev.projectSetup && !ev0) {
    ev.projectSetup = {
      name: project.name || "",
      client: project.client || "",
      author: "",
      machineName: "Celda Robotizada",
      manufacturer: "Desconocido",
      machineType: "Celda de trabajo",
      serial: "",
      manufactureDate: "",
      certification: "No disponible",
      intendedEnvironment: "Industrial",
      trainingLevel: "Capacitación normal",
      operatedBy: "Operarios de la planta",
      intendedUse: "",
      dimensions: "6 x 4 x 3",
      energySources: "24 VCC, 380 V CA",
      maintenance: "Personal de Mantenimiento",
      isMachineInUse: false
    };
  }
  const [step, setStep] = useState(1);
  const [showFindingForm, setShowFindingForm] = useState(false);
  const [editingFinding, setEditingFinding] = useState<any>(null);
  
  const isRO = ev0?.status === "CERRADA";
  const isDesign = project.type === "DISEÑO";

  const updateEv = (partial: any) => {
    const next = { ...ev, ...partial };
    setEv(next);
    onSave({ ...project, evaluations: project.evaluations.map((e: any) => e.id === evalId ? next : e) });
  };

  const handleSaveFinding = (f: any) => {
    const currentFindings = ev.findings || [];
    let nextFindings;
    if (editingFinding) {
      nextFindings = currentFindings.map((x: any) => x.id === f.id ? f : x);
    } else {
      nextFindings = [...currentFindings, f];
    }
    updateEv({ findings: nextFindings });
    setShowFindingForm(false);
    setEditingFinding(null);
  };

  const steps = [
    { n: 1, label: "Alcance", icon: <LayoutGrid size={18} /> },
    { n: 2, label: "Hallazgos", icon: <AlertTriangle size={18} /> },
    { n: 3, label: "Checklist", icon: <FileCheck size={18} />, hidden: ev.projectSetup?.isMachineInUse },
    { n: 4, label: "Resumen", icon: <BarChart3 size={18} /> },
  ].filter(s => !s.hidden);

  const handleNext = () => {
    setStep(s => {
      let next = s + 1;
      if (next === 3 && ev.projectSetup?.isMachineInUse) next = 4;
      return Math.min(next, 4);
    });
  };
  
  const handlePrev = () => {
    setStep(s => {
      let prev = s - 1;
      if (prev === 3 && ev.projectSetup?.isMachineInUse) prev = 2;
      return Math.max(prev, 1);
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-sm font-bold truncate max-w-[200px] sm:max-w-md">{project.name}</h1>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                {ev.label} • {ev.status}
              </div>
            </div>
          </div>

          {/* Stepper */}
          <div className="hidden md:flex items-center gap-0">
            {steps.map((s, i) => (
              <React.Fragment key={s.n}>
                <button
                  onClick={() => setStep(s.n)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    step === s.n ? "text-amber-600 bg-amber-50 dark:bg-amber-950/30" : "text-zinc-400"
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                    step === s.n ? "border-amber-600" : "border-zinc-200 dark:border-zinc-700"
                  }`}>
                    {s.n}
                  </span>
                  <span className="text-xs font-semibold">{s.label}</span>
                </button>
                {i < steps.length - 1 && <ChevronRight size={14} className="text-zinc-200 mx-1" />}
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {!isRO && (
              <button 
                onClick={() => updateEv({ status: "CERRADA" })}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-green-600/20"
              >
                <Check size={16} /> Cerrar Evaluación
              </button>
            )}
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-sm">
              {ev.version}
            </div>
          </div>
        </div>
        
        {/* Mobile Stepper Progress */}
        <div className="h-1 bg-zinc-100 dark:bg-zinc-800">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(step / 4) * 100}%` }}
            className="h-full bg-amber-500"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 && <Step1 ev={ev} setEv={updateEv} isRO={isRO} project={project} />}
            {step === 2 && (
              <Step2 
                ev={ev} 
                setEv={updateEv} 
                isRO={isRO} 
                setShowFindingForm={setShowFindingForm}
                setEditingFinding={setEditingFinding}
                showFindingForm={showFindingForm}
                initial={editingFinding}
                onSave={handleSaveFinding}
                onCancel={() => { setShowFindingForm(false); setEditingFinding(null); }}
              />
            )}
            {step === 3 && <Step3 ev={ev} setEv={updateEv} isRO={isRO} isDesign={isDesign} />}
            {step === 4 && <Step4 ev={ev} project={project} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Controls */}
      <footer className="fixed bottom-0 inset-x-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 p-4 z-20">
        <div className="max-w-6xl mx-auto flex justify-between gap-4">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className="px-6 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
          >
            Anterior
          </button>
          <div className="flex gap-3">
            <button
               onClick={() => console.log("Progreso guardado")}
               className="px-4 py-2.5 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            >
              <Save size={20} />
            </button>
            <button
              onClick={step === 4 ? onBack : handleNext}
              className="px-8 py-2.5 rounded-xl bg-zinc-900 dark:bg-amber-500 text-white font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
            >
              {step === 4 ? "Finalizar" : "Siguiente Paso"}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

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

// Internal Step Components (Simplified for structure)
function Step1({ ev, setEv, isRO, project }: any) {
  const setup = ev.projectSetup || {};
  
  const updateSetup = (key: string, val: any) => {
    setEv({ projectSetup: { ...setup, [key]: val } });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Información General</h3>
             <label className="flex items-center gap-2 cursor-pointer group">
               <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-amber-500 transition-colors">
                 ¿Máquina en uso?
               </span>
               <div className="relative w-8 h-5">
                 <input 
                   disabled={isRO}
                   type="checkbox" 
                   className="sr-only" 
                   checked={setup.isMachineInUse || false} 
                   onChange={(e) => updateSetup("isMachineInUse", e.target.checked)} 
                 />
                 <div className={`block w-8 h-5 rounded-full transition-colors absolute inset-0 ${setup.isMachineInUse ? 'bg-amber-500' : 'bg-zinc-200 dark:bg-zinc-800'}`}></div>
                 <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${setup.isMachineInUse ? 'transform translate-x-3' : ''}`}></div>
               </div>
             </label>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 mb-1 block">Nombre del Proyecto</label>
              <input 
                value={setup.name || ""} 
                onChange={e => updateSetup("name", e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-amber-500"
                disabled={isRO}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 mb-1 block">Cliente</label>
                <input 
                  value={setup.client || ""}
                  onChange={e => updateSetup("client", e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-amber-500"
                  disabled={isRO}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 mb-1 block">Autor / Evaluador</label>
                <input 
                  value={setup.author || ""}
                  onChange={e => updateSetup("author", e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-amber-500"
                  disabled={isRO}
                />
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
               <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest mb-3">Información de la Máquina</h4>
               <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="col-span-2">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 mb-1 block">Nombre de la máquina</label>
                    <input 
                      value={setup.machineName || ""}
                      onChange={e => updateSetup("machineName", e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-amber-500"
                      disabled={isRO}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-400 mb-1 block">Fabricante</label>
                    <input 
                      value={setup.manufacturer || ""}
                      onChange={e => updateSetup("manufacturer", e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-amber-500"
                      disabled={isRO}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-400 mb-1 block">Tipo de Máquina</label>
                    <input 
                      value={setup.machineType || ""}
                      onChange={e => updateSetup("machineType", e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-amber-500"
                      disabled={isRO}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-400 mb-1 block">Nro de serie</label>
                    <input 
                      value={setup.serial || ""}
                      onChange={e => updateSetup("serial", e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-amber-500"
                      disabled={isRO}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-400 mb-1 block">Fecha Fabricación</label>
                    <input 
                      value={setup.manufactureDate || ""}
                      onChange={e => updateSetup("manufactureDate", e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-amber-500"
                      disabled={isRO}
                    />
                  </div>
               </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            Límites de la Máquina
          </h3>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
             <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 mb-1 block">Uso pretendido / Objetivo</label>
                  <input 
                    value={setup.intendedUse || ""}
                    onChange={e => updateSetup("intendedUse", e.target.value)}
                    className="peer w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-amber-500"
                    disabled={isRO}
                  />
                  <FieldGuide 
                    desc="Uso previsto de una máquina según la información que figura en las instrucciones de uso."
                    ej="Extracción automática de fuelles inyectados"
                    norm="ISO 12100 §5.3.2"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-400 mb-1 block">Ambiente pretendido</label>
                  <input 
                    value={setup.intendedEnvironment || ""}
                    onChange={e => updateSetup("intendedEnvironment", e.target.value)}
                    className="peer w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-amber-500"
                    disabled={isRO}
                  />
                  <FieldGuide 
                    desc="Condiciones físicas donde operará la máquina (interior/exterior, temperatura, humedad)."
                    ej="Ambiente industrial cerrado, sujeto a polvo."
                    norm="ISO 12100 §5.3.4"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-400 mb-1 block">Operado por</label>
                  <input 
                    value={setup.operatedBy || ""}
                    onChange={e => updateSetup("operatedBy", e.target.value)}
                    className="peer w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-amber-500"
                    disabled={isRO}
                  />
                  <FieldGuide 
                    desc="Descripción de las personas esperadas que operarán el equipo (habilidades, idioma, limitaciones)."
                    ej="Operarios de planta sin limitaciones físicas."
                    norm="ISO 12100 §5.3.3"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 mb-1 block">Nivel capacitación requerida</label>
                  <input 
                    value={setup.trainingLevel || ""}
                    onChange={e => updateSetup("trainingLevel", e.target.value)}
                    className="peer w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-amber-500"
                    disabled={isRO}
                  />
                  <FieldGuide 
                    desc="Entrenamiento o certificación necesaria para interactuar con la máquina."
                    ej="Capacitación normal en operación y procedimientos eléctricos."
                    norm="ISO 12100 §5.3.3"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-400 mb-1 block">Dimensiones / Layout</label>
                  <input 
                    value={setup.dimensions || ""}
                    onChange={e => updateSetup("dimensions", e.target.value)}
                    className="peer w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-amber-500"
                    disabled={isRO}
                  />
                  <FieldGuide 
                    desc="Rango de movimiento, límites de espacio y dimensiones generales de la máquina."
                    ej="6 x 4 x 3 metros, con área de acceso frontal."
                    norm="ISO 12100 §5.3.4"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-400 mb-1 block">Mantenimiento por</label>
                  <input 
                    value={setup.maintenance || ""}
                    onChange={e => updateSetup("maintenance", e.target.value)}
                    className="peer w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-amber-500"
                    disabled={isRO}
                  />
                  <FieldGuide 
                    desc="Perfil de quienes realizarán ajustes, limpieza, reparación y mantenimiento."
                    ej="Personal de mantenimiento eléctrico certificado."
                    norm="ISO 12100 §5.3.2"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 mb-1 block">Fuentes de Energía (VCC, Neumática, etc)</label>
                  <input 
                    value={setup.energySources || ""}
                    onChange={e => updateSetup("energySources", e.target.value)}
                    className="peer w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-amber-500"
                    disabled={isRO}
                  />
                  <FieldGuide 
                    desc="Todas las energías que alimentan la máquina y deben ser aislables (eléctrica, neumática, hidráulica, térmica)."
                    ej="24 VCC control, 380 V CA potencia, Neumática 6 bar."
                    norm="ISO 12100 / OSHA LOTO"
                  />
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step2({ ev, setEv, isRO, setShowFindingForm, setEditingFinding, showFindingForm, initial, onSave, onCancel }: any) {
  const findings = ev.findings || [];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Hallazgos y Riesgos</h3>
        {!isRO && (
          <button 
            onClick={() => setShowFindingForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            <Plus size={16} /> Agregar Hallazgo
          </button>
        )}
      </div>
      <KanbanBoard 
        findings={findings} 
        onUpdate={(f: any[]) => setEv({ findings: f })} 
        readOnly={isRO} 
        onEdit={(f: any) => { setEditingFinding(f); setShowFindingForm(true); }}
      />
      {showFindingForm && (
        <FindingForm 
          initial={initial}
          onSave={onSave}
          onCancel={onCancel}
        />
      )}
    </div>
  );
}

function Step3({ ev, setEv, isRO, isDesign }: any) {
  const cl = ev.checklist || [];
  const [filter, setFilter] = useState("all");
  
  const setItem = (id: string, field: string, val: any) => {
    setEv({
      checklist: cl.map((c: any) => c.id === id ? { ...c, [field]: val } : c)
    });
  };

  // Lógica de "Main" vs "Expanded" (Placeholder: los primeros 3 de cada fase son Main)
  const isMainItem = (item: any) => {
    const phaseItems = cl.filter((i: any) => i.phase === item.phase);
    return phaseItems.indexOf(item) < 3;
  };

  const filteredItems = cl.filter((i: any) => {
    if (filter === "main") return isMainItem(i);
    return true;
  });

  const stats = {
    cumple: cl.filter((c: any) => c.status === "CUMPLE").length,
    noCumple: cl.filter((c: any) => c.status === "NO CUMPLE").length,
    total: cl.length
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-1">Estado de Cumplimiento</h3>
          <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-fit mt-3">
             <button 
               onClick={() => setFilter("all")}
               className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${filter === "all" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500"}`}
             >
               Full (81 ítems)
             </button>
             <button 
               onClick={() => setFilter("main")}
               className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${filter === "main" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500"}`}
             >
               Principales
             </button>
          </div>
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <div className="text-xl font-black text-green-600 font-mono">{stats.cumple}</div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase">Cumple</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-black text-red-600 font-mono">{stats.noCumple}</div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase">No Cumple</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-black text-amber-500 font-mono">{Math.round((stats.cumple / (stats.total || 1)) * 100)}%</div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase">Global</div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {PHASE_META.map(pm => {
          const items = filteredItems.filter((i: any) => i.phase === pm.num);
          if (items.length === 0) return null;
          
          return (
            <div key={pm.num} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
              <div 
                className="px-6 py-4 flex items-center justify-between"
                style={{ backgroundColor: pm.bg + "20", borderBottom: "1px solid " + pm.color + "30" }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{pm.icon}</span>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest" style={{ color: pm.color }}>
                      Fase {pm.num}: {pm.label}
                    </h4>
                    <p className="text-[10px] opacity-70 font-mono" style={{ color: pm.color }}>{pm.ref}</p>
                  </div>
                </div>
                <div className="text-[10px] font-bold px-3 py-1 bg-white/50 dark:bg-black/20 rounded-full" style={{ color: pm.color }}>
                  {items.filter((i: any) => i.status).length} / {items.length}
                </div>
              </div>

              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {items.map((item: any) => (
                  <div key={item.id} className="p-5 flex flex-col sm:flex-row gap-4 sm:items-start group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-mono font-bold text-zinc-400">{item.code}</span>
                        <h5 className="text-[13px] font-medium text-zinc-700 dark:text-zinc-200 leading-relaxed">
                          {item.q}
                        </h5>
                      </div>
                      <details className="mt-2 group/details">
                        <summary className="text-[10px] font-black text-amber-600 uppercase tracking-widest cursor-pointer list-none flex items-center gap-1.5 hover:text-amber-500">
                          <HelpCircle size={10} /> Ver Explicación Técnica
                        </summary>
                        <p className="text-[11px] text-zinc-400 leading-relaxed italic pr-4 mt-2 bg-amber-50/30 dark:bg-amber-950/10 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 animate-in fade-in slide-in-from-top-1">
                          {item.e}
                        </p>
                      </details>
                    </div>
                    
                    <div className="flex gap-2 self-end sm:self-auto">
                      {["CUMPLE", "NO CUMPLE", "N/A"].map((s) => (
                        <button
                          key={s}
                          disabled={isRO}
                          onClick={() => setItem(item.id, "status", item.status === s ? "" : s)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-tight transition-all border ${
                            item.status === s
                              ? s === "CUMPLE" ? "bg-green-600 text-white border-green-600" :
                                s === "NO CUMPLE" ? "bg-red-600 text-white border-red-600" :
                                "bg-zinc-500 text-white border-zinc-500"
                              : "bg-white dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-amber-500"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Step4({ ev, project }: any) {
  const findings = ev.findings || [];
  const maxPHR = findings.length ? Math.max(...findings.map((f: any) => f.phr)) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black mb-2 tracking-tight">Resumen Final de Evaluación</h2>
        <p className="text-zinc-500 text-sm">Resumen técnico de los hallazgos registrados para {project.name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col items-center">
          <GaugePHR phr={maxPHR} label="PHR Máximo" size={220} />
        </div>
        
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Estadísticas</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-black font-mono">{findings.length}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-tight">Peligros</div>
              </div>
              <div>
                <div className="text-2xl font-black font-mono text-green-600">
                  {findings.filter((f: any) => f.status === "IMPLEMENTADO").length}
                </div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-tight">Cerrados</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Recomendación</div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
              {maxPHR >= 500 ? "Se requiere mitigación inmediata. Riesgo intolerable." : "Analizar medidas de resguardo adicionales."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
