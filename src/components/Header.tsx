import React from "react";
import { UserRole, SystemStatus } from "../types";
import { Shield, Sparkles, Database, Layers, CloudLightning, ToggleLeft, ToggleRight } from "lucide-react";

interface HeaderProps {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  systemStatus: SystemStatus;
  toggleCache: () => void;
  toggleAsync: () => void;
}

export default function Header({
  currentRole,
  setRole,
  systemStatus,
  toggleCache,
  toggleAsync,
}: HeaderProps) {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-sm" id="docxflow-header">
      {/* Privacy Notice Banner */}
      <div className="bg-indigo-600 text-white text-[10px] tracking-[0.2em] font-mono py-1 px-4 text-center font-bold uppercase transition-all duration-300">
        Internal Team & Client Management Portal • Private Secure Space • Company Docx Law & Accounting
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo and Brand Identity */}
        <div className="flex items-center gap-3" id="brand-logo-container">
          <div className="w-12 h-12 relative flex items-center justify-center bg-slate-800 rounded-lg border border-slate-700 p-1 shadow-inner">
            {/* SVG implementation representing Company Docx Logo */}
            <svg viewBox="0 0 100 100" className="w-full h-full text-indigo-400">
              {/* Outer classic D frame */}
              <path 
                d="M 25 15 L 60 15 C 80 15, 90 28, 90 48 L 90 52 C 90 72, 80 85, 60 85 L 25 85 Z" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="6" 
                strokeLinecap="round"
              />
              {/* Roman Pillar top/capitol */}
              <rect x="23" y="14" width="22" height="4" fill="currentColor" rx="1" />
              {/* Pillar Columns */}
              <line x1="28" y1="18" x2="28" y2="82" stroke="currentColor" strokeWidth="4" />
              <line x1="34" y1="18" x2="34" y2="82" stroke="currentColor" strokeWidth="4" />
              <line x1="40" y1="18" x2="40" y2="82" stroke="currentColor" strokeWidth="4" />
              {/* Roman Pillar Base */}
              <rect x="23" y="82" width="22" height="4" fill="currentColor" rx="1" />
              
              {/* Gold Balance scales hanging from center */}
              <path d="M 45 42 L 75 42" stroke="#818cf8" strokeWidth="3" />
              <line x1="60" y1="36" x2="60" y2="70" stroke="#818cf8" strokeWidth="3.5" />
              {/* Left Pan */}
              <line x1="45" y1="42" x2="40" y2="52" stroke="#818cf8" strokeWidth="2" />
              <line x1="45" y1="42" x2="50" y2="52" stroke="#818cf8" strokeWidth="2" />
              <path d="M 37 52 Q 45 57 53 52 Z" fill="#818cf8" />
              {/* Right Pan */}
              <line x1="75" y1="42" x2="70" y2="52" stroke="#818cf8" strokeWidth="2" />
              <line x1="75" y1="42" x2="80" y2="52" stroke="#818cf8" strokeWidth="2" />
              <path d="M 67 52 Q 75 57 83 52 Z" fill="#818cf8" />

              {/* Gold Arrow climbing up indicating leads conversion */}
              <path 
                d="M 25 80 Q 55 83 80 60" 
                fill="none" 
                stroke="#34d399" 
                strokeWidth="4.5" 
                strokeDasharray="none" 
                strokeLinecap="round"
              />
              <path d="M 80 60 L 71 60 L 78 68 Z" fill="#34d399" />
            </svg>
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-sans text-xl sm:text-2xl font-bold uppercase tracking-tight text-white">
                Company Docx <span className="text-indigo-400 font-light">Flow</span>
              </span>
              <span className="bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-mono text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold">
                V2.4 Private
              </span>
            </div>
            <span className="text-xs text-slate-400 font-sans tracking-tight">
              DocxFlow — Advanced Lead Automation & Multi-Channel CRM
            </span>
          </div>
        </div>

        {/* Real-time System Optimization Settings */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700" id="controls-optimization">
          {/* Edge Cache Toggle */}
          <button 
            onClick={toggleCache}
            className="flex items-center gap-2 text-xs hover:bg-slate-700/50 p-1.5 rounded transition-all duration-200"
            title="Toggle high availability response caching"
            id="toggle-edge-caching-btn"
          >
            <CloudLightning className={`w-4 h-4 ${systemStatus.edgeCachingEnabled ? 'text-green-400 fill-green-400/20' : 'text-slate-400'}`} />
            <div className="text-left leading-none">
              <div className="font-medium flex items-center gap-1 font-mono">
                EDGE CACHE: {systemStatus.edgeCachingEnabled ? 'ACTIVE' : 'OFF'}
              </div>
              <span className="text-[9px] text-slate-400">
                {systemStatus.edgeCachingEnabled ? 'Cached response (~12ms)' : 'Live network delay (1.5s)'}
              </span>
            </div>
          </button>

          {/* Async queue Toggle */}
          <button 
            onClick={toggleAsync}
            className="flex items-center gap-2 text-xs hover:bg-slate-700/50 p-1.5 rounded transition-all duration-200"
            title="Toggle asynchronous queue job processing"
            id="toggle-async-processing-btn"
          >
            <Layers className={`w-4 h-4 ${systemStatus.asyncProcessingEnabled ? 'text-green-400 fill-green-400/20' : 'text-slate-400'}`} />
            <div className="text-left leading-none">
              <div className="font-medium flex items-center gap-1 font-mono">
                ASYNC WORKER: {systemStatus.asyncProcessingEnabled ? 'ENABLED' : 'STRICT'}
              </div>
              <span className="text-[9px] text-slate-400">
                {systemStatus.asyncProcessingEnabled ? 'Queue job dispatched' : 'Blocking API thread'}
              </span>
            </div>
          </button>
        </div>

        {/* User Role Switching Block */}
        <div className="flex items-center gap-3 bg-slate-800 p-2 rounded-lg border border-slate-700" id="user-role-section">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-slate-200">admin@companydocx.com</p>
            <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-widest font-bold flex items-center justify-end gap-1">
              <Shield className="w-3 h-3 text-indigo-400" />
              {currentRole} Access
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-indigo-300 font-mono uppercase font-bold">Simulator Role</label>
            <select
              value={currentRole}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="bg-slate-900 text-white border border-slate-750 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-sans font-medium hover:bg-slate-850"
              id="role-simulator-dropdown"
            >
              <option value="admin">🔒 Administrator (Full)</option>
              <option value="agent">👤 Team Agent (Limited)</option>
              <option value="viewer">👁️ Read-Only Viewer</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
