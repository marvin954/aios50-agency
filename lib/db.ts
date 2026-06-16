import { createClient } from "@supabase/supabase-js";
import type { Lead, Reply, Proposal, ApprovalItem, AgencyStats, Invoice } from "@/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── LEADS ────────────────────────────────────────────────────────────────────

export async function getLeads(filters?: { status?: string; limit?: number }) {
  let query = supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw error;
  return data as Lead[];
}

export async function getLead(id: string) {
  const { data, error } = await supabase.from("leads").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Lead;
}

export async function createLead(lead: Partial<Lead>) {
  const { data, error } = await supabase
    .from("leads")
    .insert({ ...lead, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data as Lead;
}

export async function updateLead(id: string, updates: Partial<Lead>) {
  const { data, error } = await supabase
    .from("leads")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Lead;
}

// ─── APPROVALS ────────────────────────────────────────────────────────────────

export async function getApprovals(status?: string) {
  let query = supabase
    .from("approvals")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  return data as ApprovalItem[];
}

export async function createApproval(item: Omit<ApprovalItem, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("approvals")
    .insert({ ...item, created_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data as ApprovalItem;
}

export async function resolveApproval(id: string, decision: "approved" | "rejected") {
  const { data, error } = await supabase
    .from("approvals")
    .update({ status: decision, resolved_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as ApprovalItem;
}

// ─── REPLIES ──────────────────────────────────────────────────────────────────

export async function getReplies(status?: string) {
  let query = supabase.from("replies").select("*, leads(business_name, owner_name)").order("received_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function updateReply(id: string, updates: Partial<Reply>) {
  const { data, error } = await supabase.from("replies").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

// ─── PROPOSALS ────────────────────────────────────────────────────────────────

export async function getProposals() {
  const { data, error } = await supabase.from("proposals").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data as Proposal[];
}

export async function createProposal(proposal: Partial<Proposal>) {
  const { data, error } = await supabase.from("proposals").insert({ ...proposal, created_at: new Date().toISOString() }).select().single();
  if (error) throw error;
  return data as Proposal;
}

// ─── STATS ────────────────────────────────────────────────────────────────────

export async function getAgencyStats(): Promise<AgencyStats> {
  const [leadsRes, proposalsRes, invoicesRes, approvalsRes] = await Promise.all([
    supabase.from("leads").select("status"),
    supabase.from("proposals").select("status, monthly_retainer, setup_fee"),
    supabase.from("invoices").select("status, amount"),
    supabase.from("approvals").select("status").eq("status", "pending"),
  ]);

  const leads = leadsRes.data || [];
  const proposals = proposalsRes.data || [];
  const invoices = invoicesRes.data || [];

  const mrr = invoices
    .filter((i: any) => i.status === "paid")
    .reduce((sum: number, i: any) => sum + (i.amount || 0), 0);

  const pipelineValue = proposals
    .filter((p: any) => ["draft", "pending_approval", "sent"].includes(p.status))
    .reduce((sum: number, p: any) => sum + ((p.monthly_retainer || 0) * 12), 0);

  return {
    leads: {
      total: leads.length,
      qualified: leads.filter((l: any) => l.status === "qualified").length,
      pending_approval: leads.filter((l: any) => l.status === "pending_approval").length,
      in_sequence: leads.filter((l: any) => l.status === "sent").length,
      replied: leads.filter((l: any) => l.status === "replied").length,
    },
    pipeline: {
      meetings_booked: leads.filter((l: any) => l.status === "meeting_booked").length,
      proposals_sent: leads.filter((l: any) => l.status === "proposal_sent").length,
      deals_won: leads.filter((l: any) => l.status === "closed_won").length,
      deals_lost: leads.filter((l: any) => l.status === "closed_lost").length,
    },
    revenue: {
      mrr,
      total_collected: mrr,
      pipeline_value: pipelineValue,
    },
    approvals_pending: approvalsRes.data?.length || 0,
  };
}
