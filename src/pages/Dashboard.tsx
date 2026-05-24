import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSystemStore } from "../store/useSystemStore";
import { useAuthStore } from "../store/useAuthStore";
import { cn } from "../lib/utils";
import { 
  Package, 
  Cpu, 
  HardDrive, 
  Zap, 
  Activity,
  Server,
  Cloud,
  ChevronRight,
  RefreshCw,
  Play,
  Box,
  Terminal,
  ShieldCheck
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Project } from "../types";

export default function Dashboard() {
  const { metrics, setMetrics } = useSystemStore();
  const token = useAuthStore(state => state.token);
  const [history, setHistory] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;

    try {
      // Fetch Metrics
      const mRes = await fetch('/api/system/metrics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (mRes.ok) {
        const data = await mRes.json();
        setMetrics(data);
        
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setHistory(prev => {
          const newHistory = [...prev, { time: now, cpu: data.cpu, ram: data.ram }];
          return newHistory.slice(-15); // Keep last 15 points
        });
      }

      // Fetch Projects
      const pRes = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (pRes.ok) {
        setProjects(await pRes.json());
      }

      // Fetch Logs
      const lRes = await fetch('/api/logs?limit=10', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (lRes.ok) {
        setLogs(await lRes.json());
      }
    } catch (err) {
      console.error("Dashboard poll error:", err);
    }
  }, [setMetrics, token]);

  const handleProjectAction = async (id: number, status: string) => {
    if (!token) return;
    try {
      await fetch(`/api/projects/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch (err) {
      console.error("Project action error:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white uppercase group">
            Control Center 
            <span className="text-emerald-500 ml-2 animate-pulse">_</span>
          </h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Industrial-grade resource orchestration and system monitoring.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-sm bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-emerald-400", isRefreshing && "animate-spin")} />
            {isRefreshing ? 'Syncing...' : 'Sync Node'}
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          icon={Cpu} 
          label="CPU Load" 
          value={`${metrics?.cpu || 0}%`} 
          color="text-emerald-400" 
          progress={metrics?.cpu || 0}
        />
        <MetricCard 
          icon={Zap} 
          label="RAM Usage" 
          value={`${metrics?.ram || 0}%`} 
          color="text-emerald-400" 
          progress={metrics?.ram || 0}
        />
        <MetricCard 
          icon={HardDrive} 
          label="Storage" 
          value={`${metrics?.disk || 0}%`} 
          color="text-slate-400" 
          progress={metrics?.disk || 0}
          isStatic
        />
        <MetricCard 
          icon={Activity} 
          label="Active Threads" 
          value={projects.length.toString()} 
          color="text-emerald-400" 
          trend={`${projects.filter(p => p.status === 'running').length} Active`}
          noBar
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Resource Chart */}
        <div className="lg:col-span-8 bg-[#0a0a0a] border border-slate-800 rounded-xl p-6 relative overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-3 h-3" /> Telemetry Stream
            </h3>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
               <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> CPU</div>
               <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-600" /> RAM</div>
             </div>
          </div>
          
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 9, fontFamily: 'monospace' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 9, fontFamily: 'monospace' }}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #1e293b', borderRadius: '4px' }}
                  itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="cpu" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorCpu)" 
                  animationDuration={1000}
                />
                <Area 
                  type="monotone" 
                  dataKey="ram" 
                  stroke="#475569" 
                  strokeWidth={2}
                  fill="transparent"
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Side Cards */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
           {/* Live Log Preview */}
           <div className="bg-[#0a0a0a] border border-slate-800 rounded-xl p-5 flex-1 flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Terminal className="w-3 h-3 text-emerald-500" /> Log Stream
                </h3>
              </div>
              <div className="flex-1 font-mono text-[10px] space-y-2 overflow-y-auto max-h-[250px] scrollbar-hide">
                <AnimatePresence initial={false}>
                  {logs.map((log) => (
                    <motion.div 
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-2 border-l border-slate-800 pl-2 py-1"
                    >
                      <span className="text-slate-600">[{new Date(log.created_at).toLocaleTimeString([], { hour12: false })}]</span>
                      <span className={cn(
                        "font-bold",
                        log.level === 'error' ? 'text-red-500' : 'text-emerald-400'
                      )}>{log.source.toUpperCase()}</span>
                      <span className="text-slate-300 truncate">{log.message}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {logs.length === 0 && (
                  <div className="text-slate-600 italic">Waiting for events...</div>
                )}
              </div>
           </div>

           <div className="bg-[#0a0a0a] border border-slate-800 rounded-xl p-5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Node Health</h3>
              <div className="space-y-3">
                <StatusItem label="SECURE SHIELD" value="Active" color="text-emerald-400" />
                <StatusItem label="UPTIME" value={`${metrics?.uptime || 0}D`} />
                <StatusItem label="DATABASE" value="Sqlite3 Cloud" color="text-slate-400" />
              </div>
           </div>
        </div>
      </div>

      {/* Active Projects */}
      <div className="bg-[#0a0a0a] border border-slate-800 rounded-xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-black/20">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Service Orchestrator</h3>
          <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-white italic">
            Viewing {projects.length} System Processes
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-900 bg-[#050505]">
                <th className="px-6 py-4 font-bold">Process Name</th>
                <th className="px-6 py-4 font-bold">State</th>
                <th className="px-6 py-4 font-bold">Utilization</th>
                <th className="px-6 py-4 font-bold">Created</th>
                <th className="px-6 py-4 font-bold text-right">Control</th>
              </tr>
            </thead>
            <tbody className="text-xs font-mono">
               {projects.map((project) => (
                 <AppRow 
                  key={project.id}
                  id={project.id}
                  name={project.name} 
                  path={project.path} 
                  status={project.status} 
                  cpu="-" 
                  created={project.created_at ? new Date(project.created_at.replace(' ', 'T')).toLocaleDateString() : 'N/A'} 
                  isStopped={project.status !== 'running'} 
                  onAction={handleProjectAction}
                 />
               ))}
               {projects.length === 0 && (
                 <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-slate-600 italic">No active projects found.</td>
                 </tr>
               )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color, progress, noBar }: any) {
  return (
    <div className="bg-[#0a0a0a] border border-slate-800 p-5 rounded-lg transition-transform hover:translate-y-[-2px] hover:border-slate-700">
      <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">{label}</div>
      <div className={cn("text-2xl font-mono", color)}>{value}</div>
      {!noBar && (
        <div className="mt-4 w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className={cn("h-full rounded-full transition-all duration-1000", color.replace('text-', 'bg-'))} 
          />
        </div>
      )}
    </div>
  );
}

function StatusItem({ label, value, color = "text-slate-200" }: any) {
  return (
    <div className="flex items-center justify-between group">
      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{label}</span>
      <span className={cn("text-[10px] font-mono font-bold", color)}>{value}</span>
    </div>
  );
}

function AppRow({ id, name, path, status, cpu, created, isStopped, onAction }: any) {
  return (
    <tr className="border-b border-slate-900 hover:bg-slate-900/50 transition-colors">
      <td className="px-6 py-4">
        <div className={cn("font-bold flex items-center gap-2", isStopped ? "text-slate-500" : "text-white")}>
          <Box className={cn("w-3 h-3", !isStopped && "text-emerald-500")} />
          {name}
        </div>
        <div className="text-[10px] text-slate-600 truncate max-w-xs">{path}</div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {!isStopped && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
          <span className={cn("font-bold uppercase text-[10px]", isStopped ? "text-red-500" : "text-emerald-400")}>{status}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-slate-400">{cpu}</td>
      <td className="px-6 py-4 text-slate-500">{created}</td>
      <td className="px-6 py-4 text-right">
        {isStopped ? (
          <button 
            onClick={() => onAction(id, 'running')}
            className="text-emerald-500 hover:text-emerald-400 px-3 py-1 border border-emerald-900/50 rounded-sm text-[10px] uppercase font-bold transition-all hover:bg-emerald-500/10"
          >
            Start
          </button>
        ) : (
          <button 
            onClick={() => onAction(id, 'stopped')}
            className="text-slate-500 hover:text-white px-3 py-1 border border-slate-800 rounded-sm text-[10px] uppercase font-bold transition-all hover:bg-slate-800"
          >
            Stop
          </button>
        )}
      </td>
    </tr>
  );
}
