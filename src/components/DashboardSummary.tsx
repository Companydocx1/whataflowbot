import React from "react";
import { Users, Clock, MessageSquare, TrendingUp, ArrowUpRight } from "lucide-react";
import { Lead, Campaign, Message, QueueJob } from "../types";

export interface DashboardSummaryProps {
  leads: Lead[];
  campaigns?: Campaign[];
  messages: Message[];
  queueJobs?: QueueJob[];
}

export default function DashboardSummary({
  leads = [],
  campaigns = [],
  messages = [],
  queueJobs = []
}: DashboardSummaryProps) {
  // 1. Total Active Leads (leads that are active in the pipeline)
  const activeLeadsCount = leads.filter(l => l.status !== "Closed_Lost").length;
  const hotLeadsCount = leads.filter(l => l.temperature === "Hot" && l.status !== "Closed_Lost").length;
  const warmLeadsCount = leads.filter(l => l.temperature === "Warm" && l.status !== "Closed_Lost").length;

  // 2. Pending Campaign Jobs (queued or processing asynchronous broadcast jobs)
  const pendingJobsCount = (queueJobs && queueJobs.length > 0)
    ? queueJobs.filter(j => j.status === "pending" || j.status === "processing").length
    : (campaigns || []).filter(c => c.status === "Queued" || c.status === "Sending").length;
  const totalCampaignsCount = campaigns.length;

  // 3. Total Inbox Messages (multi-channel conversations)
  const totalMessagesCount = messages.length;
  const inboundCount = messages.filter(m => m.sender === "customer").length;
  const outboundCount = messages.filter(m => m.sender === "agent" || m.sender === "bot").length;

  // 4. Lead Conversion Rate (retained consultations, won proposals, or confirmed bookings)
  const convertedCount = leads.filter(
    l => l.status === "Closed_Won" || l.consultationFee === "Paid" || l.bookingStatus === "Confirmed" || l.bookingStatus === "Completed"
  ).length;
  const conversionRate = leads.length > 0 
    ? ((convertedCount / leads.length) * 100).toFixed(1) 
    : "0.0";

  return (
    <div className="flex flex-col gap-3 font-sans" id="dashboard-summary-root">
      <div className="flex items-center justify-between pb-1 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase font-mono">
            Dashboard Executive Summary & Live State Metrics
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
          State Synchronized
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-summary-cards">
        {/* Metric 1: Total Active Leads */}
        <div 
          className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group"
          id="metric-total-active-leads"
        >
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">
              Total Active Leads
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
                {activeLeadsCount}
              </h4>
              <span className="text-[10px] font-mono font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              <strong className="text-slate-700 font-semibold">{hotLeadsCount}</strong> hot · <strong className="text-slate-700 font-semibold">{warmLeadsCount}</strong> warm
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-50/80 border border-blue-100/80 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Pending Campaign Jobs */}
        <div 
          className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group"
          id="metric-pending-campaign-jobs"
        >
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">
              Pending Campaign Jobs
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <h4 className="text-2xl font-extrabold text-amber-600 tracking-tight font-sans">
                {pendingJobsCount}
              </h4>
              <span className="text-[10px] font-mono font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                Queue
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Across <strong className="text-slate-700 font-semibold">{totalCampaignsCount}</strong> campaign{totalCampaignsCount === 1 ? '' : 's'}
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50/80 border border-amber-100/80 rounded-xl flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Total Inbox Messages */}
        <div 
          className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group"
          id="metric-total-inbox-messages"
        >
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">
              Total Inbox Messages
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
                {totalMessagesCount}
              </h4>
              <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                Omnichannel
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              <strong className="text-slate-700 font-semibold">{inboundCount}</strong> in · <strong className="text-slate-700 font-semibold">{outboundCount}</strong> out
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50/80 border border-emerald-100/80 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Lead Conversion Rate */}
        <div 
          className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between group"
          id="metric-lead-conversion-rate"
        >
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">
              Lead Conversion Rate
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <h4 className="text-2xl font-extrabold text-indigo-700 tracking-tight font-sans">
                {conversionRate}%
              </h4>
              <span className="text-[10px] font-mono font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> Win
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              <strong className="text-slate-700 font-semibold">{convertedCount}</strong> of <strong className="text-slate-700 font-semibold">{leads.length}</strong> converted
            </p>
          </div>
          <div className="w-12 h-12 bg-indigo-50/80 border border-indigo-100/80 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
