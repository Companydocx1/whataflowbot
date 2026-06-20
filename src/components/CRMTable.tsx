import React, { useState } from "react";
import { Lead, UserRole, SystemStatus } from "../types";
import { 
  Building2, 
  Search, 
  Briefcase, 
  Tag, 
  Coins, 
  UserCheck, 
  TrendingUp, 
  Users, 
  Sparkles, 
  RefreshCw, 
  Mail, 
  CheckCheck,
  AlertCircle,
  Plus,
  Webhook,
  Sliders,
  Settings,
  Activity,
  Phone,
  Terminal,
  Check,
  Upload,
  FileSpreadsheet
} from "lucide-react";

interface CRMTableProps {
  currentRole: UserRole;
  leads: Lead[];
  onAddLead: (leadData: Partial<Lead>) => Promise<void>;
  onScoreLeadWithAI: (leadId: string) => Promise<{ success: boolean; aiScored: any }>;
  onUpdateLeadField: (leadId: string, updates: Partial<Lead>) => Promise<void>;
  systemStatus: SystemStatus;
  triggerEmailSync: () => Promise<void>;
  syncingEmail: boolean;
}

export default function CRMTable({
  currentRole,
  leads,
  onAddLead,
  onScoreLeadWithAI,
  onUpdateLeadField,
  systemStatus,
  triggerEmailSync,
  syncingEmail
}: CRMTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'law' | 'accounting'>('all');
  const [scoringLeadId, setScoringLeadId] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<{ [key: string]: any }>({});
  
  // Dynamic Keyword-Based Onboarding message variables
  const [activeIntroText, setActiveIntroText] = useState<string | null>(null);
  const [activeIntroLeadName, setActiveIntroLeadName] = useState<string>("");
  const [generatingForLeadId, setGeneratingForLeadId] = useState<string | null>(null);
  
  // Lead Creation Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newType, setNewType] = useState<'law' | 'accounting'>('law');
  const [newNotes, setNewNotes] = useState("");
  const [newScore, setNewScore] = useState(40);
  const [newKeyword, setNewKeyword] = useState("");
  const [newTemperature, setNewTemperature] = useState<'Hot' | 'Warm' | 'Cold'>('Warm');

  // Bulk Lead Import State
  const [showBulkImportForm, setShowBulkImportForm] = useState(false);
  const [bulkImportText, setBulkImportText] = useState("");
  const [bulkImportError, setBulkImportError] = useState<string | null>(null);
  const [bulkImportSuccess, setBulkImportSuccess] = useState<string | null>(null);
  const [parsedLeads, setParsedLeads] = useState<any[]>([]);

  const isReadOnly = currentRole === "viewer";
  const isAgent = currentRole === "agent";

  // Purchased CRM Integration Configuration & Webhook Simulator state
  const [integrationKeyword, setIntegrationKeyword] = useState("audit");
  const [integrationMessage, setIntegrationMessage] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSettingsStatus, setSaveSettingsStatus] = useState<string | null>(null);

  // Webhook Lead Simulator state
  const [simName, setSimName] = useState("Brenda Jenkins");
  const [simPhone, setSimPhone] = useState("+1 (555) 345-6789");
  const [simEmail, setSimEmail] = useState("brenda@jenkinsconsulting.com");
  const [simNotes, setSimNotes] = useState("We need an urgent tax audit and corporate restructurings session by Arthur Jenkins.");
  const [simType, setSimType] = useState<'law' | 'accounting'>("law");
  const [simScore, setSimScore] = useState(80);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // Load CRM Integration Settings from Server on Mount
  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/crm/integration-settings");
        if (res.ok) {
          const data = await res.json();
          setIntegrationKeyword(data.keyword || "audit");
          setIntegrationMessage(data.welcomeMessage || "");
        }
      } catch (err) {
        console.error("Failed to fetch CRM integration settings", err);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveIntegrationSettings = async () => {
    setIsSavingSettings(true);
    setSaveSettingsStatus(null);
    try {
      const res = await fetch("/api/crm/integration-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: integrationKeyword,
          welcomeMessage: integrationMessage,
        })
      });
      if (res.ok) {
        setSaveSettingsStatus("Integration settings saved & live successfully!");
        setTimeout(() => setSaveSettingsStatus(null), 3500);
      }
    } catch (err) {
      setSaveSettingsStatus("Error: Could not update integration credentials on server.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRunWebhookSimulation = async () => {
    setIsSimulating(true);
    setSimulationResult(null);
    try {
      const res = await fetch("/api/webhooks/crm-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: simName,
          phone: simPhone,
          email: simEmail,
          notes: simNotes,
          type: simType,
          score: Number(simScore)
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSimulationResult(data);
      }
    } catch (err) {
      console.error("Webhook simulation request failed", err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleGenerateKeywordIntro = async (lead: Lead) => {
    setGeneratingForLeadId(lead.id);
    setActiveIntroLeadName(lead.name);
    try {
      const response = await fetch("/api/message/suggest-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          customContext: `Write a friendly, high-converting WhatsApp/SMS welcome greeting for client "${lead.name}". They signed up for ${lead.type.toUpperCase()} services with keyword identifier "${lead.keyword || 'compliance'}". Incorporate direct booking link "docx.link/consult" for setting up consultations, outline our standard timeline 3-5 days, charges competitive, and list our Chennai & Bengaluru office address. Respond strictly with the formatted message only, do not put labels.`
        })
      });
      if (response.ok) {
        const data = await response.json();
        setActiveIntroText(data.suggestedReply || data.reply || `Greetings ${lead.name}! Glad to connect.`);
      } else {
        throw new Error();
      }
    } catch (err) {
      // High-quality fallback template builder
      const kw = (lead.keyword || "Intake").toUpperCase();
      setActiveIntroText(`⭐ *WELCOME TO COMPANY DOCX - ${kw} DIVISION*

Dear ${lead.name},

Thank you for registering your inquiry with our CRM. We have cataloged your file under keyword *"${lead.keyword || 'compliance'}"* and automatically assigned you a lead advisor.

📋 *Registration Deliverables & Overview:*
• *Estimated Timeline:* 3 to 5 business days
• *Consultation Booking Mode:* Direct Session or Virtual VC (Video Call)
• *National Hub Details:* Expressway Chambers, Mount Road, Chennai & Gachibowli, Hyderabad.

👉 *Next Action Step:*
To reserve your priority 1-on-1 advisor slot, please book directly at:
🔗 *docx.link/consult*

Our experts are standing by!`);
    } finally {
      setGeneratingForLeadId(null);
    }
  };

  // Filter logic
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          lead.phone.includes(searchQuery);
    const matchesType = filterType === 'all' || lead.type === filterType;
    return matchesSearch && matchesType;
  });

  const parseBulkText = (text: string) => {
    if (!text.trim()) {
      setParsedLeads([]);
      return;
    }
    const lines = text.split("\n");
    const parsed = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // split by comma, tab, or semicolon
      let parts = line.split(/[,\t;]/);
      parts = parts.map(p => p.trim());
      
      const name = parts[0] || "";
      const phone = parts[1] || "";
      const keyword = parts[2] || "";
      let tempRaw = parts[3] || "Warm";
      
      let temp: 'Hot' | 'Warm' | 'Cold' = 'Warm';
      const cleanTemp = tempRaw.toLowerCase();
      if (cleanTemp.includes("hot")) temp = "Hot";
      else if (cleanTemp.includes("cold")) temp = "Cold";
      else temp = "Warm";

      const isValid = name.length > 0 && phone.length > 0 && keyword.length > 0;
      
      parsed.push({
        id: `parsed-${i}-${Date.now()}`,
        name,
        phone,
        keyword,
        temperature: temp,
        email: parts[4] || `${name.toLowerCase().replace(/[^a-z0-9]/g, "") || "prospect"}@corp-docx.com`,
        notes: parts[5] || "Bulk imported dossier record.",
        type: (keyword.toLowerCase().includes("tax") || keyword.toLowerCase().includes("accounting") || keyword.toLowerCase().includes("bookkeeping") ? "accounting" : "law") as 'law' | 'accounting',
        score: temp === 'Hot' ? 85 : temp === 'Warm' ? 50 : 20,
        isValid
      });
    }
    setParsedLeads(parsed);
  };

  const handleCommitBulkImport = async () => {
    if (parsedLeads.length === 0) {
      setBulkImportError("No parsed records to import.");
      return;
    }
    const invalidCount = parsedLeads.filter(p => !p.isValid).length;
    if (invalidCount > 0) {
      setBulkImportError(`Please resolve the ${invalidCount} invalid item(s). Keyword, name and mobile number are strictly mandatory!`);
      return;
    }

    setBulkImportError(null);
    setBulkImportSuccess(null);
    let successCount = 0;

    for (const leadItem of parsedLeads) {
      try {
        await onAddLead({
          name: leadItem.name,
          phone: leadItem.phone,
          email: leadItem.email,
          type: leadItem.type,
          notes: leadItem.notes,
          score: leadItem.score,
          consultationFee: "Unpaid",
          temperature: leadItem.temperature,
          keyword: leadItem.keyword
        });
        successCount++;
      } catch (err) {
        console.error("Failed importing row:", leadItem, err);
      }
    }

    setBulkImportSuccess(`Successfully imported ${successCount} records in bulk!`);
    setBulkImportText("");
    setParsedLeads([]);
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!newName.trim() || !newPhone.trim() || !newKeyword.trim()) {
      alert("Name, Direct Telephone, and Service Keyword are strictly mandatory to lead adding process!");
      return;
    }

    await onAddLead({
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || `${newName.trim().toLowerCase().replace(/\s+/g, '')}@corp-docx.com`,
      type: newType,
      notes: newNotes,
      score: Number(newScore),
      consultationFee: "Unpaid",
      temperature: newTemperature,
      keyword: newKeyword.trim()
    });

    // Reset Form
    setNewName("");
    setNewPhone("");
    setNewEmail("");
    setNewNotes("");
    setNewScore(40);
    setNewKeyword("");
    setNewTemperature("Warm");
    setShowAddForm(false);
  };

  const handleAIScoreTrigger = async (leadId: string) => {
    if (isReadOnly) return;
    setScoringLeadId(leadId);
    
    try {
      const response = await onScoreLeadWithAI(leadId);
      if (response && response.aiScored) {
        setAiReport(prev => ({
          ...prev,
          [leadId]: response.aiScored
        }));
      }
    } catch (err) {
      console.error("AI scoring failed", err);
    } finally {
      setScoringLeadId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6" id="crm-table-root">
      {/* Top action header and filter panel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Categorized Filter Buttons */}
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'all' 
                ? "bg-indigo-600 text-white border border-indigo-700 shadow-sm" 
                : "bg-slate-50 text-slate-500 border border-transparent hover:bg-slate-100"
            }`}
            id="filter-all-leads-btn"
          >
            📂 View All Leads ({leads.length})
          </button>
          <button
            onClick={() => setFilterType('law')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'law' 
                ? "bg-indigo-600 text-white border border-indigo-700 shadow-sm" 
                : "bg-slate-50 text-slate-500 border border-transparent hover:bg-slate-100"
            }`}
            id="filter-law-leads-btn"
          >
            ⚖️ Law Division Leads ({leads.filter(l => l.type === 'law').length})
          </button>
          <button
            onClick={() => setFilterType('accounting')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'accounting' 
                ? "bg-indigo-600 text-white border border-indigo-700 shadow-sm" 
                : "bg-slate-50 text-slate-500 border border-transparent hover:bg-slate-100"
            }`}
            id="filter-accounting-leads-btn"
          >
            📊 Accounting Leads ({leads.filter(l => l.type === 'accounting').length})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Dynamic Search Box */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-450" />
            <input
              type="text"
              placeholder="Search prospects by name/phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
              id="crm-search-input"
            />
          </div>

          {/* Add New lead Toggle */}
          {!isReadOnly && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowBulkImportForm(!showBulkImportForm);
                  setShowAddForm(false);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg border border-emerald-700 shadow-sm flex items-center gap-1.5 transition-all duration-300"
                id="crm-bulk-import-toggle"
              >
                <Upload className="w-4 h-4" />
                <span>Bulk Import</span>
              </button>

              <button
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  setShowBulkImportForm(false);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-2 rounded-lg border border-indigo-700 shadow-sm flex items-center gap-1.5 transition-all duration-300"
                id="crm-add-lead-toggle"
              >
                <Plus className="w-4 h-4" />
                <span>Add Lead</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Bulk Lead Import Form */}
      {showBulkImportForm && !isReadOnly && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-emerald-500/30 p-6 animate-fadeIn flex flex-col gap-5" id="crm-bulk-import-form-block">
          <div className="flex justify-between items-start border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-sans font-bold text-slate-900 text-base flex items-center gap-1.5 leading-tight">
                <Upload className="w-5 h-5 text-emerald-600" />
                Dossier Pipeline: Bulk Lead Import Utility
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Import dozens of client inquiries instantly by copying & pasting from CSV, Excel, or notepad.
              </p>
            </div>
            <button
              onClick={() => {
                setBulkImportText(
                  "Alliance Ventures Ltd, +91 (987) 654-3210, tax audit, Hot\nJupiter Biotech, +1 (555) 888-1920, trademark, Warm\nEvergreen Holdings,, incorporation, Cold"
                );
                parseBulkText(
                  "Alliance Ventures Ltd, +91 (987) 654-3210, tax audit, Hot\nJupiter Biotech, +1 (555) 888-1920, trademark, Warm\nEvergreen Holdings,, incorporation, Cold"
                );
              }}
              className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-bold px-2 py-1 rounded"
              type="button"
            >
              ⚡ Load Sample Data
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Left Input Panel */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">
                <span>Copy-Paste CSV / Spreadsheet Columns:</span>
                <span className="text-red-650 text-red-600">* Name, Phone, Keyword are strictly mandatory</span>
              </div>
              <textarea
                value={bulkImportText}
                onChange={(e) => {
                  setBulkImportText(e.target.value);
                  parseBulkText(e.target.value);
                }}
                placeholder="Enter client rows. Format: Name, Mobile, Service Keyword, Temperature [optional]"
                className="p-3 border border-gray-200 rounded-lg outline-none font-mono text-[11px] h-36 bg-gray-50 focus:bg-white resize-none"
                id="bulk-import-textarea"
              />
              <p className="text-[10px] text-slate-450 leading-relaxed font-mono">
                💡 <span className="font-bold underline">Column Order:</span> Name , Mobile No , Service Keyword , Temperature Tag.<br/>
                Keywords match available law or accounting services, and temperature can be <b>Hot</b>, <b>Warm</b> or <b>Cold</b>.
              </p>
            </div>

            {/* Right Information Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-col gap-3">
              <h4 className="font-bold text-xs uppercase text-slate-700 font-mono tracking-wide">Import Specifications checklist</h4>
              <div className="grid grid-cols-3 gap-2.5 text-center text-[10px]">
                <div className="bg-white p-2 rounded border border-gray-200">
                  <span className="block font-bold text-slate-800">1. PROSPECT NAME</span>
                  <span className="text-[9px] text-slate-400">Main identifier</span>
                </div>
                <div className="bg-white p-2 rounded border border-gray-200">
                  <span className="block font-bold text-slate-800">2. MOBILE PHONE</span>
                  <span className="text-[9px] text-slate-400">Communication path</span>
                </div>
                <div className="bg-white p-2 rounded border border-red-250 border-red-300 bg-red-50/10">
                  <span className="block font-bold text-red-700">3. SERVICE KEYWORD</span>
                  <span className="text-[9px] text-red-500 font-bold">strictly mandatory</span>
                </div>
              </div>
              <div className="text-[10px] font-mono text-slate-500 leading-normal flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✔</span>
                  <span><b>Enforces validations:</b> Missing Keywords are caught on real-time parser below.</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✔</span>
                  <span><b>Dynamic Segment matching:</b> Automatically allocates Law or Accounting division by Keyword categorization.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Area */}
          {bulkImportError && (
            <div className="bg-rose-50 text-rose-800 border border-rose-250 p-3 rounded-lg text-xs font-bold leading-normal flex items-center gap-2">
              <span className="bg-rose-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px]">!</span>
              {bulkImportError}
            </div>
          )}

          {bulkImportSuccess && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-250 p-3 rounded-lg text-xs font-bold leading-normal flex items-center gap-2">
              <span className="bg-emerald-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px]">✓</span>
              {bulkImportSuccess}
            </div>
          )}

          {/* Parsed Live Grid Preview */}
          {parsedLeads.length > 0 && (
            <div className="border border-slate-250 rounded-lg overflow-hidden mt-1 flex flex-col">
              <div className="bg-slate-900 px-3.5 py-2 flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold text-slate-100 uppercase tracking-widest">
                  Live Parsed Grid Data ({parsedLeads.length} record(s))
                </span>
                <span className="text-[9px] text-emerald-400 font-mono italic">
                  Row editing active! Ensure hot, warm & cold status and mandatory keyword validity.
                </span>
              </div>
              <div className="max-h-56 overflow-y-auto divide-y divide-gray-150">
                {parsedLeads.map((item, index) => (
                  <div key={item.id} className={`p-2.5 flex flex-wrap md:flex-nowrap items-center gap-3 text-xs justify-between ${
                    item.isValid ? "bg-slate-50/50 hover:bg-slate-50" : "bg-rose-50/40 hover:bg-rose-50/60"
                  }`}>
                    {/* Position */}
                    <span className="bg-slate-250 text-slate-500 font-mono text-[9px] px-1.5 py-0.5 rounded flex-shrink-0">
                      Row {index + 1}
                    </span>

                    {/* Editable Name */}
                    <div className="flex-1 min-w-[120px] flex flex-col gap-0.5">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Client Name *</span>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...parsedLeads];
                          updated[index].name = e.target.value;
                          updated[index].isValid = e.target.value.length > 0 && item.phone.length > 0 && item.keyword.length > 0;
                          setParsedLeads(updated);
                        }}
                        placeholder="Name required"
                        className={`p-1 border text-xs rounded outline-none ${!item.name ? "border-rose-450 bg-rose-50/50" : "border-gray-200"}`}
                      />
                    </div>

                    {/* Editable Phone */}
                    <div className="flex-1 min-w-[110px] flex flex-col gap-0.5">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Mobile No *</span>
                      <input
                        type="text"
                        value={item.phone}
                        onChange={(e) => {
                          const updated = [...parsedLeads];
                          updated[index].phone = e.target.value;
                          updated[index].isValid = item.name.length > 0 && e.target.value.length > 0 && item.keyword.length > 0;
                          setParsedLeads(updated);
                        }}
                        placeholder="Mobile required"
                        className={`p-1 border text-xs rounded outline-none ${!item.phone ? "border-rose-450 bg-rose-50/50" : "border-gray-200"}`}
                      />
                    </div>

                    {/* Editable Keyword */}
                    <div className="flex-1 min-w-[110px] flex flex-col gap-0.5">
                      <span className="text-[9px] font-mono font-bold text-rose-500 uppercase font-extrabold">Service Keyword *</span>
                      <input
                        type="text"
                        value={item.keyword}
                        onChange={(e) => {
                          const updated = [...parsedLeads];
                          updated[index].keyword = e.target.value;
                          updated[index].isValid = item.name.length > 0 && item.phone.length > 0 && e.target.value.length > 0;
                          // update type based on taxonomy keyword matching
                          updated[index].type = (e.target.value.toLowerCase().includes("tax") || e.target.value.toLowerCase().includes("accounting") || e.target.value.toLowerCase().includes("bookkeeping") ? "accounting" : "law");
                          setParsedLeads(updated);
                        }}
                        placeholder="Keyword compulsory"
                        className={`p-1 border text-xs rounded font-bold outline-none ${!item.keyword ? "border-rose-600 bg-rose-50 text-rose-950" : "border-emerald-350 bg-emerald-50/10 focus:bg-white text-emerald-900"}`}
                      />
                    </div>

                    {/* Temperature Dropdown */}
                    <div className="w-24 flex flex-col gap-0.5">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Temperature</span>
                      <select
                        value={item.temperature}
                        onChange={(e) => {
                          const updated = [...parsedLeads];
                          updated[index].temperature = e.target.value as any;
                          updated[index].score = e.target.value === 'Hot' ? 85 : e.target.value === 'Warm' ? 50 : 20;
                          setParsedLeads(updated);
                        }}
                        className="p-1 border border-gray-200 text-xs rounded bg-white font-bold text-slate-800"
                      >
                        <option value="Hot">🔥 Hot</option>
                        <option value="Warm">⚡ Warm</option>
                        <option value="Cold">❄️ Cold</option>
                      </select>
                    </div>

                    {/* Status badge */}
                    <div className="flex-shrink-0 flex items-center justify-center pt-3 self-center">
                      {item.isValid ? (
                        <span className="bg-emerald-100 text-emerald-800 font-bold text-[9px] px-2 py-1 rounded inline-flex items-center gap-1">
                          ✓ Ready
                        </span>
                      ) : (
                        <span className="bg-rose-100 text-rose-800 font-extrabold text-[9px] px-2 py-1 rounded inline-flex items-center gap-1 animate-pulse" title="Check missing fields!">
                          ⚠ Invalid
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => {
                setShowBulkImportForm(false);
                setBulkImportText("");
                setParsedLeads([]);
                setBulkImportError(null);
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded font-semibold transition text-xs"
              id="bulk-import-cancel-btn"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCommitBulkImport}
              disabled={parsedLeads.length === 0}
              className={`px-5 py-2 rounded text-xs font-bold font-sans transition flex items-center gap-1 ${
                parsedLeads.length === 0 
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                  : "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700"
              }`}
              id="bulk-import-submit-btn"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>
                {parsedLeads.length === 0 
                  ? "Enter data to import" 
                  : `Commit ${parsedLeads.filter(p => p.isValid).length} Client Record(s)`
                }
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Expandable Add lead Form */}
      {showAddForm && !isReadOnly && (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200/85 p-6 animate-fadeIn" id="crm-add-lead-form-block">
          <h3 className="font-sans font-bold text-slate-900 text-base mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Plus className="w-5 h-5 text-indigo-600" />
            Register New Corporate Lead
          </h3>
          <form onSubmit={handleCreateLead} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="flex flex-col gap-1">
              <label className="font-mono font-bold text-gray-700 uppercase tracking-widest text-[9.5px]">Client Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Sterling Restructuring Ltd"
                className="p-2 border border-gray-200 rounded outline-none bg-gray-50 focus:bg-white"
                id="raw-new-lead-name"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono font-bold text-gray-700 uppercase tracking-widest text-[9.5px]">Direct Telephone</label>
              <input
                type="text"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="e.g. +1 (555) 762-1200"
                className="p-2 border border-gray-200 rounded outline-none bg-gray-50 focus:bg-white"
                id="raw-new-lead-phone"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono font-bold text-gray-700 uppercase tracking-widest text-[9.5px]">Corporate Email</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g. accounts@docxcorp.com"
                className="p-2 border border-gray-200 rounded outline-none bg-gray-50 focus:bg-white"
                id="raw-new-lead-email"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono font-bold text-gray-700 uppercase tracking-widest text-[9.5px]">Firm Division</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="p-2 border border-gray-200 rounded bg-gray-50 outline-none"
                id="raw-new-lead-division"
              >
                <option value="law">⚖️ Judicial/Legal Consultation Suite</option>
                <option value="accounting">📊 Tax advisory & Corporate Bookkeeping</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono font-bold text-red-600 uppercase tracking-widest text-[9.5px]">Service Keyword * (MANDATORY)</label>
              <input
                type="text"
                required
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="e.g. audit, registration, trademark"
                className="p-2 border border-red-200 rounded outline-none bg-red-50/20 focus:bg-white focus:border-red-400"
                id="raw-new-lead-keyword"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono font-bold text-gray-700 uppercase tracking-widest text-[9.5px]">Tag Temperature (Dropdown)</label>
              <select
                value={newTemperature}
                onChange={(e) => setNewTemperature(e.target.value as any)}
                className="p-2 border border-gray-200 rounded bg-gray-50 outline-none font-bold text-slate-800"
                id="raw-new-lead-temperature"
              >
                <option value="Hot">🔥 Hot Prospect</option>
                <option value="Warm">⚡ Warm Opportunity</option>
                <option value="Cold">❄️ Cold Lead</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono font-bold text-gray-700 uppercase tracking-widest text-[9.5px]">Initial Lead Score estimate</label>
              <input
                type="number"
                min="0"
                max="100"
                value={newScore}
                onChange={(e) => setNewScore(Number(e.target.value))}
                className="p-2 border border-gray-200 rounded bg-gray-50 outline-none"
                id="raw-new-lead-score"
              />
            </div>

            <div className="flex flex-col gap-1 md:col-span-3">
              <label className="font-mono font-bold text-gray-700 uppercase tracking-widest text-[9.5px]">Onboarding Notes & Client Goals</label>
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="e.g. Seeking premium accounting integration, scale values of consulting, filing schedule..."
                className="p-2 border border-gray-200 rounded outline-none resize-none h-16 bg-gray-50 focus:bg-white"
                id="raw-new-lead-notes"
              />
            </div>

            <div className="flex gap-2 justify-end md:col-span-3 mt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded font-semibold transition"
                id="new-lead-cancel-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 px-5 py-2 rounded font-semibold transition"
                id="new-lead-submit-btn"
              >
                Submit Prospect File
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CRM Main Grid Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden" id="crm-main-table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-slate-100 border-b border-slate-800 font-mono tracking-wider uppercase">
                <th className="p-4 font-bold">Client / Dossier</th>
                <th className="p-4 font-bold">Phone & Email</th>
                <th className="p-4 font-bold">Division</th>
                <th className="p-4 font-bold">Consultation status</th>
                <th className="p-4 font-bold">Consultation booking tracker</th>
                <th className="p-4 font-bold">Dynamic lead evaluation</th>
                <th className="p-4 font-bold text-right">Intelligent Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLeads.map((lead) => {
                const isEvaluating = scoringLeadId === lead.id;
                const specificReport = aiReport[lead.id];
                
                return (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors" id={`crm-lead-row-${lead.id}`}>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-sans font-bold text-gray-900 text-sm">{lead.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono">Dossier ID: {lead.id} • Created {new Date(lead.createdAt).toLocaleDateString()}</span>
                        {lead.keyword && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[9.5px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/50 px-2 py-0.5 rounded w-max font-mono">
                            🔑 Keyword: {lead.keyword}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5 text-gray-600 font-mono">
                        <span className="flex items-center gap-1">📞 {lead.phone}</span>
                        <span className="flex items-center gap-1">✉️ {lead.email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        lead.type === 'law' 
                          ? 'bg-amber-50 text-amber-800 border border-amber-200/45' 
                          : 'bg-indigo-50 text-indigo-800 border border-indigo-200/45'
                      }`}>
                        {lead.type === 'law' ? '⚖️ Law Division' : '📊 accounting'}
                      </span>
                    </td>
                    <td className="p-4">
                      <select
                        value={lead.consultationFee}
                        disabled={isReadOnly}
                        onChange={(e) => onUpdateLeadField(lead.id, { consultationFee: e.target.value as any })}
                        className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs text-indigo-600 font-bold outline-none"
                        id={`crm-fee-select-${lead.id}`}
                      >
                        <option value="Unpaid">❌ Invoice Unpaid</option>
                        <option value="Paid">💳 Consultation PAID</option>
                        <option value="Waived">Comped/No Fee</option>
                      </select>
                    </td>
                    
                    {/* Consultation Booking Tracker Column */}
                    <td className="p-4">
                      <div className="flex flex-col gap-1 w-44">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400 font-mono">Type:</span>
                          <select
                            value={lead.bookingType || "None"}
                            disabled={isReadOnly}
                            onChange={(e) => onUpdateLeadField(lead.id, { bookingType: e.target.value as any })}
                            className="bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-[11px] outline-none font-bold text-slate-700 font-sans"
                            id={`crm-booking-type-${lead.id}`}
                          >
                            <option value="None">None</option>
                            <option value="Direct">🏢 Direct Meeting</option>
                            <option value="Virtual">💻 Virtual Video Call</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400 font-mono">Status:</span>
                          <select
                            value={lead.bookingStatus || "Pending"}
                            disabled={isReadOnly}
                            onChange={(e) => onUpdateLeadField(lead.id, { bookingStatus: e.target.value as any })}
                            className={`border rounded px-1 py-0.5 text-[10px] font-bold outline-none font-sans ${
                              lead.bookingStatus === "Completed" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                              lead.bookingStatus === "Confirmed" ? "bg-indigo-50 text-indigo-800 border-indigo-200" :
                              lead.bookingStatus === "Cancelled" ? "bg-red-50 text-red-800 border-red-200" :
                              "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                            id={`crm-booking-status-${lead.id}`}
                          >
                            <option value="Pending">⏳ Pending</option>
                            <option value="Confirmed">✅ Confirmed</option>
                            <option value="Completed">💯 Completed</option>
                            <option value="Cancelled">❌ Cancelled</option>
                          </select>
                        </div>

                        <input
                          type="datetime-local"
                          value={lead.bookingTime ? lead.bookingTime.substring(0, 16) : ""}
                          disabled={isReadOnly}
                          onChange={(e) => onUpdateLeadField(lead.id, { bookingTime: e.target.value })}
                          className="bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-[10px] text-slate-700 outline-none w-full font-mono font-sans"
                        />
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {/* Interactive Temperature Dropdown option */}
                        <select
                          value={lead.temperature || 'Warm'}
                          disabled={isReadOnly}
                          onChange={(e) => {
                            const selectedTemp = e.target.value as 'Hot' | 'Warm' | 'Cold';
                            // automatic score adjustment matching temperature
                            const newScore = selectedTemp === 'Hot' ? 85 : selectedTemp === 'Warm' ? 50 : 20;
                            onUpdateLeadField(lead.id, { 
                              temperature: selectedTemp,
                              score: newScore 
                            });
                          }}
                          className={`text-[11px] font-bold px-1.5 py-1 rounded outline-none border transition-all cursor-pointer ${
                            lead.temperature === 'Hot' ? 'bg-red-50 border-red-200 text-red-700' :
                            lead.temperature === 'Warm' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                            'bg-blue-50 border-blue-200 text-blue-700'
                          }`}
                          id={`crm-temp-select-${lead.id}`}
                        >
                          <option value="Hot">🔥 Hot</option>
                          <option value="Warm">⚡ Warm</option>
                          <option value="Cold">❄️ Cold</option>
                        </select>

                        {/* Numeric score progression */}
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{lead.score}/100</span>
                          <div className="w-16 bg-gray-100 rounded-full h-1">
                            <div 
                              className={`h-1 rounded-full ${lead.temperature === 'Hot' ? 'bg-red-500' : lead.temperature === 'Warm' ? 'bg-amber-500' : 'bg-blue-500'}`} 
                              style={{ width: `${lead.score}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex flex-col gap-1 items-end justify-end">
                        <button
                          onClick={() => handleAIScoreTrigger(lead.id)}
                          disabled={isReadOnly || isEvaluating}
                          className={`w-full max-w-[130px] px-2 py-1 rounded text-[10px] font-bold shadow-sm flex items-center justify-center gap-1 transition-all ${
                            isReadOnly ? "bg-slate-100 text-slate-400 cursor-not-allowed" :
                            "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                          }`}
                          id={`crm-ai-score-btn-${lead.id}`}
                        >
                          {isEvaluating ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
                              <span>Analyzing...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 text-indigo-600" />
                              <span>AI Score Lead</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleGenerateKeywordIntro(lead)}
                          disabled={isReadOnly || (generatingForLeadId === lead.id)}
                          className={`w-full max-w-[130px] px-2 py-1 rounded text-[10px] font-bold shadow-sm flex items-center justify-center gap-1 transition-all ${
                            isReadOnly ? "bg-slate-100 text-slate-400 cursor-not-allowed" :
                            "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"
                          }`}
                          id={`crm-keyword-intro-btn-${lead.id}`}
                        >
                          {(generatingForLeadId === lead.id) ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                              <span>Composing...</span>
                            </>
                          ) : (
                            <>
                              <Terminal className="w-3 h-3 text-amber-650" />
                              <span>Suggest Intro</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchased CRM Integration and WhatsApp Bot Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 flex flex-col gap-6" id="purchased-crm-integration-panel">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-sans font-bold text-slate-900 flex items-center gap-2">
              <Webhook className="w-5 h-5 text-indigo-600 animate-pulse" />
              Purchased CRM Webhook Link & Admin WhatsApp Bot Auto-Responder
            </h3>
            <p className="text-xs text-slate-500">
              Link Salesforce, HubSpot, Zoho, or proprietary CRM lead addition events to automatically capture keywords and trigger admin intro messages.
            </p>
          </div>
          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
            <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
            LIVE LINK ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Config Settings */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 flex flex-col gap-4">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                Webhook Receiver & Trigger Settings
              </span>

              {/* Developer URL Setup */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Your Live CRM Webhook Destination URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/crm-lead`}
                    className="flex-1 p-2 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-650 outline-none select-all"
                  />
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/api/webhooks/crm-lead`;
                      navigator.clipboard.writeText(url);
                      alert("Webhook URL copied to clipboard! Configure this as your lead-addition trigger in your CRM.");
                    }}
                    className="px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded text-xs text-slate-700 transition"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Deliver POST JSON payloads with <code>name</code> and <code>phone</code> to automatically register incoming leads.
                </p>
              </div>

              {/* Keyword Trigger */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Keyword to Capture</label>
                  <span className="text-[9px] text-indigo-600 font-mono font-bold uppercase">Case-Insensitive Match</span>
                </div>
                <input
                  type="text"
                  value={integrationKeyword}
                  onChange={(e) => setIntegrationKeyword(e.target.value)}
                  placeholder="e.g. audit"
                  className="p-2 border border-slate-200 rounded text-xs outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-400">
                  Our WhatsApp Bot will parse incoming lead dossiers. If the text includes this term, a welcome message triggers.
                </p>
              </div>

              {/* Auto Welcome Message */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Admin WhatsApp Auto-Welcome Script</label>
                  <span className="text-[9px] text-slate-400 font-mono">Use {"{name}"} for customer name</span>
                </div>
                <textarea
                  value={integrationMessage}
                  onChange={(e) => setIntegrationMessage(e.target.value)}
                  placeholder="Welcome to Company Docx! Arthur Jenkins from our team is looking forward to scheduling our initial consultation..."
                  className="p-2 border border-slate-200 rounded text-xs outline-none focus:border-indigo-500 h-24 resize-none leading-relaxed font-mono"
                />
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-between mt-1">
                {saveSettingsStatus ? (
                  <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded animate-fade-in font-medium">
                    {saveSettingsStatus}
                  </span>
                ) : (
                  <span></span>
                )}
                
                <button
                  onClick={handleSaveIntegrationSettings}
                  disabled={isSavingSettings}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs transition border border-indigo-750 shadow-sm flex items-center gap-1.5"
                >
                  {isSavingSettings ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Settings className="w-3.5 h-3.5" />
                      <span>Update WhatsApp Bot Settings</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Column 2: Sandbox Webhook Tester */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 flex flex-col gap-4">
              <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-mono font-bold flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                Purchased CRM Outbox Webhook Simulator
              </span>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 uppercase tracking-wide">Client Full Name</label>
                  <input
                    type="text"
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    className="p-1.5 bg-slate-800 text-white rounded outline-none border border-slate-700 text-xs focus:border-indigo-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 uppercase tracking-wide">Customer Phone Number</label>
                  <input
                    type="text"
                    value={simPhone}
                    onChange={(e) => setSimPhone(e.target.value)}
                    className="p-1.5 bg-slate-800 text-white rounded outline-none border border-slate-700 text-xs focus:border-indigo-400 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 uppercase tracking-wide">Client Email</label>
                  <input
                    type="text"
                    value={simEmail}
                    onChange={(e) => setSimEmail(e.target.value)}
                    className="p-1.5 bg-slate-800 text-white rounded outline-none border border-slate-700 text-xs focus:border-indigo-400 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-400 uppercase tracking-wide">System Division</label>
                  <select
                    value={simType}
                    onChange={(e) => setSimType(e.target.value as 'law' | 'accounting')}
                    className="p-1.5 bg-slate-800 text-white rounded outline-none border border-slate-750 text-xs focus:border-indigo-400"
                  >
                    <option value="law">Law Firm Consultation</option>
                    <option value="accounting">Tax & Accounting Practice</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1 text-xs">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] text-slate-400 uppercase tracking-wide">Dossier Notes (Keyword search is run here)</label>
                  <span className="text-[9px] text-yellow-400 font-mono font-bold animate-pulse">
                    {simNotes.toLowerCase().includes(integrationKeyword.toLowerCase()) ? "✓ Trigger Keyword Present" : "⚠ No Match Found"}
                  </span>
                </div>
                <textarea
                  value={simNotes}
                  onChange={(e) => setSimNotes(e.target.value)}
                  className="p-2 bg-slate-800 text-white rounded outline-none border border-slate-705 text-xs h-16 resize-none focus:border-indigo-400"
                />
              </div>

              <div className="flex justify-between items-center mt-1">
                <span className="text-[9.5px] text-slate-500 font-mono italic">Simulates CRM adding a lead record</span>
                
                <button
                  onClick={handleRunWebhookSimulation}
                  disabled={isSimulating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-slate-900 font-bold text-xs rounded transition flex items-center gap-1 shadow-sm"
                >
                  {isSimulating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending payload...</span>
                    </>
                  ) : (
                    <>
                      <Phone className="w-3.5 h-3.5 text-slate-900" />
                      <span>Post Webhook Payload</span>
                    </>
                  )}
                </button>
              </div>

              {/* Simulation Response Displays */}
              {simulationResult && (
                <div className="mt-2 border-t border-slate-800 pt-3 flex flex-col gap-2">
                  <div className="bg-slate-950 p-2.5 rounded text-[11px] font-mono text-slate-300 leading-normal flex flex-col gap-1">
                    <div className="flex justify-between items-center text-slate-400 text-[10px]">
                      <span>SERVER Webhook HTTP 200 OK</span>
                      <span className={simulationResult.keywordMatched ? "text-emerald-400 font-bold" : "text-yellow-400 font-bold"}>
                        {simulationResult.keywordMatched ? "MATCHED" : "NO KEYWORD"}
                      </span>
                    </div>
                    <p className="text-slate-100 font-sans mt-1">{simulationResult.message}</p>
                  </div>

                  {/* Real visual WhatsApp simulation message bubble */}
                  {simulationResult.whatsappDispatched && (
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[9px] text-slate-450 border-b border-slate-800 pb-1 font-mono">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          ADMIN WA BOT DISPATCH
                        </span>
                        <span>TO: {simulationResult.lead.phone}</span>
                      </div>
                      
                      {/* WhatsApp Speech Bubble Style */}
                      <div className="flex justify-start">
                        <div className="bg-emerald-50 text-slate-900 p-2.5 rounded-lg text-xs max-w-[90%] rounded-tl-none relative shadow-sm border border-emerald-150 font-sans leading-relaxed">
                          <p className="whitespace-pre-wrap">{simulationResult.dispatchedText}</p>
                          <span className="text-[8px] text-slate-500 text-right block mt-1 font-mono leading-none">
                            Sent • Just now • Latency: 9ms
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Email Platform Synchronizer and Marketing Automation panel */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-xl border border-slate-800 text-white shadow flex flex-col md:flex-row items-center justify-between gap-6" id="crm-marketing-integrations">
        <div className="flex gap-4 items-start max-w-xl">
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <Mail className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h4 className="font-sans text-lg font-bold text-indigo-400">
              Centralized Email Marketing Automation Suite
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Mapped directly to your connected marketing platform: <span className="text-emerald-400 font-bold underline">{systemStatus.emailPlatformName}</span>. Syncing ensures that clients are tagged automatically on their dynamic lead temperature (e.g. Hot, Warm) for active legal retainers or tax updates.
            </p>
            <div className="flex items-center gap-1.5 mt-2.5 bg-slate-800/80 p-1.5 px-3 rounded text-[10.5px] border border-slate-700 w-fit">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              <span className="text-slate-300">Status: Verified Integration • Linked to <strong>admin@companydocx.com</strong></span>
            </div>
          </div>
        </div>

        <button
          onClick={triggerEmailSync}
          disabled={isReadOnly || syncingEmail}
          className={`px-5 py-3 rounded-lg text-xs font-bold transition-all shadow-sm shrink-0 flex items-center justify-center gap-2 ${
            isReadOnly ? "bg-slate-850 text-slate-500 border border-slate-800 cursor-not-allowed" :
            syncingEmail ? "bg-slate-800 text-indigo-300 outline-none" :
            "bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 font-sans"
          }`}
          id="crm-sync-email-trigger"
        >
          {syncingEmail ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Syncing cohorts...</span>
            </>
          ) : (
            <>
              <CheckCheck className="w-4 h-4" />
              <span>Optimize Active campaigns Sync</span>
            </>
          )}
        </button>
      </div>

      {/* AI Reasoning Disclosure Modal / Drawer */}
      {Object.keys(aiReport).length > 0 && (
        <div className="bg-indigo-50/20 p-5 rounded-xl border border-indigo-100/65 shadow-sm flex flex-col gap-4" id="crm-ai-reasoning-panel">
          <h4 className="font-sans font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-indigo-100 pb-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Active AI Evaluation Disclosures ({Object.keys(aiReport).length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leads.map(lead => {
              const r = aiReport[lead.id];
              if (!r) return null;
              return (
                <div key={lead.id} className="bg-white p-4 rounded-lg border border-slate-200/80 text-xs shadow-inner transition-all flex flex-col gap-2">
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded">
                    <span className="font-bold text-gray-900">{lead.name}</span>
                    <span className="font-mono text-[10px] text-green-700 bg-green-50 px-2 rounded-full font-bold">
                      Evaluated: {r.score}/100 • {r.temperature}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 italic">
                    <strong>AI Analysis:</strong> {r.reasoning}
                  </p>
                  
                  <div>
                    <strong className="text-gray-700 uppercase tracking-wide font-mono text-[9px] block mb-1">Recommended Action Steps:</strong>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-500 text-[10.5px]">
                      {r.actionSteps?.map((step: string, i: number) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Suggested Keyword Welcome Greeting Modal Overlay */}
      {activeIntroText && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-550 transition-all font-sans" id="keyword-intro-modal-backdrop">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200/90 max-w-lg w-full overflow-hidden flex flex-col transform scale-100 transition-all">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="font-bold text-sm">Suggested Onboarding Message</h4>
                  <p className="text-[10px] text-slate-400">Keyword-Based Auto Greeting • {activeIntroLeadName}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setActiveIntroText(null);
                  setActiveIntroLeadName("");
                }}
                className="text-slate-400 hover:text-white font-bold text-lg select-none outline-none focus:ring-1 focus:ring-slate-500 rounded p-1"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Content Preview */}
            <div className="p-5 flex-1 overflow-y-auto max-h-[350px] bg-slate-50">
              <div className="bg-emerald-50 text-slate-800 p-4 border border-emerald-150 rounded-lg text-xs font-mono select-all shadow-inner leading-relaxed whitespace-pre-wrap">
                {activeIntroText}
              </div>
              <p className="text-[10px] text-slate-400 mt-2.5 font-mono">
                💡 This customized dynamic greeting specifies company address details, document checklist files, and routes to **docx.link/consult** for immediate intake.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-2.5">
              <button
                onClick={() => {
                  setActiveIntroText(null);
                  setActiveIntroLeadName("");
                }}
                className="px-4 py-2 hover:bg-slate-100 text-slate-600 rounded text-xs transition-all font-bold"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeIntroText);
                  alert("Copied to clipboard successfully!");
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-amber-400 hover:text-amber-300 font-bold text-xs rounded transition-all shadow flex items-center gap-1"
              >
                📥 Copy Greeting Text
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
