import React, { useState } from "react";
import { Campaign, QueueJob, UserRole } from "../types";
import { 
  Megaphone, 
  Send, 
  Clock, 
  BarChart, 
  Sliders, 
  Database,
  ArrowUpRight,
  ShieldAlert,
  Loader,
  Play,
  CheckCircle,
  FileText
} from "lucide-react";

interface BroadcastCampaignsProps {
  currentRole: UserRole;
  campaigns: Campaign[];
  queueJobs: QueueJob[];
  onLaunchCampaign: (campaignId: string) => Promise<void>;
  edgeCachingEnabled: boolean;
}

export default function BroadcastCampaigns({
  currentRole,
  campaigns,
  queueJobs,
  onLaunchCampaign,
  edgeCachingEnabled
}: BroadcastCampaignsProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [showTemplateWizard, setShowTemplateWizard] = useState(false);

  // Read only controls
  const isReadOnly = currentRole !== "admin"; // Only Admin can dispatch broadcasts

  const activeCampaign = campaigns.find(c => c.id === selectedCampaignId) || campaigns[0];

  const triggerLaunch = async (campaignId: string) => {
    if (isReadOnly) return;
    await onLaunchCampaign(campaignId);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 flex flex-col gap-6" id="campaigns-root">
      
      {/* Intro */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-sans font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-indigo-600" />
            Bulk Broadcasts & Asynchronous Campaign Queue
          </h2>
          <p className="text-sm text-gray-500">
            Dispatch compliant corporate newsletters, legal alerts, or tax schedule reminders to large contact cohorts.
          </p>
        </div>
        
        {isReadOnly && (
          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 text-xs px-3 py-1.5 rounded-lg border border-amber-250">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Access Restrict: Only <strong>Administrator</strong> can send bulk broadcasts.</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column: Campaigns List */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          <span className="text-[10.5px] font-bold text-gray-400 font-mono tracking-widest uppercase">Target Broadcasts Dossier</span>
          
          <div className="flex flex-col gap-3">
            {campaigns.map((camp) => {
              const isSelected = camp.id === selectedCampaignId;
              const activeJob = queueJobs.find(j => j.payload?.campaignId === camp.id && j.status !== "completed");
              
              return (
                <div
                  key={camp.id}
                  onClick={() => setSelectedCampaignId(camp.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    isSelected ? "bg-indigo-50/40 border-indigo-200 shadow-sm" : "bg-white border-slate-200/80 hover:bg-slate-50/50"
                  }`}
                  id={`camp-card-${camp.id}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-sans font-bold text-sm text-slate-900">{camp.name}</h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span className="bg-slate-100 text-slate-800 px-1.5 rounded font-bold uppercase tracking-tight text-[9px] font-mono border border-slate-200">
                          {camp.channel}
                        </span>
                        <span>Template: <strong className="text-slate-700">{camp.templateName}</strong></span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 font-mono">
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded uppercase font-medium ${
                        camp.status === "Completed" ? "bg-green-50 text-green-700 border border-green-200" :
                        camp.status === "Sending" ? "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse" :
                        "bg-slate-100 text-slate-400"
                      }`}>
                        {camp.status}
                      </span>
                      {camp.scheduledAt && <span className="text-[10px] text-indigo-600 font-bold">Sched: {new Date(camp.scheduledAt).toLocaleDateString()}</span>}
                    </div>
                  </div>

                  {/* Dispatch progress indicators */}
                  {camp.status === "Completed" ? (
                    <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 grid grid-cols-4 gap-2 text-center text-xs mt-1">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-mono">Sent Ratio</span>
                        <strong className="text-slate-900">{camp.sentCount} / {camp.totalContacts}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-mono">Open Rate</span>
                        <strong className="text-slate-900">{Math.floor((camp.openCount / camp.totalContacts) * 100)}%</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-mono">Click Ratio</span>
                        <strong className="text-slate-900">{Math.floor((camp.clickCount / camp.totalContacts) * 100)}%</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-mono">ROI Attribution</span>
                        <strong className="text-green-700 font-bold">${camp.roiValue}</strong>
                      </div>
                    </div>
                  ) : camp.status === "Sending" ? (
                    <div className="flex flex-col gap-1.5 mt-2 bg-amber-50/20 p-3 rounded-lg border border-amber-200/30">
                      <div className="flex justify-between items-center text-[10px] text-amber-700 font-bold font-mono">
                        <span className="flex items-center gap-1">
                          <Loader className="w-3" />
                          MESSAGES FLUIDLY PACKING: {camp.sentCount} SENT
                        </span>
                        <span>{Math.floor((camp.sentCount / camp.totalContacts) * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(camp.sentCount / camp.totalContacts) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : null}

                  {camp.status === "Draft" && !isReadOnly && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerLaunch(camp.id);
                      }}
                      className="mt-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all border border-indigo-700"
                      id={`launch-btn-${camp.id}`}
                    >
                      <Play className="w-3.5 h-3.5 text-white fill-white" />
                      <span>Launch Asynchronous Broadcast</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Async Queue & Jobs Status Dashboard */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          <span className="text-[10.5px] font-bold text-gray-400 font-mono tracking-widest uppercase">System Queue Background Workers</span>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col gap-4 shadow-inner" id="campaign-worker-panel">
            <div className="border-b border-gray-200/60 pb-2">
              <h4 className="font-serif text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-gray-600" />
                Active Queue Jobs ({queueJobs.length})
              </h4>
              <p className="text-[10px] text-gray-500 mt-1">
                Edge cache processes {edgeCachingEnabled ? "instantly (300ms intervals)" : "via throttled standards (1500ms API restricts)"}.
              </p>
            </div>

            {queueJobs.length === 0 ? (
              <div className="bg-white p-8 rounded-lg border border-dashed border-slate-200 text-center text-slate-400 flex flex-col items-center justify-center gap-1.5">
                <Clock className="w-6 h-6 text-slate-300" />
                <span className="text-xs">Queue is currently idle.</span>
                <span className="text-[10px]">No asynchronous bulk transacts are running.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto">
                {queueJobs.map((job) => (
                  <div key={job.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-xs flex flex-col gap-1.5" id={`queue-job-${job.id}`}>
                    <div className="flex justify-between items-center bg-slate-50 p-1.5 px-2.5 rounded font-mono text-[9px]">
                      <span className="font-bold text-slate-800">JOBID: #{job.id}</span>
                      <span className={`px-1.5 rounded uppercase font-bold text-[8px] ${
                        job.status === "completed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700 animate-pulse"
                      }`}>{job.status}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-600">
                        <span>Task Type: <strong>Bulk campaign send</strong></span>
                        <span className="font-bold">{job.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${job.status === "completed" ? "bg-green-500" : "bg-amber-500"}`} 
                          style={{ width: `${job.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 italic">
                      Payload details: Campaign ID {job.payload?.campaignId} dispatched to {job.payload?.total} targets.
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            {/* Visual template guide showing custom branding */}
            <div className="bg-white p-3.5 rounded-xl border border-indigo-150 flex flex-col gap-1">
              <span className="text-[9.5px] text-slate-450 font-mono tracking-widest uppercase font-bold">Active Template Snippet</span>
              <div className="flex gap-2 items-start text-xs border border-slate-100 p-2 rounded bg-slate-50/45">
                <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <p className="font-bold text-gray-900 leading-none">Accounting Urgency Alert</p>
                  <p className="text-gray-500 mt-1 text-[10.5px] leading-tight">
                    "Dear Client, Company Docx reminds you that your tax filing date approaches. Contact your assigned accountant at docx.link/consult to lock in review slots."
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
