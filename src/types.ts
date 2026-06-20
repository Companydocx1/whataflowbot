export type UserRole = 'admin' | 'agent' | 'viewer';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: 'law' | 'accounting'; // Tallored for Law & Accounting
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Closed_Won' | 'Closed_Lost';
  score: number; // 0-100 Lead Score
  temperature: 'Hot' | 'Warm' | 'Cold'; // Temperature based on lead score
  consultationFee: 'Unpaid' | 'Paid' | 'Waived'; // Legal / tax consultation fee
  assignedAgent: string;
  notes: string;
  createdAt: string;
  lastInteractionAt: string;
  keyword: string; // Service keyword (mandatory)
  bookingType?: 'Direct' | 'Virtual' | 'None';
  bookingStatus?: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  bookingTime?: string;
}

export interface InteractionHistory {
  id: string;
  leadId: string;
  timestamp: string;
  type: 'whatsapp' | 'sms' | 'email' | 'call' | 'consultation';
  summary: string;
  cost?: number; // Usage fee tracker
}

export interface Message {
  id: string;
  leadId: string;
  sender: 'customer' | 'agent' | 'bot';
  content: string;
  timestamp: string;
  channel: 'whatsapp' | 'sms' | 'email';
  agentName?: string;
  status: 'sent' | 'delivered' | 'read';
  latencyMs?: number; // Tracks actual simulated API latency VS cached speed
  wasProcessedAsynchronously?: boolean;
}

export interface BotWorkflowNode {
  id: string;
  type: 'trigger' | 'message' | 'condition' | 'action';
  title: string;
  textContent: string;
  options?: Array<{ id: string; label: string; nextNodeId?: string }>;
  actionType?: 'assign_agent' | 'set_status' | 'score_lead' | 'send_email_outbox';
  actionValue?: string;
  x: number;
  y: number;
}

export interface Campaign {
  id: string;
  name: string;
  channel: 'whatsapp' | 'sms' | 'email_broadcast';
  templateName: string;
  status: 'Draft' | 'Queued' | 'Sending' | 'Completed';
  sentCount: number;
  totalContacts: number;
  openCount: number;
  clickCount: number;
  roiValue?: number; // Financial return attribution
  createdAt: string;
  scheduledAt?: string;
}

export interface QueueJob {
  id: string;
  type: 'campaign_send' | 'webhook_payload';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payload: any;
  progress: number;
  createdAt: string;
  processedAt?: string;
}

export interface SystemStatus {
  edgeCachingEnabled: boolean;
  asyncProcessingEnabled: boolean;
  lastSyncAt: string;
  activeAgentsCount: number;
  emailPlatformStatus: 'connected' | 'disconnected';
  emailPlatformName: 'ActiveCampaign' | 'Mailchimp' | 'HubSpot' | 'Postmark';
  whatsAppApiStatus: 'ready' | 'delay' | 'restricted';
  geminiQuotaExceeded?: boolean;
}

export interface Employee {
  id: string;
  name: string;
  position: 'Admin' | 'Senior Consultant' | 'Junior Draftsman' | 'Tax Auditor' | 'Virtual Office Executive' | 'Support Agent';
  email: string;
  phone: string;
  role: 'admin' | 'agent' | 'viewer';
  permissions: string[]; // List of permission keys: e.g. ['all', 'billing', 'inbox']
  createdAt: string;
}

export interface ServiceItem {
  id: string;
  category: 'business_reg' | 'ngo_reg' | 'ip_reg' | 'legal_accounting' | 'website' | 'registered_office' | 'industry_cert';
  name: string;
  price: string;
  description: string;
  requirements: string[];
}
