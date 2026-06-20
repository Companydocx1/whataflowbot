import React from "react";
import { AlertCircle, CheckCircle, Flame, Server, DollarSign, PieChart, Users, ArrowRight, Zap } from "lucide-react";
import { SystemStatus } from "../types";

interface DisadvProps {
  systemStatus: SystemStatus;
  toggleCache: () => void;
  toggleAsync: () => void;
}

export default function DisadvPanel({ systemStatus, toggleCache, toggleAsync }: DisadvProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200/80 p-6 flex flex-col gap-6" id="disadv-panel-root">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-sans font-bold text-slate-900 flex items-center gap-2">
            <Flame className="w-6 h-6 text-indigo-600 fill-indigo-100" />
            Wati Disadvantages vs. DocxFlow Enterprise Solutions
          </h2>
          <p className="text-sm text-slate-500">
            A comprehensive side-by-side architecture audit demonstrating how Company Docx optimizes performance and minimizes operational costs.
          </p>
        </div>
        <div className="bg-slate-900 text-white p-2.5 rounded-lg border border-slate-800 text-xs flex flex-col gap-1 sm:self-start">
          <span className="text-[10px] text-slate-400 font-mono tracking-widest font-bold uppercase">Firm Integration Status</span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="font-medium">Active - Synchronized to Law CRM</span>
          </div>
        </div>
      </div>

      {/* Latency Comparison Visual Simulator */}
      <div className="bg-slate-50/80 rounded-xl p-5 border border-slate-200 flex flex-col gap-4" id="latency-simulator">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-indigo-600" />
              Real-Time Edge Caching & Delivery Simulator
            </h3>
            <p className="text-xs text-slate-500">
              Wati relies purely on raw Meta API calls which are strictly throttled. We bypass this using asynchronous queue layers.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleCache}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-md border shadow-sm transition-all ${
                systemStatus.edgeCachingEnabled
                  ? "bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700"
                  : "bg-white text-slate-400 border-slate-200 hover:bg-slate-50"
              }`}
              id="caching-quick-toggle"
            >
              Edge Cache: {systemStatus.edgeCachingEnabled ? "ACTIVE (12ms)" : "OFF (1.5s delay)"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Default Wati Call Path */}
          <div className="bg-white p-4 rounded-lg border border-red-200 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-red-50 pb-2">
              <span className="text-xs font-bold text-red-600 tracking-wider uppercase font-mono">Standard Wati API Flow</span>
              <span className="text-xs font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                ~1,500ms Delay
              </span>
            </div>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between text-slate-650">
                <span>1. Meta Compliance Check:</span>
                <span className="text-slate-900 font-medium">Blocking Wait</span>
              </div>
              <div className="flex items-center justify-between text-slate-655">
                <span>2. Message Delivery Status:</span>
                <span className="text-slate-900 font-medium">Serial Processing</span>
              </div>
              <div className="flex items-center justify-between text-slate-655">
                <span>3. CRM DB Pipeline:</span>
                <span className="text-red-600 font-mono font-bold">Throttled Queue</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div className="bg-red-500 h-1.5 rounded-full" style={{ width: "100%" }}></div>
            </div>
            <p className="text-[10.5px] text-red-500 italic">
              * Users suffer delays during campaign broadcasts while Meta evaluates template restrictions.
            </p>
          </div>

          {/* DocxFlow Edge Path */}
          <div className="bg-slate-900 text-white p-4 rounded-lg border border-slate-800 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-[#818cf8] tracking-wider uppercase font-mono">DocxFlow Caching Engine</span>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                ~12ms Instant
              </span>
            </div>
            <div className="flex flex-col gap-2 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span>1. Local Cache Verification:</span>
                <span className="text-emerald-400 font-medium">HIT (Edge Node)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>2. Message Assembly:</span>
                <span className="text-indigo-400 font-medium">Asynchronous Worker</span>
              </div>
              <div className="flex items-center justify-between">
                <span>3. Business CRM Sync:</span>
                <span className="text-green-400 font-mono font-bold">Priority Threaded</span>
              </div>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5">
              <div className="bg-green-400 h-1.5 rounded-full" style={{ width: "12%" }}></div>
            </div>
            <p className="text-[10.5px] text-slate-400 italic">
              * Messages resolve instantly via internal memory caches, syncing in the background for team accessibility.
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="wati-docxflow-grid">
        {/* Cost comparison */}
        <div className="border border-slate-200/80 rounded-xl p-4 hover:shadow-md transition-all duration-300 flex flex-col gap-3 bg-slate-50/50">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Wati High Cost Pain</h4>
            <p className="text-xs text-red-650 font-mono font-bold mt-1">PROHIBITIVE MONTHLY + TEMPLATE FEES</p>
            <p className="text-xs text-slate-500 mt-2">
              Prone to surging usage charges. Every bulk campaign template requests variable fees from Meta on top of fixed baseline subscriptions.
            </p>
          </div>
          <div className="mt-auto pt-3 border-t border-slate-100">
            <span className="text-[10px] text-indigo-700 font-bold font-mono uppercase bg-indigo-50 border border-indigo-100 px-2 py-1 rounded block text-center">
              DocxFlow Solution: 100% Free Messaging
            </span>
          </div>
        </div>

        {/* WhatsApp Exclusive */}
        <div className="border border-slate-200/80 rounded-xl p-4 hover:shadow-md transition-all duration-300 flex flex-col gap-3 bg-slate-50/50" id="watichannel-lockin-col">
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Wati Channel Lock-In</h4>
            <p className="text-xs text-orange-650 font-mono font-bold mt-1">WHATSAPP-ONLY BOTTLENECK</p>
            <p className="text-xs text-slate-500 mt-2">
              Forced tool splitting. Businesses must handle standard cellular SMS lists and corporate email segments inside separate external tools.
            </p>
          </div>
          <div className="mt-auto pt-3 border-t border-slate-100">
            <span className="text-[10px] text-indigo-700 font-bold font-mono uppercase bg-indigo-50 border border-indigo-100 px-2 py-1 rounded block text-center">
              DocxFlow Solution: SMS & Email Co-Sync
            </span>
          </div>
        </div>

        {/* Delays / API Restrictions */}
        <div className="border border-slate-200/80 rounded-xl p-4 hover:shadow-md transition-all duration-300 flex flex-col gap-3 bg-slate-50/50" id="api-restricted-delays-col">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">API Restricted Delays</h4>
            <p className="text-xs text-blue-650 font-mono font-bold mt-1">STRICT META THROTTLING</p>
            <p className="text-xs text-slate-500 mt-2">
              Users experience delivery bottlenecks or broadcast delays. Blocked messages occur frequently due to strict compliance triggers.
            </p>
          </div>
          <div className="mt-auto pt-3 border-t border-slate-100">
            <span className="text-[10px] text-indigo-700 font-bold font-mono uppercase bg-indigo-50 border border-indigo-100 px-2 py-1 rounded block text-center">
              DocxFlow Solution: Priority Async Workers
            </span>
          </div>
        </div>

        {/* Analytics limitation */}
        <div className="border border-slate-200/80 rounded-xl p-4 hover:shadow-md transition-all duration-300 flex flex-col gap-3 bg-slate-50/50" id="weak-analytics-col">
          <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center text-violet-500">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Weak Analytics reporting</h4>
            <p className="text-xs text-violet-650 font-mono font-bold mt-1">NO REVENUE ATTRIBUTION</p>
            <p className="text-xs text-slate-500 mt-2">
              Simple click tracking only. Fails to compute professional stakeholder ROI, custom lead scoring, or corporate conversion funnels.
            </p>
          </div>
          <div className="mt-auto pt-3 border-t border-slate-100">
            <span className="text-[10px] text-indigo-700 font-bold font-mono uppercase bg-indigo-50 border border-indigo-100 px-2 py-1 rounded block text-center">
              DocxFlow Solution: AI Lead Scoring + ROI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
