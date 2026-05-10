import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { askAria } from "../services/aiService";
import { getRiskLabel } from "../lib/utils";
import { Send, User, Bot, X, Paperclip, ChevronDown, Sparkles, Book, CheckSquare, Square, Trash2 } from "lucide-react";
import { get, set } from 'idb-keyval';

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface StoredFile {
  id: string;
  name: string;
  mimeType: string;
  data: string; // base64
  size: number; // bytes
}

export function ARIAAgent({ findings, project }: { findings: any[]; project: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hola, soy **ARIA** — Asistente de Riesgo Industrial Avanzado. Estoy aquí para ayudarte con normativas ISO 12100, 13849 y NR-12.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Library Management
  const [libraryFiles, setLibraryFiles] = useState<StoredFile[]>([]);
  const [activeFileIds, setActiveFileIds] = useState<Set<string>>(new Set());
  const [showLibrary, setShowLibrary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quickPrompts = [
    "¿Cómo calculo el PLr?",
    "Requisitos de NR-12 para robots",
    "Distancias de seguridad ISO 13857",
    "Jerarquía de reducción de riesgos",
  ];

  // Load files from IndexedDB on mount
  useEffect(() => {
    async function loadLibrary() {
      try {
        const stored = await get<StoredFile[]>('aria_library');
        if (stored) {
          setLibraryFiles(stored);
        }
      } catch (err) {
        console.error("Failed to load library", err);
      }
    }
    loadLibrary();
  }, []);

  // Save to IndexedDB when library changes
  useEffect(() => {
    set('aria_library', libraryFiles).catch(console.error);
  }, [libraryFiles]);

  useEffect(() => {
    if (scrollRef.current && !showLibrary) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, showLibrary]);

  const toggleActiveFile = (id: string, size: number) => {
    setActiveFileIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        // Calculate current active size
        let currentSize = 0;
        next.forEach(actId => {
          const f = libraryFiles.find(sf => sf.id === actId);
          if (f) currentSize += f.size;
        });

        if (currentSize + size > 15 * 1024 * 1024) {
          alert("Alcanzaste el límite de tamaño (15MB) para consultas. No puedes seleccionar más normas para esta consulta.");
          return prev;
        }

        if (next.size >= 5) {
          alert("Puedes seleccionar un máximo de 5 normas al mismo tiempo para consultar.");
          return prev;
        }

        next.add(id);
      }
      return next;
    });
  };

  const removeFile = (id: string) => {
    setLibraryFiles(prev => prev.filter(f => f.id !== id));
    setActiveFileIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleSend = async (text?: string) => {
    const q = text || input.trim();
    if (!q && activeFileIds.size === 0) return;
    if (isLoading) return;

    setInput("");
    setShowLibrary(false);
    
    const activeFiles = libraryFiles.filter(f => activeFileIds.has(f.id));

    // Add user message to UI
    let userMsgContent = q;
    if (activeFiles.length > 0 && !text) { // only attach if not coming from quick prompt
      userMsgContent = activeFiles.map(f => `📎 ${f.name}`).join('\n') + `\n${q}`;
    }
    setMessages(prev => [...prev, { role: "user", content: userMsgContent || "Analiza los documentos seleccionados." }]);
    setIsLoading(true);

    const context = `
      Proyecto: ${project.name || "Sin nombre"}
      Hallazgos: ${findings.length}
      PHR máximo: ${findings.length ? Math.max(...findings.map(f => f.phr)) : 0}
    `;

    const filesToPass = text ? undefined : activeFiles;

    const response = await askAria(q || "Analiza el documento y dame un resumen, salvo que pida otra cosa.", context, messages, filesToPass?.map(f => ({ ...f, filename: f.name })));
    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setIsLoading(false);
  };

  const formatSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-amber-500 text-white shadow-lg flex items-center justify-center z-50 overflow-hidden"
      >
        {!isOpen && <Sparkles size={24} />}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col z-[60]"
          >
            {/* Header */}
            <div className="p-4 bg-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                  <Bot size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold">ARIA Assistant</div>
                  <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium">Expert Mode • AI Active</div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    m.role === "assistant" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600"
                  }`}>
                    {m.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                    m.role === "assistant" 
                      ? "bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" 
                      : "bg-amber-500 text-white"
                  }`}>
                    {m.content.split("\n").map((line, idx) => (
                      <p key={idx} className={idx > 0 ? "mt-2" : ""}>{line}</p>
                    ))}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
                    <Bot size={16} />
                  </div>
                  <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-3 flex gap-1 items-center">
                    <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce"></span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-zinc-100 dark:border-zinc-900">
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(p)}
                  className="whitespace-nowrap px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-[10px] font-medium text-zinc-600 dark:text-zinc-400 hover:border-amber-500 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              {/* Active Files Context Bar */}
              {activeFileIds.size > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {libraryFiles.filter(f => activeFileIds.has(f.id)).map(file => (
                    <div key={file.id} className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 py-1 px-2 rounded-lg text-xs font-medium border border-amber-200/50 dark:border-amber-800/50">
                      <Book size={10} />
                      <span className="truncate max-w-[100px]">{file.name}</span>
                      <button onClick={() => toggleActiveFile(file.id, file.size)} className="hover:bg-amber-200/50 dark:hover:bg-amber-800/50 rounded-full p-0.5 ml-1">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Library Drawer Toggle */}
              {showLibrary && (
                <div className="mb-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl max-h-48 overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Base de Conocimiento (Normas)</span>
                    <span className="text-[10px] text-zinc-500">{libraryFiles.length} guardadas</span>
                  </div>
                  {libraryFiles.length === 0 ? (
                    <div className="text-xs text-zinc-400 italic py-2 text-center">No hay normas guardadas. Utiliza el clip para subir archivos (se guardarán automáticamente en tu navegador).</div>
                  ) : (
                    <div className="space-y-1">
                      {libraryFiles.map(file => {
                        const isActive = activeFileIds.has(file.id);
                        return (
                          <div key={file.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 group">
                            <button 
                              onClick={() => toggleActiveFile(file.id, file.size)}
                              className="flex items-center gap-2 flex-1 text-left"
                            >
                              {isActive ? <CheckSquare size={14} className="text-amber-500 flex-shrink-0" /> : <Square size={14} className="text-zinc-400 flex-shrink-0" />}
                              <span className={`text-xs truncate max-w-[200px] ${isActive ? "text-amber-600 font-medium" : "text-zinc-600 dark:text-zinc-300"}`}>{file.name}</span>
                              <span className="text-[10px] text-zinc-400 flex-shrink-0">{formatSize(file.size)}</span>
                            </button>
                            <button onClick={() => removeFile(file.id)} className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition-opacity">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="relative flex items-center">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="application/pdf,.pdf" 
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      const newStoredFiles: StoredFile[] = [];
                      const newActiveIds = new Set(activeFileIds);
                      let currentActiveSize = 0;
                      
                      libraryFiles.forEach(f => {
                         if (activeFileIds.has(f.id)) currentActiveSize += f.size;
                      });

                      for (const file of files) {
                        try {
                          const reader = new FileReader();
                          reader.readAsDataURL(file);
                          reader.onload = () => {
                            const base64 = (reader.result as string).split(',')[1];
                            const id = Math.random().toString(36).substring(2, 9);
                            
                            newStoredFiles.push({
                              id,
                              name: file.name,
                              mimeType: file.type || 'application/pdf',
                              data: base64,
                              size: file.size
                            });

                            // Auto-activate if under limit
                            if (currentActiveSize + file.size <= 15 * 1024 * 1024 && newActiveIds.size < 5) {
                              newActiveIds.add(id);
                              currentActiveSize += file.size;
                            }
                            
                            // If it's the last file, update state
                            if (newStoredFiles.length === files.length) {
                              setLibraryFiles(prev => [...prev, ...newStoredFiles]);
                              setActiveFileIds(newActiveIds);
                              setShowLibrary(true);
                            }
                          };
                        } catch (err) {
                          console.error('Error reading file:', err);
                        }
                      }
                    }
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                />
                
                <div className="absolute left-1 flex gap-1 z-10">
                  <button
                    onClick={() => setShowLibrary(!showLibrary)}
                    className={`p-1.5 rounded-lg transition-colors ${showLibrary ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-zinc-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}
                    title="Base de Conocimiento"
                  >
                    <Book size={18} />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 text-zinc-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                    title="Subir norma (pdf)"
                  >
                    <Paperclip size={18} />
                  </button>
                </div>

                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Hacer una consulta de seguridad..."
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-3 pl-[4.5rem] pr-12 text-sm resize-none focus:ring-2 focus:ring-amber-500/50 transition-all font-medium text-zinc-700 dark:text-zinc-200"
                  rows={2}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={(!input.trim() && activeFileIds.size === 0) || isLoading}
                  className={`absolute right-2 p-2 rounded-lg transition-all ${
                    (input.trim() || activeFileIds.size > 0) ? "bg-amber-500 text-white shadow-md shadow-amber-500/20" : "bg-zinc-100 dark:bg-zinc-700 text-zinc-400"
                  }`}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
