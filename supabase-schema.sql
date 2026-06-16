-- AIOS-50 AI Automation Agency — Supabase Schema
-- Run this in your Supabase SQL Editor

-- ─── LEADS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id                    TEXT PRIMARY KEY,
  business_name         TEXT NOT NULL,
  business_type         TEXT NOT NULL,
  owner_name            TEXT,
  email                 TEXT NOT NULL UNIQUE,
  phone                 TEXT,
  website               TEXT,
  address               TEXT,
  city                  TEXT NOT NULL,
  state                 TEXT NOT NULL DEFAULT 'FL',
  ai_score              INTEGER DEFAULT 0,
  ai_score_reasoning    TEXT,
  pain_points           JSONB DEFAULT '[]',
  automation_opportunities JSONB DEFAULT '[]',
  status                TEXT DEFAULT 'raw',
  email_subject         TEXT,
  email_body            TEXT,
  sequence_id           TEXT,
  proposal_value        DECIMAL,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  approved_at           TIMESTAMPTZ,
  replied_at            TIMESTAMPTZ
);

-- ─── APPROVALS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS approvals (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type          TEXT NOT NULL, -- outreach_batch | reply | proposal | invoice
  title         TEXT NOT NULL,
  description   TEXT,
  data          JSONB NOT NULL DEFAULT '{}',
  status        TEXT DEFAULT 'pending',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  resolved_at   TIMESTAMPTZ
);

-- ─── REPLIES ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS replies (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  lead_id           TEXT REFERENCES leads(id),
  from_email        TEXT NOT NULL,
  subject           TEXT,
  body              TEXT NOT NULL,
  received_at       TIMESTAMPTZ DEFAULT NOW(),
  intent            TEXT, -- interested | not_interested | question | out_of_office | unsubscribe
  ai_draft_response TEXT,
  status            TEXT DEFAULT 'pending_review'
);

-- ─── PROPOSALS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS proposals (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  lead_id           TEXT REFERENCES leads(id),
  business_name     TEXT NOT NULL,
  business_type     TEXT,
  automations       JSONB DEFAULT '[]',
  setup_fee         DECIMAL DEFAULT 0,
  monthly_retainer  DECIMAL DEFAULT 0,
  total_value       DECIMAL DEFAULT 0,
  executive_summary TEXT,
  roi_projection    TEXT,
  timeline          TEXT,
  status            TEXT DEFAULT 'draft',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INVOICES ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  lead_id       TEXT REFERENCES leads(id),
  business_name TEXT NOT NULL,
  amount        DECIMAL NOT NULL,
  type          TEXT NOT NULL, -- setup | monthly_retainer
  status        TEXT DEFAULT 'draft',
  due_date      DATE,
  stripe_id     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DELIVERY PROJECTS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_projects (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  lead_id               TEXT REFERENCES leads(id),
  proposal_id           TEXT REFERENCES proposals(id),
  business_name         TEXT NOT NULL,
  business_type         TEXT,
  automations_to_build  JSONB DEFAULT '[]',
  blueprints            JSONB DEFAULT '[]',
  status                TEXT DEFAULT 'not_started',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  delivered_at          TIMESTAMPTZ
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_email  ON leads(email);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_replies_lead_id  ON replies(lead_id);
