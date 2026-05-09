import React, { useState } from "react";
import { X, Layout, Settings, Rocket } from "lucide-react";
import { uid } from "../lib/utils";

export function NewProjectModal({ onSave, onCancel }: { onSave: any; onCancel: any }) {
  const [form, setForm] = useState({
    name: "",
    type: "DISEÑO",
    client: "",
    author: "",
    docNum: `REV-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    onSave({
      ...form,
      id: uid(),
      createdAt: new Date().toISOString(),
      evaluations: [],
    });
  };

  return (
    <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-lg rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
          <h2 className="text-xl font-black tracking-tight">Nuevo Proyecto</h2>
          <button onClick={onCancel} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "DISEÑO", label: "Proyecto Diseño", icon: <Layout size={16} /> },
              { id: "MAQUINA_INSTALADA", label: "Máquina Instalada", icon: <Settings size={16} /> },
            ].map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setForm({ ...form, type: type.id })}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  form.type === type.id 
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20 text-amber-600" 
                    : "border-zinc-100 dark:border-zinc-800 text-zinc-400 hover:border-zinc-200"
                }`}
              >
                {type.icon}
                <span className="text-[10px] font-black uppercase tracking-tight">{type.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Nombre del Proyecto</label>
              <input
                autoFocus
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Celda de Soldadura Robotizada"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">Cliente</label>
                <input
                  required
                  value={form.client}
                  onChange={(e) => setForm({ ...form, client: e.target.value })}
                  placeholder="Empresa ACME"
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">N° Documento</label>
                <input
                  required
                  value={form.docNum}
                  onChange={(e) => setForm({ ...form, docNum: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 rounded-2xl font-bold text-sm text-zinc-500 hover:bg-zinc-100 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!form.name || !form.client}
              className="flex-1 flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-zinc-900 dark:bg-amber-500 text-white font-bold text-sm shadow-xl enabled:hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
            >
              <Rocket size={18} /> Crear Proyecto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
