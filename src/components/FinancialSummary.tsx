import React, { useState } from "react";
import { 
  IndianRupee, 
  TrendingUp, 
  ArrowUpRight, 
  ShieldCheck, 
  CreditCard, 
  Receipt, 
  Wallet, 
  Building2, 
  Layers, 
  CheckCircle2, 
  Clock, 
  FileText,
  Calendar,
  Filter,
  ArrowDownRight
} from "lucide-react";
import { Lead, Campaign, ServiceItem } from "../types";

interface FinancialSummaryProps {
  leads: Lead[];
  campaigns: Campaign[];
  services?: ServiceItem[];
}

export default function FinancialSummary({ leads, campaigns, services = [] }: FinancialSummaryProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'q2' | 'fy26' | 'all'>('fy26');
  const [divisionFilter, setDivisionFilter] = useState<'all' | 'law' | 'accounting'>('all');

  // Consultation Fee constant (Standard Indian corporate law triage fee)
  const CONSULTATION_FEE_INR = 1499;

  // Filter leads based on division
  const relevantLeads = divisionFilter === 'all' 
    ? leads 
    : leads.filter(l => l.type === divisionFilter);

  // Financial calculations
  const paidConsultations = relevantLeads.filter(l => l.consultationFee === "Paid");
  const unpaidConsultations = relevantLeads.filter(l => l.consultationFee === "Unpaid");
  const waivedConsultations = relevantLeads.filter(l => l.consultationFee === "Waived");

  const consultationRevenueCollected = paidConsultations.length * CONSULTATION_FEE_INR;
  const consultationReceivables = unpaidConsultations.length * CONSULTATION_FEE_INR;

  // Campaign ROI attribution in INR
  const totalCampaignROI = campaigns.reduce((acc, c) => acc + (c.roiValue || 0), 0);

  // Estimated Closed Retainer Revenue (Corporate contracts typically ₹65,000 for Law, ₹45,000 for Tax/Audit)
  const closedWonLeads = relevantLeads.filter(l => l.status === "Closed_Won");
  const proposalLeads = relevantLeads.filter(l => l.status === "Proposal");
  const qualifiedLeads = relevantLeads.filter(l => l.status === "Qualified");

  // Base contract estimates
  const lawRetainerAvg = 85000;
  const accountingRetainerAvg = 45000;

  const calculateContractValue = (l: Lead) => {
    if (l.keyword.toLowerCase().includes("restructure")) return 120000;
    if (l.keyword.toLowerCase().includes("incorporation") || l.keyword.toLowerCase().includes("pvt ltd")) return 14999;
    if (l.keyword.toLowerCase().includes("audit")) return 65000;
    if (l.keyword.toLowerCase().includes("trademark")) return 9999;
    if (l.keyword.toLowerCase().includes("bookkeeping") || l.keyword.toLowerCase().includes("gst")) return 28000;
    return l.type === 'law' ? lawRetainerAvg : accountingRetainerAvg;
  };

  const closedWonRevenue = closedWonLeads.reduce((acc, l) => acc + calculateContractValue(l), 0);
  const pipelineValue = [...proposalLeads, ...qualifiedLeads].reduce((acc, l) => acc + calculateContractValue(l), 0);

  // Total Realized Revenue (Collected Fees + Campaign ROI + Contract Realizations)
  // If no closed_won yet in mock, calculate from verified paid files (Clara Sterling, Devon Harris)
  const verifiedBaseContractRevenue = relevantLeads
    .filter(l => l.consultationFee === "Paid")
    .reduce((acc, l) => acc + calculateContractValue(l), 0);

  const totalRealizedRevenue = consultationRevenueCollected + totalCampaignROI + verifiedBaseContractRevenue;

  // Monthly Recurring Revenue estimate (from ongoing compliance services)
  const estimatedMRR = Math.round(totalRealizedRevenue * 0.35);

  // Format Helper in INR (e.g., ₹1,00,000 format)
  const formatINR = (val: number) => {
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // Division breakdown calculation
  const lawRevenue = leads
    .filter(l => l.type === 'law')
    .reduce((acc, l) => acc + (l.consultationFee === "Paid" ? calculateContractValue(l) + CONSULTATION_FEE_INR : 0), 0) + Math.round(totalCampaignROI * 0.55);

  const accountingRevenue = leads
    .filter(l => l.type === 'accounting')
    .reduce((acc, l) => acc + (l.consultationFee === "Paid" ? calculateContractValue(l) + CONSULTATION_FEE_INR : 0), 0) + Math.round(totalCampaignROI * 0.45);

  const totalDivisionSum = (lawRevenue + accountingRevenue) || 1;
  const lawPercent = Math.round((lawRevenue / totalDivisionSum) * 100);
  const accountingPercent = 100 - lawPercent;

  // Invoices mock ledger with realistic Indian business context
  const invoiceLedger = [
    {
      id: "INV-2026-081",
      client: "Clara Sterling (Sterling Enterprises)",
      service: "Corporate Restructuring & Legal Retainer",
      division: "Law Division",
      amount: 120000,
      feeAmount: CONSULTATION_FEE_INR,
      status: "Paid",
      method: "NEFT / Corporate Bank",
      date: "16 Jun 2026"
    },
    {
      id: "INV-2026-082",
      client: "Devon Harris (TechSolar IO)",
      service: "Multi-State Tax Audit & GST Alignment",
      division: "Accounting Division",
      amount: 65000,
      feeAmount: CONSULTATION_FEE_INR,
      status: "Paid",
      method: "UPI Corporate Auto-Debit",
      date: "17 Jun 2026"
    },
    {
      id: "INV-2026-083",
      client: "Marcus Zhao (Zhao Consulting)",
      service: "Trademark Class 9 & 42 Examination",
      division: "Law Division",
      amount: 9999,
      feeAmount: CONSULTATION_FEE_INR,
      status: "Pending",
      method: "Razorpay Payment Link Sent",
      date: "15 Jun 2026"
    },
    {
      id: "INV-2026-084",
      client: "Fiona Gallagher (Gallagher Bakes)",
      service: "Sole Proprietorship to Pvt Ltd Incorporation",
      division: "Accounting Division",
      amount: 14999,
      feeAmount: CONSULTATION_FEE_INR,
      status: "Pending",
      method: "UPI Invoice Generated",
      date: "17 Jun 2026"
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col gap-6 p-6" id="financial-summary-root">
      
      {/* Financial Summary Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono leading-none py-1 px-2.5 rounded-full uppercase tracking-wider font-extrabold flex items-center gap-1">
              <IndianRupee className="w-3 h-3 text-emerald-700" />
              INR Financial Overview
            </span>
            <span className="text-slate-400 text-xs font-mono">Fiscal Year 2026-27</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight font-sans flex items-center gap-2">
            Company Docx Financial Summary
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Consolidated revenue metrics, consultation retainer collections, campaign returns, and pipeline contract valuations in Indian Rupee (₹) format.
          </p>
        </div>

        {/* Period & Division Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          {/* Period selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setSelectedPeriod('q2')}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedPeriod === 'q2' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Q2 Active
            </button>
            <button
              onClick={() => setSelectedPeriod('fy26')}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedPeriod === 'fy26' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              FY 2026-27
            </button>
            <button
              onClick={() => setSelectedPeriod('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                selectedPeriod === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All-Time
            </button>
          </div>

          {/* Division Filter */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setDivisionFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                divisionFilter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDivisionFilter('law')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                divisionFilter === 'law' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Law
            </button>
            <button
              onClick={() => setDivisionFilter('accounting')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                divisionFilter === 'accounting' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tax/Audit
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Financial KPI Metric Cards (INR Format) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="financial-kpi-grid">
        
        {/* KPI 1: Total Realized Revenue */}
        <div className="bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 p-5 rounded-xl border border-emerald-200/80 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
              Total Realized Revenue
            </span>
            <div className="w-9 h-9 bg-emerald-100/80 rounded-lg flex items-center justify-center text-emerald-700">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
              {formatINR(totalRealizedRevenue)}
            </h4>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-emerald-700">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+28.6% MoM Growth</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Collected retainers + Campaign conversions
            </p>
          </div>
        </div>

        {/* KPI 2: Active Pipeline Valuation */}
        <div className="bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 p-5 rounded-xl border border-indigo-200/80 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-indigo-800 bg-indigo-100/80 px-2 py-0.5 rounded">
              Active Pipeline Value
            </span>
            <div className="w-9 h-9 bg-indigo-100/80 rounded-lg flex items-center justify-center text-indigo-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
              {formatINR(pipelineValue)}
            </h4>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-indigo-700">
              <Clock className="w-3.5 h-3.5" />
              <span>{proposalLeads.length + qualifiedLeads.length} Qualified Proposals</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Weighted legal & accounting contracts
            </p>
          </div>
        </div>

        {/* KPI 3: Consultation Fees Status */}
        <div className="bg-gradient-to-br from-blue-50/70 via-white to-slate-50 p-5 rounded-xl border border-blue-200/80 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded">
              Consultation Retainers
            </span>
            <div className="w-9 h-9 bg-blue-100/80 rounded-lg flex items-center justify-center text-blue-700">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
              {formatINR(consultationRevenueCollected)}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600 font-semibold">
              <span className="text-emerald-700 font-bold">{paidConsultations.length} Paid</span>
              <span>•</span>
              <span className="text-amber-700 font-bold">{unpaidConsultations.length} Pending</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Fixed triage retainer rate of ₹1,499
            </p>
          </div>
        </div>

        {/* KPI 4: Monthly Recurring Retainers (MRR) */}
        <div className="bg-gradient-to-br from-amber-50/70 via-white to-slate-50 p-5 rounded-xl border border-amber-200/80 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded">
              Projected Monthly MRR
            </span>
            <div className="w-9 h-9 bg-amber-100/80 rounded-lg flex items-center justify-center text-amber-700">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h4 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
              {formatINR(estimatedMRR)}
              <span className="text-xs font-semibold text-slate-500 font-mono">/mo</span>
            </h4>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-amber-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>GST & Bookkeeping Subscriptions</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Annual compliance & virtual office retainers
            </p>
          </div>
        </div>

      </div>

      {/* Division Revenue Share & Unit Economics Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Division Revenue Breakdown */}
        <div className="lg:col-span-2 bg-slate-50/70 rounded-xl p-5 border border-slate-200/80 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                Revenue Distribution by Practice Division
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Contribution between Corporate Law litigation/contracts vs Tax & Auditing services
              </p>
            </div>
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold px-2 py-1 rounded border border-indigo-200">
              INR ALLOCATION
            </span>
          </div>

          {/* Visual Percentage Progress Bar */}
          <div className="flex flex-col gap-2">
            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden flex shadow-inner">
              <div 
                className="bg-indigo-600 h-full transition-all duration-700 flex items-center justify-center" 
                style={{ width: `${lawPercent}%` }}
                title={`Corporate Law: ${lawPercent}%`}
              />
              <div 
                className="bg-amber-500 h-full transition-all duration-700 flex items-center justify-center" 
                style={{ width: `${accountingPercent}%` }}
                title={`Tax & Accounting: ${accountingPercent}%`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                    ⚖️ Corporate Law Division
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-800">{lawPercent}%</span>
                </div>
                <span className="text-base font-extrabold text-slate-900 font-mono mt-1">
                  {formatINR(lawRevenue)}
                </span>
                <span className="text-[10px] text-slate-400">Restructuring, IP filings, M&A contracts</span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                    📊 Tax & Accounting Division
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-800">{accountingPercent}%</span>
                </div>
                <span className="text-base font-extrabold text-slate-900 font-mono mt-1">
                  {formatINR(accountingRevenue)}
                </span>
                <span className="text-[10px] text-slate-400">Statutory audits, GST retainers, GAAP books</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Standard Corporate Fee Schedule */}
        <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-200/80 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Standard Retainer Tariffs (INR)
            </h4>
            <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">Standardized</span>
          </div>

          <div className="flex flex-col divide-y divide-slate-200/80 text-xs">
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-600">Initial Strategy Consult</span>
              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                ₹1,499
              </span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-600">Pvt Ltd Incorporation</span>
              <span className="font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                ₹11,999
              </span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-600">Trademark Filing (Class 1)</span>
              <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                ₹4,999
              </span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-600">Monthly GST & Audit Plan</span>
              <span className="font-mono font-bold text-amber-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                ₹2,499/mo
              </span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-600">Statutory Tax Audit</span>
              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                ₹12,499
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Client Retainer & Invoice Ledger */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-indigo-600" />
              Recent Client Retainer Invoices (INR Ledger)
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live settlement status for consultation triage fees and corporate project retainers
            </p>
          </div>
          <span className="bg-slate-100 text-slate-600 text-[10px] font-mono px-2.5 py-1 rounded font-bold">
            {invoiceLedger.length} Invoices Active
          </span>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-200 font-mono text-[10px] uppercase tracking-wider">
                <th className="p-3 font-bold">Invoice Ref</th>
                <th className="p-3 font-bold">Client / Entity</th>
                <th className="p-3 font-bold">Service Matter</th>
                <th className="p-3 font-bold">Division</th>
                <th className="p-3 font-bold">Consultation Fee</th>
                <th className="p-3 font-bold">Contract Total</th>
                <th className="p-3 font-bold">Settlement Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {invoiceLedger.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-800 text-[11px]">
                    {inv.id}
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-slate-900 block">{inv.client}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{inv.date}</span>
                  </td>
                  <td className="p-3 text-slate-700">
                    {inv.service}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inv.division.includes("Law") 
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200" 
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {inv.division}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-700">
                    {formatINR(inv.feeAmount)}
                  </td>
                  <td className="p-3 font-mono font-extrabold text-slate-900 text-xs">
                    {formatINR(inv.amount)}
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                      inv.status === "Paid" 
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}>
                      {inv.status === "Paid" ? "✓ SETTLED" : "⏳ PENDING"}
                    </span>
                    <span className="text-[9px] text-slate-400 block font-mono mt-0.5">{inv.method}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
