import React, { useState, useEffect } from "react";
import { 
  Users, 
  Plus, 
  Trash2, 
  Shield, 
  FileText, 
  DollarSign, 
  Eye, 
  Activity, 
  Save, 
  CheckCircle, 
  X, 
  ListFilter,
  Briefcase,
  Building2,
  Lock,
  Edit2,
  MessageSquare,
  Send,
  Zap,
  Globe,
  Settings,
  HelpCircle,
  Clock,
  Sparkles
} from "lucide-react";
import { Employee, ServiceItem, Lead, Message } from "../types";

interface AdminControlsProps {
  leads: Lead[];
  messages: Message[];
  employees: Employee[];
  services: ServiceItem[];
  onRefreshData: () => Promise<void>;
  onUpdateLeadField: (leadId: string, updates: Partial<Lead>) => Promise<void>;
}

export default function AdminControls({ 
  leads, 
  messages, 
  employees, 
  services, 
  onRefreshData,
  onUpdateLeadField
}: AdminControlsProps) {
  const [subTab, setSubTab] = useState<'employees' | 'services' | 'chat-monitor' | 'crm-integrations'>('employees');

  // CRM Integrations Custom Settings State
  const [crmKeyword, setCrmKeyword] = useState("audit");
  const [crmWelcomeMessage, setCrmWelcomeMessage] = useState("");
  const [crmUrl, setCrmUrl] = useState("https://your-custom-crm.com/api/v1/leads");
  const [crmApiKey, setCrmApiKey] = useState("");
  const [crmSecret, setCrmSecret] = useState("");
  const [crmLoading, setCrmLoading] = useState(false);
  const [crmStatusMessage, setCrmStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchCrmSettings = async () => {
    try {
      setCrmLoading(true);
      const res = await fetch("/api/crm/integration-settings");
      if (res.ok) {
        const data = await res.json();
        setCrmKeyword(data.keyword || "audit");
        setCrmWelcomeMessage(data.welcomeMessage || "");
        setCrmUrl(data.customCrmUrl || "https://your-custom-crm.com/api/v1/leads");
        setCrmApiKey(data.customCrmApiKey || "");
        setCrmSecret(data.customCrmSecret || "");
      }
    } catch (err) {
      console.error("Failed to load CRM Settings:", err);
    } finally {
      setCrmLoading(false);
    }
  };

  const handleSaveCrmSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCrmLoading(true);
      setCrmStatusMessage(null);
      const res = await fetch("/api/crm/integration-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: crmKeyword,
          welcomeMessage: crmWelcomeMessage,
          customCrmUrl: crmUrl,
          customCrmApiKey: crmApiKey,
          customCrmSecret: crmSecret
        })
      });
      if (res.ok) {
        setCrmStatusMessage({ type: 'success', text: "✔ CRM integration endpoints and credentials saved successfully!" });
        await onRefreshData();
      } else {
        setCrmStatusMessage({ type: 'error', text: "❌ Failed to save CRM credentials on server backend." });
      }
    } catch (err) {
      console.error(err);
      setCrmStatusMessage({ type: 'error', text: "❌ Connection error during CRM endpoints dispatch." });
    } finally {
      setCrmLoading(false);
    }
  };

  useEffect(() => {
    if (subTab === 'crm-integrations') {
      fetchCrmSettings();
    }
  }, [subTab]);

  // Employee Form State
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [empName, setEmpName] = useState("");
  const [empPosition, setEmpPosition] = useState<Employee['position']>("Senior Consultant");
  const [empEmail, setEmpEmail] = useState("");
  const [empPhone, setEmpPhone] = useState("");
  const [empRole, setEmpRole] = useState<'admin' | 'agent' | 'viewer'>('agent');
  const [empPermissions, setEmpPermissions] = useState<string[]>(["inbox"]);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);

  // Service Form State
  const [showAddSrvModal, setShowAddSrvModal] = useState(false);
  const [editingSrvId, setEditingSrvId] = useState<string | null>(null);
  const [srvCategory, setSrvCategory] = useState<ServiceItem['category']>("business_reg");
  const [srvName, setSrvName] = useState("");
  const [srvPrice, setSrvPrice] = useState("");
  const [srvDescription, setSrvDescription] = useState("");
  const [srvRequirements, setSrvRequirements] = useState("");

  // Chat Monitor state
  const [selectedMonitorLeadId, setSelectedMonitorLeadId] = useState<string>("");
  const [supervisorReply, setSupervisorReply] = useState("");
  const [supervisorFilter, setSupervisorFilter] = useState<'all' | 'unassigned' | 'assigned'>('all');

  // Load / Save Action functions
  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName) return;

    try {
      const url = editingEmpId ? `/api/employees/${editingEmpId}/update` : "/api/employees";
      const body = {
        name: empName,
        position: empPosition,
        email: empEmail,
        phone: empPhone,
        role: empRole,
        permissions: empPermissions
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        await onRefreshData();
        // Reset states
        setShowAddEmpModal(false);
        setEditingEmpId(null);
        setEmpName("");
        setEmpEmail("");
        setEmpPhone("");
        setEmpRole("agent");
        setEmpPermissions(["inbox"]);
      }
    } catch (err) {
      console.error("Failed to save employee roster", err);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("Are you sure you want to remove this employee from Company Docx's internal role registry? This will revoke active positions!")) return;
    try {
      const res = await fetch(`/api/employees/${id}/delete`, {
        method: "POST"
      });
      if (res.ok) {
        await onRefreshData();
      }
    } catch (err) {
      console.error("Failed to delete employee", err);
    }
  };

  const startEditEmployee = (emp: Employee) => {
    setEditingEmpId(emp.id);
    setEmpName(emp.name);
    setEmpPosition(emp.position);
    setEmpEmail(emp.email);
    setEmpPhone(emp.phone);
    setEmpRole(emp.role);
    setEmpPermissions(emp.permissions || []);
    setShowAddEmpModal(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!srvName || !srvPrice) return;

    try {
      const url = editingSrvId ? `/api/services/${editingSrvId}/update` : "/api/services";
      const requirementsArray = srvRequirements.split(",").map(r => r.trim()).filter(Boolean);
      const body = {
        category: srvCategory,
        name: srvName,
        price: srvPrice,
        description: srvDescription,
        requirements: requirementsArray
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        await onRefreshData();
        setShowAddSrvModal(false);
        setEditingSrvId(null);
        setSrvName("");
        setSrvPrice("");
        setSrvDescription("");
        setSrvRequirements("");
      }
    } catch (err) {
      console.error("Failed to save service portfolio pricing", err);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Remove this service listing? This will detach it from the frontend public page!")) return;
    try {
      const res = await fetch(`/api/services/${id}/delete`, {
        method: "POST"
      });
      if (res.ok) {
        await onRefreshData();
      }
    } catch (err) {
      console.error("Failed to delete service listing", err);
    }
  };

  const startEditService = (srv: ServiceItem) => {
    setEditingSrvId(srv.id);
    setSrvCategory(srv.category);
    setSrvName(srv.name);
    setSrvPrice(srv.price);
    setSrvDescription(srv.description);
    setSrvRequirements(srv.requirements ? srv.requirements.join(", ") : "");
    setShowAddSrvModal(true);
  };

  // Setup active position capabilities table
  const positionPermissionsMap = {
    "Admin": { desc: "Full administrative mastery.", access: ["All", "Workflows", "CRM", "Inbox", "Billing", "Supervision"] },
    "Senior Consultant": { desc: "Handles premium legal restructures.", access: ["CRM", "Inbox", "Supervision"] },
    "Tax Auditor": { desc: "Access limited to tax analysis.", access: ["CRM", "Inbox", "Accounting"] },
    "Junior Draftsman": { desc: "Limited draft read-write privileges.", access: ["CRM", "Inbox-Read"] },
    "Virtual Office Executive": { desc: "Office address compliance checks.", access: ["Address-Logs"] },
    "Support Agent": { desc: "Manages general web conversations.", access: ["Inbox", "Direct-Replies"] }
  };

  // Helper: Count work assigned per employee
  const getWorkCount = (empName: string) => {
    return leads.filter(l => l.assignedAgent === empName).length;
  };

  // Post Supervisor Overwriting chat reply
  const handleSendSupervisorReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMonitorLeadId || !supervisorReply.trim()) return;

    try {
      const res = await fetch("/api/message/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedMonitorLeadId,
          content: supervisorReply.trim(),
          channel: "whatsapp",
          sender: "agent",
          agentName: "CRM Admin Supervisor (Takeover)"
        })
      });

      if (res.ok) {
        setSupervisorReply("");
        await onRefreshData();
      }
    } catch (err) {
      console.error("Supervisor override failed", err);
    }
  };

  const filteredMonitorLeads = leads.filter(l => {
    if (supervisorFilter === 'unassigned') return l.assignedAgent === 'Unassigned' || !l.assignedAgent;
    if (supervisorFilter === 'assigned') return l.assignedAgent !== 'Unassigned' && l.assignedAgent;
    return true;
  });

  const getServiceCategoryLabel = (category: string) => {
    switch (category) {
      case 'business_reg': return '💼 Business Registration';
      case 'ngo_reg': return '🎗️ NGO Registration';
      case 'ip_reg': return '🛡️ IP Registration';
      case 'legal_accounting': return '📊 Legal & Accounting';
      case 'website': return '🌐 Website & CRM Services';
      case 'registered_office': return '🏢 Registered Office Services';
      case 'industry_cert': return '📜 Industry Certificate Registration';
      default: return category;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col min-h-[680px]" id="admin-controls-panel">
      {/* Tab Header Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-mono leading-none py-1 px-2.5 rounded-full uppercase tracking-widest font-extrabold animate-pulse">
              Internal Control Panel
            </span>
            <span className="text-slate-400 text-xs font-mono">Company Docx Office Gate v2.9</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight font-sans">
            Administration Control Center
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Configure employee positions, modify regulatory services pricing, assign workload quotas, and live monitor cross-channel communication lines using raw telemetry records.
          </p>
        </div>
        
        {/* Toggle Controls tabs */}
        <div className="flex gap-1.5 bg-slate-800 p-1.5 rounded-xl border border-slate-700/60 self-start md:self-center">
          <button
            onClick={() => setSubTab('employees')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              subTab === 'employees' 
                ? 'bg-rose-600 text-white shadow-md' 
                : 'text-slate-300 hover:bg-slate-700/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff Roles ({employees.length})</span>
          </button>
          <button
            onClick={() => setSubTab('services')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              subTab === 'services' 
                ? 'bg-rose-600 text-white shadow-md' 
                : 'text-slate-300 hover:bg-slate-700/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Services Catalog ({services.length})</span>
          </button>
          <button
            onClick={() => setSubTab('chat-monitor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              subTab === 'chat-monitor' 
                ? 'bg-rose-600 text-white shadow-md' 
                : 'text-slate-300 hover:bg-slate-700/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Monitor Supervision</span>
          </button>
          <button
            onClick={() => setSubTab('crm-integrations')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              subTab === 'crm-integrations' 
                ? 'bg-rose-600 text-white shadow-md' 
                : 'text-slate-300 hover:bg-slate-700/60'
            }`}
            id="admin-crm-integrations-subtab"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>CRM Integrations</span>
          </button>
        </div>
      </div>

      {subTab === 'employees' && (
        <div className="p-6 flex flex-col gap-6 flex-1">
          {/* Header section with add button and position privileges legend */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-500" />
                Position-Based Access Matrix
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Each position auto-grants distinct CRM view boundaries, conversation permissions, and administrative capabilities.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingEmpId(null);
                setEmpName("");
                setEmpEmail("");
                setEmpPhone("");
                setEmpRole("agent");
                setEmpPermissions(["inbox"]);
                setShowAddEmpModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Add Employee Role
            </button>
          </div>

          {/* Position Guide Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(positionPermissionsMap).map(([posName, info]) => (
              <div key={posName} className="bg-slate-50/60 border border-slate-100 rounded-xl p-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-sans font-bold text-xs text-slate-800">{posName}</span>
                  <span className="bg-slate-200 text-slate-700 text-[10px] font-mono font-medium px-2 py-0.5 rounded">
                    {info.access.length} rights
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">{info.desc}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {info.access.map((acc, i) => (
                    <span key={i} className="bg-white text-slate-600 text-[9px] px-1.5 py-0.5 rounded border border-slate-200">
                      {acc}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Employees List Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mt-2">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-slate-800 uppercase text-[10px] font-mono tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Employee Identity</th>
                  <th className="py-3 px-4">Corporate Position</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4 text-center">Work Assigned</th>
                  <th className="py-3 px-4">Authentication Role</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-sans">
                {employees.map((emp) => {
                  const numAssigned = getWorkCount(emp.name);
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700">
                            {emp.name.split(' ').map(n=>n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-xs">{emp.name}</div>
                            <div className="text-[10.5px] text-slate-400 font-mono">{emp.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700">{emp.position}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {emp.email}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block font-mono font-bold text-xs leading-none rounded-full px-2.5 py-1 ${
                          numAssigned > 2 
                            ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                            : numAssigned > 0 
                              ? 'bg-indigo-100 text-indigo-800' 
                              : 'bg-slate-100 text-slate-400'
                        }`}>
                          {numAssigned} case{numAssigned !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span className="capitalize font-mono font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {emp.role}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => startEditEmployee(emp)}
                            className="p-1 px-2.5 bg-slate-100 text-slate-600 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition text-[10px] font-bold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp.id)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded-md transition"
                            title="Deactivate Role"
                          >
                            <Trash2 className="w-4 h-4" />
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
      )}

      {subTab === 'services' && (
        <div className="p-6 flex flex-col gap-6 flex-1">
          {/* Header section with category instructions */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-rose-500" />
                Customizable Legal & Accounting Portfolio Setup
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit or modify specific items across our 7 core divisions. New additions immediately show up on the public intake terminal.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingSrvId(null);
                setSrvCategory("business_reg");
                setSrvName("");
                setSrvPrice("");
                setSrvDescription("");
                setSrvRequirements("");
                setShowAddSrvModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Add Custom Service
            </button>
          </div>

          {/* Group services by category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['business_reg', 'ngo_reg', 'ip_reg', 'legal_accounting', 'website', 'registered_office', 'industry_cert'].map((categoryKey) => {
              const servicesInCategory = services.filter(s => s.category === categoryKey);
              if (servicesInCategory.length === 0) return null;
              return (
                <div key={categoryKey} className="border border-slate-200 bg-white rounded-xl p-4 flex flex-col gap-3">
                  <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-900 font-sans">
                      {getServiceCategoryLabel(categoryKey)}
                    </h4>
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                      {servicesInCategory.length} listing{servicesInCategory.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 flex flex-col">
                    {servicesInCategory.map((srv) => (
                      <div key={srv.id} className="py-3 flex items-start justify-between gap-4 first:pt-0 last:pb-0">
                        <div className="flex flex-col gap-1 max-w-[70%]">
                          <span className="font-bold text-xs text-slate-800 leading-tight">
                            {srv.name}
                          </span>
                          <span className="text-[11px] text-slate-500 leading-normal">
                            {srv.description}
                          </span>
                          {srv.requirements && srv.requirements.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {srv.requirements.map((req, rid) => (
                                <span key={rid} className="bg-slate-100 text-slate-600 text-[9px] px-1 py-0.5 rounded font-mono">
                                  ✓ {req}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className="font-mono font-bold text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                            {srv.price}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEditService(srv)}
                              className="text-[10px] font-extrabold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-1.5 py-0.5 rounded border border-slate-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteService(srv.id)}
                              className="text-slate-400 hover:text-red-500 p-0.5 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {subTab === 'chat-monitor' && (
        <div className="p-0 flex flex-1 flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* Left panel: Threads to Monitor */}
          <div className="w-full lg:w-96 flex flex-col flex-shrink-0 bg-slate-50">
            <div className="p-4 border-b border-slate-200 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-700 uppercase tracking-widest font-mono">
                  Active Channels
                </span>
                <span className="bg-amber-100 text-amber-800 text-[9px] font-mono px-2 py-0.5 rounded border border-amber-300">
                  REAL-TIME MONITORING
                </span>
              </div>
              
              {/* Filter controls */}
              <div className="grid grid-cols-3 gap-1">
                {(['all', 'unassigned', 'assigned'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSupervisorFilter(mode)}
                    className={`text-[10px] font-bold py-1 px-1.5 rounded transition capitalize ${
                      supervisorFilter === mode 
                        ? 'bg-rose-600 text-white shadow-sm' 
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Leads threads scroll */}
            <div className="overflow-y-auto max-h-[500px] flex-1 divide-y divide-slate-100">
              {filteredMonitorLeads.map((lead) => {
                const leadMsgs = messages.filter(m => m.leadId === lead.id);
                const lastMsg = leadMsgs[leadMsgs.length - 1];
                const unassigned = lead.assignedAgent === 'Unassigned' || !lead.assignedAgent;
                const isSelected = selectedMonitorLeadId === lead.id;

                return (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedMonitorLeadId(lead.id)}
                    className={`p-3.5 cursor-pointer transition flex flex-col gap-2 relative ${
                      isSelected
                        ? 'bg-rose-50/70 border-l-4 border-l-rose-500' 
                        : 'bg-white hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-slate-800">{lead.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono leading-none">{lead.phone}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        unassigned 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {unassigned ? 'BOT/UNASSIGNED' : lead.assignedAgent}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                      {lastMsg ? `"${lastMsg.content}"` : 'No communications logged.'}
                    </p>

                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono mt-0.5">
                      <span>{leadMsgs.length} messages in buffer</span>
                      <span>Score: <strong className="text-slate-700">{lead.score}</strong></span>
                    </div>
                  </div>
                );
              })}
              {filteredMonitorLeads.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs font-mono">
                  No active channels found under this monitor log filter.
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Conversation logs and supervisor takeover actions */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {selectedMonitorLeadId ? (() => {
              const activeLead = leads.find(l => l.id === selectedMonitorLeadId);
              const conversation = messages.filter(m => m.leadId === selectedMonitorLeadId);

              if (!activeLead) return <div className="p-8 text-center text-slate-400">Loading monitor records...</div>;

              return (
                <div className="flex flex-col flex-1 h-full" id="chat-monitor-conversation-area">
                  
                  {/* Lead metadata header banner */}
                  <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="font-bold text-xs text-slate-800">{activeLead.name}</h4>
                        <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-2 mt-0.5">
                          <span>Phone: <strong className="font-mono text-slate-700">{activeLead.phone}</strong></span>
                          <span>•</span>
                          <span>Email: <strong className="font-mono text-slate-700">{activeLead.email}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Agent re-assign direct drop down in real-time */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-bold font-mono">Assigned Staff Agent:</span>
                      <select
                        value={activeLead.assignedAgent}
                        onChange={(e) => onUpdateLeadField(activeLead.id, { assignedAgent: e.target.value })}
                        className="bg-white border border-slate-300 text-xs rounded-lg px-2.5 outline-none py-1.5 text-indigo-700 font-extrabold focus:ring-1 focus:ring-indigo-500"
                        id="monitor-agent-assign"
                      >
                        <option value="Unassigned">🤖 Unassigned (Bot Control)</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.name}>👥 {emp.name} ({emp.position})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Message stream */}
                  <div className="p-4 overflow-y-auto max-h-[380px] bg-slate-50/40 flex-1 flex flex-col gap-3">
                    <div className="text-center py-2">
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-mono leading-relaxed py-1 px-6 rounded-full border border-amber-200 uppercase font-bold">
                        🔒 Admin Supervision Enabled — Remote interception active
                      </span>
                    </div>

                    {conversation.map((msg) => {
                      const isCustomer = msg.sender === 'customer';
                      const isBot = msg.sender === 'bot';

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col max-w-[80%] ${
                            isCustomer ? 'self-start' : 'self-end'
                          }`}
                        >
                          <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                            isCustomer 
                              ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                              : isBot
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-rose-600 text-white rounded-tr-none'
                          }`}>
                            <p>{msg.content}</p>
                          </div>
                          <div className="flex gap-1.5 items-center mt-1 text-[9px] text-slate-400 font-mono">
                            <span className="uppercase tracking-wide font-extrabold">
                              {isCustomer ? 'CLIENT' : isBot ? `AI BOT (${msg.agentName || 'Arthur'})` : msg.agentName || 'HUMAN'}
                            </span>
                            <span>•</span>
                            <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                            <span>•</span>
                            <span>Delay: {msg.latencyMs || '12'}ms</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Remote interception terminal send */}
                  <form onSubmit={handleSendSupervisorReply} className="p-4 border-t border-slate-200 bg-white flex flex-col gap-2">
                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-200 text-[10.5px]">
                      <span className="text-rose-600 font-bold font-mono uppercase flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 animate-pulse" /> Supervisor Takeover
                      </span>
                      <span className="text-slate-400 text-[9.5px]">Sending a manual reply locks the agent session and logs your ID.</span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={supervisorReply}
                        onChange={(e) => setSupervisorReply(e.target.value)}
                        placeholder="Interfere dialogue. Enter manual supervisor override response..."
                        className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-rose-500"
                        id="monitor-takeover-input"
                      />
                      <button
                        type="submit"
                        className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-5 text-xs font-bold font-mono tracking-wide flex items-center gap-1.5 transition shadow"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Intercept
                      </button>
                    </div>
                  </form>
                </div>
              );
            })() : (
              <div className="p-16 text-center text-slate-400 text-xs font-mono flex flex-col items-center justify-center gap-4 flex-1">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shadow-inner">
                  <Activity className="w-8 h-8 animate-pulse text-indigo-500" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-700 capitalize mb-1">Central Console Terminal Idle</h4>
                  <p className="max-w-sm text-slate-500 leading-normal">
                    Select a conversation thread from the left active listings ledger to begin watching live traffic or sending override intercept vectors.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'crm-integrations' && (
        <div className="p-6 flex flex-col gap-6 flex-1 bg-slate-50">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Section Header */}
            <div className="bg-slate-900 text-white p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-sans font-bold text-sm tracking-tight flex items-center gap-2">
                  <span className="bg-rose-500 text-white font-mono text-[9px] px-2 py-0.5 rounded uppercase font-bold animate-pulse">
                     Live Stream
                  </span>
                  CRM Endpoints & Webhook Security Ingestion System
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Connect third-party CRMs (Salesforce, HubSpot, custom integrations) using active authorization secrets for real-time lead ingestion and automatic greeting dispatches.
                </p>
              </div>
              <div className="bg-slate-800 border border-slate-700/60 p-1.5 px-3 rounded-lg text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 font-bold shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                INTEGRATION ACTIVE
              </div>
            </div>

            {/* Config Form container */}
            <form onSubmit={handleSaveCrmSettings} className="p-6 flex flex-col gap-5 text-sm md:text-xs">
              
              {/* Form Status Banner */}
              {crmStatusMessage && (
                <div className={`p-3.5 rounded-lg text-xs font-bold leading-normal border flex items-center gap-2 ${
                  crmStatusMessage.type === 'success' 
                    ? 'bg-emerald-50 border-emerald-250 text-emerald-800' 
                    : 'bg-rose-50 border-rose-250 text-rose-800'
                }`}>
                  {crmStatusMessage.text}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Left Form: Endpoints configuration */}
                <div className="flex flex-col gap-4">
                  <h4 className="font-sans font-bold text-[11px] text-slate-700 uppercase tracking-widest font-mono border-b border-slate-100 pb-1.5">
                    1. Destination Endpoints & Credentials
                  </h4>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono font-bold text-gray-700 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                      <span>Custom CRM Ingestion Webhook Endpoint (URL)</span>
                      <span className="text-red-500 font-extrabold">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      value={crmUrl}
                      onChange={(e) => setCrmUrl(e.target.value)}
                      placeholder="e.g. https://your-crm-platform.com/api/v1/leads"
                      className="w-full p-2.5 border border-slate-300 rounded-lg outline-none font-mono text-[11px] focus:border-rose-500 bg-slate-50 focus:bg-white transition"
                      id="crm-integration-url-input"
                    />
                    <span className="text-[10px] text-slate-400">Incoming CRM leads posted to this sandbox are automatically ingested as live prospects.</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono font-bold text-gray-700 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                      <span>Custom CRM API Key Identifier</span>
                      <span className="text-red-500 font-extrabold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={crmApiKey}
                      onChange={(e) => setCrmApiKey(e.target.value)}
                      placeholder="e.g. api_key_docx_live_..."
                      className="w-full p-2.5 border border-slate-300 rounded-lg outline-none font-mono text-[11px] focus:border-rose-500 bg-slate-50 focus:bg-white transition"
                      id="crm-integration-key-input"
                    />
                    <span className="text-[10px] text-slate-400">Unique identifier matching custom user accounts for API authentications.</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono font-bold text-gray-700 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                      <span>CRM Webhook secret Signature</span>
                      <span className="text-red-500 font-extrabold">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={crmSecret}
                      onChange={(e) => setCrmSecret(e.target.value)}
                      placeholder="••••••••••••••••••••••••••••••••"
                      className="w-full p-2.5 border border-slate-300 rounded-lg outline-none font-mono text-[11px] focus:border-rose-500 bg-slate-50 focus:bg-white transition"
                      id="crm-integration-secret-input"
                    />
                    <span className="text-[10px] text-slate-400">Encrypted signature matching headers for payload validations (stored securely in custom memory).</span>
                  </div>
                </div>

                {/* Right Form: Ingestion trigger keywords and message */}
                <div className="flex flex-col gap-4">
                  <h4 className="font-sans font-bold text-[11px] text-slate-700 uppercase tracking-widest font-mono border-b border-slate-100 pb-1.5">
                    2. Automatic Message Trigger Specifications
                  </h4>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono font-bold text-gray-700 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                      <span>Service keyword trigger condition</span>
                      <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={crmKeyword}
                      onChange={(e) => setCrmKeyword(e.target.value)}
                      placeholder="e.g. audit, registration, compliance"
                      className="w-full p-2.5 border border-slate-300 rounded-lg outline-none font-sans text-xs focus:border-rose-500 font-semibold text-rose-800 bg-slate-50 focus:bg-white transition"
                      id="crm-keyword-trigger-input"
                    />
                    <span className="text-[10px] text-slate-400">Incoming CRM leads containing this metadata keyword will instantly trigger the welcome broadcast.</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono font-bold text-gray-700 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                      <span>Auto-respond Dispatch Message Template</span>
                    </label>
                    <textarea
                      value={crmWelcomeMessage}
                      onChange={(e) => setCrmWelcomeMessage(e.target.value)}
                      rows={5}
                      placeholder="Enter automatically dispatched welcome notification script..."
                      className="w-full p-2.5 border border-slate-300 rounded-lg outline-none font-sans text-xs focus:border-rose-500 bg-slate-50 focus:bg-white transition leading-relaxed"
                      id="crm-welcome-message-input"
                    />
                    <span className="text-[10px] text-slate-400">Use <span className="font-semibold text-slate-800">`{`{customer}`}`</span> tag variable to dynamically represent client names.</span>
                  </div>
                </div>
              </div>

              {/* CRM Sandbox Lead Simulator Panel */}
              <div className="bg-rose-50/20 border border-slate-200 rounded-xl p-5 mt-2 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-sans font-bold text-slate-800 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                     Sandbox Integration Simulator
                  </h4>
                  <span className="text-[10px] text-indigo-700 font-mono font-bold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                     Real-Time API Listening
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  You can mimic real-time client ingestion by posting custom JSON payload to our lead routing API route. This tests endpoint parsing instantly without breaking the existing pipeline.
                </p>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-[10px] font-mono text-slate-300 leading-normal overflow-x-auto relative">
                  <header className="absolute right-3 top-3 text-[9px] text-rose-500 font-bold bg-rose-950/40 px-1.5 py-0.5 rounded uppercase font-mono tracking-wider font-extrabold">
                     HTTP POST
                  </header>
                  <pre className="text-emerald-400 select-all p-0 m-0">
{`curl -X POST "${window.location.origin}/api/leads/crm-webhook" \\
  -H "Content-Type: application/json" \\
  -H "X-CRM-API-Key: ${crmApiKey || 'YOUR_API_KEY'}" \\
  -H "X-CRM-Secret: ${crmSecret || 'YOUR_SECRET'}" \\
  -d '{
    "name": "Alliance Ventures Inc",
    "phone": "+1 (555) 777-8899",
    "notes": "Looking for active business incorporation & compliance ${crmKeyword || 'audit'}.",
    "keyword": "${crmKeyword || 'audit'}"
  }'`}
                  </pre>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4 mt-1">
                <button
                  type="button"
                  onClick={fetchCrmSettings}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 p-2 px-5 font-bold rounded-lg transition"
                  disabled={crmLoading}
                  id="crm-integrations-reset-btn"
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-6 font-bold rounded-lg transition shadow flex items-center gap-1.5"
                  disabled={crmLoading}
                  id="crm-integrations-save-btn"
                >
                  {crmLoading ? (
                    <span>Synchronizing...</span>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save configurations</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Roster Add / Edit Employee Modal Dialog */}
      {showAddEmpModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md border border-slate-200 shadow-xl overflow-hidden animate-zoomIn">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-widest font-mono">
                {editingEmpId ? "✏️ Edit Employee Registry" : "➕ Register New Staff Member"}
              </h4>
              <button
                onClick={() => setShowAddEmpModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="p-5 flex flex-col gap-4 text-xs text-slate-600">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Human Resource Name *</label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="e.g. Arthur Jenkins, Sarah Jenkins"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none focus:bg-white text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Corporate Position</label>
                  <select
                    value={empPosition}
                    onChange={(e) => setEmpPosition(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none font-bold text-indigo-600"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Senior Consultant">Senior Consultant</option>
                    <option value="Tax Auditor">Tax Auditor</option>
                    <option value="Junior Draftsman">Junior Draftsman</option>
                    <option value="Virtual Office Executive">Virtual Office Executive</option>
                    <option value="Support Agent">Support Agent</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Auth Access Role</label>
                  <select
                    value={empRole}
                    onChange={(e) => setEmpRole(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none capitalize"
                  >
                    <option value="admin">Admin (Full Control)</option>
                    <option value="agent">Agent (Standard)</option>
                    <option value="viewer">Viewer (Readonly)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Internal Outlook Email</label>
                <input
                  type="email"
                  value={empEmail}
                  onChange={(e) => setEmpEmail(e.target.value)}
                  placeholder="name@companydocx.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none focus:bg-white text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile Contact Phone</label>
                <input
                  type="text"
                  value={empPhone}
                  onChange={(e) => setEmpPhone(e.target.value)}
                  placeholder="+1 (555) 234-5678"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none focus:bg-white text-slate-800 font-mono"
                />
              </div>

              {/* Checkbox permissions */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">Position Permission Log Flags</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {['all', 'inbox', 'billing', 'settings', 'accounting'].map((pKey) => {
                    const isChecked = empPermissions.includes(pKey);
                    return (
                      <label key={pKey} className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setEmpPermissions(empPermissions.filter(p => p !== pKey));
                            } else {
                              setEmpPermissions([...empPermissions, pKey]);
                            }
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                        />
                        <span className="uppercase font-mono font-medium">{pKey}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 px-4 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 px-5 rounded-lg font-bold shadow-md transition"
                >
                  Save Employee Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Roster Add / Edit Service Modal Dialog */}
      {showAddSrvModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md border border-slate-200 shadow-xl overflow-hidden animate-zoomIn">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-widest font-mono">
                {editingSrvId ? "✏️ Edit Service Offering" : "➕ Create Custom Service offering"}
              </h4>
              <button
                onClick={() => setShowAddSrvModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="p-5 flex flex-col gap-4 text-xs text-slate-600">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Service Listing Category *</label>
                <select
                  value={srvCategory}
                  onChange={(e) => setSrvCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none font-bold text-indigo-700"
                >
                  <option value="business_reg">Business Registration</option>
                  <option value="ngo_reg">NGO Registration</option>
                  <option value="ip_reg">IP Registrations</option>
                  <option value="legal_accounting">Legal & Accounting Services</option>
                  <option value="website">Website Portfolio Services</option>
                  <option value="registered_office">Registered Office Setup</option>
                  <option value="industry_cert">Industry & Business Certificate</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Service Name / Title *</label>
                <input
                  type="text"
                  required
                  value={srvName}
                  onChange={(e) => setSrvName(e.target.value)}
                  placeholder="e.g. ISO Audits, LLP Registration Standard"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none focus:bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Filing Price Quote (USD or relative) *</label>
                <input
                  type="text"
                  required
                  value={srvPrice}
                  onChange={(e) => setSrvPrice(e.target.value)}
                  placeholder="e.g. $299 or $99/month"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none focus:bg-white text-slate-800 font-bold font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description (Public Facing)</label>
                <textarea
                  value={srvDescription}
                  onChange={(e) => setSrvDescription(e.target.value)}
                  rows={3}
                  placeholder="Provide precise scope of filings, digital signatures, and certifications included in quote."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none focus:bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Requirements Checklist (Comma Separated)</label>
                <input
                  type="text"
                  value={srvRequirements}
                  onChange={(e) => setSrvRequirements(e.target.value)}
                  placeholder="e.g. Identity Proof, Utility Bills, Passport Copy"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-none focus:bg-white text-slate-800 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Separate multiple required credentials with commas.</span>
              </div>

              <div className="flex gap-2 justify-end mt-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSrvModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 px-4 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 px-5 rounded-lg font-bold shadow-md transition"
                >
                  Save Service Setup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
