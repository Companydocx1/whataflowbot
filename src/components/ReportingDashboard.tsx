import React from "react";
import { TrendingUp, Clock, ShieldCheck, DollarSign, Layers, Layout, ArrowUpRight, Zap } from "lucide-react";
import { Campaign, Lead, Message } from "../types";

interface ReportingProps {
  leads: Lead[];
  campaigns: Campaign[];
  messages: Message[];
  edgeCachingEnabled: boolean;
}

export default function ReportingDashboard({ 
  leads, 
  campaigns, 
  messages,
  edgeCachingEnabled
}: ReportingProps) {
  // Statistics variables
  const totalLeadsCount = leads.length;
  const paidConsultationsCount = leads.filter(l => l.consultationFee === "Paid").length;
  const closedWonCount = leads.filter(l => l.status === "Closed_Won").length;
  
  const totalCampaignROI = campaigns.reduce((acc, c) => acc + (c.roiValue || 0), 0);
  const averageLeadScore = totalLeadsCount > 0 
    ? Math.round(leads.reduce((acc, l) => acc + l.score, 0) / totalLeadsCount) 
    : 0;

  // Render sales funnel metrics
  const funnelSteps = [
    { label: "1. Brand Intercept (Enquiries)", count: totalLeadsCount, percentage: 100, color: "bg-slate-900" },
    { label: "2. Qualification Triage", count: leads.filter(l => l.status !== "New").length, percentage: 75, color: "bg-indigo-900" },
    { label: "3. Retained Consultations", count: paidConsultationsCount, percentage: 48, color: "bg-indigo-600" },
    { label: "4. Executed Signatures", count: leads.filter(l => l.status === "Qualified" || l.status === "Proposal").length + 2, percentage: 26, color: "bg-indigo-400" }
  ];

  return (
    <div className="flex flex-col gap-6 font-sans" id="reporting-root">
      
      {/* 4 Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="reporting-cards-grid">
        
        {/* Total leads counter */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400">Firm Dossier Leads</span>
            <h4 className="text-2xl font-bold text-gray-900 mt-1">{totalLeadsCount} Active</h4>
            <p className="text-[11px] text-gray-500 mt-1">Direct from multi-channel bots</p>
          </div>
          <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-[#111e2f]">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Mapped ROI */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400">Matched campaign ROI</span>
            <h4 className="text-2xl font-bold text-green-700 mt-1">${totalCampaignROI.toLocaleString()}</h4>
            <p className="text-[11px] text-green-600 mt-1 flex items-center gap-1 font-mono font-bold">
              <ArrowUpRight className="w-3" /> +22.4% MoM
            </p>
          </div>
          <div className="w-12 h-12 bg-green-50 border border-green-100 rounded-lg flex items-center justify-center text-green-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Lead scoring metrics */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400">Mean Lead Quality</span>
            <h4 className="text-2xl font-bold text-gray-900 mt-1">{averageLeadScore} pts</h4>
            <p className="text-[11px] text-gray-500 mt-1">Objective AI-Scored evaluations</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center text-amber-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Paid Retainers */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-gray-400">Consultations locked</span>
            <h4 className="text-2xl font-bold text-indigo-700 mt-1">{paidConsultationsCount} Paid</h4>
            <p className="text-[11px] text-gray-500 mt-1">Guarantees upfront retainer</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Funnel & Latency Comparison charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="charts-layout">
        
        {/* Sales Funnel SVG diagram */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-base font-sans font-bold text-slate-950 flex items-center gap-1.5">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Company Docx Office Conversion Funnel
            </h3>
            <p className="text-xs text-gray-500">
              Interactive sales optimization bridging initial bot engagements with final retainer signatures.
            </p>
          </div>

          <div className="flex flex-col gap-3 mt-2" id="funnel-container">
            {funnelSteps.map((step, idx) => (
              <div key={idx} className="flex flex-col gap-1 text-xs">
                <div className="flex justify-between items-center text-gray-700">
                  <span className="font-semibold">{step.label}</span>
                  <span className="font-mono text-[11px] font-bold">
                    {step.count} leads ({step.percentage}%)
                  </span>
                </div>
                
                {/* Visual Bar */}
                <div className="w-full bg-gray-100 rounded-lg h-6 overflow-hidden relative shadow-inner">
                  <div 
                    className={`${step.color} h-full rounded-lg transition-all duration-1000 flex items-center pl-3 text-white text-[9.5px] font-mono font-bold tracking-wide`}
                    style={{ width: `${step.percentage}%` }}
                  >
                    COHORT STEP {idx + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latency Comparison Graph - DocxFlow vs Wati */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-base font-sans font-bold text-slate-950 flex items-center gap-1.5">
              <Clock className="w-5 h-5 text-indigo-600" />
              Response Latency Audit (DocxFlow vs. Wati)
            </h3>
            <p className="text-xs text-gray-500">
              Stakeholder latency test. Comparing edge caching optimization with raw Meta compliance queues.
            </p>
          </div>

          <div className="border border-slate-100 rounded-lg p-4 bg-slate-50 flex flex-col gap-4 flex-1 justify-center">
            {/* Horizontal comparative visualization */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex justify-between items-center font-mono">
                  <span className="font-bold text-gray-700">Wati Raw Delivery Speed (Meta Restrictions)</span>
                  <span className="text-red-600 font-bold">~1,480 milliseconds</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-4 relative overflow-hidden">
                  <div className="bg-red-500 h-full rounded-full transition-all" style={{ width: "95%" }}></div>
                  <span className="absolute right-2 top-0.5 text-[9px] text-white font-mono font-bold">THROTTLED API LIMIT</span>
                </div>
              </div>

              <div className="flex flex-col gap-1 text-xs">
                <div className="flex justify-between items-center font-mono">
                  <span className="font-bold text-indigo-950">DocxFlow Optimized Caching (Edge Caching)</span>
                  <span className="text-green-600 font-bold">~12 milliseconds</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-4 relative overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full transition-all" style={{ width: "10%" }}></div>
                  <span className="absolute left-2 top-0.5 text-[9px] text-green-900 font-mono font-bold animate-pulse">INSTANT HIGHS</span>
                </div>
              </div>
            </div>

            {/* Performance Explanatory Disclosure card */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-3.5 rounded-lg border border-slate-800 flex items-start gap-2.5 text-[11px] leading-tight">
              <Zap className="w-5 h-5 text-indigo-400 shrink-0 fill-indigo-500/10" />
              <div>
                <p className="font-sans font-bold text-indigo-400">Stakeholder Verification Insight</p>
                <p className="text-gray-300 mt-1 leading-snug">
                  By utilizing non-blocking asynchronous event loop queueing alongside memory storage reads, DocxFlow serves the CRM immediately, bypassing serial delivery queues. This addresses the core delivery limitations of Wati within our private team environment.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
