// ─── LEADS ────────────────────────────────────────────────────────────────────

export type BusinessType =
  | "restaurant" | "dental" | "real_estate" | "salon" | "gym"
  | "law_firm" | "auto_repair" | "plumber" | "hvac" | "retail"
  | "medical" | "accounting" | "insurance" | "contractor" | "other";

export type LeadStatus =
  | "raw"           // just imported from Apollo
  | "qualified"     // AI scored ≥ 70
  | "rejected"      // AI scored < 40
  | "pending_approval" // email drafted, awaiting your approval
  | "approved"      // you approved — queued for Instantly
  | "sent"          // Instantly sent the sequence
  | "replied"       // lead replied to email
  | "meeting_booked"
  | "proposal_sent"
  | "closed_won"
  | "closed_lost";

export interface Lead {
  id: string;
  // Business info
  business_name: string;
  business_type: BusinessType;
  owner_name?: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city: string;
  state: string;
  // AI scoring
  ai_score: number;           // 0-100
  ai_score_reasoning: string;
  pain_points: string[];      // AI identified
  automation_opportunities: string[]; // AI identified
  // Status
  status: LeadStatus;
  // Outreach
  email_subject?: string;
  email_body?: string;
  sequence_id?: string;       // Instantly sequence ID
  // Pipeline
  proposal_value?: number;    // estimated deal value $
  // Timestamps
  created_at: string;
  updated_at: string;
  approved_at?: string;
  replied_at?: string;
}

// ─── OUTREACH ─────────────────────────────────────────────────────────────────

export interface OutreachEmail {
  lead_id: string;
  subject: string;
  body: string;
  follow_up_1: string;  // Day 3
  follow_up_2: string;  // Day 7
  follow_up_3: string;  // Day 14
}

export interface Reply {
  id: string;
  lead_id: string;
  from_email: string;
  subject: string;
  body: string;
  received_at: string;
  // AI classification
  intent: "interested" | "not_interested" | "question" | "out_of_office" | "unsubscribe";
  ai_draft_response?: string;
  status: "pending_review" | "approved" | "sent" | "ignored";
}

// ─── PROPOSALS ────────────────────────────────────────────────────────────────

export interface Proposal {
  id: string;
  lead_id: string;
  business_name: string;
  business_type: BusinessType;
  // Recommended automations
  automations: ProposedAutomation[];
  // Pricing
  setup_fee: number;
  monthly_retainer: number;
  total_value: number;
  // Content
  executive_summary: string;
  roi_projection: string;
  timeline: string;
  // Status
  status: "draft" | "pending_approval" | "sent" | "accepted" | "declined";
  created_at: string;
}

export interface ProposedAutomation {
  name: string;
  description: string;
  time_saved_per_week: number; // hours
  tools: string[];
  setup_complexity: "low" | "medium" | "high";
  monthly_value: number; // $ value to client
}

// ─── DELIVERY ─────────────────────────────────────────────────────────────────

export interface DeliveryProject {
  id: string;
  lead_id: string;
  proposal_id: string;
  business_name: string;
  business_type: BusinessType;
  automations_to_build: ProposedAutomation[];
  // Make.com blueprints
  blueprints: MakeBlueprint[];
  // Status
  status: "not_started" | "building" | "review" | "delivered" | "live";
  created_at: string;
  delivered_at?: string;
}

export interface MakeBlueprint {
  name: string;
  description: string;
  json: object; // Make.com scenario JSON
  setup_instructions: string;
  credentials_needed: string[];
}

// ─── APPROVAL QUEUE ───────────────────────────────────────────────────────────

export type ApprovalType = "outreach_batch" | "reply" | "proposal" | "invoice";

export interface ApprovalItem {
  id: string;
  type: ApprovalType;
  title: string;
  description: string;
  data: any;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  resolved_at?: string;
}

// ─── FINANCE ──────────────────────────────────────────────────────────────────

export interface Invoice {
  id: string;
  lead_id: string;
  business_name: string;
  amount: number;
  type: "setup" | "monthly_retainer";
  status: "draft" | "pending_approval" | "sent" | "paid" | "overdue";
  due_date: string;
  created_at: string;
}

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────

export interface AgencyStats {
  leads: {
    total: number;
    qualified: number;
    pending_approval: number;
    in_sequence: number;
    replied: number;
  };
  pipeline: {
    meetings_booked: number;
    proposals_sent: number;
    deals_won: number;
    deals_lost: number;
  };
  revenue: {
    mrr: number;
    total_collected: number;
    pipeline_value: number;
  };
  approvals_pending: number;
}
