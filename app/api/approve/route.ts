import { NextRequest, NextResponse } from "next/server";
import { resolveApproval, getApprovals, updateLead } from "@/lib/db";
import { scheduleSequence } from "@/lib/email";

export async function GET() {
  const approvals = await getApprovals("pending");
  return NextResponse.json({ approvals });
}

export async function POST(req: NextRequest) {
  const { approval_id, decision } = await req.json();

  if (!approval_id || !decision) {
    return NextResponse.json({ error: "approval_id and decision required" }, { status: 400 });
  }

  const approval = await resolveApproval(approval_id, decision);

  if (decision === "approved") {
    switch (approval.type) {

      case "outreach_batch": {
        const leads = approval.data as any[];
        const results = [];

        for (const lead of leads) {
          try {
            await scheduleSequence({
              id: lead.id,
              email: lead.email,
              owner_name: lead.owner_name,
              business_name: lead.business_name,
              email_subject: lead.email_subject,
              email_body: lead.email_body,
              follow_up_1: lead.follow_up_1,
              follow_up_2: lead.follow_up_2,
              follow_up_3: lead.follow_up_3,
            });

            await updateLead(lead.id, {
              status: "approved",
              approved_at: new Date().toISOString(),
            });

            results.push({ lead_id: lead.id, status: "sent" });
          } catch (err) {
            results.push({ lead_id: lead.id, status: "error", error: String(err) });
          }
        }

        return NextResponse.json({
          message: `Approved. ${results.filter(r => r.status === "sent").length} emails sent via Brevo.`,
          results,
        });
      }

      case "reply": {
        const reply = approval.data as any;
        const { sendEmail } = await import("@/lib/email");
        await sendEmail({
          to: reply.from_email,
          toName: reply.owner_name,
          subject: reply.subject?.startsWith("Re:") ? reply.subject : `Re: ${reply.subject}`,
          body: reply.draft_response,
        });
        return NextResponse.json({ message: "Reply sent." });
      }

      case "proposal": {
        const proposal = approval.data as any;
        const { sendEmail } = await import("@/lib/email");
        await sendEmail({
          to: proposal.client_email,
          toName: proposal.business_name,
          subject: `Your AI Automation Proposal — ${proposal.business_name}`,
          body: buildProposalEmail(proposal),
        });
        await updateLead(proposal.lead_id, { status: "proposal_sent" });
        return NextResponse.json({ message: `Proposal sent to ${proposal.business_name}.` });
      }

      case "invoice": {
        const invoice = approval.data as any;
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) return NextResponse.json({ message: "Stripe not configured yet — invoice saved as draft." });
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(stripeKey);
        const customer = await stripe.customers.create({ name: invoice.business_name, email: invoice.client_email });
        await stripe.invoiceItems.create({ customer: customer.id, amount: invoice.amount * 100, currency: "usd", description: invoice.description });
        const si = await stripe.invoices.create({ customer: customer.id, collection_method: "send_invoice", days_until_due: 7 });
        await stripe.invoices.sendInvoice(si.id);
        return NextResponse.json({ message: `Invoice of $${invoice.amount} sent.`, url: si.hosted_invoice_url });
      }
    }
  }

  return NextResponse.json({ message: `${decision} — ${approval.type}` });
}

function buildProposalEmail(proposal: any): string {
  const automationList = proposal.automations
    ?.map((a: any, i: number) => `${i + 1}. ${a.name}\n   ${a.description}\n   Time saved: ${a.time_saved_per_week}hrs/week`)
    .join("\n\n") || "";

  return `Hi ${proposal.business_name},

Thank you for your interest. Here's your custom AI automation proposal.

${proposal.executive_summary}

PROPOSED AUTOMATIONS
${automationList}

INVESTMENT
Setup fee: $${proposal.setup_fee}
Monthly retainer: $${proposal.monthly_retainer}/month

ROI PROJECTION
${proposal.roi_projection}

TIMELINE
${proposal.timeline}

To move forward, simply reply to this email or book a call here: [CALENDAR_LINK]

Best,
Marvin
AIOS Agency`;
}
