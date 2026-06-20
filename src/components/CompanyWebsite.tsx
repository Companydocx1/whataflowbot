import React, { useState, useEffect } from "react";
import { 
  Globe, 
  Send, 
  Moon, 
  Sun, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  PhoneCall, 
  ShieldCheck, 
  FileText, 
  Building2, 
  ArrowRight,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Activity,
  RefreshCw,
  Award,
  Users,
  Layers,
  HeartHandshake
} from "lucide-react";
import { ServiceItem } from "../types";

interface CompanyWebsiteProps {
  leads: any[];
  messages: any[];
  systemStatus: any;
  onRefreshData: () => Promise<void>;
  services?: ServiceItem[];
}

export default function CompanyWebsite({ leads, messages, systemStatus, onRefreshData, services = [] }: CompanyWebsiteProps) {
  // Website Form State
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPractice, setClientPractice] = useState<"law" | "accounting">("law");
  const [clientNotes, setClientNotes] = useState("Urgent corporate restructurings and tax audit consultation needed.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Embedded Web Chat Widget State
  const [webChatOpen, setWebChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [activeSessionLeadId, setActiveSessionLeadId] = useState<string | null>(null);
  const [isAiReplying, setIsAiReplying] = useState(false);

  // Time detection for nighttime shift
  const [localHours, setLocalHours] = useState(new Date().getHours());
  const [overnightSettings, setOvernightSettings] = useState({
    enabled: true,
    startHour: 20,
    endHour: 9,
    forceActiveForTesting: true,
    aiName: "Arthur (Docx Overnight AI)"
  });

  // Load backend settings
  const fetchOvernightConfig = async () => {
    try {
      const res = await fetch("/api/overnight-ai/settings");
      if (res.ok) {
        const data = await res.json();
        setOvernightSettings(data);
      }
    } catch (err) {
      console.error("Error loading overnight config", err);
    }
  };

  useEffect(() => {
    fetchOvernightConfig();
    const interval = setInterval(() => {
      setLocalHours(new Date().getHours());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const isShiftActive = overnightSettings.enabled && (
    overnightSettings.forceActiveForTesting || 
    (overnightSettings.startHour > overnightSettings.endHour 
      ? (localHours >= overnightSettings.startHour || localHours < overnightSettings.endHour)
      : (localHours >= overnightSettings.startHour && localHours < overnightSettings.endHour))
  );

  // Submit Inquiry form (Simulating a true external CRM webhook connection)
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone) {
      alert("Name and Phone Number are required to generate legal/tax work-files.");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch("/api/webhooks/crm-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clientName,
          phone: clientPhone,
          email: clientEmail || `${clientName.toLowerCase().replace(/\s+/g, "")}@example.net`,
          type: clientPractice,
          notes: clientNotes,
          score: 85 // Pre-set hot lead priority score
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSubmitStatus(result);
        
        // Save the lead ID for the embedded chat simulation if desired!
        if (result.lead && result.lead.id) {
          setActiveSessionLeadId(result.lead.id);
        }
        
        // Reset fields
        setClientName("");
        setClientPhone("");
        setClientEmail("");
        setClientNotes("");
        
        // Refresh the backend database sync immediately so they show up on the team dashboard
        await onRefreshData();
      } else {
        const err = await response.json();
        alert(err.error || "Failed secure portal submission.");
      }
    } catch (err) {
      console.error("Submission error", err);
      alert("Error reaching the Express integration gateway.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Chat with Arthur Overnight AI from the customer browser
  const handleSendWebChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    let leadIdToUse = activeSessionLeadId;

    // If no lead exists yet, register a temporary website guest first
    if (!leadIdToUse) {
      try {
        const guestName = `Website Guest-${Math.floor(1000 + Math.random() * 9000)}`;
        const registerRes = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: guestName,
            phone: "+1 (555) 001-9999",
            email: "guest@docx.link",
            type: "law",
            notes: "Initiated live conversation from overnight website widget."
          })
        });
        if (registerRes.ok) {
          const newLead = await registerRes.json();
          leadIdToUse = newLead.id;
          setActiveSessionLeadId(newLead.id);
          await onRefreshData();
        }
      } catch (err) {
        console.error("Temporary lead generation failed", err);
        return;
      }
    }

    if (!leadIdToUse) return;

    const typedMessage = chatInput.trim();
    setChatInput("");
    setIsAiReplying(true);

    try {
      // 1. Post client message
      await fetch("/api/message/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: leadIdToUse,
          content: typedMessage,
          channel: "whatsapp",
          sender: "customer"
        })
      });

      // Refresh to fetch the customer message immediately
      await onRefreshData();

      // The backend will automatically kick off Gemini AI as long as shifts are armed.
      // We wait 2 seconds and pull settings updates.
      setTimeout(async () => {
        await onRefreshData();
        setIsAiReplying(false);
      }, 2500);

    } catch (err) {
      console.error("Failed sending chat message", err);
      setIsAiReplying(false);
    }
  };

  const activeChatList = activeSessionLeadId 
    ? messages.filter(m => m.leadId === activeSessionLeadId)
    : [];

  // Selected schedule slot
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  return (
    <div className="flex flex-col gap-8 font-sans" id="docx-public-website">
      {/* 1. Website Frame Banner */}
      <div className="bg-indigo-900 text-indigo-100 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm border border-indigo-950">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-950 rounded-lg text-amber-400">
            <Globe className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300 font-mono">Sandbox Sandbox</span>
            <h2 className="text-sm font-bold text-white leading-normal">Public Customer-Facing Website (Simulated Live Preview)</h2>
          </div>
        </div>
        <p className="text-xs text-indigo-200 max-w-md">
          This portal simulates the exact user-journey. Clients visit this page, submit secure legal/tax enquiries, and book live consultation sessions instantly.
        </p>
      </div>

      {/* 2. Main Web Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-xl overflow-hidden min-h-[700px] relative">
        
        {/* Top Floating Alert for Night Shift Status */}
        <div className="lg:col-span-12 bg-slate-950 py-2.5 px-6 border-b border-slate-800 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isShiftActive ? "bg-amber-400" : "bg-slate-400"}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isShiftActive ? "bg-amber-400" : "bg-slate-400"}`}></span>
            </span>
            <span className="text-[11px] font-mono tracking-wide text-slate-300 uppercase">
              Current Service Shift: <strong>{isShiftActive ? "Overnight AI Shift (8 PM - 9 AM) Active" : "Daytime Standard Shift Active"}</strong>
            </span>
          </div>

          <div className="text-[10.5px] text-slate-400 flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Pre-rendered: {localHours % 12 || 12}:00 {localHours >= 12 ? 'PM' : 'AM'} Local Standard Time
            </span>
            <span className="bg-slate-800 text-[9px] px-2 py-0.5 rounded text-amber-450 font-bold text-amber-400">
              {overnightSettings.forceActiveForTesting ? "24/7 OVERNIGHT DEMO FORCE DISPATCHED" : "REGULAR TIMING"}
            </span>
          </div>
        </div>

        {systemStatus?.geminiQuotaExceeded && (
          <div className="lg:col-span-12 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 py-2.5 px-6 flex items-center gap-2.5 text-[11px] font-medium leading-relaxed font-sans">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
            <span>
              <strong>Quotas Active:</strong> The daily free-tier sandbox API limit for <code>gemini-3.5-flash</code> has been exceeded on this server. The system has gracefully activated our custom <strong>Arthur Jenkins Local High-Fidelity Engine</strong>. Conversational routing, CRM logging, and consultation scheduling remain fully operational without pause!
            </span>
          </div>
        )}

        {/* Column 1: Elegant Corporate Website Frontend (Span 7) */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col gap-8 border-r border-slate-800">
          
          {/* Landing Header */}
          <div className="flex justify-between items-center pb-6 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-serif font-black tracking-tighter text-lg shadow-md">
                D
              </div>
              <div>
                <h1 className="text-lg font-serif font-bold text-white tracking-tight">COMPANY DOCX</h1>
                <p className="text-[9px] text-slate-400 tracking-wider font-mono">CORPORATE LAW & COMPLIANCE</p>
              </div>
            </div>

            <div className="flex gap-4 text-xs font-medium text-slate-300">
              <a href="#about" className="hover:text-indigo-400 transition">Solutions</a>
              <a href="#partners" className="hover:text-indigo-400 transition">Attorneys</a>
              <a href="#contact" className="hover:text-indigo-400 transition border-b-2 border-indigo-500 pb-0.5">Enquire Hub</a>
            </div>
          </div>

          {/* Epic Legal/Accounting Hero Copy */}
          <div className="flex flex-col gap-4">
            <span className="text-xs text-indigo-400 font-mono tracking-widest uppercase font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              ESTABLISHED IN 2008 • TRUSTED BY 140+ ENTERPRISES
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif text-white leading-tight font-extrabold tracking-tight">
              Aesthetic Corporate Defense & Audits. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-amber-200 to-indigo-100">
                Armed with Instant Overnight Consultation.
              </span>
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xl">
              Company Docx handles enterprise accounting compliance audits, corporate structuring legal briefs, and high-frequency litigation strategies. We operate on zero delay. Get matched with Arthur Jenkins' team immediately, day or night.
            </p>
          </div>

          {/* Division Card Overviews */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white">1. Corporate Law Firm</h4>
              <p className="text-[10px] text-slate-500 leading-normal">
                Contract engineering, board disputes, structuring buyouts, and general counsel representation.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-805 border-slate-800 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-950/40 text-amber-455 text-amber-500 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white">2. Tax & Auditing</h4>
              <p className="text-[10px] text-slate-500 leading-normal">
                High-priority audits, estate planning, certified corporate ledger alignments and compliance checking.
              </p>
            </div>
          </div>

          {/* Interactive Service Catalog Block */}
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-850 border-slate-800 flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-sans font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Service & Corporate Registration Portfolio
                </h3>
                <span className="bg-indigo-900/40 text-indigo-300 font-mono text-[9px] px-2 py-0.5 rounded border border-indigo-800/60">
                  REAL-TIME QUOTES
                </span>
              </div>
              <p className="text-[11px] text-slate-505 text-slate-400 mt-1">
                Explore our official 7 Compliance Divisions. Click "Enquire File" to auto-populate the Intake Portal below with specs and required document lists!
              </p>
            </div>

            {/* Category Filter Pills (7 divisions listed!) */}
            <div className="flex flex-wrap gap-1 border-b border-slate-800/80 pb-3">
              {[
                { id: "all", label: "✨ All Services" },
                { id: "business_reg", label: "💼 Business" },
                { id: "ngo_reg", label: "🎗️ NGO" },
                { id: "ip_reg", label: "🛡️ IP Registrations" },
                { id: "legal_accounting", label: "📊 Legal & Accounting" },
                { id: "website", label: "🌐 Website" },
                { id: "registered_office", label: "🏢 Registered Office" },
                { id: "industry_cert", label: "📜 Certifications" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-2 py-1 text-[9.5px] font-bold rounded transition-all ${
                    selectedCategory === tab.id
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-900 border border-slate-800/85 text-slate-400 hover:text-slate-200"
                  }`}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Service list stream */}
            <div className="max-h-[290px] overflow-y-auto divide-y divide-slate-800/80 flex flex-col gap-2.5 pr-1">
              {services
                .filter(s => selectedCategory === "all" || s.category === selectedCategory)
                .map(srv => (
                  <div key={srv.id} className="pt-2.5 pb-2.5 flex justify-between items-start gap-4">
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-white leading-tight">{srv.name}</span>
                        <span className="bg-slate-900 border border-slate-800 text-slate-500 text-[8px] font-mono uppercase px-1.5 py-0.5 rounded leading-none">
                          {srv.category.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">{srv.description}</p>
                      
                      {srv.requirements && srv.requirements.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {srv.requirements.map((req, i) => (
                            <span key={i} className="bg-indigo-950/40 text-indigo-300 font-mono text-[8px] px-1.5 py-0.5 rounded leading-none">
                              ✓ {req}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="font-mono font-bold text-xs text-emerald-400 bg-emerald-950/45 border border-emerald-900/60 px-2 py-0.5 rounded leading-tight">
                        {srv.price}
                      </span>
                      <button
                        onClick={() => {
                          setClientPractice(
                            ["legal_accounting"].includes(srv.category) ? "accounting" : "law"
                          );
                          setClientNotes(
                            `Service Requested: ${srv.name}\nEstimated Filing Fee: ${srv.price}\nDivision: ${srv.category.toUpperCase()}\n\nRequired credentials prepared:\n${srv.requirements?.map(r => `• ${r}`).join("\n") || "None listed."}`
                          );
                          document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="bg-indigo-900/60 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-900/80 text-[9px] font-bold px-2.5 py-1 rounded transition-all"
                        type="button"
                      >
                        Enquire File
                      </button>
                    </div>
                  </div>
                ))}
              {services.filter(s => selectedCategory === "all" || s.category === selectedCategory).length === 0 && (
                <p className="text-center py-4 text-slate-500 font-mono text-[10px]">No active listings inside this portfolio division.</p>
              )}
            </div>
          </div>

          {/* Interactive Case Intake form */}
          <div className="bg-slate-950/70 p-6 rounded-xl border border-slate-800 flex flex-col gap-4" id="contact">
            <div>
              <h3 className="text-sm font-sans font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-400" />
                Intake Work-File & Application Portal
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Your dossier will be fed into our automated parser. Under overnight shifts, ChatGPT triggers response logs and slots.
              </p>
            </div>

            <form onSubmit={handleInquirySubmit} className="flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Rachel Adams"
                    className="p-2.5 bg-slate-900 border border-slate-750 border-slate-850 rounded-lg outline-none text-white text-xs focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Cell Phone (For Bot Reply Simulation)</label>
                  <input
                    type="text"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 555-5555"
                    className="p-2.5 bg-slate-900 border border-slate-750 border-slate-850 rounded-lg outline-none text-white text-xs focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="e.g. rachel@adamsgrowth.co"
                    className="p-2.5 bg-slate-900 border border-slate-750 border-slate-850 rounded-lg outline-none text-white text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Assistance Required</label>
                  <select
                    value={clientPractice}
                    onChange={(e) => setClientPractice(e.target.value as "law" | "accounting")}
                    className="p-2.5 bg-slate-900 border border-slate-750 border-slate-850 rounded-lg outline-none text-white text-xs"
                  >
                    <option value="law">Corporate Law Department</option>
                    <option value="accounting">Audit & Tax Practice</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Inquiry Details (Contains keywords checked by webhook)</label>
                <textarea
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="Notes or context for the attorney..."
                  className="p-2.5 bg-slate-900 border border-slate-750 border-slate-850 rounded-lg outline-none text-white text-xs h-16 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all shadow-md mt-2 flex items-center justify-center gap-2 tracking-wide uppercase text-xs"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Secure Gateway...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit & Dispatch Automated Channels</span>
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

        {/* Column 2: Client Simulation Phone Preview & Scheduler Widget (Span 5) */}
        <div className="lg:col-span-5 p-6 bg-slate-950 flex flex-col gap-6 justify-between">
          
          {/* A. smartphone frame representing client's Whatsapp receiver */}
          <div className="flex flex-col gap-3">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
              Client Handset Preview (Simulation Output)
            </span>

            <div className="bg-slate-900 rounded-3xl p-3 border-4 border-slate-700 relative shadow-inner flex flex-col gap-2 min-h-[290px] justify-between">
              {/* Smartphone Status notched top */}
              <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono px-2 border-b border-slate-800 pb-1">
                <span>WhatsApp Core v1.4</span>
                <span className="bg-green-500/20 text-green-400 font-bold px-1.5 rounded text-[8px] animate-pulse">● Connected</span>
              </div>

              <div className="flex-1 flex flex-col justify-end gap-3 py-2 overflow-y-auto pr-1">
                {submitStatus ? (
                  <div className="flex flex-col gap-2.5 animate-fadeIn">
                    {/* User submitted balloon */}
                    <div className="flex justify-end">
                      <div className="bg-slate-850 text-slate-250 text-xs px-2.5 py-1.5 rounded-lg rounded-tr-none max-w-[85%] font-sans flex flex-col gap-0.5">
                        <span className="text-[8px] text-indigo-400 font-mono text-right capitalize">Intake Inquire</span>
                        <p>{submitStatus.lead?.notes?.split("\n")[0] || "Enquiry dispatch file submitted."}</p>
                      </div>
                    </div>

                    {/* Overnight Automated message balloon */}
                    <div className="flex justify-start">
                      <div className="bg-emerald-50 text-slate-900 text-xs p-3 rounded-lg rounded-tl-none max-w-[90%] font-sans shadow leading-relaxed relative border border-emerald-150">
                        <div className="flex justify-between items-center text-[9px] font-mono text-indigo-900 border-b border-emerald-250 pb-1 mb-1 font-bold">
                          <span>👤 {overnightSettings.aiName || "Arthur"}</span>
                          <span>latency: {submitStatus.lead?.score > 70 ? "9ms" : "2.2s"}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{submitStatus.dispatchedText || submitStatus.message}</p>
                        <span className="text-[8px] text-slate-500 block text-right mt-1.5 font-mono">
                          Delivered • Just now • Double Ticks ✓✓
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-600 gap-2 px-6">
                    <MessageSquare className="w-8 h-8 text-slate-750" />
                    <p className="text-[11px]">No simulated message dispatched yet.</p>
                    <p className="text-[9px] text-slate-700">Submit the Case Intake Application or click on the floating "Overnight Live Chat" to test how ChatGPT coordinates replies.</p>
                  </div>
                )}
              </div>

              {/* Input simulator */}
              <div className="bg-slate-950 p-1.5 rounded-lg flex items-center gap-1">
                <input
                  type="text"
                  disabled
                  placeholder="Simulation locked..."
                  className="flex-1 bg-transparent text-[11px] text-slate-500 outline-none px-2"
                />
                <button disabled className="p-1 text-slate-600">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* B. Scheduled consult scheduler (docx.link/consult simulation) */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
            <h4 className="text-xs font-sans font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-500" />
              Direct Consultation Slot Booking (docx.link/consult)
            </h4>
            <p className="text-[10px] text-slate-500 leading-normal">
              Clients are routed here by the chatbot instruction scripts to instantly confirm appointments.
            </p>

            {bookingConfirmed ? (
              <div className="p-3 bg-indigo-900/40 border border-indigo-500/30 text-indigo-200 rounded-lg text-xs flex flex-col gap-1.5 items-center justify-center text-center animate-slideUp">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 animate-bounce" />
                <p className="font-bold">Virtual Legal Consulting Slot Logged!</p>
                <p className="text-[10px] text-indigo-300">Confirmed for {selectedSlot} with the Senior Counsel team. Active alert sent to WhatsApp.</p>
                <button 
                  onClick={() => {
                    setBookingConfirmed(false);
                    setSelectedSlot(null);
                  }}
                  className="mt-1.5 text-[9px] font-bold text-amber-400 hover:underline"
                >
                  Schedule another slot
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Tomorrow, 9:00 AM (Priority)",
                    "Tomorrow, 10:30 AM",
                    "Thursday, 2:00 PM",
                    "Friday, 11:00 AM"
                  ].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2 text-[11px] rounded-lg border text-left transition font-mono ${
                        selectedSlot === slot 
                          ? "bg-amber-500 border-amber-600 text-slate-950 font-bold" 
                          : "bg-slate-900 border-slate-750 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>

                <button
                  disabled={!selectedSlot}
                  onClick={() => setBookingConfirmed(true)}
                  className={`py-2 text-[11px] font-bold tracking-wider rounded-lg border transition uppercase mt-1 text-center ${
                    selectedSlot 
                      ? "bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-600 cursor-pointer shadow" 
                      : "bg-slate-800 border-slate-750 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  Confirm Quick Slot Book
                </button>
              </div>
            )}
          </div>

          {/* C. Direct client live chatbot emulator floating element or widget */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-[10.5px] font-bold text-indigo-400 uppercase tracking-wide flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                Browser Web-Chat Widget Simulator
              </span>
              <button 
                onClick={() => setWebChatOpen(!webChatOpen)}
                className="text-[10px] text-white bg-slate-800 hover:bg-slate-750 px-2 py-0.5 rounded cursor-pointer leading-tight"
              >
                {webChatOpen ? "Minimize Chat" : "Expand Chat Widget"}
              </button>
            </div>

            {webChatOpen && (
              <div className="flex flex-col gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800 animate-slideDown max-h-[190px]">
                <div className="flex-1 overflow-y-auto max-h-[120px] text-[10.5px] font-mono text-slate-300 leading-normal flex flex-col gap-2 p-1">
                  {activeChatList.length > 0 ? (
                    activeChatList.map((msg, index) => (
                      <div key={index} className={`flex ${msg.sender === "customer" ? "justify-end" : "justify-start"}`}>
                        <div className={`p-1.5 rounded max-w-[85%] ${
                          msg.sender === "customer" 
                            ? "bg-slate-800 text-right text-indigo-200" 
                            : "bg-emerald-900/70 border border-emerald-800 text-slate-100"
                        }`}>
                          <strong className="text-[8px] block opacity-70">
                            {msg.sender === "customer" ? "CLIENT" : (msg.agentName || "BOT")}
                          </strong>
                          <span>{msg.content}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-655 text-slate-600 block py-4 text-[10px]">
                      Ask Arthur (Overnight AI) a question here to test late-night human responses.
                    </div>
                  )}

                  {isAiReplying && (
                    <div className="text-[10px] text-amber-450 italic text-amber-500 animate-pulse flex items-center gap-1 font-sans">
                      <Sparkles className="w-3" />
                      ChatGPT Overnight Assistant Arthur responding...
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendWebChat} className="flex gap-1.5">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask e.g. What is Arthur Jenkins consultation fee?"
                    className="flex-1 bg-slate-900 border border-slate-800 outline-none text-white text-[11px] p-1.5 rounded focus:border-indigo-500"
                  />
                  <button type="submit" className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 rounded text-white text-[10px] font-bold">
                    Ask
                  </button>
                </form>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 3. Overview of Client Journey workflow guide */}
      <div className="bg-slate-100 p-5 rounded-xl border border-slate-300/60">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 font-mono flex items-center gap-1">
          <ChevronRight className="w-4 h-4 text-indigo-600" />
          The Overnight Customer Journey Loop (How to Experience It)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-650 text-slate-600">
          <div className="flex flex-col gap-1 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
            <span className="font-bold text-indigo-700">Step 1: Intake Enquiry</span>
            <p className="text-[11px]">
              Fill out the <strong>Intake application form</strong> inside the left browser panel. This triggers a real mock Salesforce/HubSpot webhook, registering the lead immediately with robust tax credentials.
            </p>
          </div>

          <div className="flex flex-col gap-1 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
            <span className="font-bold text-indigo-700">Step 2: Instant Bot Dispatch</span>
            <p className="text-[11px]">
              The webhook receives the payload and checks if the notes match the keyword (e.g. <code>audit</code>). If matched, the automated administration bot sends the initial welcome message immediately!
            </p>
          </div>

          <div className="flex flex-col gap-1 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
            <span className="font-bold text-indigo-750 text-indigo-700">Step 3: Late Night Conversing</span>
            <p className="text-[11px]">
              Toggle the **Browser Web-Chat Widget Simulator**, or type inside the Team Inbox. Any user message arrives during off-hours will recruit ChatGPT to generate an authoritative human-equivalent legal brief response loop.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
