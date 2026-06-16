import { NextRequest, NextResponse } from "next/server";
import { generateProposal } from "@/lib/agents";
import { getLead, createProposal, createApproval } from "@/lib/db";
import { v4 as uuid } from "uuid";

// POST /api/proposals/generate
export async function POST(req: NextRequest) {
  const { lead_id } = await req.json();

  if (!lead_id) {
    return NextResponse.json({ error: "lead_id required" }, { status: 400 });
  }

  const lead = await getLead(lead_id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  // Generate proposal with AI
  const proposalData = await generateProposal(lead);

  // Save to DB
  const proposal = await createProposal({
    id: uuid(),
    lead_id: lead.id,
    business_name: lead.business_name,
    business_type: lead.business_type,
    automations: proposalData.automations,
    setup_fee: proposalData.setup_fee,
    monthly_retainer: proposalData.monthly_retainer,
    total_value: proposalData.setup_fee + (proposalData.monthly_retainer * 12),
    executive_summary: proposalData.executive_summary,
    roi_projection: proposalData.roi_projection,
    timeline: proposalData.timeline,
    status: "pending_approval",
  });

  // Queue for your approval before sending
  await createApproval({
    type: "proposal",
    title: `Proposal ready — ${lead.business_name} ($${proposalData.monthly_retainer}/mo)`,
    description: `${proposalData.automations.length} automations proposed. Setup: $${proposalData.setup_fee}. Monthly: $${proposalData.monthly_retainer}.`,
    data: { ...proposal, lead_id: lead.id, client_email: lead.email },
    status: "pending",
  });

  return NextResponse.json({
    message: "Proposal generated and queued for your approval",
    proposal,
  });
}
