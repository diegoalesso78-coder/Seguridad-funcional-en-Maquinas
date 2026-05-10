import React, { useState, useEffect } from "react";
import { ProjectDashboard } from "./components/ProjectDashboard";
import { ProjectDetail } from "./components/ProjectDetail";
import { EvaluationWizard } from "./components/EvaluationWizard";
import { ARIAAgent } from "./components/ARIAAgent";
import { NewProjectModal } from "./components/NewProjectModal";
import { SyncSettingsModal } from "./components/SyncSettingsModal";
import { uid } from "./lib/utils";
import { C, RFQ, NR12 } from "./lib/constants";
import { Sparkles, Moon, Sun, Monitor, AlertCircle } from "lucide-react";

type ViewState = "dashboard" | "projectDetail" | "evaluation";

const STORAGE_KEY = "riskos_v5_data";

export default function App() {
  const [projects, setProjects] = useState<any[]>([]);
  const [view, setView] = useState<ViewState>("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showSyncSettings, setShowSyncSettings] = useState(false);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setProjects(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading projects", e);
      }
    }
    
    const dark = localStorage.getItem("riskos_dark") === "true";
    setIsDarkMode(dark);
    if (dark) document.documentElement.classList.add("dark");
    
    const handleOpenSync = () => setShowSyncSettings(true);
    window.addEventListener('open-sync-settings', handleOpenSync);
    
    setIsLoaded(true);

    return () => window.removeEventListener('open-sync-settings', handleOpenSync);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }
  }, [projects, isLoaded]);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem("riskos_dark", String(next));
    document.documentElement.classList.toggle("dark");
  };

  // Actions
  const handleSaveProject = (newProject: any) => {
    setProjects([...projects, newProject]);
    setSelectedProjectId(newProject.id);
    setView("projectDetail");
    setShowNewProjectModal(false);

    // Background sync
    const webhookUrl = localStorage.getItem("SPREADSHEET_WEBHOOK_URL");
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'sync_project', payload: newProject })
      }).catch(e => console.error("Sync error", e));
    }
  };

  const updateProject = (updatedProject: any) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    
    // Background sync
    const webhookUrl = localStorage.getItem("SPREADSHEET_WEBHOOK_URL");
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'sync_project', payload: updatedProject })
      }).catch(e => console.error("Sync error", e));
    }
  };

  const createEvaluation = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const version = project.evaluations.length + 1;
    let prevSetup = undefined;
    let prevFindings: any[] = [];
    let prevChecklist = (project.type === "DISEÑO" ? RFQ : NR12).map(i => ({ ...i, status: "", obs: "" }));

    if (project.evaluations.length > 0) {
      const last = project.evaluations[project.evaluations.length - 1];
      prevSetup = last.projectSetup;
      prevFindings = [...(last.findings || [])];
      if (last.checklist && last.checklist.length > 0) {
        prevChecklist = [...last.checklist];
      }
    }

    const newEval = {
      id: uid(),
      version,
      label: version === 1 ? "Evaluación Inicial" : `Re-evaluación ${version - 1}`,
      status: "BORRADOR",
      date: new Date().toISOString(),
      findings: prevFindings,
      checklist: prevChecklist,
      projectSetup: prevSetup
    };

    const updated = { ...project, evaluations: [...project.evaluations, newEval] };
    updateProject(updated);
    setSelectedEvaluationId(newEval.id);
    setView("evaluation");
  };

  const deleteEvaluation = (projectId: string, evalId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const updated = { ...project, evaluations: project.evaluations.filter((e: any) => e.id !== evalId) };
    updateProject(updated);
  };

  const deleteProject = (projectId: string) => {
    // Note: window.confirm is not used here because it may be blocked by iframe sandbox
    const p = projects.filter(p => p.id !== projectId);
    setProjects(p);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    if (selectedProjectId === projectId) {
        setView("dashboard");
        setSelectedProjectId(null);
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-300">
      {/* Top Navbar */}
      {view !== "evaluation" && (
        <nav className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => { setView("dashboard"); setSelectedProjectId(null); }}
            >
              <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-xl shadow-amber-500/20 group-hover:scale-105 transition-all">
                <AlertCircle size={22} strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-sm font-black tracking-tighter text-zinc-900 dark:text-white flex items-center gap-1.5 uppercase">
                  RiskOS <span className="text-[10px] text-zinc-400 font-bold">V5</span>
                </div>
                <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest leading-none">
                  Gestión de la Seguridad Funcional de Máquinas
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={toggleDarkMode}
                className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Plataforma Activa</div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Evaluador Certificado</div>
                </div>
                <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                  <Monitor size={18} />
                </div>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main View Router */}
      <div className="animate-in fade-in duration-500">
        {view === "dashboard" && (
          <ProjectDashboard 
            projects={projects} 
            onSelect={(id: string) => { setSelectedProjectId(id); setView("projectDetail"); }} 
            onNew={() => setShowNewProjectModal(true)} 
            onDeleteProject={deleteProject}
          />
        )}

        {view === "projectDetail" && selectedProject && (
          <ProjectDetail 
            project={selectedProject}
            onBack={() => setView("dashboard")}
            onOpenEvaluation={(eid: string) => { setSelectedEvaluationId(eid); setView("evaluation"); }}
            onCreateEvaluation={() => createEvaluation(selectedProjectId!)}
            onDeleteEvaluation={(eid: string) => deleteEvaluation(selectedProjectId!, eid)}
          />
        )}

        {view === "evaluation" && selectedProject && selectedEvaluationId && (
          <EvaluationWizard 
            project={selectedProject}
            evalId={selectedEvaluationId}
            onSave={updateProject}
            onBack={() => setView("projectDetail")}
          />
        )}
      </div>

      {showNewProjectModal && (
        <NewProjectModal 
          onSave={handleSaveProject}
          onCancel={() => setShowNewProjectModal(false)}
        />
      )}

      {showSyncSettings && (
        <SyncSettingsModal
          currentUrl={localStorage.getItem("SPREADSHEET_WEBHOOK_URL") || ""}
          onClose={() => setShowSyncSettings(false)}
          onSave={(url: string) => {
             localStorage.setItem("SPREADSHEET_WEBHOOK_URL", url);
             // Optionally trigger a full sync here if needed, but background on update is also fine
             if (url && projects.length > 0) {
               fetch(url, {
                 method: 'POST',
                 body: JSON.stringify({ action: 'sync_all', payload: projects })
               }).catch(e => console.error("Initial sync error", e));
             }
          }}
        />
      )}

      {/* Global AI Assistant */}
      <ARIAAgent 
        project={selectedProject || { name: "Dashboard General" }}
        findings={selectedProject ? selectedProject.evaluations.flatMap((e: any) => e.findings || []) : []}
      />
    </div>
  );
}
