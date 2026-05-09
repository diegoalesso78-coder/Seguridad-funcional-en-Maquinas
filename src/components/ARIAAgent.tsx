import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { askAria } from "../services/aiService";
import { getRiskLabel } from "../lib/utils";
import { Send, User, Bot, X, Paperclip, ChevronDown, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
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
  const [attachedFile, setAttachedFile] = useState<{name: string, data: string, mimeType: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quickPrompts = [
    "¿Cómo calculo el PLr?",
    "Requisitos de NR-12 para robots",
    "Distancias de seguridad ISO 13857",
    "Jerarquía de reducción de riesgos",
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (text?: string) => {
    const q = text || input.trim();
    if (!q && !attachedFile) return;
    if (isLoading) return;

    setInput("");
    
    // Add user message to UI
    let userMsgContent = q;
    if (attachedFile && !text) { // only attach if not coming from quick prompt
      userMsgContent = `📎 ${attachedFile.name}\n${q}`;
    }
    setMessages(prev => [...prev, { role: "user", content: userMsgContent || "Analiza el documento adjunto." }]);
    setIsLoading(true);

    const context = `
      Proyecto: ${project.name || "Sin nombre"}
      Hallazgos: ${findings.length}
      PHR máximo: ${findings.length ? Math.max(...findings.map(f => f.phr)) : 0}
    `;

    const fileToPass = text ? undefined : attachedFile;
    if (!text && attachedFile) setAttachedFile(null); // Clear after sending

    const response = await askAria(q || "Analiza el documento y dame un resumen, salvo que pida otra cosa.", context, messages, fileToPass ? { ...fileToPass, filename: fileToPass.name } : undefined);
    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setIsLoading(false);
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
              {attachedFile && (
                <div className="mb-2 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 py-1.5 px-3 rounded-lg text-xs font-medium w-fit border border-amber-200/50 dark:border-amber-800/50">
                  <Paperclip size={12} />
                  <span className="truncate max-w-[150px]">{attachedFile.name}</span>
                  <button onClick={() => setAttachedFile(null)} className="hover:bg-amber-200/50 dark:hover:bg-amber-800/50 rounded-full p-0.5 ml-1">
                    <X size={12} />
                  </button>
                </div>
              )}
              <div className="relative flex items-center">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="application/pdf,.pdf" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = () => {
                          const base64 = (reader.result as string).split(',')[1];
                          setAttachedFile({
                            name: file.name,
                            mimeType: file.type || 'application/pdf',
                            data: base64
                          });
                        };
                      } catch (err) {
                        console.error('Error reading file:', err);
                      }
                    }
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute left-2 p-2 text-zinc-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors z-10"
                >
                  <Paperclip size={18} />
                </button>
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
                  className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-3 pl-12 pr-12 text-sm resize-none focus:ring-2 focus:ring-amber-500/50 transition-all font-medium text-zinc-700 dark:text-zinc-200"
                  rows={2}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={(!input.trim() && !attachedFile) || isLoading}
                  className={`absolute right-2 p-2 rounded-lg transition-all ${
                    (input.trim() || attachedFile) ? "bg-amber-500 text-white shadow-md shadow-amber-500/20" : "bg-zinc-100 dark:bg-zinc-700 text-zinc-400"
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
