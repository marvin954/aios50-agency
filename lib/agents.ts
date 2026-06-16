import Anthropic from "@anthropic-ai/sdk";
import type { Lead, BusinessType } from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const QUALIFICATION_SYSTEM = `You are the Lead Qualification Agent for an AI Automation Agency targeting local businesses.

Your job: analyze a local business and determine if they are a good candidate for AI automation services.

Score them 0-100 based on:
- Business complexity (more staff/processes = higher score)
- Likely pain points (repetitive tasks, scheduling, follow-ups, reviews)
- Budget indicators (established business, multiple locations, premium services)
- Tech readiness (has website, online presence, uses some tools already)
- Competition gap (competitors using AI while they're not)

High-value targets (score 70+): dental offices, law firms, real estate agents, medical practices, restaurants with catering, auto dealers, insurance agencies, HVAC companies with service contracts.

Low-value targets (score <40): solo freelancers, cash-only businesses, businesses with no online presence, already tech-heavy businesses.

Respond ONLY with valid JSON, no markdown, no explanation outside the JSON:
{
  "score": <number 0-100>,
  "reasoning": "<2 sentence explanation>",
  "pain_points": ["<specific pain point>", "<specific pain point>", "<specific pain point>"],
  "automation_opportunities": ["<specific automation>", "<specific automation>", "<specific automation>"],
  "estimated_deal_value": <monthly retainer estimate in dollars>,
  "recommended_approach": "<one sentence on how to approach this business>"
}`;

export async function qualifyLead(lead: Partial<Lead>): Promise<{
  score: number;
  reasoning: string;
  pain_points: string[];
  automation_opportunities: string[];
  estimated_deal_value: number;
  recommended_approach: string;
}> {
  const prompt = `Qualify this local business lead:

Business Name: ${lead.business_name}
Business Type: ${lead.business_type}
City: ${lead.city}, ${lead.state}
Website: ${lead.website || "none listed"}
Owner: ${lead.owner_name || "unknown"}

Score and analyze this lead for AI automation services.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    system: QUALIFICATION_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text);
}

const EMAIL_SYSTEM = `You are the Outreach Agent for an AI Automation Agency. You write cold emails to local business owners.

RULES:
- Sound like a real person, not a marketer
- Reference something specific about their business type
- Lead with their pain, not your product
- One specific automation example relevant to their industry
- Short — under 120 words for the opener
- No subject line clickbait, no "quick question" openers
- Sign off as "Marvin" from "AIOS Agency"

Always respond with valid JSON only:
{
  "subject": "<subject line>",
  "body": "<email body with \\n for line breaks>",
  "follow_up_1": "<day 3 follow up, 60 words max>",
  "follow_up_2": "<day 7 follow up, 50 words max>",
  "follow_up_3": "<day 14 final follow up, 40 words max>"
}`;

export async function writeOutreachEmail(lead: Lead): Promise<{
  subject: string;
  body: string;
  follow_up_1: string;
  follow_up_2: string;
  follow_up_3: string;
}> {
  const prompt = `Write a cold email sequence for:

Business: ${lead.business_name}
Type: ${lead.business_type}
Location: ${lead.city}, ${lead.state}
Owner: ${lead.owner_name || "Business Owner"}
Pain points identified: ${lead.pain_points.join(", ")}
Best automation opportunity: ${lead.automation_opportunities[0]}
Recommended approach: ${(lead as any).recommended_approach || "focus on time savings"}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    system: EMAIL_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text);
}

const REPLY_SYSTEM = `You are the Reply Handler Agent for an AI Automation Agency.

Your job: read an inbound reply from a lead, classify their intent, and draft a response.

Intent classifications:
- "interested": they want to learn more, ask questions, or want to schedule a call
- "not_interested": clear no, not now
- "question": specific question about what we do or how it works
- "out_of_office": auto-reply
- "unsubscribe": wants off the list

For interested/question replies, draft a warm, specific response that moves toward booking a 15-min discovery call. Use Calendly link placeholder: [CALENDAR_LINK]

Respond with valid JSON only:
{
  "intent": "<classification>",
  "confidence": <0-100>,
  "summary": "<one sentence summary of what they said>",
  "draft_response": "<full email response if intent is interested or question, otherwise null>"
}`;

export async function classifyReply(replyBody: string, leadName: string, businessName: string): Promise<{
  intent: string;
  confidence: number;
  summary: string;
  draft_response: string | null;
}> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    system: REPLY_SYSTEM,
    messages: [{
      role: "user",
      content: `Lead: ${leadName} from ${businessName}\n\nTheir reply:\n${replyBody}`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text);
}

const PROPOSAL_SYSTEM = `You are the Proposal Agent for an AI Automation Agency serving local businesses.

Generate a compelling, specific proposal for a local business. Be concrete about:
- Exactly which automations they get
- Exact tools used (Make.com, Claude AI, Twilio, etc.)
- Realistic time savings
- ROI calculation
- Clear pricing

Pricing guidelines:
- Setup fee: $500-$2000 depending on complexity
- Monthly retainer: $300-$1500 depending on automations maintained

Respond with valid JSON only:
{
  "executive_summary": "<2 paragraphs, personalized to their business>",
  "automations": [
    {
      "name": "<automation name>",
      "description": "<what it does specifically>",
      "time_saved_per_week": <hours>,
      "tools": ["<tool>"],
      "setup_complexity": "<low|medium|high>",
      "monthly_value": <dollar value to client>
    }
  ],
  "setup_fee": <number>,
  "monthly_retainer": <number>,
  "roi_projection": "<specific ROI calculation>",
  "timeline": "<delivery timeline>",
  "guarantee": "<what you guarantee>"
}`;

export async function generateProposal(lead: Lead): Promise<any> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: PROPOSAL_SYSTEM,
    messages: [{
      role: "user",
      content: `Generate a proposal for:

Business: ${lead.business_name}
Type: ${lead.business_type}
Location: ${lead.city}, ${lead.state}
Pain points: ${lead.pain_points.join(", ")}
Automation opportunities: ${lead.automation_opportunities.join(", ")}`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text);
}
