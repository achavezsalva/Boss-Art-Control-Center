import { useState, useEffect } from "react";
import { Database, Plus, Download, Trash2, Calendar, FileArchive, RefreshCw } from "lucide-react";
import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { format } from "date-fns";
import { cn } from "../lib/utils";

export default function Backups() {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      const { data } = await axios.get("/api/backups", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBackups(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setCreating(true);
    try {
      await axios.post("/api/backups/create", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBackups();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white uppercase">System Backups</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Protect your infrastructure and local database states.</p>
        </div>
        <button 
          onClick={createBackup}
          disabled={creating}
          className="flex items-center gap-2 px-6 py-2.5 rounded-sm bg-white text-black text-xs font-bold uppercase tracking-tighter hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
        >
          {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Manual Backup
        </button>
      </div>

      <div className="bg-[#0a0a0a] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-black/40">
           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Archive History</h3>
           <div className="flex items-center gap-6 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Retention: 30D</span>
              <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5" /> Full Dump</span>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
             <thead className="bg-[#050505] text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-900">
               <tr>
                 <th className="px-8 py-5">Filename</th>
                 <th className="px-8 py-5">Timestamp</th>
                 <th className="px-8 py-5">Size</th>
                 <th className="px-8 py-5">Origin</th>
                 <th className="px-8 py-5 text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-900">
               {loading ? (
                 [1,2,3].map(i => <tr key={i} className="animate-pulse"><td colSpan={5} className="h-16 px-8 bg-white/5" /></tr>)
               ) : backups.length === 0 ? (
                 <tr>
                    <td colSpan={5} className="px-8 py-16 text-center text-slate-600 font-bold uppercase tracking-widest text-[10px]">
                       No backup archives found.
                    </td>
                 </tr>
               ) : (
                 backups.map(backup => (
                   <tr key={backup.id} className="hover:bg-slate-900/50 transition-colors group">
                     <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                           <FileArchive className="w-4 h-4 text-emerald-400" />
                           <span className="text-xs font-bold text-slate-300 uppercase">{backup.filename}</span>
                        </div>
                     </td>
                     <td className="px-8 py-4 text-[10px] text-slate-500 font-mono font-bold uppercase">
                        {format(new Date(backup.created_at), 'MMM dd, yyyy HH:mm')}
                     </td>
                     <td className="px-8 py-4 text-[10px] text-slate-500 font-mono font-bold uppercase">1.2 GB</td>
                     <td className="px-8 py-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">Internal</td>
                     <td className="px-8 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button className="p-2 rounded-sm bg-slate-900 border border-slate-800 text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all" title="Download">
                              <Download className="w-3.5 h-3.5" />
                           </button>
                           <button className="p-2 rounded-sm bg-slate-900 border border-slate-800 text-red-500 hover:bg-red-500 hover:text-white transition-all" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                           </button>
                        </div>
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="p-8 bg-emerald-950/20 border border-emerald-500/30 rounded-xl relative overflow-hidden group">
            <div className="flex items-center gap-4 mb-4">
               <div className="w-10 h-10 rounded-sm bg-emerald-500 flex items-center justify-center">
                  <Database className="w-5 h-5 text-black" />
               </div>
               <h3 className="text-xl font-bold uppercase tracking-tight">Auto-Backup Engine</h3>
            </div>
            <p className="text-slate-400 text-xs font-medium mb-6 leading-relaxed">
              Configured to snapshot the main SQLite instance and all active PM2 project roots every 24 hours.
            </p>
            <div className="flex items-center gap-2">
               <span className="px-3 py-1 rounded-sm bg-[#050505] border border-slate-800 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Daily: 00:00 UTC</span>
               <button className="text-[10px] font-bold text-slate-500 hover:text-white ml-auto flex items-center gap-1.5 transition-all">
                  MANAGEMENT <RefreshCw className="w-3 h-3" />
               </button>
            </div>
         </div>

         <div className="p-8 bg-[#0a0a0a] border border-slate-800 rounded-xl">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 italic">Governance Settings</h3>
            <div className="space-y-4">
               <ToggleSetting label="Binary Integrity Checks" sub="Verify checksums for all zip outputs" active />
               <ToggleSetting label="AES-256 Encryption" sub="Encrypt archives with system seed" active />
               <ToggleSetting label="Remote S3 Mirror" sub="Stream backups to off-site bucket" />
            </div>
         </div>
      </div>
    </div>
  );
}

function ToggleSetting({ label, sub, active }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-sm bg-[#050505] border border-slate-900 group">
      <div>
        <p className="text-[10px] font-bold text-white uppercase tracking-widest">{label}</p>
        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">{sub}</p>
      </div>
      <div className={cn(
        "w-8 h-4 rounded-full relative px-1 flex items-center transition-all",
        active ? "bg-emerald-600 justify-end" : "bg-slate-800 justify-start"
      )}>
        <div className="w-2.5 h-2.5 rounded-full bg-white" />
      </div>
    </div>
  );
}
