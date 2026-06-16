import { NextRequest, NextResponse } from "next/server";
import { classifyReply } from "@/lib/agents";
import { createApproval, updateLead } from "@/lib/db";
import { v4 as uuid } from "uuid";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/replies
// Called by Instantly webhook when a lead replies
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Instantly webhook payload structure
  const {
    from_email,
    subject,
    body: emailBody,
    lead_email,
    campaign_id,
  } = body;

  // Find the lead by email
  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("email", from_email || lead_email)
    .single();

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  // AI classification
  const classification = await classifyReply(
    emailBody,
    lead.owner_name || "there",
    lead.business_name
  );

  // Save reply to DB
  const { data: savedReply } = await supabase
    .from("replies")
    .insert({
      id: uuid(),
      lead_id: lead.id,
      from_email: from_email || lead_email,
      subject,
      body: emailBody,
      received_at: new Date().toISOString(),
      intent: classification.intent,
      ai_draft_response: classification.draft_response,
      status: "pending_review",
    })
    .select()
    .single();

  // Update lead status
  await updateLead(lead.id, { status: "replied", replied_at: new Date().toISOString() });

  // If interested or question — create approval for you to review + send
  if (["interested", "question"].includes(classification.intent) && classification.draft_response) {
    await createApproval({
      type: "reply",
      title: `${lead.business_name} replied — ${classification.intent}`,
      description: classification.summary,
      data: {
        ...savedReply,
        draft_response: classification.draft_response,
        business_name: lead.business_name,
        lead_id: lead.id,
      },
      status: "pending",
    });
  }

  // If unsubscribe — auto-handle, no approval needed
  if (classification.intent === "unsubscribe") {
    await updateLead(lead.id, { status: "closed_lost" });
    // TODO: remove from Instantly campaign
  }

  return NextResponse.json({
    message: "Reply processed",
    intent: classification.intent,
    approval_created: ["interested", "question"].includes(classification.intent),
  });
}

// GET /api/replies — view all replies
export async function GET() {
  const { data, error } = await supabase
    .from("replies")
    .select("*, leads(business_name, owner_name, city, business_type)")
    .order("received_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ replies: data });
}
