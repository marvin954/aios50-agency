import { NextRequest, NextResponse } from "next/server";

const BREVO_API_URL = "https://api.brevo.com/v3";

export async function POST(req: NextRequest) {
  const { leads } = await req.json();

  if (!leads || !Array.isArray(leads)) {
    return NextResponse.json({ error: "leads array required" }, { status: 400 });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "BREVO_API_KEY not set" }, { status: 500 });
  }

  const results = [];

  for (const lead of leads) {
    try {
      const res = await fetch(`${BREVO_API_URL}/smtp/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify({
          sender: { name: "Marvin", email: "mammbaent@gmail.com" },
          to: [{ email: lead.email, name: lead.owner_name || lead.business_name }],
          replyTo: { email: "mammbaent@gmail.com" },
          subject: lead.email_subject,
          textContent: lead.email_body,
          htmlContent: `<div style="font-family:Georgia,serif;font-size:14px;line-height:1.8;color:#111;max-width:560px;margin:0 auto">${lead.email_body.replace(/\n/g, "<br/>")}</div>`,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        results.push({ email: lead.email, status: "sent", message_id: data.messageId });
      } else {
        results.push({ email: lead.email, status: "error", error: data.message || JSON.stringify(data) });
      }
    } catch (err) {
      results.push({ email: lead.email, status: "error", error: String(err) });
    }
  }

  const sent = results.filter(r => r.status === "sent").length;

  return NextResponse.json({
    message: `${sent}/${leads.length} emails sent`,
    results,
  });
}
