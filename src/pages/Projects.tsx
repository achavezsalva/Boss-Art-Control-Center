import { useState, useEffect } from "react";
import { 
  Package,
  Plus, 
  Upload, 
  Terminal, 
  Play, 
  Square, 
  RefreshCw, 
  Trash2, 
  Search,
  Filter,
  MoreVertical,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { useModalStore } from "../store/useModalStore";
import { cn } from "../lib/utils";

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { openDeployModal } = useModalStore();
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    fetchProjects();
  }, [token]);

  const fetchProjects = async () => {
    if (!token) return;
    try {
      const { data } = await axios.get("/api/projects", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'running' ? 'stopped' : 'running';
    try {
      await axios.patch(`/api/projects/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await axios.delete(`/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white uppercase">Project Inventory</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Manage and deploy your applications with PM2.</p>
        </div>
        <button 
          onClick={openDeployModal}
          className="flex items-center gap-2 px-6 py-2.5 rounded-sm bg-white text-black text-xs font-bold uppercase tracking-tighter hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
        >
          <Plus className="w-4 h-4" />
          Add Project
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#0a0a0a] p-2 rounded-xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 font-bold" />
          <input 
            type="text"
            placeholder="Search projects..."
            className="w-full bg-transparent border-none outline-none pl-11 pr-4 py-2.5 text-xs font-bold uppercase tracking-widest placeholder-slate-700 text-white"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto px-2">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-slate-900 border border-slate-800 text-slate-500 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest">
            <Filter className="w-3 h-3" />
            Filter
          </button>
          <div className="h-6 w-px bg-slate-800 mx-2 hidden sm:block" />
          <button className="p-2 rounded-sm bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-all">
             <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Project Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-[#0a0a0a] border border-slate-800 rounded-xl" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-[#0a0a0a] rounded-xl border border-dashed border-slate-800">
           <Upload className="w-12 h-12 text-slate-800 mb-4" />
           <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No active projects found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {projects.map((project) => (
             <ProjectCard 
              key={project.id} 
              project={project} 
              onToggleStatus={() => handleToggleStatus(project.id, project.status)}
              onDelete={() => handleDelete(project.id)}
             />
           ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, onToggleStatus, onDelete }: any) {
  const statusConfig: any = {
    running: { color: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/10", label: "running" },
    deploying: { color: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/10", label: "deploying" },
    stopped: { color: "text-slate-400", border: "border-slate-500/20", bg: "bg-slate-500/10", label: "stopped" },
    failed: { color: "text-red-400", border: "border-red-500/20", bg: "bg-red-500/10", label: "failed" }
  };

  const config = statusConfig[project.status] || statusConfig.stopped;

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="bg-[#0a0a0a] border border-slate-800 rounded-xl overflow-hidden flex flex-col group hover:border-emerald-500/30 transition-all"
    >
      <div className="p-6 flex-1">
        <div className="flex items-start justify-between mb-6">
          <div className={cn("w-10 h-10 rounded-sm flex items-center justify-center font-bold text-lg border", config.border, config.bg, config.color)}>
             <Package className="w-5 h-5" />
          </div>
          <div className="flex gap-1">
            <button 
              onClick={onDelete}
              className="p-1.5 rounded-sm hover:bg-red-500/10 text-slate-600 hover:text-red-500 transition-all"
            >
               <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-lg font-bold tracking-tight mb-1 text-white uppercase">{project.name}</h4>
          <div className="flex items-center gap-2">
            <span className={cn("text-[10px] font-bold lowercase tracking-widest uppercase", config.color)}>
              {config.label}
            </span>
            <span className="text-slate-800 select-none">•</span>
            <span className="text-[10px] text-slate-600 font-mono font-bold uppercase">/projects/{project.name.toLowerCase()}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pb-2">
           <div className="bg-[#050505] p-2 rounded-sm border border-slate-900">
             <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mb-1">Port</p>
             <p className="text-[10px] font-mono text-slate-300">3000</p>
           </div>
           <div className="bg-[#050505] p-2 rounded-sm border border-slate-900">
             <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mb-1">Type</p>
             <p className="text-[10px] font-mono text-slate-300">Node / TS</p>
           </div>
        </div>
      </div>

      <div className="p-3 bg-black/40 border-t border-slate-800 grid grid-cols-2 gap-2">
         <button 
           onClick={onToggleStatus}
           className={cn(
             "py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest border flex items-center justify-center gap-2 transition-all",
             project.status === 'running' 
               ? "bg-slate-900 hover:bg-slate-800 border-slate-800 text-white" 
               : "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400"
           )}
         >
           {project.status === 'running' ? (
             <>
               <Square className="w-3 h-3 text-red-500" />
               Stop
             </>
           ) : (
             <>
               <Play className="w-3 h-3" />
               Start
             </>
           )}
         </button>
         <button className="py-2 rounded-sm bg-slate-900 hover:bg-slate-800 text-[10px] font-bold uppercase tracking-widest border border-slate-800 flex items-center justify-center gap-2 transition-all">
           <RefreshCw className="w-3 h-3 text-blue-400" />
           Logs
         </button>
      </div>
    </motion.div>
  );
}
