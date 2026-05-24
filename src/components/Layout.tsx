import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Package, 
  Terminal, 
  Activity, 
  Globe, 
  Users, 
  Database, 
  Settings, 
  LogOut,
  ChevronRight,
  Menu,
  Box
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useModalStore } from "../store/useModalStore";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";
import DeployModal from "./DeployModal";

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Package, label: "Projects", href: "/projects" },
  { icon: Activity, label: "Monitoring", href: "/monitoring" },
  { icon: Terminal, label: "Logs", href: "/logs" },
  { icon: Globe, label: "Domains", href: "/domains" },
  { icon: Box, label: "Docker", href: "/docker" },
  { icon: Users, label: "Users", href: "/users" },
  { icon: Database, label: "Backups", href: "/backups" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { openDeployModal } = useModalStore();

  return (
    <div className="flex h-screen bg-[#050505] text-slate-200 antialiased overflow-hidden">
      <DeployModal />
      {/* Sidebar */}
      <aside 
        className={cn(
          "relative h-full bg-[#0a0a0a] border-r border-slate-800 transition-all duration-300 ease-in-out z-30",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-sm rotate-45 flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-black rounded-full" />
              </div>
              {isSidebarOpen && (
                <span className="font-bold text-lg tracking-tight text-white uppercase">
                  BOSS ART
                </span>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto scrollbar-hide">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 px-3 pb-2 mb-2 font-bold select-none">
              {isSidebarOpen ? "Management" : "..."}
            </div>
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-200 group relative",
                    isActive 
                      ? "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500" 
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  )}
                >
                  <item.icon className={cn(
                    "w-4 h-4",
                    isActive ? "text-emerald-400" : "group-hover:text-emerald-400"
                  )} />
                  {isSidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-slate-800">
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800",
              !isSidebarOpen && "justify-center"
            )}>
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs">
                {user?.name?.[0]?.toUpperCase() || "A"}
              </div>
              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{user?.name || "Admin"}</p>
                  <p className="text-[10px] text-slate-500 truncate uppercase mt-0.5">{user?.role || "Administrator"}</p>
                </div>
              )}
              {isSidebarOpen && (
                <button 
                  onClick={logout}
                  className="p-1 rounded-md hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-sm bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors shadow-lg z-40"
        >
          <ChevronRight className={cn("w-4 h-4 transition-transform", isSidebarOpen && "rotate-180")} />
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#050505]">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-8 bg-[#050505] border-b border-slate-800 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold tracking-tight">
              {navItems.find(i => i.href === location.pathname)?.label || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Server Status: UP-04D</span>
             </div>
             <button 
                onClick={openDeployModal}
                className="px-4 py-1.5 bg-white text-black text-xs font-bold rounded-sm uppercase tracking-tighter hover:bg-emerald-400 transition-colors"
              >
                Deploy New Project
              </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scroll-smooth scrollbar-hide">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>

        {/* Footer Status Bar */}
        <footer className="h-8 border-t border-slate-800 bg-[#0a0a0a] px-4 flex items-center justify-between text-[10px] font-mono text-slate-600 shrink-0">
          <div className="flex gap-4">
            <span>NODE: v20.5.0</span>
            <span>PM2: v5.3.0</span>
            <span>DB: SQLite (32.4MB)</span>
          </div>
          <div className="flex gap-4 items-center uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
              <span>TUNNEL: STATUS_OK</span>
            </div>
            <span className="text-slate-400 font-bold">V1.0.0-PROD</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

import { motion } from "motion/react";
