import { NextRequest, NextResponse } from "next/server";
import { qualifyLead, writeOutreachEmail } from "@/lib/agents";
import { createLead, updateLead, createApproval } from "@/lib/db";
import type { Lead, BusinessType } from "@/types";
import { v4 as uuid } from "uuid";

// POST /api/leads/import
// Body: array of raw leads from Apollo CSV export or manual entry
export async function POST(req: NextRequest) {
  const { leads: rawLeads } = await req.json();

  if (!rawLeads || !Array.isArray(rawLeads)) {
    return NextResponse.json({ error: "leads array required" }, { status: 400 });
  }

  const results = { qualified: 0, rejected: 0, errors: 0, approval_queued: false };
  const approvedBatch: Lead[] = [];

  for (const raw of rawLeads) {
    try {
      // 1. Create raw lead record
      const lead = await createLead({
        id: uuid(),
        business_name: raw.business_name || raw.company,
        business_type: (raw.business_type || "other") as BusinessType,
        owner_name: raw.owner_name || raw.first_name ? `${raw.first_name} ${raw.last_name}` : undefined,
        email: raw.email,
        phone: raw.phone,
        website: raw.website,
        city: raw.city,
        state: raw.state,
        status: "raw",
        ai_score: 0,
        ai_score_reasoning: "",
        pain_points: [],
        automation_opportunities: [],
      });

      // 2. AI qualification
      const qualification = await qualifyLead(lead);

      if (qualification.score < 40) {
        await updateLead(lead.id, {
          status: "rejected",
          ai_score: qualification.score,
          ai_score_reasoning: qualification.reasoning,
          pain_points: qualification.pain_points,
          automation_opportunities: qualification.automation_opportunities,
        });
        results.rejected++;
        continue;
      }

      // 3. Write outreach email for qualified leads
      const updatedLead = await updateLead(lead.id, {
        status: "qualified",
        ai_score: qualification.score,
        ai_score_reasoning: qualification.reasoning,
        pain_points: qualification.pain_points,
        automation_opportunities: qualification.automation_opportunities,
        proposal_value: qualification.estimated_deal_value,
      });

      const email = await writeOutreachEmail(updatedLead);

      await updateLead(lead.id, {
        status: "pending_approval",
        email_subject: email.subject,
        email_body: email.body,
      });

      approvedBatch.push({ ...updatedLead, email_subject: email.subject, email_body: email.body });
      results.qualified++;

    } catch (err) {
      console.error("Lead processing error:", err);
      results.errors++;
    }
  }

  // 4. Create single approval item for the whole batch
  if (approvedBatch.length > 0) {
    await createApproval({
      type: "outreach_batch",
      title: `${approvedBatch.length} outreach emails ready to send`,
      description: `AI qualified ${approvedBatch.length} leads and wrote personalized emails. Review and approve to send via Instantly.`,
      data: approvedBatch,
      status: "pending",
    });
    results.approval_queued = true;
  }

  return NextResponse.json({
    message: `Processed ${rawLeads.length} leads`,
    results,
    next_step: approvedBatch.length > 0 ? "Review pending approvals in your dashboard" : "No qualified leads found",
  });
}

// GET /api/leads — list leads with optional filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;

  const { getLeads } = await import("@/lib/db");
  const leads = await getLeads({ status, limit: 100 });

  return NextResponse.json({ leads });
}
