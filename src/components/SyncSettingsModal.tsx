import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

export function SyncSettingsModal({ onClose, currentUrl, onSave }: { onClose: any, currentUrl: string, onSave: any }) {
  const [url, setUrl] = useState(currentUrl);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave(url);
    setSaved(true);
    setTimeout(() => onClose(), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-lg shadow-xl"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
             <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-500">
               <FileSpreadsheet size={24} />
             </div>
             <h2 className="text-xl font-bold dark:text-white">Sincronización Sheets</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full dark:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Pega aquí la <strong>URL de tu Aplicación Web de Google Apps Script</strong>. Cada vez que modifiques un proyecto, este se sincronizará automáticamente a tu hoja de cálculo.
          </p>
          <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">URL del Webhook (Apps Script)</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/..."
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={saved}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all disabled:opacity-50"
          >
            {saved ? <><CheckCircle2 size={18} /> Guardado</> : <><Save size={18} /> Guardar URL</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
