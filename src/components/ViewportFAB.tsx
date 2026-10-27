import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Plus, 
  Users, 
  MessageSquare, 
  Megaphone, 
  X, 
  RefreshCw, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Mail, 
  Tag, 
  Briefcase, 
  CircleDot
} from "lucide-react";
import { Lead, Campaign } from "../types";

interface ViewportFABProps {
  leads: Lead[];
  campaigns: Campaign[];
  onAddLead: (leadData: Partial<Lead>) => Promise<void>;
  onSendMessage: (leadId: string, content: string, channel: 'whatsapp' | 'sms' | 'email') => Promise<void>;
  onLaunchCampaign: (campaignId: string) => Promise<void>;
  isViewportHovered: boolean;
}

export default function ViewportFAB({
  leads,
  campaigns,
  onAddLead,
  onSendMessage,
  onLaunchCampaign,
  isViewportHovered
}: ViewportFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'add_lead' | 'draft_msg' | 'trigger_campaign' | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Modal 1: Create New Lead States
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadType, setLeadType] = useState<'law' | 'accounting'>('law');
  const [leadNotes, setLeadNotes] = useState("");
  const [leadKeyword, setLeadKeyword] = useState("");
  const [leadTemperature, setLeadTemperature] = useState<'Hot' | 'Warm' | 'Cold'>('Warm');
  const [leadFee, setLeadFee] = useState<'Unpaid' | 'Paid' | 'Waived'>('Unpaid');
  const [submittingLead, setSubmittingLead] = useState(false);

  // Modal 2: Draft Message States
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [msgChannel, setMsgChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [msgContent, setMsgContent] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);

  // Modal 3: Trigger Campaign States
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [triggeringCampaign, setTriggeringCampaign] = useState(false);

  // Auto-fill selected lead id if leads list changes
  useEffect(() => {
    if (leads.length > 0 && !selectedLeadId) {
      setSelectedLeadId(leads[0].id);
    }
  }, [leads, selectedLeadId]);

  // Auto-fill selected campaign id if list changes
  useEffect(() => {
    if (campaigns.length > 0 && !selectedCampaignId) {
      setSelectedCampaignId(campaigns[0].id);
    }
  }, [campaigns, selectedCampaignId]);

  // Trigger temporary success notification
  const triggerSuccess = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Trigger temporary error notification
  const triggerError = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 4000);
  };

  // Submit operations
  const handleCreateLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadPhone.trim() || !leadKeyword.trim()) {
      triggerError("Please fill out complete Name, Phone number and Keyword fields.");
      return;
    }
    setSubmittingLead(true);
    try {
      await onAddLead({
        name: leadName.trim(),
        phone: leadPhone.trim(),
        email: leadEmail.trim() || `${leadName.trim().toLowerCase().replace(/\s+/g, '')}@corp-docx.com`,
        type: leadType,
        notes: leadNotes.trim(),
        score: leadTemperature === 'Hot' ? 85 : leadTemperature === 'Warm' ? 50 : 20,
        temperature: leadTemperature,
        consultationFee: leadFee,
        keyword: leadKeyword.trim()
      });

      triggerSuccess(`Lead "${leadName}" has been successfully added to the CRM pipeline.`);
      
      // Reset Form fields
      setLeadName("");
      setLeadPhone("");
      setLeadEmail("");
      setLeadNotes("");
      setLeadKeyword("");
      setLeadTemperature("Warm");
      setLeadFee("Unpaid");
      setActiveModal(null);
    } catch (err) {
      triggerError("Could not submit the lead to database backend. Please verify your connection.");
    } finally {
      setSubmittingLead(false);
    }
  };

  const handleFetchAiSuggestions = async () => {
    if (!selectedLeadId) {
      triggerError("Please select a valid Lead from the dropdown client list.");
      return;
    }
    setLoadingSuggestions(true);
    setAiSuggestions([]);
    try {
      const response = await fetch("/api/gemini/suggest-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedLeadId,
          customContext: "Draft a dynamic introductory welcome message. Mention direct booking at docx.link/consult or request pending audit document details."
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.options && data.options.length > 0) {
          setAiSuggestions(data.options);
        } else {
          throw new Error("Empty AI suggestions response");
        }
      } else {
        throw new Error();
      }
    } catch (err) {
      // Setup beautiful high-fidelity local recommendations
      const target = leads.find(l => l.id === selectedLeadId);
      const name = target ? target.name : "Valued Customer";
      const divName = target?.type === "law" ? "Corporate Law Department" : "Tax & Auditing Division";
      setAiSuggestions([
        `Dear ${name}, thank you for registering with Company Docx. We have mapped your docket inside our ${divName}. Please lock in your expert appointment Slot: docx.link/consult`,
        `Hi ${name}, this is Sarah Jenkins from the Docx team. Regarding your inquiry, we can help finalize registration files in 3 business days! Please let us know if you can attach bank records.`,
        `Greetings ${name}! Our tax team reviewed your file checklist. We can Comp/Waive your initial consulting fee if you arrange onboarding details via: docx.link/consult`
      ]);
      triggerSuccess("Activated fallback suggestions engine successfully!");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSendMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId) {
      triggerError("Please specify a recipient lead.");
      return;
    }
    if (!msgContent.trim()) {
      triggerError("Please compose or pick a suggested message template first.");
      return;
    }
    setSendingMsg(true);
    try {
      await onSendMessage(selectedLeadId, msgContent.trim(), msgChannel);
      triggerSuccess(`Message drafted & delivered immediately via ${msgChannel.toUpperCase()} channels!`);
      setMsgContent("");
      setAiSuggestions([]);
      setActiveModal(null);
    } catch (err) {
      triggerError("Message transfer protocol failed.");
    } finally {
      setSendingMsg(false);
    }
  };

  const handleTriggerCampaignSubmit = async () => {
    if (!selectedCampaignId) {
      triggerError("Please select an active broadcast Campaign.");
      return;
    }
    setTriggeringCampaign(true);
    try {
      await onLaunchCampaign(selectedCampaignId);
      const camp = campaigns.find(c => c.id === selectedCampaignId);
      triggerSuccess(`Broadcast Campaign "${camp ? camp.name : 'Bulk'}" has been queued for instant automated sending!`);
      setActiveModal(null);
    } catch (err) {
      triggerError("Failed triggering campaign dispatch.");
    } finally {
      setTriggeringCampaign(false);
    }
  };

  // Determine if the FAB menu itself should show up in full visibility
  // If the viewport is hovered, OR the menu is open, OR a subordinate modal is active, the FAB remains solid & visible
  const isFabVisible = isViewportHovered || isOpen || activeModal !== null;

  const currentCampSelected = campaigns.find(c => c.id === selectedCampaignId);

  return (
    <>
      {/* 1. Global Temporary Success/Error Toasts */}
      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-6 z-[600] bg-emerald-900 border border-emerald-500 text-white p-4 rounded-xl shadow-xl flex items-center gap-3 max-w-sm text-xs font-sans"
            id="fab-success-toast"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold">Operation Successful</p>
              <p className="text-emerald-200 mt-0.5">{successToast}</p>
            </div>
            <button onClick={() => setSuccessToast(null)} className="text-emerald-400 hover:text-white ml-2 font-bold select-none text-sm leading-none">×</button>
          </motion.div>
        )}

        {errorToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-6 z-[600] bg-red-955 bg-red-950 border border-red-500 text-white p-4 rounded-xl shadow-xl flex items-center gap-3 max-w-sm text-xs font-sans"
            id="fab-error-toast"
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="font-bold">Constraint Refused</p>
              <p className="text-red-200 mt-0.5">{errorToast}</p>
            </div>
            <button onClick={() => setErrorToast(null)} className="text-red-400 hover:text-white ml-2 font-bold select-none text-sm leading-none">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Floating Action Button Structure (Bottom-Right corner) */}
      <div 
        className="fixed bottom-6 right-6 z-[450] flex flex-col items-end gap-3 font-sans"
        onMouseLeave={() => setIsOpen(false)}
        id="docxflow-viewport-fab"
      >
        <AnimatePresence>
          {isFabVisible && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 15 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-end gap-3"
            >
              {/* Expandable Shortcut Options Panel */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.9 }}
                    transition={{ duration: 0.18 }}
                    className="flex flex-col gap-2 bg-slate-900 border border-slate-800 p-2.5 rounded-2xl shadow-2xl w-52 mb-1"
                    id="fab-shortcuts-list"
                  >
                    <div className="px-2 pb-1.5 border-b border-slate-800 text-center">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold font-mono">Quick Workspace Actions</p>
                    </div>

                    {/* Shortcut 1: Create New Lead */}
                    <button
                      onClick={() => {
                        setActiveModal('add_lead');
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-3 px-3 py-2 text-left rounded-xl text-slate-200 hover:text-white hover:bg-slate-800 transition-all text-xs font-semibold outline-none group"
                      id="shortcut-btn-create-lead"
                    >
                      <span className="p-1.5 bg-blue-500/15 text-blue-400 rounded-lg group-hover:scale-105 transition-transform">
                        <Users className="w-4 h-4" />
                      </span>
                      <span>Create New Lead</span>
                    </button>

                    {/* Shortcut 2: Draft Message */}
                    <button
                      onClick={() => {
                        setActiveModal('draft_msg');
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-3 px-3 py-2 text-left rounded-xl text-slate-200 hover:text-white hover:bg-slate-800 transition-all text-xs font-semibold outline-none group"
                      id="shortcut-btn-draft-message"
                    >
                      <span className="p-1.5 bg-emerald-500/15 text-emerald-400 rounded-lg group-hover:scale-105 transition-transform">
                        <MessageSquare className="w-4 h-4" />
                      </span>
                      <span>Draft Message</span>
                    </button>

                    {/* Shortcut 3: Trigger Campaign */}
                    <button
                      onClick={() => {
                        setActiveModal('trigger_campaign');
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-3 px-3 py-2 text-left rounded-xl text-slate-200 hover:text-white hover:bg-slate-800 transition-all text-xs font-semibold outline-none group"
                      id="shortcut-btn-trigger-campaign"
                    >
                      <span className="p-1.5 bg-amber-500/15 text-amber-400 rounded-lg group-hover:scale-105 transition-transform">
                        <Megaphone className="w-4 h-4" />
                      </span>
                      <span>Trigger Campaign</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Core Hotkey Circular FAB Trigger Button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={() => setIsOpen(true)}
                className={`relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95 outline-none focus:ring-4 focus:ring-indigo-500/50 ${
                  isOpen 
                    ? "bg-slate-950 border border-slate-850 rotate-90" 
                    : "bg-indigo-600 border border-indigo-500 hover:bg-indigo-750"
                }`}
                id="fab-primary-circular-trigger"
                title="Workspace Actions Shortcuts"
              >
                {isOpen ? (
                  <X className="w-6 h-6 text-slate-300" />
                ) : (
                  <div className="relative">
                    <Plus className="w-6 h-6 transition-transform" />
                    <Sparkles className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 text-amber-300" />
                  </div>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. MODAL OVERLAY PORTALS */}
      <AnimatePresence>
        {/* Modal A: Create New Lead Client Form */}
        {activeModal === 'add_lead' && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-[550] overflow-y-auto" id="modal-fab-add-lead">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-md w-full overflow-hidden flex flex-col font-sans"
            >
              {/* Header */}
              <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Add Client to CRM Pipeline</h4>
                    <p className="text-[10px] text-slate-400 font-mono">Workspace Quick Intake Module</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="text-slate-400 hover:text-white font-bold select-none outline-none focus:ring-1 focus:ring-slate-500 rounded p-1"
                >
                  ✕
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateLeadSubmit} className="p-5 flex flex-col gap-4 text-xs overflow-y-auto max-h-[450px]">
                {/* Full Name */}
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">Client Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rachel Adams"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-800 font-sans font-medium"
                  />
                </div>

                {/* Grid layout for Phone & Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+91 or +1 number"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-800 font-sans"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> Email address
                    </label>
                    <input
                      type="email"
                      placeholder="adams@corp.com"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-800 font-sans"
                    />
                  </div>
                </div>

                {/* Division & Category Keyword */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700 flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Practice Division *
                    </label>
                    <select
                      value={leadType}
                      onChange={(e) => setLeadType(e.target.value as any)}
                      className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-800 font-sans font-semibold"
                    >
                      <option value="law">⚖️ Corporate Law</option>
                      <option value="accounting">🧾 Tax & Audit</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400" /> Intake Keyword *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. audit or trademark"
                      value={leadKeyword}
                      onChange={(e) => setLeadKeyword(e.target.value)}
                      className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-800 font-sans font-medium"
                    />
                  </div>
                </div>

                {/* Temparature & Fee Code Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700">Dynamic Score Vibe</label>
                    <select
                      value={leadTemperature}
                      onChange={(e) => setLeadTemperature(e.target.value as any)}
                      className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-800 font-sans font-semibold"
                    >
                      <option value="Hot">🔥 Hot Prospect</option>
                      <option value="Warm">☀️ Warm Liaison</option>
                      <option value="Cold">❄️ Cold Lead</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-slate-700">Initial Fee status</label>
                    <select
                      value={leadFee}
                      onChange={(e) => setLeadFee(e.target.value as any)}
                      className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-800 font-sans font-semibold"
                    >
                      <option value="Unpaid">❌ Unpaid / General Invoice</option>
                      <option value="Paid">✅ Paid upfront</option>
                      <option value="Waived">🎁 Waived (Comped)</option>
                    </select>
                  </div>
                </div>

                {/* Intake Notes */}
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">Intake Dossier Notes</label>
                  <textarea
                    placeholder="Explain full corporate context, urgent tax files, legal restructurings requested..."
                    rows={3}
                    value={leadNotes}
                    onChange={(e) => setLeadNotes(e.target.value)}
                    className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-800 leading-relaxed font-sans"
                  />
                </div>

                {/* Submit Panel */}
                <div className="flex justify-end gap-2.5 mt-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 hover:bg-slate-100 text-slate-600 rounded-lg text-xs transition-all font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingLead}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs rounded-lg transition-all shadow-md flex items-center justify-center gap-1"
                  >
                    {submittingLead ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Registering...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Lead NOW</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal B: Draft & Deliver Custom Message with Gemini Assistant Suggestions */}
        {activeModal === 'draft_msg' && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-[550] overflow-y-auto" id="modal-fab-draft-message">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-md w-full overflow-hidden flex flex-col font-sans"
            >
              {/* Header */}
              <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Send Team Client Message</h4>
                    <p className="text-[10px] text-slate-400 font-mono">Workspace Direct Messaging</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setActiveModal(null);
                    setAiSuggestions([]);
                  }}
                  className="text-slate-400 hover:text-white font-bold select-none outline-none focus:ring-1 focus:ring-slate-500 rounded p-1"
                >
                  ✕
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSendMessageSubmit} className="p-5 flex flex-col gap-4 text-xs overflow-y-auto max-h-[460px]">
                {/* Select Recipient Lead */}
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">Target CRM Client Recipient *</label>
                  {leads.length === 0 ? (
                    <div className="text-red-500 font-semibold p-2 border border-red-200 rounded-lg bg-red-50">
                      ⚠️ No leads exist in the system. Create a lead first.
                    </div>
                  ) : (
                    <select
                      value={selectedLeadId}
                      required
                      onChange={(e) => {
                        setSelectedLeadId(e.target.value);
                        setAiSuggestions([]);
                      }}
                      className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-800 font-sans font-medium"
                    >
                      {leads.map(l => (
                        <option key={l.id} value={l.id}>
                          👤 {l.name} ({l.type.toUpperCase()} • Keyword: {l.keyword || 'compliance'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Channel Toggle */}
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">Message Delivery Protocol</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['whatsapp', 'sms', 'email'] as const).map(channel => (
                      <button
                        key={channel}
                        type="button"
                        onClick={() => setMsgChannel(channel)}
                        className={`py-2 px-3 border rounded-lg font-bold text-center transition-all ${
                          msgChannel === channel 
                            ? "bg-indigo-650 text-white border-indigo-600 shadow"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {channel === 'whatsapp' ? '💬 WhatsApp' : channel === 'sms' ? '📱 SMS' : '✉️ Email'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI suggested pre-draft blocks */}
                <div className="flex flex-col gap-1.5 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-indigo-950 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" /> GEMINI AI RESPONSE GENERATOR
                    </span>
                    <button
                      type="button"
                      disabled={loadingSuggestions}
                      onClick={handleFetchAiSuggestions}
                      className="text-indigo-700 hover:text-indigo-900 hover:underline font-extrabold flex items-center gap-0.5"
                    >
                      {loadingSuggestions ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Get Pre-Drafts'}
                    </button>
                  </div>

                  {aiSuggestions.length > 0 ? (
                    <div className="flex flex-col gap-2 mt-2">
                      {aiSuggestions.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setMsgContent(opt)}
                          className="bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 p-2.5 rounded-lg text-left text-[11px] text-slate-800 font-sans shadow-sm transition-all"
                        >
                          <span className="font-bold text-slate-400 mr-1 font-mono">Template {i+1}:</span> {opt}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 italic mt-0.5">Click "Get Pre-Drafts" to load high-fidelity custom replies matched for this client's specific legal or tax dossier.</p>
                  )}
                </div>

                {/* Textbox Message content */}
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-slate-700">Draft Content Payload *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Enter message dispatch details here..."
                    value={msgContent}
                    onChange={(e) => setMsgContent(e.target.value)}
                    className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-800 leading-relaxed font-mono text-[11px]"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2.5 mt-1 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModal(null);
                      setAiSuggestions([]);
                    }}
                    className="px-4 py-2 hover:bg-slate-100 text-slate-600 rounded-lg text-xs transition-all font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingMsg || !selectedLeadId}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    {sendingMsg ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Transmitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Dispatch Message</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal C: Trigger Campaign Broadcast */}
        {activeModal === 'trigger_campaign' && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-[550] overflow-y-auto" id="modal-fab-trigger-campaign">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-md w-full overflow-hidden flex flex-col font-sans"
            >
              {/* Header */}
              <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Bulk Trigger Broadcast Campaign</h4>
                    <p className="text-[10px] text-slate-400 font-mono">Workspace Bulk Outbox Engine</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="text-slate-400 hover:text-white font-bold select-none outline-none focus:ring-1 focus:ring-slate-500 rounded p-1"
                >
                  ✕
                </button>
              </div>

              {/* Form Content */}
              <div className="p-5 flex flex-col gap-4 text-xs">
                {campaigns.length === 0 ? (
                  <div className="text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200 font-semibold leading-relaxed">
                    ⚠️ No campaigns have been configured inside the database. Build an active campaign first from the Campaign Broadcast tab.
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {/* select campaign list */}
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-slate-700">Select Campaign to Queue *</label>
                      <select
                        value={selectedCampaignId}
                        onChange={(e) => setSelectedCampaignId(e.target.value)}
                        className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-800 font-sans font-semibold text-[13px]"
                      >
                        {campaigns.map(c => (
                          <option key={c.id} value={c.id}>
                            📢 {c.name} ({c.channel.toUpperCase()} • status: {c.status})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* selected campaign overview metadata */}
                    {currentCampSelected && (
                      <div className="bg-slate-50 border border-slate-250 p-4 rounded-xl flex flex-col gap-2.5">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                          <span className="font-bold text-slate-800 text-[13px]">{currentCampSelected.name}</span>
                          <span className="bg-blue-100 text-blue-800 text-[9px] uppercase tracking-wide font-extrabold px-2 py-0.5 rounded-md">
                            {currentCampSelected.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500">
                          <p>👥 Targeted: <strong>{currentCampSelected.totalContacts} Contacts</strong></p>
                          <p>✉️ Channel: <strong>{currentCampSelected.channel.toUpperCase()}</strong></p>
                          <p>📋 Template: <strong>{currentCampSelected.templateName}</strong></p>
                          <p>📅 Created: <strong>{new Date(currentCampSelected.createdAt).toLocaleDateString()}</strong></p>
                        </div>

                        {/* template warning */}
                        <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-900 leading-normal flex items-start gap-1.5">
                          <CircleDot className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>
                            Triggering this campaign immediately pushes dynamic broadcast blocks into the system queue buffer, contacting all matching CRM leads!
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit button bar */}
                <div className="flex justify-end gap-2.5 mt-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 hover:bg-slate-100 text-slate-600 rounded-lg text-xs transition-all font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={triggeringCampaign || !selectedCampaignId}
                    onClick={handleTriggerCampaignSubmit}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-850 text-amber-400 hover:text-amber-300 font-bold text-xs rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    {triggeringCampaign ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing Bulk Send...</span>
                      </>
                    ) : (
                      <>
                        <Megaphone className="w-3.5 h-3.5" />
                        <span>Launch Campaign Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
