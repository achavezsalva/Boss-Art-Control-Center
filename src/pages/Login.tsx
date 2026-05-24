import React, { useState } from "react";
import { motion } from "motion/react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { Box, Lock, Mail, Loader2 } from "lucide-react";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("admin@artchie.local");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post("/api/auth/login", { email, password });
      setAuth(data.user, data.token);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 selection:bg-emerald-500/30 selection:text-emerald-400">
      {/* Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] relative z-10"
      >
        <div className="bg-[#0a0a0a] border border-slate-800 rounded-xl p-10 shadow-2xl overflow-hidden relative group">
           <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] to-transparent pointer-events-none" />
           
           <div className="flex flex-col items-center mb-10">
              <div className="w-12 h-12 bg-emerald-500 rounded-sm rotate-45 flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/20">
                <div className="w-4 h-4 bg-black rounded-full" />
              </div>
              <h1 className="text-3xl font-bold tracking-tighter text-white uppercase text-center">BOSS ART</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2 text-center italic">Control Center Access</p>
           </div>

           <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Identifier</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@artchie.local"
                  required
                  className="w-full bg-[#050505] border border-slate-800 rounded-sm px-4 py-3.5 text-xs font-bold uppercase tracking-widest placeholder-slate-800 outline-none focus:border-emerald-500/50 transition-all text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Secret Key</label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#050505] border border-slate-800 rounded-sm px-4 py-3.5 text-xs font-bold uppercase tracking-widest placeholder-slate-800 outline-none focus:border-emerald-500/50 transition-all text-white"
                />
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase text-center"
                >
                  {error}
                </motion.div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-white text-black text-xs font-bold rounded-sm uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2 shadow-xl shadow-black/40"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : "Authenticate"}
              </button>
           </form>

           <div className="mt-10 pt-8 border-t border-slate-900 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter italic">Auth Protocol: JWT-SECURE</span>
              </div>
              <p className="text-[9px] text-slate-800 font-bold uppercase tracking-widest text-center">Managed Deployment Environment 2.0</p>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
