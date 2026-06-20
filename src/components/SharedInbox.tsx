import React, { useState } from "react";
import { Message, Lead, UserRole } from "../types";
import { 
  Send, 
  Sparkles, 
  MessageSquare, 
  Phone, 
  Mail, 
  Clock, 
  CheckCheck, 
  User, 
  ArrowRight, 
  ShieldAlert,
  Loader,
  Moon,
  Sun,
  Settings,
  Sliders,
  RefreshCw
} from "lucide-react";

interface SharedInboxProps {
  currentRole: UserRole;
  leads: Lead[];
  messages: Message[];
  onSendMessage: (leadId: string, content: string, channel: 'whatsapp' | 'sms' | 'email') => Promise<void>;
  selectedLeadId: string;
  setSelectedLeadId: (id: string) => void;
  onUpdateLeadField: (leadId: string, updates: Partial<Lead>) => Promise<void>;
  employees?: any[];
}

export default function SharedInbox({
  currentRole,
  leads,
  messages,
  onSendMessage,
  selectedLeadId,
  setSelectedLeadId,
  onUpdateLeadField,
  employees = []
}: SharedInboxProps) {
  const [inputText, setInputText] = useState("");
  const [chatChannel, setChatChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [customReplyPrompt, setCustomReplyPrompt] = useState("");

  // Overnight AI settings
  const [overnightSettings, setOvernightSettings] = useState({
    enabled: true,
    startHour: 20,
    endHour: 9,
    forceActiveForTesting: true,
    aiName: "Arthur (Docx Overnight AI)",
    systemPrompt: "You are a professional, highly helpful corporate counsel and accountant named Arthur, replying on behalf of Company Docx during off-hours (between 8 PM and 9 AM). Assure the client their message has been logged, provide helpful and authoritative legal/tax advice answering their message, and offer them to secure a fast-track slot at docx.link/consult."
  });
  const [isSavingOvernight, setIsSavingOvernight] = useState(false);
  const [overnightSaveStatus, setOvernightSaveStatus] = useState<string | null>(null);
  const [mockSender, setMockSender] = useState<'agent' | 'customer'>('agent');

  const activeLead = leads.find(l => l.id === selectedLeadId) || leads[0];
  const activeChatMessages = messages.filter(m => m.leadId === (activeLead?.id || ""));

  // Check role restrictions
  const isReadOnly = currentRole === "viewer";

  // Load CRM Integration Settings from Server on Mount
  React.useEffect(() => {
    const fetchOvernightSettings = async () => {
      try {
        const res = await fetch("/api/overnight-ai/settings");
        if (res.ok) {
          const data = await res.json();
          setOvernightSettings(data);
        }
      } catch (err) {
        console.error("Failed to fetch overnight AI settings", err);
      }
    };
    fetchOvernightSettings();
  }, []);

  const handleSaveOvernightSettings = async () => {
    setIsSavingOvernight(true);
    setOvernightSaveStatus(null);
    try {
      const res = await fetch("/api/overnight-ai/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(overnightSettings)
      });
      if (res.ok) {
        const data = await res.json();
        setOvernightSettings(data.settings);
        setOvernightSaveStatus("Overnight settings saved & active!");
        setTimeout(() => setOvernightSaveStatus(null), 3500);
      }
    } catch (err) {
      setOvernightSaveStatus("Error: Could not save overnight configs.");
    } finally {
      setIsSavingOvernight(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!inputText.trim()) return;

    if (mockSender === 'customer') {
      try {
        await fetch("/api/message/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId: activeLead.id,
            content: inputText.trim(),
            channel: chatChannel,
            sender: "customer"
          })
        });
        setInputText("");
      } catch (err) {
        console.error("Simulation error", err);
      }
    } else {
      await onSendMessage(activeLead.id, inputText.trim(), chatChannel);
      setInputText("");
    }
    // Clear out suggestion pool
    setSuggestedReplies([]);
  };

  // Trigger Gemini AI Reply Suggestions
  const fetchAISuggestions = async () => {
    if (!activeLead) return;
    setLoadingSuggestions(true);
    setSuggestedReplies([]);
    
    try {
      const res = await fetch("/api/gemini/suggest-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: activeLead.id,
          customContext: customReplyPrompt.trim() || undefined
        })
      });
      const data = await res.json();
      if (data.options) {
        setSuggestedReplies(data.options);
      }
    } catch (err) {
      console.error("Failed to suggest replies", err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const selectSuggestion = (text: string) => {
    setInputText(text);
  };

  return (
    <div className="flex flex-col gap-6" id="shared-inbox-wrapper">
      <div className="grid grid-cols-1 lg:grid-cols-12 bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden min-h-[600px]" id="shared-inbox-root">
      {/* 1. Left Column: Lead Conversations Index */}
      <div className="lg:col-span-4 border-r border-slate-100 flex flex-col bg-slate-50/50" id="inbox-index">
        <div className="p-4 bg-white border-b border-slate-100">
          <h3 className="font-sans font-bold text-slate-900 text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            Shared Team Inbox
          </h3>
          <p className="text-xs text-slate-400 mt-1">Multi-agent unassigned / active queues</p>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[500px]">
          {leads.map((lead) => {
            const isSelected = lead.id === activeLead?.id;
            const lastMsg = messages.filter(m => m.leadId === lead.id).slice(-1)[0];
            
            return (
              <button
                key={lead.id}
                onClick={() => {
                  setSelectedLeadId(lead.id);
                  setSuggestedReplies([]);
                }}
                className={`w-full text-left p-4 border-b border-slate-100/70 transition-all flex flex-col gap-1.5 ${
                  isSelected ? "bg-indigo-50/40 border-l-4 border-l-indigo-600 bg-white" : "hover:bg-slate-100/40"
                }`}
                id={`lead-tab-${lead.id}`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-sans font-bold text-sm text-gray-900">{lead.name}</span>
                  <div className="flex items-center gap-1">
                    {/* Platform Tag */}
                    <span className="text-[9px] uppercase tracking-wider font-mono font-bold bg-[#111e2f]/10 text-[#111e2f] px-1 rounded">
                      {lead.type}
                    </span>
                    {/* Temperature Indicator */}
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      lead.temperature === "Hot" 
                        ? "bg-red-50 text-red-600 border border-red-250/20" 
                        : lead.temperature === "Warm"
                        ? "bg-amber-50 text-amber-600 border border-amber-250/20"
                        : "bg-blue-50 text-blue-600"
                    }`}>
                      {lead.temperature}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 truncate w-full">
                  {lastMsg ? lastMsg.content : lead.notes}
                </p>

                <div className="flex justify-between items-center mt-1 text-[10px]">
                  <span className="text-gray-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {new Date(lead.lastInteractionAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-slate-500 font-medium">
                    Assignee: <span className="text-indigo-600 font-bold">{lead.assignedAgent}</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Middle Column: Interactive Thread View */}
      <div className="lg:col-span-5 flex flex-col bg-white" id="inbox-conversation-thread">
        {activeLead ? (
          <>
            {/* Header detail */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h4 className="font-sans font-bold text-slate-900 text-sm flex items-center gap-2">
                  {activeLead.name}
                  <span className="font-mono text-xs text-slate-400 font-normal">{activeLead.phone}</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 italic truncate max-w-sm">
                  CRM Context: {activeLead.notes}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] text-slate-400 font-mono">Consultation status:</span>
                <select
                  value={activeLead.consultationFee}
                  disabled={isReadOnly}
                  onChange={(e) => onUpdateLeadField(activeLead.id, { consultationFee: e.target.value as any })}
                  className="bg-white text-xs border border-slate-200 rounded px-1 text-indigo-600 font-bold outline-none"
                  id={`consultation-fee-dropdown-${activeLead.id}`}
                >
                  <option value="Unpaid">Invoice Sent (Unpaid)</option>
                  <option value="Paid">💳 Consultation PAID</option>
                  <option value="Waived">Waived/Comped</option>
                </select>
              </div>
            </div>

            {/* Conversation Feed */}
            <div className="flex-1 p-4 overflow-y-auto max-h-[380px] bg-slate-50 flex flex-col gap-3 min-h-[350px]">
              {activeChatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 py-12">
                  <MessageSquare className="w-8 h-8 text-gray-300" />
                  <p className="text-xs">No active chat transactions found. Send a message to open conversation.</p>
                </div>
              ) : (
                activeChatMessages.map((msg) => {
                  const isAgent = msg.sender === "agent";
                  const isBot = msg.sender === "bot";
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[85%] ${
                        isAgent 
                          ? "self-end items-end" 
                          : isBot 
                          ? "self-start items-start" 
                          : "self-start items-start"
                      }`}
                      id={`chat-message-${msg.id}`}
                    >
                      {/* Name of sender */}
                      <span className="text-[10px] text-gray-400 mb-0.5 font-mono">
                        {isAgent ? `Agent (${msg.agentName || "You"})` : isBot ? "DocxFlow AI Autopilot" : "Client"}
                      </span>

                      <div className={`p-3 rounded-lg text-xs leading-relaxed shadow-sm ${
                        isAgent
                          ? "bg-slate-900 text-white rounded-tr-none border border-slate-800"
                          : isBot
                          ? "bg-indigo-50 text-indigo-950 rounded-tl-none border border-indigo-100"
                          : "bg-white text-slate-800 rounded-tl-none border border-slate-200"
                      }`}>
                        <p>{msg.content}</p>
                      </div>

                      {/* Msg Status & latency metrics */}
                      <div className="flex items-center gap-1.5 mt-1 text-[9px] text-slate-400 font-mono">
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span className={msg.latencyMs && msg.latencyMs < 50 ? "text-green-500 font-bold" : "text-slate-400"}>
                          latency: {msg.latencyMs || 10}ms
                        </span>
                        {msg.wasProcessedAsynchronously && (
                          <>
                            <span>•</span>
                            <span className="bg-blue-50 text-blue-500 font-bold px-1 rounded scale-90">ASYNC</span>
                          </>
                        )}
                        {isAgent && <CheckCheck className="w-3 h-3 text-indigo-500" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Locked Viewer UI notification or standard send box */}
            {isReadOnly ? (
              <div className="p-4 bg-amber-50 border-t border-amber-250 flex items-center gap-1.5 text-amber-800 text-xs text-center justify-center">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>You are currently in <strong>Viewer mode</strong>. Standard sending has been locked. Upgrade simulator role to Agent or Admin to reply.</span>
              </div>
            ) : (
              <form onSubmit={handleSend} className="p-4 border-t border-slate-100 flex flex-col gap-2 bg-white">
                <div className="flex gap-2">
                  <select
                    value={chatChannel}
                    onChange={(e) => setChatChannel(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 text-xs rounded px-2 outline-none py-1.5 text-slate-600"
                    id="message-channel-select"
                  >
                    <option value="whatsapp">🟢 WhatsApp Business</option>
                    <option value="sms">📱 Standard Cellular SMS</option>
                  </select>

                  <select
                    value={activeLead.assignedAgent}
                    onChange={(e) => onUpdateLeadField(activeLead.id, { assignedAgent: e.target.value })}
                    className="bg-slate-50 border border-slate-200 text-xs rounded px-2 outline-none py-1.5 text-indigo-600 font-bold"
                    id="message-assignee-select"
                  >
                    <option value="Unassigned">Assign: Unassigned</option>
                    {employees && employees.length > 0 ? (
                      employees.map(emp => (
                        <option key={emp.id} value={emp.name}>Assign: {emp.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="Arthur Pendelton">Assign: Arthur Pendelton</option>
                        <option value="Sarah Jenkins">Assign: Sarah Jenkins</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Sender Role Toggle for simulations */}
                <div className="flex items-center justify-between border border-slate-100 rounded-lg p-1 bg-slate-50 text-[11px] h-9 gap-1.5">
                  <span className="text-[9.5px] text-slate-500 font-mono font-bold pl-1 uppercase">Send simulator perspective:</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setMockSender('agent')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 ${
                        mockSender === 'agent'
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <User className="w-3 h-3" />
                      <span>👥 Staff Agent</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMockSender('customer')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 ${
                        mockSender === 'customer'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200 shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Moon className="w-3 h-3 text-amber-600 animate-pulse" />
                      <span>👤 Client Enquiry</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      mockSender === 'customer'
                        ? `Simulate incoming nocturnal client inquiry from ${activeLead.name}...`
                        : `Compose ${chatChannel.toUpperCase()} reply to ${activeLead.name}...`
                    }
                    className="flex-1 bg-slate-50 border border-slate-205 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:bg-white outline-none"
                    id="message-reply-input"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg border border-indigo-700 transition-all shadow-sm"
                    id="message-submit-btn"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-gray-400">
            <Loader className="w-8 h-8 animate-spin" />
            <p className="text-xs mt-2">Loading active corporate threads...</p>
          </div>
        )}
      </div>

      {/* 3. Right Column: Gemini smart agent copilot & CRM lookup */}
      <div className="lg:col-span-3 border-l border-slate-100 p-4 bg-slate-50/50 flex flex-col gap-4" id="inbox-assistant-sidebar">
        <div>
          <h4 className="font-sans font-bold text-slate-900 text-sm flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Gemini Agent Copilot
          </h4>
          <p className="text-[10px] text-slate-400 mt-1">
            Server-side script parsing and auto reply drafts using <strong>gemini-3.5-flash</strong> model.
          </p>
        </div>

        {/* Custom prompts for suggestion drafts */}
        <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col gap-2 shadow-sm">
          <label className="text-[10px] font-bold text-slate-700 tracking-wider uppercase font-mono">Custom Suggestion Directives</label>
          <textarea
            value={customReplyPrompt}
            onChange={(e) => setCustomReplyPrompt(e.target.value)}
            disabled={isReadOnly}
            placeholder="e.g. Keep it extra polite, schedule corporate audit next Wednesday morning..."
            className="w-full text-xs p-2 border border-slate-200 rounded bg-slate-50 focus:bg-white outline-none resize-none h-16"
            id="copilot-context-textarea"
          />
          <button
            onClick={fetchAISuggestions}
            disabled={isReadOnly || loadingSuggestions}
            className={`w-full py-1.5 rounded text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 ${
              isReadOnly 
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed" 
                : "bg-slate-900 hover:bg-slate-800 text-white border border-slate-800"
            }`}
            id="suggest-replies-copilot-btn"
          >
            {loadingSuggestions ? (
              <>
                <Loader className="w-3 h-3 animate-spin" />
                <span>Thinking with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Generate Smart Drafts</span>
              </>
            )}
          </button>
        </div>

        {/* Suggested Response Output list */}
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
          <span className="text-[10.5px] font-bold text-slate-400 font-mono tracking-widest uppercase">Click to populate response</span>
          {suggestedReplies.length > 0 ? (
            suggestedReplies.map((reply, idx) => (
              <button
                key={idx}
                onClick={() => selectSuggestion(reply)}
                className="bg-white p-2.5 rounded-lg border border-slate-200 hover:border-indigo-500 text-left text-xs text-slate-700 leading-tight transition-all duration-200 shadow-sm hover:shadow"
                id={`suggestion-pill-${idx}`}
              >
                <p className="line-clamp-4">{reply}</p>
                <div className="flex justify-between items-center mt-1 text-[10px] text-indigo-600 font-bold">
                  <span>Draft option {idx + 1}</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            ))
          ) : (
            <div className="bg-white p-6 rounded-lg border border-gray-200 border-dashed text-center text-gray-400 text-[11px] flex flex-col items-center justify-center gap-1">
              <span>No active drafts.</span>
              <span>Click generative triggers above to parse live conversation context.</span>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Overnight AI Assistant Shift Configuration Hub */}
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 mt-6 flex flex-col gap-5" id="overnight-ai-control-hub">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-905 bg-slate-900 rounded-lg text-amber-400">
            <Moon className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-slate-900 text-base flex items-center gap-2">
              Overnight ChatGPT Assistant
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-sans font-bold uppercase tracking-wider ${
                overnightSettings.enabled 
                  ? "bg-green-100 text-green-800 border border-green-200" 
                  : "bg-slate-100 text-slate-500 border border-slate-200"
              }`}>
                {overnightSettings.enabled ? "Active Night shift" : "Disabled"}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Automatically assume customer messages respond like a human between {overnightSettings.startHour % 12 || 12} {overnightSettings.startHour >= 12 ? 'PM' : 'AM'} and {overnightSettings.endHour % 12 || 12} {overnightSettings.endHour >= 12 ? 'PM' : 'AM'} {overnightSettings.forceActiveForTesting && " (Simulation overriding active)"}
            </p>
          </div>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-2 rounded-lg text-xs">
          <div className={`w-2.5 h-2.5 rounded-full ${overnightSettings.enabled ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
          <span className="font-mono text-[11px] font-bold text-slate-700">
            Status: {overnightSettings.enabled ? (overnightSettings.forceActiveForTesting ? "FORCE SIMULATION ACTIVE" : "SHIFTS ARMED") : "OFF-DUTY"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Form: Toggle configurations and parameters */}
        <div className="md:col-span-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 font-mono tracking-wider uppercase mb-1">Shift Hours & Controls</h4>
            
            {/* Toggle Enable switch */}
            <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100 cursor-pointer hover:bg-slate-50/40">
              <span className="text-xs font-semibold text-slate-900">Enable Night shift</span>
              <input
                type="checkbox"
                checked={overnightSettings.enabled}
                onChange={(e) => setOvernightSettings({ ...overnightSettings, enabled: e.target.checked })}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded cursor-pointer"
                id="overnight-on-toggle"
              />
            </label>

            {/* Daytime simulation override */}
            <label className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-600/20 cursor-pointer hover:bg-amber-600/15 mt-2">
              <span className="text-xs font-semibold text-amber-900 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5" />
                Override Active (For Testing Only)
              </span>
              <input
                type="checkbox"
                checked={overnightSettings.forceActiveForTesting}
                onChange={(e) => setOvernightSettings({ ...overnightSettings, forceActiveForTesting: e.target.checked })}
                className="w-4 h-4 text-amber-600 focus:ring-amber-500 rounded cursor-pointer"
                id="overnight-simulation-bypass"
              />
            </label>
            <p className="text-[10px] text-amber-700 mt-1 pl-1">
              Bypasses standard clock hours so any mock client enquiry instantly replies via AI. Great for daytime previews!
            </p>

            {/* Hour select sliders */}
            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200/60">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Starts (e.g. 20 = 8 PM)</label>
                <select
                  value={overnightSettings.startHour}
                  onChange={(e) => setOvernightSettings({ ...overnightSettings, startHour: parseInt(e.target.value) })}
                  className="bg-white border border-slate-250 text-xs rounded-lg px-2 py-1 outline-none text-slate-700 font-bold"
                  id="start-shift-hour-select"
                >
                  <option value={18}>18:00 (6 PM)</option>
                  <option value={19}>19:00 (7 PM)</option>
                  <option value={20}>20:00 (8 PM)</option>
                  <option value={21}>21:00 (9 PM)</option>
                  <option value={22}>22:00 (10 PM)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Ends (e.g. 9 = 9 AM)</label>
                <select
                  value={overnightSettings.endHour}
                  onChange={(e) => setOvernightSettings({ ...overnightSettings, endHour: parseInt(e.target.value) })}
                  className="bg-white border border-slate-250 text-xs rounded-lg px-2 py-1 outline-none text-slate-700 font-bold"
                  id="end-shift-hour-select"
                >
                  <option value={6}>06:00 (6 AM)</option>
                  <option value={7}>07:00 (7 AM)</option>
                  <option value={8}>08:00 (8 AM)</option>
                  <option value={9}>09:00 (9 AM)</option>
                  <option value={10}>10:00 (10 AM)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 p-4 bg-slate-50/50 rounded-xl border border-slate-200">
            <label className="text-xs font-bold text-slate-700 font-mono tracking-wider uppercase">AI Assistant Custom Name</label>
            <input
              type="text"
              value={overnightSettings.aiName}
              onChange={(e) => setOvernightSettings({ ...overnightSettings, aiName: e.target.value })}
              className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white font-semibold outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Arthur (Docx Overnight AI)"
              id="overnight-ai-name-input"
            />
            <p className="text-[10px] text-slate-400">This identity attaches as the WhatsApp/SMS sender of the AI agent replies.</p>
          </div>
        </div>

        {/* Right Form: System prompt / assistant instructions */}
        <div className="md:col-span-7 flex flex-col gap-4">
          <div className="flex flex-col gap-2 p-4 bg-slate-50/50 rounded-xl border border-slate-200 flex-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 font-mono tracking-wider uppercase flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Nocturnal Assistant Prompt (ChatGPT Instructions)
              </label>
              <span className="text-[10px] text-indigo-600 font-bold font-mono">POWERED BY GEMINI AI</span>
            </div>
            
            <textarea
              value={overnightSettings.systemPrompt}
              onChange={(e) => setOvernightSettings({ ...overnightSettings, systemPrompt: e.target.value })}
              className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-white outline-none focus:ring-1 focus:ring-indigo-500 font-sans leading-relaxed flex-1 min-h-[160px] resize-none"
              placeholder="Provide a comprehensive system description..."
              id="overnight-ai-prompt-editor"
            />

            <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 mt-1">
              <p className="text-[10.5px] text-slate-500 leading-tight pr-6">
                <strong>Tip:</strong> Instruct the AI to log consultations, offer fast-track booking at <strong>docx.link/consult</strong>, and act exactly like a professional human team representative!
              </p>
              
              <button
                onClick={handleSaveOvernightSettings}
                disabled={isSavingOvernight}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg border border-indigo-700 shadow-sm transition flex items-center gap-1.5 shrink-0"
                id="overnight-save-btn"
              >
                {isSavingOvernight ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deploying...</span>
                  </>
                ) : (
                  <>
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Save Overnight Configuration</span>
                  </>
                )}
              </button>
            </div>

            {overnightSaveStatus && (
              <div className="mt-2 text-center text-xs font-semibold py-1.5 px-3 bg-indigo-55/40 text-indigo-700 bg-indigo-50 border border-indigo-150 rounded-lg animate-fadeIn">
                {overnightSaveStatus}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
