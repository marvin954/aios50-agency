import Anthropic from "@anthropic-ai/sdk";
import type { BusinessType, MakeBlueprint } from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── PREBUILT BLUEPRINTS ──────────────────────────────────────────────────────
// These are Make.com scenario structures we generate per client

export const AUTOMATION_LIBRARY: Record<string, {
  name: string;
  description: string;
  applicable_to: BusinessType[];
  setup_instructions: string;
  credentials_needed: string[];
  template: object;
}> = {
  missed_call_sms: {
    name: "Missed Call → Instant SMS",
    description: "When a customer call is missed, automatically send them a personalized SMS within 60 seconds offering to call back or book online.",
    applicable_to: ["dental", "salon", "gym", "law_firm", "medical", "auto_repair", "plumber", "hvac"],
    setup_instructions: "1. Connect Twilio account\n2. Set your business phone number\n3. Customize the SMS template\n4. Connect to your phone system via webhook",
    credentials_needed: ["Twilio Account SID", "Twilio Auth Token", "Business Phone Number"],
    template: {
      name: "Missed Call Auto-SMS",
      flow: [
        { id: 1, module: "webhook:receiver", label: "Missed Call Webhook" },
        { id: 2, module: "claude:message", label: "Personalize SMS", config: { prompt: "Write a friendly SMS to {caller_name} who just missed a call from {business_name}. Keep under 160 chars. Offer to call back or book at {booking_link}" } },
        { id: 3, module: "twilio:sendSms", label: "Send SMS", config: { to: "{{1.caller_number}}", body: "{{2.response}}" } }
      ]
    }
  },
  review_request: {
    name: "Post-Service Review Request",
    description: "48 hours after service completion, automatically send a personalized email + SMS asking for a Google review.",
    applicable_to: ["restaurant", "dental", "salon", "gym", "auto_repair", "plumber", "hvac", "medical"],
    setup_instructions: "1. Connect to your booking/POS system\n2. Add your Google review link\n3. Set timing delay (default 48hrs)\n4. Customize message templates",
    credentials_needed: ["Twilio (SMS)", "SendGrid or Gmail (email)", "Booking system API or webhook", "Google Review Link"],
    template: {
      name: "Review Request Sequence",
      flow: [
        { id: 1, module: "webhook:receiver", label: "Service Completed" },
        { id: 2, module: "make:sleep", label: "Wait 48 hours", config: { delay: 172800 } },
        { id: 3, module: "claude:message", label: "Write Review Request", config: { prompt: "Write a warm review request to {customer_name} who just used {business_name} for {service}. Mention their specific service. Include: {review_link}" } },
        { id: 4, module: "sendgrid:sendEmail", label: "Send Email" },
        { id: 5, module: "twilio:sendSms", label: "Send SMS (same day)" }
      ]
    }
  },
  lead_followup: {
    name: "New Lead Auto Follow-Up",
    description: "When a contact form or inquiry comes in, instantly respond with a personalized email within 2 minutes, then follow up at day 1, 3, and 7.",
    applicable_to: ["real_estate", "law_firm", "insurance", "contractor", "hvac", "plumber", "accounting"],
    setup_instructions: "1. Connect your contact form (Typeform, Gravity Forms, website)\n2. Set up email account\n3. Customize follow-up sequence timing\n4. Add your calendar booking link",
    credentials_needed: ["Form webhook URL", "Gmail or SendGrid", "Calendar link (Calendly)"],
    template: {
      name: "Lead Follow-Up Sequence",
      flow: [
        { id: 1, module: "webhook:receiver", label: "New Lead Form Submission" },
        { id: 2, module: "claude:message", label: "Write Instant Response", config: { prompt: "Write an immediate, warm response to {lead_name} who inquired about {service} from {business_name}. Be specific to their inquiry: {inquiry_details}. Include calendar link: {calendar_link}" } },
        { id: 3, module: "gmail:sendEmail", label: "Send Instant Reply" },
        { id: 4, module: "supabase:insert", label: "Save to CRM" },
        { id: 5, module: "make:sleep", label: "Wait 24 hours" },
        { id: 6, module: "claude:message", label: "Write Day 1 Follow-up" },
        { id: 7, module: "gmail:sendEmail", label: "Send Day 1 Follow-up" }
      ]
    }
  },
  appointment_reminder: {
    name: "Appointment Reminder Sequence",
    description: "Automated reminders at 48hrs, 24hrs, and 2hrs before appointment via SMS and email. Reduces no-shows by 60-80%.",
    applicable_to: ["dental", "salon", "gym", "medical", "law_firm", "real_estate", "accounting"],
    setup_instructions: "1. Connect your booking system (Acuity, Calendly, SimplePractice)\n2. Set reminder timing\n3. Add cancel/reschedule links\n4. Connect Twilio for SMS",
    credentials_needed: ["Booking system API key", "Twilio", "Email provider"],
    template: {
      name: "Appointment Reminder",
      flow: [
        { id: 1, module: "calendly:appointmentCreated", label: "New Appointment Booked" },
        { id: 2, module: "supabase:insert", label: "Log Appointment" },
        { id: 3, module: "make:scheduleAt", label: "Schedule 48hr Reminder" },
        { id: 4, module: "twilio:sendSms", label: "48hr SMS Reminder" },
        { id: 5, module: "make:scheduleAt", label: "Schedule 2hr Reminder" },
        { id: 6, module: "twilio:sendSms", label: "2hr SMS Reminder" }
      ]
    }
  },
  ai_receptionist: {
    name: "AI Chat Receptionist",
    description: "24/7 website chatbot powered by Claude that answers FAQs, qualifies leads, and books appointments automatically.",
    applicable_to: ["dental", "law_firm", "real_estate", "medical", "salon", "gym", "insurance", "accounting"],
    setup_instructions: "1. Add chat widget script to website\n2. Train on your FAQ document\n3. Connect booking system for live availability\n4. Set escalation rules for complex queries",
    credentials_needed: ["Website access (to add script)", "Anthropic API key", "Booking system", "Twilio (optional for SMS handoff)"],
    template: {
      name: "AI Receptionist",
      flow: [
        { id: 1, module: "webhook:chatMessage", label: "Visitor Message" },
        { id: 2, module: "supabase:select", label: "Get Conversation History" },
        { id: 3, module: "claude:message", label: "AI Receptionist Response", config: { system: "You are the receptionist for {business_name}. You answer questions about services, pricing, and availability. Always try to book an appointment. Never make up information. If unsure, offer to have someone call back." } },
        { id: 4, module: "supabase:upsert", label: "Save Conversation" },
        { id: 5, module: "webhook:respond", label: "Send Response to Chat" },
        { id: 6, module: "make:ifelse", label: "Booking Intent?", config: { condition: "{{3.intent}} = book_appointment" } },
        { id: 7, module: "calendly:createBooking", label: "Book Appointment" }
      ]
    }
  },
  monthly_report: {
    name: "Monthly Client Report",
    description: "Auto-generates and emails a professional performance report to clients every month showing ROI from their automations.",
    applicable_to: ["restaurant", "dental", "real_estate", "salon", "gym", "law_firm", "auto_repair", "plumber", "hvac", "retail", "medical", "accounting", "insurance", "contractor", "other"],
    setup_instructions: "1. Connect data sources (Google Analytics, booking system, Twilio)\n2. Set report date (default: 1st of month)\n3. Add client email\n4. Customize report branding",
    credentials_needed: ["Supabase (automation logs)", "Google Analytics (optional)", "SendGrid"],
    template: {
      name: "Monthly ROI Report",
      flow: [
        { id: 1, module: "make:schedule", label: "1st of Month Trigger", config: { cron: "0 9 1 * *" } },
        { id: 2, module: "supabase:select", label: "Get Month's Automation Data" },
        { id: 3, module: "claude:message", label: "Generate Report", config: { prompt: "Generate a professional monthly report for {client_name} showing: calls handled by AI, reviews collected, leads followed up, appointments reminded, no-shows prevented. Calculate hours saved and dollar value. Be specific with numbers." } },
        { id: 4, module: "sendgrid:sendEmail", label: "Email Report to Client" }
      ]
    }
  }
};

// ─── AI BLUEPRINT CUSTOMIZER ──────────────────────────────────────────────────

export async function generateCustomBlueprint(
  businessType: BusinessType,
  automationName: string,
  businessDetails: {
    name: string;
    city: string;
    specific_tools?: string[];
    custom_requirements?: string;
  }
): Promise<MakeBlueprint> {
  const template = Object.values(AUTOMATION_LIBRARY).find(a => a.name === automationName);

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: `You are a Make.com automation specialist. Customize an automation blueprint for a specific local business.
Return only valid JSON with this structure:
{
  "name": "<automation name>",
  "description": "<what this does for THIS specific business>",
  "setup_instructions": "<numbered steps specific to this business type>",
  "credentials_needed": ["<credential>"],
  "customizations": "<what was customized for their business>",
  "json": { "<Make.com scenario structure>" }
}`,
    messages: [{
      role: "user",
      content: `Customize this automation for:
Business: ${businessDetails.name} (${businessType})
City: ${businessDetails.city}
Automation: ${automationName}
Base template: ${JSON.stringify(template?.template || {})}
Custom requirements: ${businessDetails.custom_requirements || "none"}

Make the setup instructions specific to a ${businessType} business.`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  const parsed = JSON.parse(text);

  return {
    name: parsed.name,
    description: parsed.description,
    json: parsed.json || template?.template || {},
    setup_instructions: parsed.setup_instructions,
    credentials_needed: parsed.credentials_needed || template?.credentials_needed || [],
  };
}

export function getRecommendedAutomations(businessType: BusinessType): string[] {
  return Object.entries(AUTOMATION_LIBRARY)
    .filter(([, auto]) => auto.applicable_to.includes(businessType))
    .map(([key]) => key);
}
