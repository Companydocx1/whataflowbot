import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { 
  UserRole, 
  Lead, 
  Message, 
  BotWorkflowNode, 
  Campaign, 
  QueueJob, 
  SystemStatus,
  Employee,
  ServiceItem
} from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Database (synchronized, reset on reload or persisted in-memory)
let leads: Lead[] = [
  {
    id: "lead-1",
    name: "Clara Sterling",
    phone: "+1 (555) 234-5678",
    email: "clara@sterlingenterprises.com",
    type: "law",
    status: "Qualified",
    score: 85,
    temperature: "Hot",
    consultationFee: "Paid",
    assignedAgent: "Arthur Pendelton",
    notes: "Requires complete corporate restructuring. Interested in premium legal subscription suite. Paid consultation last Monday.",
    createdAt: "2026-06-10T14:32:00Z",
    lastInteractionAt: "2026-06-16T18:12:00Z",
    keyword: "restructure",
    bookingType: "Direct",
    bookingStatus: "Completed",
    bookingTime: "2026-06-15T10:00:00Z"
  },
  {
    id: "lead-2",
    name: "Devon Harris",
    phone: "+1 (555) 987-6543",
    email: "devon.harris@techsolar.io",
    type: "accounting",
    status: "Proposal",
    score: 92,
    temperature: "Hot",
    consultationFee: "Paid",
    assignedAgent: "Sarah Jenkins",
    notes: "Needs multi-state tax auditing and corporate filing. Highly active company with high transaction volume.",
    createdAt: "2026-06-12T09:15:00Z",
    lastInteractionAt: "2026-06-17T08:44:00Z",
    keyword: "audit",
    bookingType: "Virtual",
    bookingStatus: "Confirmed",
    bookingTime: "2026-06-18T14:30:00Z"
  },
  {
    id: "lead-3",
    name: "Marcus Zhao",
    phone: "+1 (555) 456-7890",
    email: "marcus@zhaoconsulting.com",
    type: "law",
    status: "Contacted",
    score: 42,
    temperature: "Warm",
    consultationFee: "Unpaid",
    assignedAgent: "Arthur Pendelton",
    notes: "Spoke about trademark filings for new trademark. Still debating consultation invoice. Needs automated followup.",
    createdAt: "2026-06-14T11:20:00Z",
    lastInteractionAt: "2026-06-15T15:30:00Z",
    keyword: "trademark",
    bookingType: "Virtual",
    bookingStatus: "Pending",
    bookingTime: "2026-06-19T11:00:00Z"
  },
  {
    id: "lead-4",
    name: "Fiona Gallagher",
    phone: "+1 (555) 678-1234",
    email: "fiona@gallagherbakes.com",
    type: "accounting",
    status: "New",
    score: 18,
    temperature: "Cold",
    consultationFee: "Unpaid",
    assignedAgent: "Unassigned",
    notes: "Incoming enquiry from webchat. Seeking simple bookkeeping software, but potentially high-value tax structure client.",
    createdAt: "2026-06-17T05:12:00Z",
    lastInteractionAt: "2026-06-17T05:12:00Z",
    keyword: "bookkeeping",
    bookingType: "None",
    bookingStatus: "Pending",
    bookingTime: ""
  }
];

let messages: Message[] = [
  {
    id: "msg-101",
    leadId: "lead-1",
    sender: "customer",
    content: "Hi Docx Law! I received the corporate restructuring draft. Can we discuss changes?",
    timestamp: "2026-06-16T18:10:00Z",
    channel: "whatsapp",
    status: "read",
    latencyMs: 12,
    wasProcessedAsynchronously: false
  },
  {
    id: "msg-102",
    leadId: "lead-1",
    sender: "agent",
    content: "Absolutely Clara. I have assigned Arthur Pendelton to your file. He is reviewing it now.",
    timestamp: "2026-06-16T18:12:00Z",
    channel: "whatsapp",
    agentName: "Sarah Jenkins",
    status: "read",
    latencyMs: 15,
    wasProcessedAsynchronously: false
  },
  {
    id: "msg-201",
    leadId: "lead-2",
    sender: "customer",
    content: "Can you confirm if you have integrated our Quickbooks data into the audit sheet?",
    timestamp: "2026-06-17T08:40:00Z",
    channel: "whatsapp",
    status: "read",
    latencyMs: 8,
    wasProcessedAsynchronously: false
  },
  {
    id: "msg-202",
    leadId: "lead-2",
    sender: "bot",
    content: "Hello Devon! All data streams have been centralized. I have scored this file and shared it with your accountant Sarah.",
    timestamp: "2026-06-17T08:44:00Z",
    channel: "whatsapp",
    status: "read",
    latencyMs: 5,
    wasProcessedAsynchronously: true
  },
  {
    id: "msg-301",
    leadId: "lead-3",
    sender: "customer",
    content: "Is there any charge for a quick Trademark question before our meeting?",
    timestamp: "2026-06-15T15:28:00Z",
    channel: "sms",
    status: "read",
    latencyMs: 1540, // Show restrictiveness of raw standard API delays
    wasProcessedAsynchronously: false
  },
  {
    id: "msg-302",
    leadId: "lead-3",
    sender: "agent",
    content: "Hi Marcus, trademark triage is complementary, but custom reports will request a consultation fee. Book here: docx.link/schedule",
    timestamp: "2026-06-15T15:30:00Z",
    channel: "sms",
    agentName: "Arthur Pendelton",
    status: "delivered",
    latencyMs: 1420,
    wasProcessedAsynchronously: false
  }
];

let botWorkflowNodes: BotWorkflowNode[] = [
  {
    id: "node-1",
    type: "trigger",
    title: "Incoming WhatsApp Lead",
    textContent: "Triggered whenever a message is received from a non-contact number.",
    x: 100,
    y: 150
  },
  {
    id: "node-2",
    type: "message",
    title: "Welcome Greeting & Menu",
    textContent: "Thank you for contacting Company Docx Law & Accounting. How can we support you today?\n\n1. Legal Consultation & Restructuring\n2. Corporate Tax Auditing\n3. Contact Agent",
    options: [
      { id: "opt-1", label: "Legal Consult", nextNodeId: "node-3" },
      { id: "opt-2", label: "Tax Audits", nextNodeId: "node-4" },
      { id: "opt-3", label: "Contact Agent", nextNodeId: "node-5" }
    ],
    x: 350,
    y: 150
  },
  {
    id: "node-3",
    type: "action",
    title: "Route to Law Division",
    textContent: "Assign lead to the Legal Team queue and schedule consultation reminders.",
    actionType: "set_status",
    actionValue: "Contacted",
    x: 650,
    y: 50
  },
  {
    id: "node-4",
    type: "action",
    title: "Score Lead & Dispatch Sync",
    textContent: "Elevate lead score +30 and queue background webhook sync.",
    actionType: "score_lead",
    actionValue: "30",
    x: 650,
    y: 250
  },
  {
    id: "node-5",
    type: "action",
    title: "Escalate to Live Agent",
    textContent: "Force assign the WhatsApp thread to active CRM human queue.",
    actionType: "assign_agent",
    actionValue: "Arthur Pendelton",
    x: 650,
    y: 450
  }
];

let campaigns: Campaign[] = [
  {
    id: "camp-1",
    name: "Corporate Q2 Tax Filings",
    channel: "email_broadcast",
    templateName: "Accounting Urgency Template",
    status: "Completed",
    sentCount: 150,
    totalContacts: 150,
    openCount: 124,
    clickCount: 89,
    roiValue: 12800,
    createdAt: "2026-06-01T08:00:00Z"
  },
  {
    id: "camp-2",
    name: "Corporate Restructuring Outreach",
    channel: "whatsapp",
    templateName: "Docx Business Restructure",
    status: "Draft",
    sentCount: 0,
    totalContacts: 45,
    openCount: 0,
    clickCount: 0,
    roiValue: 0,
    createdAt: "2026-06-15T09:30:00Z"
  },
  {
    id: "camp-3",
    name: "Schedule Consult Broadcast",
    channel: "sms",
    templateName: "Immediate SMS Slot",
    status: "Queued",
    sentCount: 0,
    totalContacts: 98,
    openCount: 0,
    clickCount: 0,
    roiValue: 0,
    createdAt: "2026-06-16T14:45:00Z",
    scheduledAt: "2026-06-18T10:00:00Z"
  }
];

let queueJobs: QueueJob[] = [];

let systemStatus: SystemStatus = {
  edgeCachingEnabled: true,
  asyncProcessingEnabled: true,
  lastSyncAt: new Date().toISOString(),
  activeAgentsCount: 3,
  emailPlatformStatus: "connected",
  emailPlatformName: "ActiveCampaign",
  whatsAppApiStatus: "ready",
  geminiQuotaExceeded: false
};

let crmIntegration = {
  keyword: "audit",
  welcomeMessage: "Welcome to Company Docx! We have successfully received your inquiry from the CRM. Our lead automation agent has parsed your profile. Arthur Jenkins from our team is looking forward to scheduling our initial consultation with you. Reply 'YES' to choose your time slot!",
  customCrmUrl: "https://your-custom-crm.com/api/v1/leads",
  customCrmApiKey: "api_key_docx_live_xyz542",
  customCrmSecret: "docx_secret_scrt998242",
};

let employees: Employee[] = [
  {
    id: "emp-1",
    name: "Arthur Pendelton",
    position: "Senior Consultant",
    email: "arthur@companydocx.com",
    phone: "+1 (555) 234-1111",
    role: "admin",
    permissions: ["all", "inbox", "billing", "settings"],
    createdAt: "2026-01-10T08:00:00Z"
  },
  {
    id: "emp-2",
    name: "Sarah Jenkins",
    position: "Tax Auditor",
    email: "sarah@companydocx.com",
    phone: "+1 (555) 234-2222",
    role: "agent",
    permissions: ["inbox", "accounting"],
    createdAt: "2026-02-15T09:30:00Z"
  },
  {
    id: "emp-3",
    name: "Liam O'Connor",
    position: "Junior Draftsman",
    email: "liam@companydocx.com",
    phone: "+1 (555) 234-3333",
    role: "viewer",
    permissions: ["inbox"],
    createdAt: "2026-05-01T11:20:00Z"
  },
  {
    id: "emp-4",
    name: "Fiona Gallagher",
    position: "Support Agent",
    email: "fiona@companydocx.com",
    phone: "+1 (555) 234-4444",
    role: "agent",
    permissions: ["inbox"],
    createdAt: "2026-06-15T10:00:00Z"
  }
];

let services: ServiceItem[] = [
  // 1. Business Registration
  {
    id: "srv-bus-1",
    category: "business_reg",
    name: "LLP (Limited Liability Partnership) Formation",
    price: "$299",
    description: "Hybrid corporate structure registration with customized LLP agreements and regional filing representation.",
    requirements: ["Identity Proof of Partners", "Address Verification", "NOC from registered seat landlord"]
  },
  {
    id: "srv-bus-2",
    category: "business_reg",
    name: "Private Limited Company Incorporation",
    price: "$499",
    description: "End-to-end setup including digital signature, director identification number (DIN), and official certificate.",
    requirements: ["PAN & Aadhaar Identity files", "Registered Office proof", "Director profile draft"]
  },
  {
    id: "srv-bus-3",
    category: "business_reg",
    name: "Sole Proprietorship / General Partnership Setup",
    price: "$149",
    description: "Basic entity configuration, tax identification number, bank authorization, and legal name registration.",
    requirements: ["Identity Proof", "Business address utility bills"]
  },
  {
    id: "srv-bus-4",
    category: "business_reg",
    name: "One Person Company (OPC) Registration",
    price: "$349",
    description: "Incorporation for single founders wanting full corporate protection and nominee registries.",
    requirements: ["Founder ID", "Nominee agreement statement", "Office tenancy records"]
  },
  // 2. NGO Registration
  {
    id: "srv-ngo-1",
    category: "ngo_reg",
    name: "Public Charitable Trust Registry",
    price: "$399",
    description: "Drafting of solid Trust Deed, filing before sub-registrar, trustee coordination, and regulatory checklist.",
    requirements: ["Two trustees identity details", "Trust asset declaration", "Property ownership statement"]
  },
  {
    id: "srv-ngo-2",
    category: "ngo_reg",
    name: "Society / Association NGO Bylaws Filing",
    price: "$349",
    description: "Structuring Memorandum of Association (MoA), drafting bylaws, and registering in local state archives.",
    requirements: ["Aims & Objectives list", "At least 7 board members minimum"]
  },
  {
    id: "srv-ngo-3",
    category: "ngo_reg",
    name: "Section 8 Non-Profit Company Setup",
    price: "$599",
    description: "Central incorporation for formal non-profits. Maximum eligibility for systemic tax exceptions.",
    requirements: ["Project financial projection draft", "Identification of core directors"]
  },
  // 3. IP Registrations
  {
    id: "srv-ip-1",
    category: "ip_reg",
    name: "Trademark Standard Registration",
    price: "$199",
    description: "Trademark classification lookup, application filing before controller, and trademark status monitoring.",
    requirements: ["Brand name or logo high-res artwork", "Exact date of first market usage"]
  },
  {
    id: "srv-ip-2",
    category: "ip_reg",
    name: "Logo & Brand Asset Copyright Setup",
    price: "$149",
    description: "Copyright registry protection filing for website designs, layout grids, or software programming files.",
    requirements: ["Full work source file", "Declaration of original authorship"]
  },
  {
    id: "srv-ip-3",
    category: "ip_reg",
    name: "Utility Patent Search & Drafting",
    price: "$899",
    description: "Technical state-of-the-art search and drafting of professional patent filings.",
    requirements: ["Detailed utility description", "Patent graphics/designs"]
  },
  {
    id: "srv-ip-4",
    category: "ip_reg",
    name: "Industrial Design Patent",
    price: "$299",
    description: "Protecting aesthetic look-and-feel of consumer products and industrial enclosures.",
    requirements: ["Multiple-angle 3D vectors or drawings", "Classification statements"]
  },
  // 4. Legal & Accounting Service
  {
    id: "srv-acc-1",
    category: "legal_accounting",
    name: "Annual GST Filing & Reconciliation",
    price: "$99/month",
    description: "Preparation and filing of monthly business GST, credit audits, and complete record tracking.",
    requirements: ["Sales ledger spreadsheets", "Purchase invoice summaries"]
  },
  {
    id: "srv-acc-2",
    category: "legal_accounting",
    name: "Bookkeeping & Periodic GAAP Reporting",
    price: "$149/month",
    description: "Certified bookkeeper allocations, ledger maintenance, and custom profit-and-loss sheet creation.",
    requirements: ["Bank transaction files", "Central sales receipts"]
  },
  {
    id: "srv-acc-3",
    category: "legal_accounting",
    name: "Corporate Income Tax Filing",
    price: "$249",
    description: "Completing annual business tax returns, maximizing tax-deductible items, and securing filing proofs.",
    requirements: ["Bank statement files", "Previous financial tax reports"]
  },
  {
    id: "srv-acc-4",
    category: "legal_accounting",
    name: "GAAP Financial Audit & Compliance Checks",
    price: "$499",
    description: "Official auditing of balance sheets, internal accounting verification, and generating licensed auditor logs.",
    requirements: ["Central accounting platform access", "Past fiscal tax records"]
  },
  {
    id: "srv-acc-5",
    category: "legal_accounting",
    name: "Corporate NDA & Contract Engineering",
    price: "$199",
    description: "Drafting bulletproof NDA binders, software development contracts, or partner buy-out agreements.",
    requirements: ["Contract scope description", "Party legal credentials"]
  },
  // 5. Website Services
  {
    id: "srv-web-1",
    category: "website",
    name: "Brand Domain Booking & SSL",
    price: "$49",
    description: "Domain search, registration, and active SSL installation for safe enterprise communications.",
    requirements: ["Target domain choices", "Owner details"]
  },
  {
    id: "srv-web-2",
    category: "website",
    name: "Corporate Landing Page with Chat Simulation",
    price: "$599",
    description: "Developing custom, elegant website landing pages equipped with live responsive lead capture forms.",
    requirements: ["Writing guides", "Logo assets"]
  },
  {
    id: "srv-web-3",
    category: "website",
    name: "CRM Lead Routing & API Webhook Integration",
    price: "$349",
    description: "Connecting website intake forms with Hubspot, Salesforce, or custom WhatsApp auto-reply nodes.",
    requirements: ["CRM credentials", "Target flow parameters"]
  },
  // 6. Registered Office
  {
    id: "srv-off-1",
    category: "registered_office",
    name: "Premium Virtual Registered Office Address",
    price: "$29/month",
    description: "Prestigious office address for receiving correspondence, mail forwarding scans, and compliance agents.",
    requirements: ["Company registration documents"]
  },
  {
    id: "srv-off-2",
    category: "registered_office",
    name: "Agent for Service of Process",
    price: "$99/year",
    description: "Providing a designated professional local agent to receive court files and compliance notices.",
    requirements: ["Articles of incorporation"]
  },
  // 7. Industry & Business Certificates
  {
    id: "srv-cert-1",
    category: "industry_cert",
    name: "ISO 9001:2015 Quality Certificate",
    price: "$249",
    description: "Quality management audit manuals, operation guidelines, and ISO certificate logging.",
    requirements: ["Operations flowchart", "Staff policy manual details"]
  },
  {
    id: "srv-cert-2",
    category: "industry_cert",
    name: "MSME / Udyam registration",
    price: "$79",
    description: "Enrolling business in small enterprise registries to enable priority collateral-free banking lines.",
    requirements: ["Aadhaar Card copy", "Company Ledger balance info"]
  },
  {
    id: "srv-cert-3",
    category: "industry_cert",
    name: "Import-Export Code (IEC) Registration",
    price: "$199",
    description: "Obtaining central customs clearance import-export certificate for worldwide trading.",
    requirements: ["PAN files", "Partnership deed or incorporation file", "Canceled cheque"]
  },
  {
    id: "srv-cert-4",
    category: "industry_cert",
    name: "FSSAI (Food Safety License)",
    price: "$199",
    description: "Securing food hygiene and manufacturer operating license before commercial dispatch.",
    requirements: ["Layout outline of location", "Identify of promoter", "Item list"]
  }
];

let notificationsList: any[] = [
  {
    id: "notif-init-1",
    type: "crm_added",
    title: "CRM Ingestion Online",
    message: "CRM Connector Hub is listening for automated webhook ingestion requests.",
    timestamp: new Date().toISOString(),
    read: false
  }
];

function getFallbackTranslation(text: string, targetLanguage: string): string {
  const t = targetLanguage.toLowerCase().trim();
  const lowerText = text.toLowerCase();
  
  if (t === "english") {
    if (lowerText.includes("வணக்கம்") || lowerText.includes("नमस्ते") || lowerText.includes("നമസ്കാരം") || lowerText.includes("ನಮಸ್ಕಾರ")) {
      return "Hello! Thank you for contacting Company Docx Legal and Accounts department.";
    }
    return text;
  }

  if (t === "tamil") {
    if (lowerText.includes("hello") || lowerText.includes("hi")) {
      return "வணக்கம்! கம்பெனி டாக்ஸ் (Company Docx) ஐ தொடர்பு கொண்டதற்கு நன்றி. நாங்கள் உங்களுக்கு எவ்வாறு உதவலாம்?";
    }
    if (lowerText.includes("documents") || lowerText.includes("draft")) {
      return "தேவையான ஆவணங்களின் பட்டியல்: பான் கார்டு, ஆதார் கார்டு, முகவரி ஆதாரம் மற்றும் வங்கி அறிக்கை.";
    }
    return `[தமிழ்] ${text}`;
  }

  if (t === "hindi") {
    if (lowerText.includes("hello") || lowerText.includes("hi")) {
      return "नमस्ते! कंपनी डॉक्स (Company Docx) से संपर्क करने के लिए धन्यवाद। हम आपकी क्या सेवा कर सकते हैं?";
    }
    if (lowerText.includes("documents") || lowerText.includes("draft")) {
      return "दस्तावेज़ सूची: पैन कार्ड, आधार कार्ड और बैंक विवरण। कृपया परामर्श के लिए संपर्क करें।";
    }
    return `[हिंदी] ${text}`;
  }

  if (t === "malayalam") {
    if (lowerText.includes("hello") || lowerText.includes("hi")) {
      return "നമസ്കാരം! കമ്പനി ഡോക്സ് (Company Docx) ലേക്ക് സ്വാഗതം. ഞങ്ങൾ നിങ്ങളെ എങ്ങനെയാണ് സഹായിക്കേണ്ടത്?";
    }
    return `[മലയാളം] ${text}`;
  }

  if (t === "kannada") {
    if (lowerText.includes("hello") || lowerText.includes("hi")) {
      return "ನಮಸ್ಕಾರ! ಕಂಪನಿ ಡಾಕ್ಸ್ (Company Docx) ಗೆ ಸ್ವಾಗತ. ನಾವು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?";
    }
    return `[ಕನ್ನಡ] ${text}`;
  }

  if (t === "telugu") {
    if (lowerText.includes("hello") || lowerText.includes("hi")) {
      return "నమస్కారం! కంపెనీ డాక్స్ (Company Docx) కి స్వాగతం. మేము మీకు ఎలా సహాయపడగలము?";
    }
    return `[తెలుగు] ${text}`;
  }

  return `[Translated to ${targetLanguage}] ${text}`;
}

let overnightAiSettings = {
  enabled: true,
  startHour: 20, // 8 PM
  endHour: 9, // 9 AM
  forceActiveForTesting: true, // Default true to allow instant daytime demoing/testing
  aiName: "Arthur (Docx Overnight AI)",
  systemPrompt: "You are a professional, highly helpful corporate counsel and accountant names Arthur, replying on behalf of Company Docx during off-hours (between 8 PM and 9 AM). Assure the client their message has been logged, provide helpful and authoritative legal/tax advice answering their message, and offer them to secure a fast-track slot at docx.link/consult.",
};

function checkIsOvernightHours(): boolean {
  if (overnightAiSettings.forceActiveForTesting) {
    return true;
  }
  const currentHour = new Date().getHours();
  const start = overnightAiSettings.startHour;
  const end = overnightAiSettings.endHour;
  if (start > end) {
    return currentHour >= start || currentHour < end;
  } else {
    return currentHour >= start && currentHour < end;
  }
}

function handleGeminiApiError(err: any): void {
  const errStr = String(err || "").toLowerCase() + " " + JSON.stringify(err || "");
  if (
    errStr.includes("429") || 
    errStr.includes("403") || 
    errStr.includes("quota") || 
    errStr.includes("exhausted") || 
    errStr.includes("limit") || 
    errStr.includes("denied") || 
    errStr.includes("permission") || 
    errStr.includes("forbidden") || 
    errStr.includes("apierror") || 
    errStr.includes("key")
  ) {
    systemStatus.geminiQuotaExceeded = true;
  }
}

function generateOvernightFallback(lead: any, clientText: string): string {
  const name = lead ? lead.name : "there";
  const userText = clientText.toLowerCase();
  
  let coreHelpfulParagraph = "Thank you for reaching out to Company Docx during our late-night hours. We have logged your enquiry with priority.";
  
  if (userText.includes("audit") || userText.includes("tax") || userText.includes("accounting")) {
    coreHelpfulParagraph = "I notice you require assistance with tax filing or business auditing. Our certified practices specialize in corporate risk management and urgent audit compliance checks. We will definitely make sure Arthur Jenkins reviews this first thing in the morning.";
  } else if (userText.includes("law") || userText.includes("legal") || userText.includes("court") || userText.includes("contract")) {
    coreHelpfulParagraph = "I see your inquiry pertains to corporate legal agreements or board compliance. Our senior staff attorneys can easily draft corporate restructurings and review contracts. They will dissect your case at 9:00 AM sharp.";
  } else if (userText.includes("price") || userText.includes("cost") || userText.includes("fee") || userText.includes("billing")) {
    coreHelpfulParagraph = "Company Docx retains flat consultation rates for our review workshops. This ensures our advisors can pull corporate entity filing records in advance.";
  }

  const suffix = systemStatus.geminiQuotaExceeded
    ? "\n\n*(Notice: Our overnight system is active on sandbox local backup engines because the primary Gemini API daily quota was exceeded. Arthur Jenkins' team is fully notified and available for your morning appointment!)*"
    : "";

  return `Hello ${name}! This is Arthur from the Company Docx overnight support team.

${coreHelpfulParagraph}

Because we are currently closed (we are active on the channels from 9:00 AM to 8:00 PM), I want to bypass the standard queue for you. Please select a premium morning calendar block at docx.link/consult so we have you fully locked in.

Have a great night, and we look forward to finalizing your legal docx tomorrow!${suffix}`;
}


// Lazy initialization pattern for Gemini API Key to protect against startup crashes
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY" && key.trim() !== "") {
      try {
        aiInstance = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
      } catch (err) {
        console.error("Failed to initialize Gemini Client with provided key:", err);
      }
    }
  }
  return aiInstance;
}

// Simulated Latency Middleware
// Evaluates edgeCachingEnabled to showcase solution for "Wati delivery delay" complaints
const simulatedLatencyMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path.startsWith('/api/')) {
    // Determine simulated delay based on edge caching preference
    let latencyMs = 12; // Base caching speed
    if (!systemStatus.edgeCachingEnabled) {
      // Wati/Meta standard compliances delay simulators: 1.2 to 1.8 seconds delay
      latencyMs = Math.floor(Math.random() * 600) + 1100;
    }
    setTimeout(() => {
      // Log headers for debugging
      res.setHeader('X-Response-Delay-Ms', latencyMs.toString());
      res.setHeader('X-Cache-Status', systemStatus.edgeCachingEnabled ? 'HIT-EDGE-NODE' : 'MISS-API-LIMIT');
      next();
    }, latencyMs);
  } else {
    next();
  }
};

app.use(simulatedLatencyMiddleware);

// --- API Endpoints ---

// Simple connection status checks
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", edgeCached: systemStatus.edgeCachingEnabled });
});

// Database Get & Update
app.get("/api/db", (req, res) => {
  res.json({
    leads,
    messages,
    botWorkflowNodes,
    campaigns,
    queueJobs,
    systemStatus,
    employees,
    services
  });
});

app.post("/api/db/update-status", (req, res) => {
  const { edgeCachingEnabled, asyncProcessingEnabled, emailPlatformStatus, emailPlatformName } = req.body;
  if (typeof edgeCachingEnabled === "boolean") systemStatus.edgeCachingEnabled = edgeCachingEnabled;
  if (typeof asyncProcessingEnabled === "boolean") systemStatus.asyncProcessingEnabled = asyncProcessingEnabled;
  if (emailPlatformStatus) systemStatus.emailPlatformStatus = emailPlatformStatus;
  if (emailPlatformName) systemStatus.emailPlatformName = emailPlatformName;
  
  systemStatus.lastSyncAt = new Date().toISOString();
  res.json(systemStatus);
});

// Add message to chat threads
app.post("/api/message/send", (req, res) => {
  const { leadId, sender, content, channel, agentName } = req.body;
  
  const targetLead = leads.find(l => l.id === leadId);
  if (targetLead) {
    targetLead.lastInteractionAt = new Date().toISOString();
  }
  
  const baseLatency = systemStatus.edgeCachingEnabled ? Math.floor(Math.random() * 15) + 5 : Math.floor(Math.random() * 500) + 1200;
  
  const newMsg: Message = {
    id: `msg-${Date.now()}`,
    leadId,
    sender,
    content,
    timestamp: new Date().toISOString(),
    channel: channel || "whatsapp",
    agentName,
    status: "sent",
    latencyMs: baseLatency,
    wasProcessedAsynchronously: systemStatus.asyncProcessingEnabled
  };
  
  messages.push(newMsg);
  
  // Simulated asynchronous chatbot reaction trigger / Optional Overnight AI Assistant
  if (sender === "customer") {
    const isOvernightActive = overnightAiSettings.enabled && checkIsOvernightHours();
    
    // 1. Off-Hours Toast Alert notification creation if active
    if (isOvernightActive) {
      const offHoursNotif = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type: 'non_business_response',
        title: 'Off-Hours Client Response Received',
        message: `Client "${targetLead ? targetLead.name : 'Prospect'}" sent an off-hours enquiry: "${content.substring(0, 45)}..."`,
        timestamp: new Date().toISOString(),
        read: false
      };
      notificationsList.unshift(offHoursNotif);
    }

    // 2. Real-Time Keyword Matching auto-delivery of document list, timeline, charges, address, website
    const contentLower = content.toLowerCase();
    let matchedCategory = "";
    let autoRespondedText = "";

    if (contentLower.includes("audit") || contentLower.includes("tax") || contentLower.includes("bookkeeping") || contentLower.includes("compliance") || contentLower.includes("gst")) {
      matchedCategory = "Tax & Financial Auditing";
      autoRespondedText = `🧾 *OFFICIAL RESOURCE DISPATCH - TAX & AUDITING DIVISION*
Thank you for your enquiry regarding GST filing or Corporate Tax Auditing. Here are the immediate compliance routing details for your dossier:

📋 *Required Document Checklist:*
1. Company PAN & Founder Identity Proofs
2. GSTIN Certificate & Active Portal Login Access
3. Full business Bank Statements (for evaluated period)
4. Tally, Zoho, or raw Ledger spreadsheets

⏱️ *Delivery Timeline:* 5 to 7 Business Days
💳 *Professional Charges:* ₹4,999 (Exclusive of government filing fees)
📍 *Chennai Office Location:* Company Docx Legal Hub, 3rd Floor, Express Chambers, Mount Road, Chennai, Tamil Nadu, 600001
🌐 *Official Gateway website:* www.companydocx.com`;
    } 
    else if (contentLower.includes("incorporation") || contentLower.includes("registration") || contentLower.includes("company") || contentLower.includes("register") || contentLower.includes("pvt ltd") || contentLower.includes("incorporate")) {
      matchedCategory = "Business Registration & Incorporation";
      autoRespondedText = `🏢 *OFFICIAL RESOURCE DISPATCH - DIVISION OF INCORPORATION*
Thank you for your enquiry regarding business formation. Here are the active corporate incorporation metrics:

📋 *Required Document Checklist:*
1. Digital Signatures (DSC) for all directors
2. Founder PAN Cards, Aadhar Cards, and utility bills
3. Proposed company name choices
4. Registered Office lease deed & Owner NOC

⏱️ *Delivery Timeline:* 10 to 14 Business Days
💳 *Professional Charges:* ₹7,499 (All inclusive legal stampings)
📍 *Bengaluru Office Location:* Company Docx Incubator, Tech Workspace Tower, MG Road, Bengaluru, Karnataka, 560001
🌐 *Official Gateway website:* www.companydocx.com`;
    }
    else if (contentLower.includes("trademark") || contentLower.includes("brand") || contentLower.includes("ip") || contentLower.includes("patent") || contentLower.includes("copyright")) {
      matchedCategory = "Intellectual Property & Patents Division";
      autoRespondedText = `🔍 *OFFICIAL RESOURCE DISPATCH - INTELLECTUAL PROPERTY DIVISION*
Thank you for starting your brand security. Trademark and IP registry requirements:

📋 *Required Document Checklist:*
1. High-Resolution brand logo file (JPEG/PNG)
2. MSME / Udyam Certificate (to claim 50% Government rebate)
3. Signed TM-48 Authorization Letter
4. User Affidavit (if brand is already in active use)

⏱️ *Delivery Timeline:* 3 Business Days (Filing certificate issued immediately)
💳 *Professional Charges:* ₹2,999 + statutory Govt filings
📍 *Hyderabad Office Location:* Company Docx, Suite 404, Prestige Block, Gachibowli, Hyderabad, Telangana, 500001
🌐 *Official Gateway website:* www.companydocx.com`;
    }
    else if (contentLower.includes("ngo") || contentLower.includes("trust") || contentLower.includes("society") || contentLower.includes("charity") || contentLower.includes("non-profit")) {
      matchedCategory = "NGO & Trust Registrations Office";
      autoRespondedText = `🌸 *OFFICIAL RESOURCE DISPATCH - NON-PROFIT & NGO CHAMBERS*
Thank you for your concern. NGO Registration protocol:

📋 *Required Document Checklist:*
1. Full member directory (Minimum 3 for trust, 7 for society)
2. Completed Trust Deed Draft or Memorandums
3. Office utility bills & Landlord Consent Form (NOC)
4. Professional background credentials of members

⏱️ *Delivery Timeline:* 15 to 20 Business Days
💳 *Professional Charges:* ₹9,999 (Complete folder preparation support)
📍 *New Delhi Office Location:* Company Docx Chambers, Elite Block, Connaught Place, New Delhi, 110001
🌐 *Official Gateway website:* www.companydocx.com`;
    }

    if (autoRespondedText) {
      setTimeout(() => {
        const instantResourceMsg: Message = {
          id: `msg-resource-${Date.now()}`,
          leadId,
          sender: "bot",
          agentName: "Docx Automated Responder",
          content: autoRespondedText,
          timestamp: new Date().toISOString(),
          channel: channel || "whatsapp",
          status: "read",
          latencyMs: 12,
          wasProcessedAsynchronously: true
        };
        messages.push(instantResourceMsg);
        
        // Register dispatch toast notification
        const autoDispatchNotif = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: "crm_added",
          title: "Auto-Response Card Dispatched",
          message: `Matched "${matchedCategory}" protocol keyword. Document checklist and fee structure auto-shared with ${targetLead?.name || 'Client'} via ${channel.toUpperCase()}.`,
          timestamp: new Date().toISOString(),
          read: false
        };
        notificationsList.unshift(autoDispatchNotif);
      }, 500);
    }

    if (isOvernightActive) {
      const delayTime = systemStatus.edgeCachingEnabled ? 900 : 2200;
      setTimeout(async () => {
        let textReply = "";
        const aiClient = getGeminiClient();
        
        if (aiClient) {
          try {
            const historyText = messages
              .filter(m => m.leadId === leadId)
              .slice(-6)
              .map(m => `${m.sender === "customer" ? "CLIENT" : "ASSISTANT"}: ${m.content}`)
              .join("\n");

            const prompt = `You are a professional, warm and extremely helpful human legal and tax consultant advisor named Arthur, answering late-night messages on behalf of 'Company Docx'.
The current time is between 8 PM and 9 AM.
Client Name: ${targetLead ? targetLead.name : "Valued Customer"}
Client past context notes: ${targetLead ? targetLead.notes : "No past context."}

Conversational context so far:
${historyText}

Current message received from client: "${content}"

Your instructions: ${overnightAiSettings.systemPrompt}
Generate a highly polished, human-sounding reply that addresses their enquiry directly and intelligently as an expert legal or tax consultant. We want them to feel heard. Close by politely asking them to schedule a morning slot at docx.link/consult so we can speak at 9:00 AM sharp. No bracketed text, no system codes, no placeholders.`;

            const response = await aiClient.models.generateContent({
              model: "gemini-3.5-flash",
              contents: prompt,
            });
            textReply = response.text ? response.text.trim() : "";
            systemStatus.geminiQuotaExceeded = false; // reset flag on success!
          } catch (err: any) {
            console.error("Overnight Gemini AI generation failed. Falling back to human-written local templates.", err);
            handleGeminiApiError(err);
          }
        }

        if (!textReply) {
          textReply = generateOvernightFallback(targetLead, content);
        }

        const overnightMsg: Message = {
          id: `msg-overnight-${Date.now()}`,
          leadId,
          sender: "bot",
          agentName: overnightAiSettings.aiName,
          content: textReply,
          timestamp: new Date().toISOString(),
          channel: channel || "whatsapp",
          status: "read",
          latencyMs: systemStatus.edgeCachingEnabled ? 15 : 1250,
          wasProcessedAsynchronously: true
        };
        messages.push(overnightMsg);

        // Register overnight AI trigger toast notification
        const aiNotif = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: "non_business_response",
          title: "Overnight Assist Replied",
          message: `Arthur responded to customer "${targetLead ? targetLead.name : 'Prospect'}" during non-business hours.`,
          timestamp: new Date().toISOString(),
          read: false
        };
        notificationsList.unshift(aiNotif);
        
        if (targetLead) {
          targetLead.lastInteractionAt = new Date().toISOString();
        }
      }, delayTime);
    } else {
      // Standard daytime workflow auto-replies
      if (systemStatus.asyncProcessingEnabled) {
        setTimeout(() => {
          const triggerWelcomeNode = botWorkflowNodes.find(n => n.type === "message" && n.title.includes("Greeting"));
          if (triggerWelcomeNode) {
            const botReply: Message = {
              id: `msg-${Date.now() + 1}`,
              leadId,
              sender: "bot",
              content: `[Automated Response] ${triggerWelcomeNode.textContent}`,
              timestamp: new Date().toISOString(),
              channel: channel || "whatsapp",
              status: "read",
              latencyMs: 8,
              wasProcessedAsynchronously: true
            };
            messages.push(botReply);
          }
        }, 800);
      } else {
        const triggerWelcomeNode = botWorkflowNodes.find(n => n.type === "message" && n.title.includes("Greeting"));
        if (triggerWelcomeNode) {
          const botReply: Message = {
            id: `msg-${Date.now() + 1}`,
            leadId,
            sender: "bot",
            content: `[Automated Response] ${triggerWelcomeNode.textContent}`,
            timestamp: new Date().toISOString(),
            channel: channel || "whatsapp",
            status: "read",
            latencyMs: baseLatency + 100,
            wasProcessedAsynchronously: false
          };
          messages.push(botReply);
        }
      }
    }
  }
  
  res.json({ message: newMsg, leads, messages });
});

// Update or Add Lead to Corporate CRM
app.post("/api/leads", (req, res) => {
  const { name, phone, email, type, status, notes, assignedAgent, consultationFee, score, temperature, keyword } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Prospect Name is required" });
  }
  if (!phone || !phone.trim()) {
    return res.status(400).json({ error: "Mobile Phone Number is required" });
  }
  if (!keyword || !keyword.trim()) {
    return res.status(400).json({ error: "Service Keyword is mandatory to lead adding process!" });
  }

  let temp: 'Hot' | 'Warm' | 'Cold' = temperature || 'Cold';
  let leadScore = score;
  if (leadScore === undefined || leadScore === null) {
    if (temp === 'Hot') leadScore = 85;
    else if (temp === 'Warm') leadScore = 50;
    else leadScore = 20;
  } else {
    leadScore = Number(leadScore);
    if (!temperature) {
      if (leadScore >= 75) temp = 'Hot';
      else if (leadScore >= 35) temp = 'Warm';
      else temp = 'Cold';
    }
  }
  
  const newLead: Lead = {
    id: `lead-${Date.now()}`,
    name: name.trim(),
    phone: phone.trim(),
    email: email || `${name.toLowerCase().replace(/\s+/g, '')}@example-corp.com`,
    type: type || 'law',
    status: status || 'New',
    score: leadScore,
    temperature: temp,
    consultationFee: consultationFee || 'Unpaid',
    assignedAgent: assignedAgent || 'Unassigned',
    notes: notes || '',
    createdAt: new Date().toISOString(),
    lastInteractionAt: new Date().toISOString(),
    keyword: keyword.trim()
  };
  
  leads.push(newLead);
  res.json(newLead);
});

// GET CRM integration-settings
app.get("/api/crm/integration-settings", (req, res) => {
  res.json(crmIntegration);
});

// POST update CRM integration-settings
app.post("/api/crm/integration-settings", (req, res) => {
  const { keyword, welcomeMessage, customCrmUrl, customCrmApiKey, customCrmSecret } = req.body;
  if (typeof keyword === "string") {
    crmIntegration.keyword = keyword.trim();
  }
  if (typeof welcomeMessage === "string") {
    crmIntegration.welcomeMessage = welcomeMessage.trim();
  }
  if (typeof customCrmUrl === "string") {
    crmIntegration.customCrmUrl = customCrmUrl.trim();
  }
  if (typeof customCrmApiKey === "string") {
    crmIntegration.customCrmApiKey = customCrmApiKey.trim();
  }
  if (typeof customCrmSecret === "string") {
    crmIntegration.customCrmSecret = customCrmSecret.trim();
  }
  res.json({ success: true, settings: crmIntegration });
});

// GET Overnight AI Assistant settings
app.get("/api/overnight-ai/settings", (req, res) => {
  res.json(overnightAiSettings);
});

// POST Update Overnight AI Assistant settings
app.post("/api/overnight-ai/settings", (req, res) => {
  const { enabled, startHour, endHour, forceActiveForTesting, aiName, systemPrompt } = req.body;
  if (typeof enabled === "boolean") overnightAiSettings.enabled = enabled;
  if (typeof forceActiveForTesting === "boolean") overnightAiSettings.forceActiveForTesting = forceActiveForTesting;
  if (typeof startHour === "number") overnightAiSettings.startHour = startHour;
  if (typeof endHour === "number") overnightAiSettings.endHour = endHour;
  if (typeof aiName === "string") overnightAiSettings.aiName = aiName.trim();
  if (typeof systemPrompt === "string") overnightAiSettings.systemPrompt = systemPrompt.trim();

  res.json({ success: true, settings: overnightAiSettings });
});

// GET Notifications and Toasts
app.get("/api/notifications", (req, res) => {
  res.json(notificationsList);
});

// POST Clear/Dismiss notifications
app.post("/api/notifications/clear", (req, res) => {
  notificationsList = [];
  res.json({ success: true, notificationsList });
});

// POST Translate API (Gemini/Fallback)
app.post("/api/gemini/translate", async (req, res) => {
  const { text, targetLanguage } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Text is required for translation." });
  }

  const aiClient = getGeminiClient();
  let translatedText = "";

  if (aiClient) {
    try {
      const prompt = `Translate this business/consultation note or chat message from a legal firm client accurately into ${targetLanguage || 'English'}.
Reply ONLY with the translated text itself. Do not include any tags, notes, or introductions:
"${text}"`;
      
      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });
      translatedText = response.text ? response.text.trim() : "";
    } catch (err) {
      console.error("Gemini Translation failed, using fallback mapper", err);
    }
  }

  if (!translatedText) {
    translatedText = getFallbackTranslation(text, targetLanguage || "English");
  }

  res.json({ success: true, translatedText });
});

// Real POST incoming hook from purchased CRM (Salesforce, HubSpot, Zoho, webform, etc.)
app.post("/api/webhooks/crm-lead", (req, res) => {
  const { name, phone, email, type, notes, score } = req.body;
  
  // Optional Authorization signature checks if secrets configured
  const providedKey = req.headers['x-crm-api-key'] || req.headers['X-CRM-API-Key'] || req.headers['authorization'];
  const providedSecret = req.headers['x-crm-secret'] || req.headers['X-CRM-Secret'] || req.headers['x-api-secret'];
  
  if (crmIntegration.customCrmApiKey && providedKey && providedKey !== crmIntegration.customCrmApiKey) {
    return res.status(401).json({
      error: "Authentication Failed: X-CRM-API-Key token mismatch. Please audit headers inside destination controls."
    });
  }
  
  if (crmIntegration.customCrmSecret && providedSecret && providedSecret !== crmIntegration.customCrmSecret) {
    return res.status(401).json({
      error: "Authentication Failed: X-CRM-Secret token signature mismatch."
    });
  }
  
  if (!name || !phone) {
    return res.status(400).json({ 
      error: "Could not integrate incoming CRM lead: 'name' and 'phone' fields are strictly required." 
    });
  }

  const leadScore = score !== undefined ? Number(score) : 45;
  let temp: 'Hot' | 'Warm' | 'Cold' = 'Cold';
  if (leadScore >= 75) temp = 'Hot';
  else if (leadScore >= 35) temp = 'Warm';

  // Automatically assign lead
  let assignedAgent = "Arthur Pendelton";
  if (employees && employees.length > 0) {
    const activeStaff = employees.filter(e => e.role !== 'viewer');
    if (activeStaff.length > 0) {
      // Pick next or random staff
      const pick = activeStaff[Math.floor(Math.random() * activeStaff.length)];
      assignedAgent = `Automatically (${pick.name})`;
    } else {
      assignedAgent = `Automatically (${employees[0].name})`;
    }
  } else {
    assignedAgent = "Automatically (Arthur Pendelton)";
  }

  const newLead: Lead = {
    id: `lead-crm-${Date.now()}`,
    name,
    phone,
    email: email || "unknown@crm-portal.net",
    type: type || 'law',
    status: 'New',
    score: leadScore,
    temperature: temp,
    consultationFee: 'Unpaid',
    assignedAgent,
    notes: `${notes || ''}\n\n[Imported live from external CRM Integration]`,
    createdAt: new Date().toISOString(),
    lastInteractionAt: new Date().toISOString(),
    keyword: req.body.keyword || crmIntegration.keyword || "internal",
    bookingType: 'None',
    bookingStatus: 'Pending',
    bookingTime: ''
  };

  leads.push(newLead);

  // Parse keyword check (Case-insensitive)
  const queryKeyword = (crmIntegration.keyword || "audit").toLowerCase();
  const notesText = (notes || "").toLowerCase();
  const nameText = name.toLowerCase();
  const keywordMatched = notesText.includes(queryKeyword) || nameText.includes(queryKeyword);

  // Real-time toast alert creation for agents
  const newNotif = {
    id: `notif-${Date.now()}`,
    type: 'crm_added',
    title: 'New Client Ingested (CRM Link)',
    message: `${name} has been auto-assigned to ${assignedAgent}. Keyword matched: ${keywordMatched ? 'YES' : 'NO'}.`,
    timestamp: new Date().toISOString(),
    read: false
  };
  notificationsList.unshift(newNotif);

  let whatsappDispatched = false;
  let dispatchedText = "";

  if (keywordMatched && crmIntegration.welcomeMessage) {
    let finalMessage = crmIntegration.welcomeMessage.replace(/{customer}/g, name).replace(/{name}/g, name);
    
    const baseLatency = systemStatus.edgeCachingEnabled ? 9 : 1350;
    const adminWelcomeMessage: Message = {
      id: `msg-crm-${Date.now()}`,
      leadId: newLead.id,
      sender: 'bot', // dispatched through automated whatsapp admin bot
      content: `${finalMessage}`,
      timestamp: new Date().toISOString(),
      channel: 'whatsapp',
      status: 'read',
      latencyMs: baseLatency,
      wasProcessedAsynchronously: true
    };

    messages.push(adminWelcomeMessage);
    newLead.lastInteractionAt = new Date().toISOString();
    whatsappDispatched = true;
    dispatchedText = finalMessage;
  }

  res.json({
    success: true,
    message: keywordMatched 
      ? `CRM lead processed. Keyword "${crmIntegration.keyword}" CAPTURED successfully. Automated Admin WhatsApp welcome was dispatched immediately.`
      : `CRM lead processed. Keyword "${crmIntegration.keyword}" was not found inside lead details. Welcome skip-triggered.`,
    keywordMatched,
    whatsappDispatched,
    dispatchedText,
    lead: newLead
  });
});

// Update single lead context
app.post("/api/leads/:id/update", (req, res) => {
  const leadId = req.params.id;
  const leadIndex = leads.findIndex(l => l.id === leadId);
  
  if (leadIndex !== -1) {
    const updatedLead = { ...leads[leadIndex], ...req.body };
    
    // Auto adjust Temperature and Score parameters harmoniously
    if (req.body.temperature && !req.body.score) {
      if (req.body.temperature === 'Hot') updatedLead.score = 85;
      else if (req.body.temperature === 'Warm') updatedLead.score = 50;
      else updatedLead.score = 20;
    } else if (req.body.score !== undefined && !req.body.temperature) {
      if (updatedLead.score >= 75) updatedLead.temperature = 'Hot';
      else if (updatedLead.score >= 35) updatedLead.temperature = 'Warm';
      else updatedLead.temperature = 'Cold';
    }
    
    updatedLead.lastInteractionAt = new Date().toISOString();
    leads[leadIndex] = updatedLead;
    res.json(updatedLead);
  } else {
    res.status(404).json({ error: "Lead not found" });
  }
});

// Employee Management APIs
app.get("/api/employees", (req, res) => {
  res.json({ employees });
});

app.post("/api/employees", (req, res) => {
  const { name, position, email, phone, role, permissions } = req.body;
  if (!name || !position) {
    return res.status(400).json({ error: "Name and Position are required" });
  }
  const newEmp: Employee = {
    id: `emp-${Date.now()}`,
    name,
    position,
    email: email || `${name.toLowerCase().replace(/\s+/g, '')}@companydocx.com`,
    phone: phone || "+1 (555) 000-0000",
    role: role || "agent",
    permissions: permissions || ["inbox"],
    createdAt: new Date().toISOString()
  };
  employees.push(newEmp);
  res.json({ success: true, employee: newEmp, employees });
});

app.post("/api/employees/:id/update", (req, res) => {
  const empId = req.params.id;
  const idx = employees.findIndex(e => e.id === empId);
  if (idx !== -1) {
    employees[idx] = { ...employees[idx], ...req.body };
    res.json({ success: true, employee: employees[idx], employees });
  } else {
    res.status(404).json({ error: "Employee not found" });
  }
});

app.post("/api/employees/:id/delete", (req, res) => {
  const empId = req.params.id;
  const idx = employees.findIndex(e => e.id === empId);
  if (idx !== -1) {
    const removed = employees.splice(idx, 1);
    res.json({ success: true, removed, employees });
  } else {
    res.status(404).json({ error: "Employee not found" });
  }
});

// Service Portfolio Listing / Catalog APIs
app.get("/api/services", (req, res) => {
  res.json({ services });
});

app.post("/api/services", (req, res) => {
  const { category, name, price, description, requirements } = req.body;
  if (!category || !name || !price) {
    return res.status(400).json({ error: "Category, Name, and Price are required" });
  }
  const srvId = `srv-custom-${Date.now()}`;
  const newSrv: ServiceItem = {
    id: srvId,
    category,
    name,
    price,
    description: description || "",
    requirements: Array.isArray(requirements) ? requirements : (requirements ? [requirements] : [])
  };
  services.push(newSrv);
  res.json({ success: true, service: newSrv, services });
});

app.post("/api/services/:id/update", (req, res) => {
  const srvId = req.params.id;
  const idx = services.findIndex(s => s.id === srvId);
  if (idx !== -1) {
    services[idx] = { ...services[idx], ...req.body };
    res.json({ success: true, service: services[idx], services });
  } else {
    res.status(404).json({ error: "Service not found" });
  }
});

app.post("/api/services/:id/delete", (req, res) => {
  const srvId = req.params.id;
  const idx = services.findIndex(s => s.id === srvId);
  if (idx !== -1) {
    services.splice(idx, 1);
    res.json({ success: true, services });
  } else {
    res.status(404).json({ error: "Service not found" });
  }
});

// Advanced API Lead Auto-Scoring via server-side Gemini
app.post("/api/gemini/score-lead", async (req, res) => {
  const { leadId, details } = req.body;
  const targetLead = leads.find(l => l.id === leadId);
  if (!targetLead) {
    return res.status(404).json({ error: "Lead not found" });
  }

  const aiClient = getGeminiClient();
  
  const prompt = `Analyze this business enquiry and consultation details for a Law & Accounting firm ("Company Docx"). Calculate an objective, hard numerical lead score between 0 and 100 based on consultation fee status, communication activity, and interest level.
Target Client Name: ${targetLead.name}
Inquiry Details: ${details || targetLead.notes}
Division requested: ${targetLead.type.toUpperCase()}
Consultation fee: ${targetLead.consultationFee}
Current client status: ${targetLead.status}

Respond strictly with a JSON object matching this schema:
{
  "score": number, 
  "temperature": "Hot" | "Warm" | "Cold",
  "reasoning": string,
  "actionSteps": string[]
}`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      
      const resText = response.text || "";
      const parsedData = JSON.parse(resText.trim());
      
      // Update CRM state with calculated credentials
      targetLead.score = Math.max(0, Math.min(100, parsedData.score));
      targetLead.temperature = parsedData.temperature;
      targetLead.notes = `${targetLead.notes}\n\n[DocxFlow AI Scoring]: ${parsedData.reasoning}`;
      targetLead.lastInteractionAt = new Date().toISOString();
      
      systemStatus.geminiQuotaExceeded = false; // call succeeded!
      res.json({ success: true, aiScored: parsedData, leads });
    } catch (err: any) {
      console.error("Gemini Lead Scoring failed. Falling back to rule-based algorithm.", err);
      handleGeminiApiError(err);
      // Fail nicely to standard local rules if key has limit issues or parses wrong
      const ruleScore = calculateFallbackScore(targetLead);
      targetLead.score = ruleScore;
      targetLead.temperature = ruleScore >= 75 ? 'Hot' : (ruleScore >= 35 ? 'Warm' : 'Cold');
      res.json({
        success: false,
        warning: "Scoring fallback active (Gemini config missing or key limit).",
        aiScored: {
          score: ruleScore,
          temperature: targetLead.temperature,
          reasoning: "Rule-based analysis active. Consultation payment confirmed or pending.",
          actionSteps: ["Send direct follow-up consultation slots", "Collect administrative paperwork"]
        },
        leads
      });
    }
  } else {
    // Key has not been setup yet, use mock high quality fallback
    const ruleScore = calculateFallbackScore(targetLead);
    targetLead.score = ruleScore;
    targetLead.temperature = ruleScore >= 75 ? 'Hot' : (ruleScore >= 35 ? 'Warm' : 'Cold');
    res.json({
      success: false,
      warning: "Gemini client not initialized. Ensure GEMINI_API_KEY is configured in Settings > Secrets.",
      aiScored: {
        score: ruleScore,
        temperature: targetLead.temperature,
        reasoning: "Local DocxFlow analytics active. Core parameters prioritized representing legal consultation metrics.",
        actionSteps: ["Assigned agent review required", "Send secure payment confirmation template via SMS/Whatsapp"]
      },
      leads
    });
  }
});

function calculateFallbackScore(lead: Lead): number {
  let score = 30;
  if (lead.consultationFee === "Paid") score += 35;
  if (lead.status === "Qualified" || lead.status === "Proposal") score += 20;
  if (lead.notes.toLowerCase().includes("corporate") || lead.notes.toLowerCase().includes("audit")) score += 15;
  return Math.min(100, score);
}

// Generate premium auto-draft responses based on chat interactions using server-side Gemini
app.post("/api/gemini/suggest-reply", async (req, res) => {
  const { leadId, customContext } = req.body;
  const leadMessages = messages.filter(m => m.leadId === leadId).slice(-6);
  const targetLead = leads.find(l => l.id === leadId);
  
  if (!targetLead) {
    return res.status(404).json({ error: "Lead not found" });
  }

  const aiClient = getGeminiClient();
  const baseConversationText = leadMessages.map(m => `${m.sender.toUpperCase()}: ${m.content}`).join("\n");
  
  const prompt = `You are the lead counselor at "Company Docx" (Law & Accounting Firm). 
A client named ${targetLead.name} (seeking ${targetLead.type.toUpperCase()} support) has messaged us.
Context: ${targetLead.notes}
Conversational History:
${baseConversationText}

Custom Context to include: ${customContext || "Keep it highly professional, short, and offer immediate consultation slot reservation via 'docx.link/consult'."}

Provide three highly professional pre-drafted WhatsApp/SMS responses that the team agent can immediately copy and send. Ensure the tone is corporate, elegant and helpful.
Return strictly a JSON object:
{
  "options": [string, string, string]
}`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const parsed = JSON.parse(response.text.trim());
      systemStatus.geminiQuotaExceeded = false; // Successfully parsed reply suggestion
      res.json(parsed);
    } catch (e: any) {
      handleGeminiApiError(e);
      res.json(getDefaultSuggestedReplies(targetLead));
    }
  } else {
    res.json(getDefaultSuggestedReplies(targetLead));
  }
});

function getDefaultSuggestedReplies(lead: Lead) {
  const divisionName = lead.type === "law" ? "Docx Law Division" : "Docx Tax & Corporate Accounting Division";
  return {
    options: [
      `Dear ${lead.name}, thank you for checking in with ${divisionName}. We have reviewed your files and would love to confirm a consultation session this week. Book your secure slot here: docx.link/consult`,
      `Hi ${lead.name}, Arthur Pendelton from Company Docx here. I'm preparing your corporate document drafts. Do you have any secondary audits or bank declarations to append before we finalize?`,
      `Hello ${lead.name}, this is an automated follow-up to check if you have received our onboarding package. Please let us know if we can route you to an active attorney or accountant.`
    ]
  };
}

// Visual Node workflow builder AI Autogeneration
app.post("/api/gemini/generate-workflow", async (req, res) => {
  const { goal } = req.body;
  const aiClient = getGeminiClient();
  const prompt = `Build a complete WhatsApp automated workflow for a digital law/accounting business. The user wants to build a chatbot to handle this goal: ${goal || "Tax client onboarding and billing checklist triage"}.
Generate exactly 4-5 connected BotWorkflowNode elements.
Each node object must have fields:
{
  "id": string (unique node-X),
  "type": "trigger" | "message" | "condition" | "action",
  "title": string,
  "textContent": string,
  "options": [{"id": string, "label": string, "nextNodeId": string}] (only for "message" node type),
  "actionType": "assign_agent" | "set_status" | "score_lead" | "send_email_outbox" (only for "action" node type),
  "actionValue": string,
  "x": number,
  "y": number
}

Ensure coordinates layout beautifully (x starting around 100 with steps of 250, and relative vertical layouts).
Return strictly a JSON array of BotWorkflowNode items.`;

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const parsedWorkflow = JSON.parse(response.text.trim());
      
      // Update our internal nodes with this new AI workflow!
      botWorkflowNodes = parsedWorkflow;
      systemStatus.geminiQuotaExceeded = false; // Successfully called Gemini content!
      res.json({ success: true, botWorkflowNodes });
    } catch (err: any) {
      handleGeminiApiError(err);
      res.status(500).json({ error: "Could not generate flow automatically", fallback: botWorkflowNodes });
    }
  } else {
    // Simply return custom preset workflow nodes for law firm
    res.json({ 
      success: false, 
      warning: "No AI client found. Returning structured Law Consultation menu preset.",
      botWorkflowNodes 
    });
  }
});

// Broadcast Campaign queue and send triggers (Asynchronous Processing Sim)
app.post("/api/campaign/send", (req, res) => {
  const { campaignId } = req.body;
  const targetCampaign = campaigns.find(c => c.id === campaignId);
  
  if (!targetCampaign) {
    return res.status(404).json({ error: "Campaign not found" });
  }

  targetCampaign.status = "Sending";
  targetCampaign.sentCount = 0;
  
  const jobId = `job-${Date.now()}`;
  const newJob: QueueJob = {
    id: jobId,
    type: "campaign_send",
    status: "pending",
    payload: { campaignId, total: targetCampaign.totalContacts },
    progress: 0,
    createdAt: new Date().toISOString()
  };
  
  queueJobs.push(newJob);
  
  // Set up background process
  let progress = 0;
  const intervalTime = systemStatus.asyncProcessingEnabled ? 300 : 1500; // Fast edge processing vs congested Wati raw API waiting
  
  const interval = setInterval(() => {
    progress += 20;
    const job = queueJobs.find(j => j.id === jobId);
    if (job) {
      job.progress = progress;
      job.status = progress >= 100 ? "completed" : "processing";
      
      targetCampaign.sentCount = Math.floor((progress / 100) * targetCampaign.totalContacts);
      
      if (progress >= 100) {
        job.processedAt = new Date().toISOString();
        targetCampaign.status = "Completed";
        targetCampaign.openCount = Math.floor(targetCampaign.totalContacts * 0.82); // high standard response
        targetCampaign.clickCount = Math.floor(targetCampaign.totalContacts * 0.58);
        targetCampaign.roiValue = Math.floor(targetCampaign.clickCount * 120); // attribution estimate
        clearInterval(interval);
      }
    } else {
      clearInterval(interval);
    }
  }, intervalTime);

  res.json({ success: true, campaign: targetCampaign, jobId, queueJobs });
});

app.post("/api/bot-nodes/update", (req, res) => {
  const newNodes = req.body.nodes;
  if (Array.isArray(newNodes)) {
    botWorkflowNodes = newNodes;
  }
  res.json({ success: true, botWorkflowNodes });
});


// Boot Vite Dev / static production logic
async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Web statically deployed inside assets
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
