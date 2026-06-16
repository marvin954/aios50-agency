// Brevo (formerly Sendinblue) email sender
// Replaces Instantly for cold outreach sequences

const BREVO_API_URL = "https://api.brevo.com/v3";

interface SendEmailParams {
  to: string;
  toName?: string;
  subject: string;
  body: string;
  replyTo?: string;
}

export async function sendEmail({ to, toName, subject, body, replyTo }: SendEmailParams) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY not set");

  const res = await fetch(`${BREVO_API_URL}/smtp/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: {
        name: "Marvin",
        email: "mammbaent@gmail.com",
      },
      to: [{ email: to, name: toName || to }],
      replyTo: { email: replyTo || "mammbaent@gmail.com" },
      subject,
      textContent: body,
      // Convert plain text line breaks to HTML
      htmlContent: `<div style="font-family:Georgia,serif;font-size:14px;line-height:1.7;color:#111;max-width:560px">${body.replace(/\n/g, "<br/>")}</div>`,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Brevo send failed: ${JSON.stringify(err)}`);
  }

  return await res.json();
}

// ─── SEQUENCE SCHEDULER ───────────────────────────────────────────────────────
// Brevo doesn't have built-in sequences like Instantly
// We use Supabase + a daily cron job to send follow-ups

export async function scheduleSequence(lead: {
  id: string;
  email: string;
  owner_name?: string;
  business_name: string;
  email_subject: string;
  email_body: string;
  follow_up_1?: string;
  follow_up_2?: string;
  follow_up_3?: string;
}) {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const day3  = new Date(now.getTime() + 3  * 24 * 60 * 60 * 1000);
  const day7  = new Date(now.getTime() + 7  * 24 * 60 * 60 * 1000);
  const day14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  // Send initial email immediately
  await sendEmail({
    to: lead.email,
    toName: lead.owner_name || lead.business_name,
    subject: lead.email_subject,
    body: lead.email_body,
  });

  // Schedule follow-ups in DB — cron job picks these up daily
  const followUps = [
    { send_at: day3.toISOString(),  subject: `Re: ${lead.email_subject}`, body: lead.follow_up_1 },
    { send_at: day7.toISOString(),  subject: `Re: ${lead.email_subject}`, body: lead.follow_up_2 },
    { send_at: day14.toISOString(), subject: `Re: ${lead.email_subject}`, body: lead.follow_up_3 },
  ].filter(f => f.body);

  if (followUps.length > 0) {
    await supabase.from("email_sequence_queue").insert(
      followUps.map(f => ({
        lead_id: lead.id,
        to_email: lead.email,
        to_name: lead.owner_name || lead.business_name,
        subject: f.subject,
        body: f.body,
        send_at: f.send_at,
        status: "scheduled",
      }))
    );
  }

  return { sent: true, follow_ups_scheduled: followUps.length };
}
