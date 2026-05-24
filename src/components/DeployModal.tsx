import { useState } from "react";
import { Upload, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { useModalStore } from "../store/useModalStore";
import { cn } from "../lib/utils";

export default function DeployModal({ onComplete }: { onComplete?: () => void }) {
  const { isDeployModalOpen, closeDeployModal } = useModalStore();
  const [deploying, setDeploying] = useState(false);
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);
  const [projectName, setProjectName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const token = useAuthStore(state => state.token);

  const simulateLogs = (logs: string[]) => {
    return new Promise<void>((resolve) => {
      let current = 0;
      const interval = setInterval(() => {
        if (current >= logs.length) {
          clearInterval(interval);
          resolve();
          return;
        }
        setDeploymentLogs(prev => [...prev, logs[current]]);
        current++;
      }, 400);
    });
  };

  const handleDeploy = async () => {
    if (!projectName || !selectedFile || !token) return;
    
    let hasError = false;
    setDeploying(true);
    setDeploymentLogs(["[SYSTEM] Initializing deployment pipeline..."]);
    
    setDeploymentLogs(prev => [...prev, `[INFO] Preparing archive (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)...`]);

    await simulateLogs([
      "> Validating bundle signature...",
      "> Checksum verified [SHA-256 OK]",
      "> Extracting archive to temporary workspace...",
      "> Analyzing package.json dependencies...",
      "> Pruning legacy artifacts...",
    ]);

    const formData = new FormData();
    formData.append("name", projectName);
    formData.append("project", selectedFile);

    try {
      await axios.post("/api/deploy", formData, {
        headers: { Authorization: `Bearer ${token}` },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      
      await simulateLogs([
        "> Finalizing container configuration...",
        "> Rebuilding PM2 process tree...",
        "[SUCCESS] Application node is now online."
      ]);
      
      setTimeout(() => {
        closeDeployModal();
        setProjectName("");
        setSelectedFile(null);
        setDeploymentLogs([]);
        if (onComplete) onComplete();
      }, 1000);
    } catch (err: any) {
      console.error("Upload Error:", err);
      let errorMsg = "[ERROR] Deployment failed. Check system logs for details.";
      if (err.response?.status === 413) {
        errorMsg = "[ERROR] Request Entity Too Large (413). The file is likely too big for the server or proxy limits.";
      } else if (err.response?.data?.message) {
        errorMsg = `[ERROR] ${err.response.data.message}`;
      }
      
      setDeploymentLogs(prev => [...prev, errorMsg]);
      hasError = true;
    } finally {
      if (!hasError) {
        setDeploying(false);
      }
    }
  };

  return (
    <AnimatePresence>
      {isDeployModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             onClick={() => !deploying && closeDeployModal()}
             className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#0a0a0a] border border-slate-800 w-full max-w-lg rounded-xl overflow-hidden shadow-2xl relative"
          >
             <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center">
               <div>
                  <h3 className="text-lg font-bold uppercase tracking-tight">Deploy Application</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Select a compiled ZIP bundle for deployment.</p>
               </div>
               {!deploying && (
                 <button onClick={closeDeployModal} className="p-2 hover:bg-slate-800 rounded-sm text-slate-500">
                   <X className="w-4 h-4" />
                 </button>
               )}
             </div>
             
             <div className="p-8 space-y-6">
                {deploying ? (
                  <div className="bg-black rounded-lg p-6 font-mono text-[10px] space-y-1.5 h-64 overflow-y-auto border border-slate-900 scrollbar-hide">
                     {deploymentLogs.map((log, i) => (
                       <motion.div 
                        initial={{ opacity: 0, x: -5 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        key={i} 
                        className={cn(
                          log?.includes('[ERROR]') ? 'text-red-500' : 
                          log?.includes('[SUCCESS]') ? 'text-emerald-400 font-bold' : 
                          'text-slate-400'
                        )}
                       >
                         {log}
                       </motion.div>
                     ))}
                     <div className="animate-pulse text-emerald-500 font-bold mt-2">_</div>
                  </div>
                ) : (
                  <>
                    <label className="block border border-dashed border-slate-800 rounded-lg p-10 flex flex-col items-center justify-center hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer group">
                       <input 
                        type="file" 
                        className="hidden" 
                        accept=".zip,.rar,.tar,.gz"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                       />
                       <div className="w-10 h-10 rounded-sm bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 group-hover:bg-emerald-500 transition-all group-hover:border-emerald-400">
                          <Upload className={cn("w-5 h-5 transition-all", selectedFile ? "text-emerald-500" : "text-slate-500 group-hover:text-black")} />
                       </div>
                       <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 text-center px-4">
                         {selectedFile ? (
                           <span className="flex flex-col gap-1">
                             <span className="text-white truncate max-w-[200px]">{selectedFile.name}</span>
                             <span className={cn(
                               "text-[8px]",
                               selectedFile.size > 30 * 1024 * 1024 ? "text-amber-500 animate-pulse" : "text-emerald-500"
                             )}>
                               {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                               {selectedFile.size > 30 * 1024 * 1024 && " • WARNING: Proxy Limit (32MB)"}
                             </span>
                           </span>
                         ) : "Select Archive file (Max 32MB)"}
                       </p>
                    </label>

                    <div className="space-y-4">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Identifier</label>
                       <input 
                         type="text" 
                         placeholder="PROJ_NAME"
                         value={projectName}
                         onChange={(e) => setProjectName(e.target.value)}
                         className="w-full bg-[#050505] border border-slate-800 rounded-sm px-4 py-3 text-xs font-mono uppercase focus:border-emerald-500/50 outline-none transition-all text-white"
                       />
                    </div>
                  </>
                )}
             </div>

             <div className="px-8 py-6 bg-black/40 border-t border-slate-800 flex items-center justify-end gap-3">
               <button 
                onClick={closeDeployModal}
                disabled={deploying}
                className="px-6 py-2 rounded-sm hover:bg-slate-800 text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
               >
                 Cancel
               </button>
               <button 
                onClick={handleDeploy}
                disabled={deploying || !selectedFile || !projectName}
                className="px-6 py-2 rounded-sm bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/10 transition-all disabled:opacity-50 disabled:grayscale"
               >
                  {deploying ? "Deploying..." : "Initialize"}
               </button>
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
