import { useState, useEffect, useRef } from "react";
import { Terminal as TerminalIcon, Search, Download, Trash2, SlidersHorizontal, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { cn } from "../lib/utils";

export default function Logs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const token = useAuthStore(state => state.token);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!token) return;

      try {
        const res = await fetch('/api/logs?limit=100', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (err) {
        console.error("Failed to fetch logs:", err);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const filteredLogs = logs.filter(log => filter === "all" || log.level === filter);

  return (
    <div className="space-y-8 h-[calc(100vh-14rem)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white uppercase">System Events</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Real-time log streaming from PM2 and system processes.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-sm bg-slate-900 border border-slate-800 text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">
             <Download className="w-3.5 h-3.5 text-emerald-400" />
             Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-sm bg-transparent border border-slate-800 text-slate-500 hover:text-red-400 hover:border-red-400/30 text-xs font-bold uppercase tracking-widest transition-all">
             <Trash2 className="w-3.5 h-3.5" />
             Purge
          </button>
        </div>
      </div>

      <div className="flex-1 bg-[#0a0a0a] border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-2xl">
        {/* Log Toolbar */}
        <div className="px-6 py-4 bg-black/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="flex items-center bg-[#050505] border border-slate-900 rounded-sm px-3 py-1.5 gap-2">
                <Search className="w-3.5 h-3.5 text-slate-700" />
                <input type="text" placeholder="FILTER LOG ENTRIES..." className="bg-transparent border-none outline-none text-[10px] font-bold uppercase tracking-widest w-48 text-white placeholder-slate-800" />
             </div>
             <div className="flex items-center gap-1 p-1 bg-[#050505] border border-slate-900 rounded-sm">
               <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>All</FilterButton>
               <FilterButton active={filter === "succ"} onClick={() => setFilter("succ")} color="text-emerald-400">Succ</FilterButton>
               <FilterButton active={filter === "info"} onClick={() => setFilter("info")} color="text-blue-400">Info</FilterButton>
               <FilterButton active={filter === "warn"} onClick={() => setFilter("warn")} color="text-amber-400">Warn</FilterButton>
               <FilterButton active={filter === "error"} onClick={() => setFilter("error")} color="text-red-400">Error</FilterButton>
             </div>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
             <div className="flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               Live stream active
             </div>
          </div>
        </div>

        {/* Terminal Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 font-mono text-[11px] space-y-1.5 scroll-smooth bg-[#020203]"
        >
          {filteredLogs.map((log) => (
            <div key={log.id} className="flex gap-4 group hover:bg-white/5 transition-colors">
              <span className="text-slate-600 shrink-0 select-none min-w-[130px]">
                [{log.created_at ? new Date(log.created_at.replace(' ', 'T')).toLocaleTimeString() : '??:??'}]
              </span>
              <span className={cn(
                "shrink-0 select-none font-bold min-w-[50px] uppercase",
                log.level === "succ" ? "text-emerald-500" :
                log.level === "info" ? "text-blue-500" :
                log.level === "warn" ? "text-amber-500" :
                "text-red-500"
              )}>
                {log.level}
              </span>
              <span className={cn(
                "text-slate-300",
                log.level === "error" && "text-red-400",
                log.level === "warn" && "text-amber-200"
              )}>{log.message}</span>
            </div>
          ))}
          {filteredLogs.length === 0 && (
            <div className="h-full flex items-center justify-center flex-col gap-4 text-slate-800 mt-20">
               <TerminalIcon className="w-12 h-12 opacity-10" />
               <p className="font-bold tracking-[0.2em] uppercase text-[10px] italic">_ Awaiting system feedback</p>
            </div>
          )}
          <div className="text-emerald-500 animate-pulse mt-4 font-bold">
            _ Incoming socket stream established...
          </div>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-2 bg-black border-t border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
           <div className="flex items-center gap-6">
             <span>Buffer: 100/1000 lines</span>
             <span>Fleet: Alpha-Node-01</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
             Auto-scroll: Enabled
           </div>
        </div>
      </div>
    </div>
  );
}

function FilterButton({ children, active, onClick, color }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase transition-all tracking-tighter",
        active ? "bg-slate-800 text-white" : "text-slate-600 hover:text-slate-300",
        active && color
      )}
    >
      {children}
    </button>
  );
}
