import { useState } from "react";
import { Globe, Plus, Shield, ShieldCheck, Trash2, ArrowUpRight, ExternalLink, Settings as SettingsIcon, RefreshCw, Lock, Cloud } from "lucide-react";
import { cn } from "../lib/utils";

export default function Domains() {
  const [domains] = useState([
    { id: 1, name: "dashboard.artchie.local", target: "localhost:3000", ssl: true, status: "Active" },
    { id: 2, name: "api.nexus.dev", target: "localhost:3001", ssl: true, status: "Active" },
    { id: 3, name: "test-site.io", target: "localhost:8080", ssl: false, status: "Pending" },
  ]);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white uppercase">Domain Connectivity</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Manage external hostnames and SSL terminator configurations.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 rounded-sm bg-white text-black text-xs font-bold uppercase tracking-tighter hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-500/10">
          <Plus className="w-4 h-4" />
          Link Domain
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
           {domains.map(domain => (
             <div key={domain.id} className="bg-[#0a0a0a] border border-slate-800 rounded-xl p-6 group hover:border-emerald-500/30 transition-all shadow-sm">
                <div className="flex items-start justify-between mb-6">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-sm bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
                         <Globe className="w-5 h-5" />
                      </div>
                      <div>
                         <h3 className="text-lg font-bold flex items-center gap-2 text-white uppercase tracking-tight">
                           {domain.name}
                           <ExternalLink className="w-3 h-3 text-slate-600 cursor-pointer hover:text-emerald-400 transition-colors" />
                         </h3>
                         <p className="text-[10px] text-slate-500 font-bold font-mono uppercase tracking-widest mt-0.5">Proxy: {domain.target}</p>
                      </div>
                   </div>
                   <div className="flex flex-col items-end gap-2">
                      <div className={cn(
                        "px-2 py-0.5 rounded-sm text-[8px] font-bold uppercase tracking-widest flex items-center gap-1.5 border",
                        domain.status === "Active" ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/20" : "bg-amber-500/5 text-amber-500 border-amber-500/20"
                      )}>
                         <span className={cn("w-1 h-1 rounded-full", domain.status === "Active" ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
                         {domain.status}
                      </div>
                      {domain.ssl && (
                        <div className="px-2 py-0.5 rounded-sm bg-slate-900 text-slate-400 border border-slate-800 text-[8px] font-bold flex items-center gap-1 uppercase tracking-tighter">
                          <ShieldCheck className="w-3 h-3 text-emerald-500" /> SSL SECURED
                        </div>
                      )}
                   </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-900">
                   <div className="flex items-center gap-4">
                      <button className="text-[10px] font-bold text-slate-500 hover:text-white flex items-center gap-1.5 transition-colors uppercase tracking-widest">
                        <SettingsIcon className="w-3.5 h-3.5" />
                        Configure
                      </button>
                      <button className="text-[10px] font-bold text-slate-500 hover:text-white flex items-center gap-1.5 transition-colors uppercase tracking-widest">
                        <RefreshCw className="w-3.5 h-3.5" />
                        Renew
                      </button>
                   </div>
                   <button className="p-2 rounded-sm text-slate-700 hover:text-red-500 hover:bg-red-500/5 transition-all">
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>
             </div>
           ))}
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="p-6 bg-[#0a0a0a] border border-slate-800 rounded-xl">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Proxy Controller</h3>
              <div className="space-y-4">
                 <NodeStatusItem label="NGINX STATUS" value="Operational" color="text-emerald-500" />
                 <NodeStatusItem label="CONFIG SYNTAX" value="Schema OK" color="text-emerald-500" />
                 <NodeStatusItem label="LAST RELOAD" value="142m ago" color="text-slate-500" />
              </div>
              <button className="w-full mt-6 py-2 bg-slate-900 hover:bg-slate-800 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all border border-slate-800 text-white">
                 Force Engine Reload
              </button>
           </div>

           <div className="p-6 bg-emerald-950/20 border border-emerald-500/30 rounded-xl group relative overflow-hidden">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Cloudflare Bridge</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed mb-4 tracking-tighter">
                Securely expose internal ports via encrypted Argot tunnels.
              </p>
              <button className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all">
                Sync Tunneling
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

function NodeStatusItem({ label, value, color }: any) {
  return (
    <div className="flex items-center justify-between border-b border-slate-900 pb-3 last:border-0 last:pb-0">
       <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{label}</span>
       <span className={cn("text-[10px] font-mono font-bold uppercase", color)}>{value}</span>
    </div>
  );
}
