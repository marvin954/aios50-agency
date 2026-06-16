# AIOS-50 — AI Automation Agency System
## Full autonomous operation: lead gen → outreach → sales → delivery

---

## What this system does

1. **You import leads** (paste a CSV or type manually)
2. **Lead Engine qualifies them** with Claude AI — scores 0-100, identifies pain points, rejects bad fits
3. **Outreach Agent writes personalized emails** for each qualified lead
4. **You approve the batch** (one click — see every email before it goes out)
5. **Instantly sends the sequence** automatically
6. **Reply Handler** reads every inbound reply, classifies intent, drafts your response
7. **You approve replies** before they send
8. **Proposal Agent** generates custom proposals for interested leads
9. **You approve proposals** — system emails them to the client
10. **Delivery Agent** generates Make.com blueprints for each automation you sell

---

## Stack (under $85/mo total)

| Service | Use | Cost |
|---------|-----|------|
| Vercel | Host Next.js app | Free |
| Supabase | Database | Free |
| Anthropic API | All AI agents | ~$20/mo |
| Instantly.ai | Cold email sending | $37/mo |
| Make.com | Client automation delivery | $9/mo |
| Twilio | SMS (client automations) | Pay-per-use |

---

## Setup — Step by Step

### 1. Supabase

1. Go to supabase.com → New project
2. SQL Editor → paste contents of `supabase-schema.sql` → Run
3. Settings → API → copy:
   - Project URL
   - anon public key  
   - service_role key (keep secret)

### 2. Instantly.ai

1. Go to instantly.ai → sign up ($37/mo)
2. Create a campaign: "AIOS-50 Local Business Outreach"
3. Connect your sending email (use Google Workspace for best deliverability)
4. Settings → API → copy your API key
5. Copy your Campaign ID from the campaign URL

### 3. Anthropic API

1. console.anthropic.com → API Keys → Create key
2. Add $20 credit to start

### 4. Deploy to Vercel

```bash
# Clone/unzip the project
cd aios50-agency
npm install

# Set environment variables
cp .env.example .env.local
# Fill in all values

# Push to GitHub
git init && git add . && git commit -m "AIOS-50 Agency"
git remote add origin https://github.com/marvin954/aios50-agency.git
git push -u origin main

# Deploy
vercel
```

### 5. Environment Variables (set in Vercel dashboard)

```
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
INSTANTLY_API_KEY=...
INSTANTLY_CAMPAIGN_ID=...
STRIPE_SECRET_KEY=sk_live_... (add later when first client signs)
```

### 6. Connect Instantly Webhook (so replies come back to you)

In Instantly.ai:
- Settings → Webhooks → Add webhook
- URL: `https://your-app.vercel.app/api/replies`
- Events: `reply_received`

---

## Daily Workflow (10 minutes)

**Morning:**
1. Open your Vercel URL
2. Check approval queue — review emails AI wrote, approve batch
3. Check reply approvals — review AI draft responses, approve sends

**That's it.** Lead Engine, Outreach, Reply Handler, and Proposal Agent run automatically.

**Weekly:**
- Import 20-50 new leads (takes 5 minutes)
- Review pipeline tab — who's meeting-booked, proposal-sent
- Generate blueprints for any new clients you've closed

---

## Pricing Your Services

| Package | What's included | Price |
|---------|----------------|-------|
| Starter | 1 automation (missed call SMS or review requests) | $500 setup + $300/mo |
| Growth | 3 automations (lead follow-up + reminders + reviews) | $1,000 setup + $500/mo |
| Full System | All 5 automations + AI receptionist + monthly reports | $2,000 setup + $1,200/mo |

**Target businesses:** Dental offices, law firms, HVAC companies, real estate agents, medical practices.
**Goal:** 5 Growth clients = $2,500/mo. 10 clients = $5,000/mo.

---

## How to find leads (free)

**Google Maps method:**
1. Search "[business type] [city]" in Google Maps
2. Click each business → copy: name, website, phone
3. Find owner email via Hunter.io (free tier: 25/mo) or LinkedIn
4. Import batch into AIOS-50

**Apollo.io free tier:**
1. apollo.io → sign up free (150 leads/mo)
2. Search: Title = "owner" OR "dentist" OR "attorney", Location = your city
3. Export CSV
4. Import directly into AIOS-50

---

## Revenue Milestones

| Timeline | Target | MRR |
|---------|--------|-----|
| Month 1 | 2 clients | $600–1,000 |
| Month 2 | 5 clients | $1,500–2,500 |
| Month 3 | 10 clients | $3,000–5,000 |
| Month 6 | 20 clients | $6,000–12,000 |
