import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { 
  Mail, 
  HardDrive, 
  FileSpreadsheet, 
  Send, 
  Plus, 
  Trash2, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  FolderPlus, 
  FileUp, 
  Sparkles, 
  Lock, 
  Check, 
  X, 
  LogOut, 
  Users, 
  FileText,
  IndianRupee,
  Clock
} from "lucide-react";
import { 
  googleSignIn, 
  logout, 
  getAccessToken, 
  initAuth 
} from "../services/googleAuth";
import { 
  listGmailMessages, 
  sendGmailEmail, 
  GmailMessageSummary,
  listDriveFiles, 
  createDriveFolder, 
  uploadDriveTextDocument, 
  deleteDriveFile, 
  DriveFileItem,
  createCrmGoogleSheet, 
  getSpreadsheetValues, 
  SpreadsheetInfo 
} from "../services/googleWorkspaceApi";
import { Lead } from "../types";

interface GoogleWorkspaceHubProps {
  leads: Lead[];
}

export default function GoogleWorkspaceHub({ leads }: GoogleWorkspaceHubProps) {
  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'gmail' | 'drive' | 'sheets'>('gmail');

  // Status & Feedback Toasts
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Confirmation Modal State (MANDATORY for Mutating / Destructive Operations)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    isDestructive?: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    actionLabel: "",
    onConfirm: async () => {}
  });

  // ==========================
  // Gmail State
  // ==========================
  const [gmailMessages, setGmailMessages] = useState<GmailMessageSummary[]>([]);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [gmailQuery, setGmailQuery] = useState("");
  // Gmail Compose
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  // ==========================
  // Drive State
  // ==========================
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveQuery, setDriveQuery] = useState("");
  // Drive Modals
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDocName, setUploadDocName] = useState("");
  const [uploadDocContent, setUploadDocContent] = useState("");

  // ==========================
  // Sheets State
  // ==========================
  const [createdSheets, setCreatedSheets] = useState<SpreadsheetInfo[]>([]);
  const [sheetsLoading, setSheetsLoading] = useState(false);
  const [sheetTitle, setSheetTitle] = useState("Company Docx - CRM Leads & Financial Retainers");
  const [previewSheetId, setPreviewSheetId] = useState<string | null>(null);
  const [previewValues, setPreviewValues] = useState<any[][]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Trigger brief alert feedback
  const showNotice = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Initialize Auth state on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // When token is available, automatically load initial data for active tab
  useEffect(() => {
    if (token) {
      if (activeTab === 'gmail') loadGmail();
      if (activeTab === 'drive') loadDrive();
    }
  }, [token, activeTab]);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        showNotice('success', `Signed in successfully as ${res.user.displayName || res.user.email}`);
      }
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to sign in with Google');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setGmailMessages([]);
    setDriveFiles([]);
    setCreatedSheets([]);
    showNotice('success', 'Logged out of Google Workspace account');
  };

  // ==========================
  // Gmail Operations
  // ==========================
  const loadGmail = async () => {
    if (!token) return;
    setGmailLoading(true);
    try {
      const msgs = await listGmailMessages(token, 10, gmailQuery);
      setGmailMessages(msgs);
    } catch (err: any) {
      showNotice('error', `Failed to load Gmail messages: ${err.message}`);
    } finally {
      setGmailLoading(false);
    }
  };

  const promptSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo || !composeSubject || !composeBody) {
      showNotice('error', 'Please fill in recipient, subject, and message content.');
      return;
    }

    // MANDATORY Confirmation Dialog before sending email on behalf of user
    setConfirmDialog({
      isOpen: true,
      title: "Confirm Sending Gmail Message",
      description: `Are you sure you want to send this email to "${composeTo}" with subject "${composeSubject}" from your official Google Workspace account?`,
      actionLabel: "Send Email",
      isDestructive: false,
      onConfirm: async () => {
        setSendingEmail(true);
        try {
          if (!token) throw new Error("No active Google token");
          await sendGmailEmail(token, composeTo, composeSubject, composeBody);
          showNotice('success', `✔ Email successfully dispatched to ${composeTo} via Gmail!`);
          setShowComposeModal(false);
          setComposeTo("");
          setComposeSubject("");
          setComposeBody("");
          await loadGmail();
        } catch (err: any) {
          showNotice('error', `Failed to dispatch email: ${err.message}`);
        } finally {
          setSendingEmail(false);
        }
      }
    });
  };

  // Quick action to email a lead
  const prepareEmailForLead = (lead: Lead) => {
    setComposeTo(lead.email);
    setComposeSubject(`Company Docx Legal & Compliance Update - ${lead.name}`);
    setComposeBody(
      `Dear ${lead.name},\n\nThank you for choosing Company Docx Law & Accounting. We have reviewed your case regarding ${lead.keyword || "corporate services"}.\n\nYour preliminary filing scope and retainer status has been recorded.\n\nWarm regards,\nCompany Docx Counsel & Tax Advisory Team\nBroadway, Chennai`
    );
    setShowComposeModal(true);
  };

  // ==========================
  // Drive Operations
  // ==========================
  const loadDrive = async () => {
    if (!token) return;
    setDriveLoading(true);
    try {
      const files = await listDriveFiles(token, 20, driveQuery);
      setDriveFiles(files);
    } catch (err: any) {
      showNotice('error', `Failed to load Drive files: ${err.message}`);
    } finally {
      setDriveLoading(false);
    }
  };

  const promptCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setConfirmDialog({
      isOpen: true,
      title: "Create Folder in Google Drive",
      description: `Create a new Google Drive folder named "${newFolderName}" for corporate case records?`,
      actionLabel: "Create Folder",
      isDestructive: false,
      onConfirm: async () => {
        try {
          if (!token) throw new Error("No active Google token");
          await createDriveFolder(token, newFolderName.trim());
          showNotice('success', `Folder "${newFolderName}" created on Google Drive!`);
          setShowNewFolderModal(false);
          setNewFolderName("");
          await loadDrive();
        } catch (err: any) {
          showNotice('error', `Failed creating folder: ${err.message}`);
        }
      }
    });
  };

  const promptUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadDocName.trim() || !uploadDocContent.trim()) return;

    setConfirmDialog({
      isOpen: true,
      title: "Upload Document to Google Drive",
      description: `Upload text file "${uploadDocName}.txt" to your Google Drive?`,
      actionLabel: "Upload Document",
      isDestructive: false,
      onConfirm: async () => {
        try {
          if (!token) throw new Error("No active Google token");
          await uploadDriveTextDocument(token, `${uploadDocName.trim()}.txt`, uploadDocContent);
          showNotice('success', `Document "${uploadDocName}.txt" uploaded to Google Drive!`);
          setShowUploadModal(false);
          setUploadDocName("");
          setUploadDocContent("");
          await loadDrive();
        } catch (err: any) {
          showNotice('error', `Upload failed: ${err.message}`);
        }
      }
    });
  };

  const promptDeleteFile = (file: DriveFileItem) => {
    // MANDATORY Confirmation Dialog for file deletion
    setConfirmDialog({
      isOpen: true,
      title: "Delete File from Google Drive",
      description: `Are you sure you want to permanently delete "${file.name}"? This action cannot be undone.`,
      actionLabel: "Delete Permanently",
      isDestructive: true,
      onConfirm: async () => {
        try {
          if (!token) throw new Error("No active Google token");
          await deleteDriveFile(token, file.id);
          showNotice('success', `File "${file.name}" deleted from Google Drive.`);
          await loadDrive();
        } catch (err: any) {
          showNotice('error', `Failed to delete file: ${err.message}`);
        }
      }
    });
  };

  // ==========================
  // Sheets Operations
  // ==========================
  const promptSyncLeadsToSheet = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Export CRM Leads & Retainers to Google Sheets",
      description: `This will create a new Google Spreadsheet titled "${sheetTitle}" in your Google Drive with all ${leads.length} active leads and Indian Rupee financial retainer data.`,
      actionLabel: "Create Spreadsheet",
      isDestructive: false,
      onConfirm: async () => {
        setSheetsLoading(true);
        try {
          if (!token) throw new Error("No active Google token");
          const sheet = await createCrmGoogleSheet(token, sheetTitle, leads);
          setCreatedSheets(prev => [sheet, ...prev]);
          showNotice('success', `✔ Google Sheet created successfully! Title: "${sheet.properties.title}"`);
          // Automatically load preview
          await handlePreviewSheet(sheet.spreadsheetId);
        } catch (err: any) {
          showNotice('error', `Failed to export to Google Sheets: ${err.message}`);
        } finally {
          setSheetsLoading(false);
        }
      }
    });
  };

  const handlePreviewSheet = async (spreadsheetId: string) => {
    if (!token) return;
    setPreviewLoading(true);
    setPreviewSheetId(spreadsheetId);
    try {
      const data = await getSpreadsheetValues(token, spreadsheetId, "A1:O15");
      setPreviewValues(data.values || []);
    } catch (err: any) {
      showNotice('error', `Failed reading sheet cells: ${err.message}`);
      setPreviewValues([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans" id="google-workspace-hub-root">
      
      {/* 1. Header Banner & Sign-In Status */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono py-1 px-3 rounded-full uppercase tracking-wider font-extrabold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Google Workspace Connected Suite
            </span>
            <span className="text-slate-400 text-xs font-mono">OAuth 2.0 Client Flow</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Google Workspace Command Center
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Manage Gmail communication with clients, organize legal dossiers in Google Drive, and sync CRM leads & financial retainers into live Google Sheets.
          </p>
        </div>

        {/* Official Google Sign-In / Account Status */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0 self-stretch md:self-center">
          {user ? (
            <div className="flex items-center gap-3 bg-slate-800/90 border border-slate-700 p-2.5 px-4 rounded-xl shadow-inner">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || "User"} 
                  className="w-9 h-9 rounded-full border border-slate-600"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                  {user.displayName?.[0] || user.email?.[0] || "U"}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white leading-tight">
                  {user.displayName || "Google Workspace User"}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {user.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="ml-2 p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition"
                title="Disconnect Google account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={isLoggingIn}
              className="gsi-material-button flex items-center gap-3 bg-white hover:bg-slate-50 text-slate-800 font-bold px-4 py-2.5 rounded-xl border border-slate-300 shadow-md transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              id="google-signin-btn"
            >
              <div className="w-5 h-5">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-full h-full block">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
              <span className="text-xs font-semibold">
                {isLoggingIn ? "Authenticating..." : "Sign in with Google"}
              </span>
            </button>
          )}
          <span className="text-[10px] text-slate-400 font-mono">
            {user ? "✓ Scopes authorized: Gmail, Drive & Sheets" : "Connect with permission from app users"}
          </span>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div 
          className={`p-3.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-between shadow-sm animate-fadeIn ${
            feedback.type === 'success' 
              ? "bg-emerald-50 text-emerald-800 border-emerald-300" 
              : "bg-rose-50 text-rose-800 border-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-sm font-bold opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* 2. Three Dedicated Workspace Services Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col min-h-[580px]">
        
        {/* Navigation Tab Bar */}
        <div className="bg-slate-100/80 p-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('gmail')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'gmail' 
                  ? "bg-white text-indigo-700 shadow-sm border border-slate-200" 
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
              id="ws-tab-gmail"
            >
              <Mail className="w-4 h-4 text-red-500" />
              <span>1. Gmail Client Dispatch</span>
            </button>

            <button
              onClick={() => setActiveTab('drive')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'drive' 
                  ? "bg-white text-indigo-700 shadow-sm border border-slate-200" 
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
              id="ws-tab-drive"
            >
              <HardDrive className="w-4 h-4 text-blue-500" />
              <span>2. Google Drive Dossiers</span>
            </button>

            <button
              onClick={() => setActiveTab('sheets')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'sheets' 
                  ? "bg-white text-indigo-700 shadow-sm border border-slate-200" 
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
              id="ws-tab-sheets"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>3. Google Sheets CRM Sync</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 pr-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Workspace API v3/v4</span>
          </div>
        </div>

        {/* Content Area when signed in or not */}
        {!user ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-4 bg-slate-50/50">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-md">
              <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-sans">
              Sign In to Activate Google Workspace Services
            </h3>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              Connect your Google account with permission to access Gmail inbox & dispatch, Google Drive client document vaults, and live Google Sheets syncing.
            </p>
            <button
              onClick={handleSignIn}
              disabled={isLoggingIn}
              className="mt-2 flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition active:scale-95 cursor-pointer"
            >
              <span>Connect Google Workspace Now</span>
            </button>
          </div>
        ) : (
          <div className="p-6 flex-1 flex flex-col gap-6">

            {/* TAB 1: GMAIL INTEGRATION */}
            {activeTab === 'gmail' && (
              <div className="flex flex-col gap-5 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-red-500" />
                      Gmail Client Communications Suite
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Send official legal updates, consultation confirmations, and triage emails via the Gmail API.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={loadGmail}
                      disabled={gmailLoading}
                      className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                      title="Refresh Gmail messages"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${gmailLoading ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>

                    <button
                      onClick={() => setShowComposeModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition"
                      id="gmail-compose-btn"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Compose New Email</span>
                    </button>
                  </div>
                </div>

                {/* Quick Client Email Shortcuts */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-500">
                    Quick Email to Active CRM Leads
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {leads.slice(0, 4).map(lead => (
                      <button
                        key={lead.id}
                        onClick={() => prepareEmailForLead(lead)}
                        className="bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-800 text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition shadow-sm"
                      >
                        <span className="font-bold text-indigo-700">{lead.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({lead.email})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Bar */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={gmailQuery}
                      onChange={(e) => setGmailQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && loadGmail()}
                      placeholder="Search Gmail messages by client name, email, or keyword..."
                      className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg outline-none bg-slate-50 focus:bg-white focus:border-indigo-500"
                    />
                  </div>
                  <button
                    onClick={loadGmail}
                    className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg"
                  >
                    Search
                  </button>
                </div>

                {/* Messages List */}
                {gmailLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                    <span className="text-xs font-mono">Fetching latest messages from Gmail...</span>
                  </div>
                ) : gmailMessages.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                    No matching Gmail messages found. Click "Compose New Email" to send an email!
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                    {gmailMessages.map((msg) => (
                      <div key={msg.id} className="p-4 hover:bg-slate-50/70 transition flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 font-sans">
                            {msg.subject || "(No Subject)"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {msg.date ? new Date(msg.date).toLocaleDateString() : ""}
                          </span>
                        </div>
                        <span className="text-[11px] text-indigo-700 font-mono font-medium">
                          From: {msg.from}
                        </span>
                        <p className="text-xs text-slate-500 line-clamp-1 italic mt-0.5">
                          {msg.snippet}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: GOOGLE DRIVE INTEGRATION */}
            {activeTab === 'drive' && (
              <div className="flex flex-col gap-5 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <HardDrive className="w-5 h-5 text-blue-500" />
                      Google Drive Client Vault & File Storage
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Store corporate dossiers, incorporation charters, and tax records securely on Google Drive.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={loadDrive}
                      disabled={driveLoading}
                      className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                      title="Refresh Drive files"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${driveLoading ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>

                    <button
                      onClick={() => setShowNewFolderModal(true)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 border border-slate-200 transition"
                    >
                      <FolderPlus className="w-3.5 h-3.5 text-amber-600" />
                      <span>New Folder</span>
                    </button>

                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition"
                    >
                      <FileUp className="w-3.5 h-3.5" />
                      <span>Upload Document</span>
                    </button>
                  </div>
                </div>

                {/* Drive Files Grid / List */}
                {driveLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="text-xs font-mono">Loading files from Google Drive...</span>
                  </div>
                ) : driveFiles.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                    No files found on Google Drive. Click "Upload Document" or "New Folder" to add records!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {driveFiles.map((file) => {
                      const isFolder = file.mimeType === "application/vnd.google-apps.folder";
                      return (
                        <div 
                          key={file.id} 
                          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between gap-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isFolder ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                              }`}>
                                {isFolder ? <FolderPlus className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                              </div>
                              <span className="font-bold text-xs text-slate-900 truncate" title={file.name}>
                                {file.name}
                              </span>
                            </div>
                            <button
                              onClick={() => promptDeleteFile(file)}
                              className="text-slate-300 hover:text-rose-600 p-1 rounded transition"
                              title="Delete file permanently (requires confirmation)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-slate-100 pt-2">
                            <span>{file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : ""}</span>
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-0.5 font-bold"
                              >
                                <span>Open in Drive</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: GOOGLE SHEETS INTEGRATION */}
            {activeTab === 'sheets' && (
              <div className="flex flex-col gap-5 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                      Google Sheets Live CRM Synchronization
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Sync CRM leads, corporate divisions, and Indian Rupee retainer data into real Google Sheets spreadsheets.
                    </p>
                  </div>

                  <button
                    onClick={promptSyncLeadsToSheet}
                    disabled={sheetsLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition active:scale-95"
                    id="sheets-create-btn"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Sync Leads to New Google Sheet</span>
                  </button>
                </div>

                {/* Configuration Bar */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex-1 w-full">
                    <label className="text-[10px] uppercase font-mono font-bold text-slate-500 block mb-1">
                      Spreadsheet Document Title
                    </label>
                    <input
                      type="text"
                      value={sheetTitle}
                      onChange={(e) => setSheetTitle(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200 self-stretch md:self-end">
                    <IndianRupee className="w-4 h-4 text-emerald-600" />
                    <span>Includes <strong>INR Retainer</strong> (₹1,499) column formatting</span>
                  </div>
                </div>

                {/* Created Sheets History */}
                {createdSheets.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                      Synchronized Spreadsheets
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {createdSheets.map((sheet) => (
                        <div 
                          key={sheet.spreadsheetId}
                          className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-sm flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                              <FileSpreadsheet className="w-4 h-4" />
                            </div>
                            <div>
                              <h5 className="font-bold text-xs text-slate-900">{sheet.properties.title}</h5>
                              <span className="text-[10px] text-slate-400 font-mono">ID: {sheet.spreadsheetId.slice(0, 16)}...</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handlePreviewSheet(sheet.spreadsheetId)}
                              className="text-[10px] font-bold text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded border border-emerald-200 transition"
                            >
                              Live Preview
                            </button>
                            {sheet.spreadsheetUrl && (
                              <a
                                href={sheet.spreadsheetUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2 py-1 rounded flex items-center gap-1 transition shadow-sm"
                              >
                                <span>Open</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Sheet Grid Preview */}
                {previewSheetId && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div className="bg-slate-900 text-white p-3 px-4 flex items-center justify-between text-xs">
                      <span className="font-mono font-bold flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        Google Sheet Live Cell Preview (First 15 Rows)
                      </span>
                      <button
                        onClick={() => handlePreviewSheet(previewSheetId)}
                        disabled={previewLoading}
                        className="text-[10px] text-slate-300 hover:text-white flex items-center gap-1 font-mono"
                      >
                        <RefreshCw className={`w-3 h-3 ${previewLoading ? 'animate-spin' : ''}`} />
                        <span>Refresh Cells</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto max-h-72">
                      {previewLoading ? (
                        <div className="p-8 text-center text-xs text-slate-400 font-mono">
                          Loading cell range from Google Sheets API...
                        </div>
                      ) : previewValues.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 font-mono">
                          No cells populated in preview range.
                        </div>
                      ) : (
                        <table className="w-full text-left text-xs border-collapse">
                          <tbody>
                            {previewValues.map((row, rIdx) => (
                              <tr 
                                key={rIdx} 
                                className={rIdx === 0 ? "bg-slate-100 font-bold text-slate-900 border-b border-slate-200" : "border-b border-slate-100 hover:bg-slate-50"}
                              >
                                {row.map((cell: any, cIdx: number) => (
                                  <td key={cIdx} className="p-2 px-3 whitespace-nowrap font-mono text-[11px] border-r border-slate-100">
                                    {String(cell || "")}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* MANDATORY CONFIRMATION DIALOG (For Destructive Operations) */}
      {/* ======================================================== */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md border border-slate-200 shadow-2xl overflow-hidden p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                confirmDialog.isDestructive ? "bg-rose-100 text-rose-600" : "bg-indigo-100 text-indigo-600"
              }`}>
                {confirmDialog.isDestructive ? <Trash2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 font-sans">
                  {confirmDialog.title}
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">User Authorization Required</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
              {confirmDialog.description}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  await confirmDialog.onConfirm();
                }}
                className={`text-xs font-bold px-4 py-2 rounded-lg text-white shadow transition ${
                  confirmDialog.isDestructive 
                    ? "bg-rose-600 hover:bg-rose-700" 
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {confirmDialog.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compose Gmail Modal Dialog */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-slate-900 text-white p-4 px-5 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-2">
                <Mail className="w-4 h-4 text-red-400" />
                Compose Official Gmail Message
              </h4>
              <button
                onClick={() => setShowComposeModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={promptSendEmail} className="p-5 flex flex-col gap-4 text-xs text-slate-700">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">Recipient Email (To:) *</label>
                <input
                  type="email"
                  required
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="client@enterprise.com"
                  className="p-2.5 border border-slate-300 rounded-lg outline-none bg-slate-50 focus:bg-white text-xs font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">Email Subject *</label>
                <input
                  type="text"
                  required
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="e.g. Company Docx - Corporate Restructuring Retainer Advice"
                  className="p-2.5 border border-slate-300 rounded-lg outline-none bg-slate-50 focus:bg-white text-xs font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700">Message Body *</label>
                <textarea
                  required
                  rows={5}
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Write message content to send via your Gmail account..."
                  className="p-2.5 border border-slate-300 rounded-lg outline-none bg-slate-50 focus:bg-white text-xs leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-bold flex items-center gap-1.5 shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Review & Send</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Drive Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-slate-200 shadow-2xl p-5 flex flex-col gap-4">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-amber-500" />
              Create Client Dossier Folder
            </h4>
            <form onSubmit={promptCreateFolder} className="flex flex-col gap-3">
              <input
                type="text"
                required
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g. Clara Sterling - Corporate Restructure Dossier"
                className="p-2.5 border border-slate-300 rounded-lg text-xs outline-none focus:border-indigo-500"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Drive Text Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md border border-slate-200 shadow-2xl p-5 flex flex-col gap-4">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileUp className="w-5 h-5 text-blue-500" />
              Upload Client Note / Retainer Memo
            </h4>
            <form onSubmit={promptUploadDocument} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 mb-1 block">File Title</label>
                <input
                  type="text"
                  required
                  value={uploadDocName}
                  onChange={(e) => setUploadDocName(e.target.value)}
                  placeholder="e.g. Devon Harris Audit Scope Summary"
                  className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 mb-1 block">Document Text Content</label>
                <textarea
                  required
                  rows={4}
                  value={uploadDocContent}
                  onChange={(e) => setUploadDocContent(e.target.value)}
                  placeholder="Enter notes, legal points, or retainer provisions..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-lg font-bold"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
