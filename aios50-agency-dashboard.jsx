import { useState, useEffect, useCallback } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg:        "#080808",
  surface:   "#101010",
  surfaceHi: "#141414",
  border:    "#1e1e1e",
  borderHi:  "#282828",
  gold:      "#c8a96e",
  goldDim:   "rgba(200,169,110,0.08)",
  green:     "#3d9e6e",
  greenDim:  "rgba(61,158,110,0.1)",
  red:       "#8b3535",
  redDim:    "rgba(139,53,53,0.12)",
  blue:      "#4a7fa8",
  blueDim:   "rgba(74,127,168,0.1)",
  text:      "#c8c8c8",
  textDim:   "#585858",
  textMute:  "#303030",
  mono:      "'Courier New', monospace",
  serif:     "Georgia, serif",
  sans:      "system-ui, sans-serif",
};

// ─── MOCK DATA (replace with real API calls after deployment) ────────────────
const MOCK_STATS = {
  leads: { total: 127, qualified: 43, pending_approval: 8, in_sequence: 31, replied: 12 },
  pipeline: { meetings_booked: 6, proposals_sent: 4, deals_won: 2, deals_lost: 1 },
  revenue: { mrr: 1400, total_collected: 2800, pipeline_value: 18600 },
  approvals_pending: 3,
};

const MOCK_APPROVALS = [
  {
    id: "ap-001", type: "outreach_batch", status: "pending",
    title: "8 outreach emails ready to send",
    description: "AI qualified 8 leads and wrote personalized emails. Review and approve to send via Instantly.",
    created_at: "2026-06-16T08:00:00Z",
    data: [
      { id: "l-001", business_name: "Miami Smile Dental", business_type: "dental", owner_name: "Dr. Sarah Chen", email: "schen@miamismile.com", city: "Miami", state: "FL", ai_score: 87, pain_points: ["Missed calls go unanswered", "No-show rate 18%", "Manual appointment reminders"], email_subject: "The automated receptionist working for dental offices in Miami", email_body: "Hi Dr. Chen,\n\nYour front desk is probably handling 40+ calls a day — and when one gets missed, that patient often books elsewhere.\n\nI set up an AI system for a dental practice in Coral Gables last month that automatically texts back any missed call within 60 seconds and books them online. They recovered 11 appointments in the first two weeks.\n\nWould a 15-minute call make sense this week?\n\nMarvin\nAIOS Agency" },
      { id: "l-002", business_name: "Sunset HVAC", business_type: "hvac", owner_name: "Mike Torres", email: "mike@sunsethvac.com", city: "Miami", state: "FL", ai_score: 82, pain_points: ["Lead follow-up too slow", "Seasonal demand spikes", "Manual scheduling"], email_subject: "HVAC companies losing leads in the first 5 minutes", email_body: "Hi Mike,\n\nMost HVAC leads call 3 companies. They book with whoever responds first.\n\nI built an automated system that responds to every new inquiry within 2 minutes — day or night — and books them into your calendar. One HVAC company in Broward used it to close 7 jobs they would have missed last summer.\n\nWorth a quick call?\n\nMarvin\nAIOS Agency" },
      { id: "l-003", business_name: "Rodriguez Law Group", business_type: "law_firm", owner_name: "Carlos Rodriguez", email: "carlos@rodriguezlaw.com", city: "Miami", state: "FL", ai_score: 91, pain_points: ["Intake process manual and slow", "Follow-up inconsistent", "Client communication gaps"], email_subject: "Law firms losing consultations to slow intake", email_body: "Hi Carlos,\n\nEvery day your intake form gets a submission, someone on your team has to manually follow up. If it happens on Friday afternoon, that lead waits until Monday.\n\nI built an AI intake system for a law firm in Brickell that follows up instantly, qualifies the case type, and books a consultation automatically. They went from 40% to 71% consultation rate.\n\nQuick 15 minutes this week?\n\nMarvin\nAIOS Agency" },
    ],
  },
  {
    id: "ap-002", type: "reply", status: "pending",
    title: "Miami Smile Dental replied — interested",
    description: "Dr. Chen asked about pricing and timeline. AI drafted a response moving toward a discovery call.",
    created_at: "2026-06-16T10:30:00Z",
    data: {
      business_name: "Miami Smile Dental",
      from_email: "schen@miamismile.com",
      body: "Hi Marvin, this is interesting timing — we actually just lost a patient last week because no one called back in time. What does something like this cost and how long does it take to set up?",
      draft_response: "Hi Dr. Chen,\n\nGreat timing — and sorry to hear about that lost patient, it happens more than most practices realize.\n\nFor a dental practice your size, setup typically runs $800 and takes about 5 days. After that it's $450/month which covers the AI missed-call system, automated appointment reminders, and post-visit review requests.\n\nMost practices make that back in the first 2-3 recovered appointments.\n\nI have some time Thursday at 2pm or Friday at 10am — does either work for a 15-minute call? [CALENDAR_LINK]\n\nMarvin",
    },
  },
  {
    id: "ap-003", type: "proposal", status: "pending",
    title: "Proposal ready — Rodriguez Law Group ($650/mo)",
    description: "3 automations proposed. Setup: $1,200. Monthly: $650. Estimated client ROI: 8x.",
    created_at: "2026-06-16T11:00:00Z",
    data: {
      business_name: "Rodriguez Law Group",
      client_email: "carlos@rodriguezlaw.com",
      setup_fee: 1200, monthly_retainer: 650,
      executive_summary: "Rodriguez Law Group is leaving significant revenue on the table through slow lead response and inconsistent follow-up. Our analysis shows 3 high-impact automation opportunities that will increase consultation bookings by an estimated 40-60% within 90 days.",
      automations: [
        { name: "AI Intake & Qualification", description: "Instant response to contact form submissions, qualifies case type, books consultations automatically", time_saved_per_week: 6, tools: ["Make.com", "Claude AI", "Calendly"], monthly_value: 2400 },
        { name: "Follow-Up Sequence", description: "7-day automated follow-up for leads who don't book immediately", time_saved_per_week: 3, tools: ["Make.com", "Gmail"], monthly_value: 1200 },
        { name: "Client Status Updates", description: "Automated case status emails so clients never have to call to check in", time_saved_per_week: 4, tools: ["Make.com", "Supabase", "SendGrid"], monthly_value: 800 },
      ],
    },
  },
];

const MOCK_LEADS = [
  { id: "l-001", business_name: "Miami Smile Dental", business_type: "dental", owner_name: "Dr. Sarah Chen", email: "schen@miamismile.com", city: "Miami", state: "FL", ai_score: 87, status: "replied", pain_points: ["Missed calls", "No-shows", "Manual reminders"], proposal_value: 450 },
  { id: "l-002", business_name: "Sunset HVAC", business_type: "hvac", owner_name: "Mike Torres", email: "mike@sunsethvac.com", city: "Miami", state: "FL", ai_score: 82, status: "sent", pain_points: ["Slow lead response", "Manual scheduling"], proposal_value: 380 },
  { id: "l-003", business_name: "Rodriguez Law Group", business_type: "law_firm", owner_name: "Carlos Rodriguez", email: "carlos@rodriguezlaw.com", city: "Miami", state: "FL", ai_score: 91, status: "meeting_booked", pain_points: ["Manual intake", "Slow follow-up"], proposal_value: 650 },
  { id: "l-004", business_name: "Brickell Auto Repair", business_type: "auto_repair", owner_name: "James Park", email: "james@brickell-auto.com", city: "Miami", state: "FL", ai_score: 74, status: "sent", pain_points: ["No review collection", "Manual appointment reminders"], proposal_value: 320 },
  { id: "l-005", business_name: "Coral Gables Realty", business_type: "real_estate", owner_name: "Maria Santos", email: "maria@cgabelesrealty.com", city: "Miami", state: "FL", ai_score: 79, status: "qualified", pain_points: ["Lead response time", "Follow-up inconsistency"], proposal_value: 520 },
  { id: "l-006", business_name: "South Beach Salon", business_type: "salon", owner_name: "Kim Lee", email: "kim@sbsalon.com", city: "Miami Beach", state: "FL", ai_score: 68, status: "pending_approval", pain_points: ["No-shows", "Manual booking"], proposal_value: 280 },
];

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

const Dot = ({ color = T.green, pulse = false }) => (
  <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0, animation: pulse ? "pulse 2s infinite" : "none" }} />
);

const Mono = ({ children, color = T.textDim, size = 10 }: any) => (
  <span style={{ fontFamily: T.mono, fontSize: size, color, letterSpacing: "0.08em" }}>{children}</span>
);

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, [string, string]> = {
    raw:              [T.textMute,  "RAW"],
    qualified:        [T.blue,      "QUALIFIED"],
    rejected:         [T.textMute,  "REJECTED"],
    pending_approval: [T.gold,      "PENDING APPROVAL"],
    approved:         [T.gold,      "APPROVED"],
    sent:             [T.blue,      "IN SEQUENCE"],
    replied:          [T.green,     "REPLIED"],
    meeting_booked:   [T.green,     "MEETING BOOKED"],
    proposal_sent:    [T.gold,      "PROPOSAL SENT"],
    closed_won:       [T.green,     "WON"],
    closed_lost:      [T.red,       "LOST"],
    pending:          [T.gold,      "PENDING"],
    approved_s:       [T.green,     "APPROVED"],
  };
  const [color, label] = map[status] || [T.textDim, status.toUpperCase()];
  return (
    <span style={{ fontSize: 9, fontFamily: T.mono, fontWeight: 700, letterSpacing: "0.1em", color, background: `${color}15`, border: `1px solid ${color}30`, padding: "2px 7px" }}>
      {label}
    </span>
  );
};

const ScoreBar = ({ score }: { score: number }) => {
  const color = score >= 80 ? T.green : score >= 60 ? T.gold : T.red;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 60, height: 3, background: T.border }}>
        <div style={{ width: `${score}%`, height: "100%", background: color }} />
      </div>
      <Mono color={color} size={11}>{score}</Mono>
    </div>
  );
};

function StatCard({ label, value, sub, accent = T.text }: any) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: "16px 20px", flex: 1, minWidth: 110 }}>
      <Mono color={T.textDim} size={9}>{label}</Mono>
      <div style={{ fontSize: 28, fontWeight: 300, fontFamily: T.mono, color: accent, marginTop: 6, letterSpacing: "-0.02em" }}>{value}</div>
      {sub && <Mono color={T.textMute} size={10}>{sub}</Mono>}
    </div>
  );
}

function ApprovalCard({ item, onApprove, onReject }: { item: any; onApprove: (id: string) => void; onReject: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const typeColors: Record<string, string> = {
    outreach_batch: T.blue,
    reply: T.green,
    proposal: T.gold,
    invoice: T.gold,
  };
  const color = typeColors[item.type] || T.textDim;

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${color}`, marginBottom: 1 }}>
      <div style={{ padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Mono color={color} size={9}>{item.type.replace("_", " ").toUpperCase()}</Mono>
            <Mono color={T.textMute} size={9}>{new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Mono>
          </div>
          <div style={{ fontSize: 13, fontFamily: T.serif, color: T.text, marginBottom: 4 }}>{item.title}</div>
          <div style={{ fontSize: 11, color: T.textDim, lineHeight: 1.6 }}>{item.description}</div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "flex-start", paddingTop: 2 }}>
          <button onClick={() => setExpanded(!expanded)} style={{ fontSize: 9, fontFamily: T.mono, color: T.textDim, background: "none", border: `1px solid ${T.border}`, padding: "4px 10px", cursor: "pointer", letterSpacing: "0.08em" }}>
            {expanded ? "HIDE" : "REVIEW"}
          </button>
          <button onClick={() => onReject(item.id)} style={{ fontSize: 9, fontFamily: T.mono, color: T.red, background: T.redDim, border: `1px solid ${T.red}40`, padding: "4px 10px", cursor: "pointer", letterSpacing: "0.08em" }}>REJECT</button>
          <button onClick={() => onApprove(item.id)} style={{ fontSize: 9, fontFamily: T.mono, color: T.bg, background: color, border: "none", padding: "4px 12px", cursor: "pointer", letterSpacing: "0.08em", fontWeight: 700 }}>APPROVE</button>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: "14px 18px", background: T.bg }}>
          {item.type === "outreach_batch" && (
            <div>
              {item.data.map((lead: any) => (
                <div key={lead.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                    <Mono color={T.gold} size={11}>{lead.business_name}</Mono>
                    <Mono color={T.textDim} size={11}>{lead.owner_name}</Mono>
                    <Mono color={T.blue} size={11}>{lead.email}</Mono>
                    <Mono color={T.green} size={11}>Score: {lead.ai_score}</Mono>
                  </div>
                  <div style={{ fontSize: 11, fontFamily: T.mono, color: T.gold, marginBottom: 4 }}>Subject: {lead.email_subject}</div>
                  <div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: T.serif }}>{lead.email_body}</div>
                </div>
              ))}
            </div>
          )}
          {item.type === "reply" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <Mono color={T.textDim} size={9}>THEIR MESSAGE</Mono>
                <div style={{ marginTop: 8, fontSize: 12, color: T.text, lineHeight: 1.7, fontFamily: T.serif, padding: "12px", background: T.surfaceHi, borderLeft: `2px solid ${T.border}` }}>{item.data.body}</div>
              </div>
              <div>
                <Mono color={T.green} size={9}>AI DRAFT RESPONSE</Mono>
                <div style={{ marginTop: 8, fontSize: 12, color: T.text, lineHeight: 1.7, fontFamily: T.serif, padding: "12px", background: T.surfaceHi, borderLeft: `2px solid ${T.green}` }}>{item.data.draft_response}</div>
              </div>
            </div>
          )}
          {item.type === "proposal" && (
            <div>
              <div style={{ marginBottom: 14 }}>
                <Mono color={T.textDim} size={9}>EXECUTIVE SUMMARY</Mono>
                <div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.7, marginTop: 6, fontFamily: T.serif }}>{item.data.executive_summary}</div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <Mono color={T.textDim} size={9}>PROPOSED AUTOMATIONS</Mono>
                <div style={{ marginTop: 8 }}>
                  {item.data.automations.map((a: any, i: number) => (
                    <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: `1px solid ${T.border}`, alignItems: "flex-start" }}>
                      <Mono color={T.textMute} size={9}>{String(i + 1).padStart(2, "0")}</Mono>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: T.text, fontWeight: 600, marginBottom: 2 }}>{a.name}</div>
                        <div style={{ fontSize: 11, color: T.textDim }}>{a.description}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 11, color: T.green, fontFamily: T.mono }}>${a.monthly_value}/mo value</div>
                        <div style={{ fontSize: 10, color: T.textDim, fontFamily: T.mono }}>{a.time_saved_per_week}h saved/wk</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 24 }}>
                <div><Mono color={T.textDim} size={9}>SETUP FEE</Mono><div style={{ fontSize: 18, fontFamily: T.mono, color: T.gold, marginTop: 4 }}>${item.data.setup_fee}</div></div>
                <div><Mono color={T.textDim} size={9}>MONTHLY RETAINER</Mono><div style={{ fontSize: 18, fontFamily: T.mono, color: T.gold, marginTop: 4 }}>${item.data.monthly_retainer}/mo</div></div>
                <div><Mono color={T.textDim} size={9}>ANNUAL VALUE</Mono><div style={{ fontSize: 18, fontFamily: T.mono, color: T.text, marginTop: 4 }}>${item.data.setup_fee + item.data.monthly_retainer * 12}</div></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── IMPORT MODAL ─────────────────────────────────────────────────────────────
function ImportModal({ onClose, onImport }: { onClose: () => void; onImport: (leads: any[]) => void }) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"csv" | "manual">("manual");
  const [manualLeads, setManualLeads] = useState([
    { business_name: "", business_type: "dental", owner_name: "", email: "", city: "Miami", state: "FL", website: "" }
  ]);

  const addRow = () => setManualLeads(p => [...p, { business_name: "", business_type: "dental", owner_name: "", email: "", city: "Miami", state: "FL", website: "" }]);
  const updateRow = (i: number, field: string, val: string) => setManualLeads(p => p.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  const BUSINESS_TYPES = ["dental","hvac","law_firm","real_estate","restaurant","salon","gym","auto_repair","plumber","medical","accounting","insurance","contractor","retail","other"];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={onClose}>
      <div style={{ background: T.surface, border: `1px solid ${T.borderHi}`, width: "100%", maxWidth: 680, maxHeight: "80vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Mono size={11} color={T.text}>IMPORT LEADS</Mono>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: 16 }}>×</button>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", gap: 1, marginBottom: 16, background: T.border }}>
            {(["manual", "csv"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "8px", background: mode === m ? T.surfaceHi : T.surface, border: "none", color: mode === m ? T.text : T.textDim, fontSize: 10, fontFamily: T.mono, letterSpacing: "0.1em", cursor: "pointer" }}>{m.toUpperCase()}</button>
            ))}
          </div>

          {mode === "manual" && (
            <div>
              {manualLeads.map((row, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1.5fr 2fr 1fr", gap: 4, marginBottom: 4 }}>
                  {[
                    { field: "business_name", placeholder: "Business Name" },
                    { field: "owner_name", placeholder: "Owner Name" },
                    { field: "email", placeholder: "Email" },
                    { field: "website", placeholder: "Website" },
                    { field: "city", placeholder: "City" },
                  ].map(({ field, placeholder }) => (
                    <input key={field} value={(row as any)[field]} onChange={e => updateRow(i, field, e.target.value)} placeholder={placeholder}
                      style={{ background: T.bg, border: `1px solid ${T.border}`, padding: "7px 10px", color: T.text, fontSize: 11, fontFamily: T.mono, outline: "none" }} />
                  ))}
                  <select value={row.business_type} onChange={e => updateRow(i, "business_type", e.target.value)}
                    style={{ background: T.bg, border: `1px solid ${T.border}`, padding: "7px 10px", color: T.text, fontSize: 11, fontFamily: T.mono, outline: "none", gridColumn: "span 5" }}>
                    {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              ))}
              <button onClick={addRow} style={{ fontSize: 10, fontFamily: T.mono, color: T.gold, background: "none", border: `1px solid ${T.border}`, padding: "6px 14px", cursor: "pointer", marginTop: 8, letterSpacing: "0.08em" }}>+ ADD ROW</button>
            </div>
          )}

          {mode === "csv" && (
            <div>
              <div style={{ fontSize: 11, color: T.textDim, marginBottom: 8, fontFamily: T.mono }}>Paste CSV: business_name, business_type, owner_name, email, website, city, state</div>
              <textarea value={input} onChange={e => setInput(e.target.value)} rows={8} placeholder={"Miami Smile Dental,dental,Dr. Sarah Chen,schen@miamismile.com,miamismile.com,Miami,FL\nSunset HVAC,hvac,Mike Torres,mike@sunsethvac.com,,Miami,FL"}
                style={{ width: "100%", background: T.bg, border: `1px solid ${T.border}`, padding: "10px", color: T.text, fontSize: 11, fontFamily: T.mono, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>
          )}

          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={onClose} style={{ fontSize: 10, fontFamily: T.mono, color: T.textDim, background: "none", border: `1px solid ${T.border}`, padding: "8px 16px", cursor: "pointer", letterSpacing: "0.08em" }}>CANCEL</button>
            <button onClick={() => {
              const leads = mode === "manual" ? manualLeads.filter(r => r.email) : input.split("\n").map(line => {
                const [business_name, business_type, owner_name, email, website, city, state] = line.split(",");
                return { business_name, business_type, owner_name, email, website, city, state };
              }).filter(r => r.email);
              onImport(leads);
            }} style={{ fontSize: 10, fontFamily: T.mono, color: T.bg, background: T.gold, border: "none", padding: "8px 20px", cursor: "pointer", letterSpacing: "0.08em", fontWeight: 700 }}>
              RUN LEAD ENGINE →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function AgencyCommandCenter() {
  const [tab, setTab]           = useState("approvals");
  const [approvals, setApprovals] = useState(MOCK_APPROVALS);
  const [leads, setLeads]       = useState(MOCK_LEADS);
  const [stats, setStats]       = useState(MOCK_STATS);
  const [showImport, setShowImport] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast]       = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const handleApprove = useCallback((id: string) => {
    const item = approvals.find(a => a.id === id);
    setApprovals(p => p.filter(a => a.id !== id));
    setStats(s => ({ ...s, approvals_pending: s.approvals_pending - 1 }));
    if (item?.type === "outreach_batch") showToast(`✓ ${(item.data as any[]).length} emails queued in Instantly`);
    else if (item?.type === "reply") showToast("✓ Reply sent");
    else if (item?.type === "proposal") showToast("✓ Proposal sent to client");
  }, [approvals]);

  const handleReject = useCallback((id: string) => {
    setApprovals(p => p.filter(a => a.id !== id));
    setStats(s => ({ ...s, approvals_pending: s.approvals_pending - 1 }));
    showToast("Rejected — removed from queue");
  }, []);

  const handleImport = useCallback(async (rawLeads: any[]) => {
    setShowImport(false);
    setProcessing(true);
    showToast(`Processing ${rawLeads.length} leads through Lead Engine...`);
    // In production: POST /api/leads/import
    await new Promise(r => setTimeout(r, 2000));
    const qualified = rawLeads.filter(l => l.email).map((l, i) => ({
      id: `new-${i}`,
      ...l,
      ai_score: Math.floor(Math.random() * 30) + 65,
      status: "pending_approval",
      pain_points: ["Manual processes", "Slow follow-up"],
      automation_opportunities: ["Lead follow-up", "Appointment reminders"],
      proposal_value: Math.floor(Math.random() * 300) + 300,
    }));
    setLeads(p => [...qualified, ...p]);
    setStats(s => ({
      ...s,
      leads: { ...s.leads, total: s.leads.total + qualified.length, pending_approval: s.leads.pending_approval + qualified.length },
      approvals_pending: s.approvals_pending + 1,
    }));
    setApprovals(p => [{
      id: `ap-new-${Date.now()}`,
      type: "outreach_batch",
      status: "pending",
      title: `${qualified.length} outreach emails ready to send`,
      description: `AI qualified ${qualified.length} leads and wrote personalized emails.`,
      created_at: new Date().toISOString(),
      data: qualified,
    }, ...p]);
    setProcessing(false);
    showToast(`✓ ${qualified.length} leads qualified — ${qualified.length} emails in approval queue`);
  }, []);

  const TABS = ["approvals", "leads", "pipeline", "delivery"];

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text, fontFamily: T.sans }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: #222; }
        input,select,textarea { color-scheme: dark; }
        button:hover { opacity: 0.85; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: T.surfaceHi, border: `1px solid ${T.borderHi}`, padding: "10px 20px", fontSize: 11, fontFamily: T.mono, color: T.text, zIndex: 200, letterSpacing: "0.06em" }}>
          {toast}
        </div>
      )}

      {showImport && <ImportModal onClose={() => setShowImport(false)} onImport={handleImport} />}

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${T.border}`, padding: "0 24px", height: 50, display: "flex", alignItems: "center", justifyContent: "space-between", background: T.surface }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Mono size={12} color={T.text}>AIOS-50</Mono>
          <span style={{ width: 1, height: 14, background: T.border }} />
          <Mono size={9} color={T.textDim}>AI AUTOMATION AGENCY</Mono>
          {processing && <><Dot color={T.gold} pulse /><Mono color={T.gold} size={9}>LEAD ENGINE RUNNING</Mono></>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {stats.approvals_pending > 0 && (
            <div style={{ background: T.gold, color: T.bg, fontSize: 9, fontFamily: T.mono, fontWeight: 700, padding: "3px 8px", letterSpacing: "0.1em" }}>
              {stats.approvals_pending} PENDING APPROVAL
            </div>
          )}
          <button onClick={() => setShowImport(true)} style={{ fontSize: 9, fontFamily: T.mono, color: T.bg, background: T.gold, border: "none", padding: "6px 14px", cursor: "pointer", letterSpacing: "0.1em", fontWeight: 700 }}>
            + IMPORT LEADS
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: "flex", gap: 1, padding: "1px", background: T.border, margin: "0" }}>
        <StatCard label="MRR" value={`$${stats.revenue.mrr.toLocaleString()}`} sub={`$${stats.revenue.pipeline_value.toLocaleString()} pipeline`} accent={T.gold} />
        <StatCard label="TOTAL LEADS" value={stats.leads.total} sub={`${stats.leads.qualified} qualified`} />
        <StatCard label="IN SEQUENCE" value={stats.leads.in_sequence} sub={`${stats.leads.replied} replied`} accent={T.blue} />
        <StatCard label="MEETINGS" value={stats.pipeline.meetings_booked} sub={`${stats.pipeline.proposals_sent} proposals sent`} accent={T.green} />
        <StatCard label="DEALS WON" value={stats.pipeline.deals_won} sub={`${stats.pipeline.deals_lost} lost`} accent={T.green} />
        <StatCard label="APPROVAL QUEUE" value={stats.approvals_pending} sub="awaiting your decision" accent={stats.approvals_pending > 0 ? T.gold : T.textDim} />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${T.border}`, padding: "0 24px", background: T.surface }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: "none", border: "none", borderBottom: `2px solid ${tab === t ? T.gold : "transparent"}`,
            padding: "12px 18px", fontSize: 10, fontFamily: T.mono, letterSpacing: "0.1em",
            color: tab === t ? T.text : T.textDim, cursor: "pointer", marginBottom: -1,
          }}>{t.toUpperCase()}</button>
        ))}
      </div>

      <div style={{ padding: "20px 24px", maxWidth: 1100, margin: "0 auto" }}>

        {/* ── APPROVALS TAB ── */}
        {tab === "approvals" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
              <div>
                <Mono color={T.textDim} size={9}>APPROVAL QUEUE</Mono>
                <div style={{ fontSize: 14, fontFamily: T.serif, marginTop: 4 }}>Actions awaiting your decision</div>
              </div>
              {approvals.length > 0 && (
                <button onClick={() => { approvals.forEach(a => handleApprove(a.id)); }} style={{ fontSize: 9, fontFamily: T.mono, color: T.bg, background: T.green, border: "none", padding: "6px 14px", cursor: "pointer", letterSpacing: "0.1em", fontWeight: 700 }}>
                  APPROVE ALL ({approvals.length})
                </button>
              )}
            </div>
            {approvals.length === 0 ? (
              <div style={{ padding: "60px 0", textAlign: "center" }}>
                <Dot color={T.green} />
                <div style={{ fontSize: 13, color: T.textDim, marginTop: 12, fontFamily: T.serif }}>No pending approvals. The system is running.</div>
                <div style={{ fontSize: 11, color: T.textMute, marginTop: 6, fontFamily: T.mono }}>Import leads to generate outreach for review.</div>
              </div>
            ) : (
              approvals.map(item => <ApprovalCard key={item.id} item={item} onApprove={handleApprove} onReject={handleReject} />)
            )}
          </div>
        )}

        {/* ── LEADS TAB ── */}
        {tab === "leads" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
              <div>
                <Mono color={T.textDim} size={9}>LEAD REGISTRY</Mono>
                <div style={{ fontSize: 14, fontFamily: T.serif, marginTop: 4 }}>{leads.length} total leads</div>
              </div>
              <button onClick={() => setShowImport(true)} style={{ fontSize: 9, fontFamily: T.mono, color: T.gold, background: T.goldDim, border: `1px solid ${T.gold}40`, padding: "6px 14px", cursor: "pointer", letterSpacing: "0.1em" }}>
                + IMPORT LEADS
              </button>
            </div>
            <div style={{ background: T.border, display: "flex", flexDirection: "column", gap: 1 }}>
              <div style={{ background: T.surfaceHi, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px 80px 120px", gap: 0, padding: "8px 14px" }}>
                {["BUSINESS", "TYPE", "LOCATION", "SCORE", "VALUE", "STATUS"].map(h => (
                  <Mono key={h} size={9} color={T.textDim}>{h}</Mono>
                ))}
              </div>
              {leads.map(lead => (
                <div key={lead.id} style={{ background: T.surface, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px 80px 120px", gap: 0, padding: "11px 14px", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{lead.business_name}</div>
                    <div style={{ fontSize: 10, color: T.textDim }}>{lead.owner_name}</div>
                  </div>
                  <Mono color={T.textDim} size={10}>{lead.business_type}</Mono>
                  <Mono color={T.textDim} size={10}>{lead.city}, {lead.state}</Mono>
                  <ScoreBar score={lead.ai_score} />
                  <Mono color={T.gold} size={11}>${lead.proposal_value}/mo</Mono>
                  <StatusBadge status={lead.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PIPELINE TAB ── */}
        {tab === "pipeline" && (
          <div>
            <Mono color={T.textDim} size={9}>SALES PIPELINE</Mono>
            <div style={{ fontSize: 14, fontFamily: T.serif, marginTop: 4, marginBottom: 20 }}>Active opportunities</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1, background: T.border }}>
              {[
                { stage: "SEQUENCE", status: "sent", color: T.blue },
                { stage: "REPLIED", status: "replied", color: T.green },
                { stage: "MEETING", status: "meeting_booked", color: T.green },
                { stage: "PROPOSAL", status: "proposal_sent", color: T.gold },
                { stage: "CLOSED", status: "closed_won", color: T.gold },
              ].map(({ stage, status, color }) => {
                const stageleads = leads.filter(l => l.status === status);
                return (
                  <div key={stage} style={{ background: T.surface, padding: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <Mono color={color} size={9}>{stage}</Mono>
                      <Mono color={T.textDim} size={9}>{stageleads.length}</Mono>
                    </div>
                    {stageleads.length === 0 ? (
                      <div style={{ fontSize: 10, color: T.textMute, fontFamily: T.mono }}>—</div>
                    ) : stageleads.map(lead => (
                      <div key={lead.id} style={{ background: T.bg, padding: "8px 10px", marginBottom: 4 }}>
                        <div style={{ fontSize: 11, color: T.text, marginBottom: 2 }}>{lead.business_name}</div>
                        <div style={{ fontSize: 10, color: T.gold, fontFamily: T.mono }}>${lead.proposal_value}/mo</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── DELIVERY TAB ── */}
        {tab === "delivery" && (
          <div>
            <Mono color={T.textDim} size={9}>AUTOMATION LIBRARY</Mono>
            <div style={{ fontSize: 14, fontFamily: T.serif, marginTop: 4, marginBottom: 20 }}>Make.com blueprints ready to deploy for clients</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1, background: T.border }}>
              {[
                { name: "Missed Call → Instant SMS", desc: "Auto-texts any missed call within 60 seconds. Recovers 30-40% of missed leads.", for: ["dental","salon","hvac","plumber"], setup: "$0 extra", value: "$800–1,200 setup" },
                { name: "Post-Service Review Request", desc: "48hr auto-email + SMS asking for Google review. Increases reviews 3–5x.", for: ["restaurant","salon","auto_repair","hvac"], setup: "$0 extra", value: "Included in retainer" },
                { name: "New Lead Auto Follow-Up", desc: "Responds to contact forms within 2 min, 7-day follow-up sequence.", for: ["real_estate","law_firm","hvac","contractor"], setup: "$0 extra", value: "$600–900 setup" },
                { name: "Appointment Reminder Sequence", desc: "48hr, 24hr, 2hr reminders. Reduces no-shows 60–80%.", for: ["dental","medical","salon","law_firm"], setup: "$0 extra", value: "Included in retainer" },
                { name: "AI Chat Receptionist", desc: "24/7 website chatbot that answers FAQs, qualifies leads, books appointments.", for: ["dental","law_firm","medical","real_estate"], setup: "2–3 days", value: "$1,500–2,000 setup" },
                { name: "Monthly ROI Report", desc: "Auto-generates and emails client performance reports on the 1st of each month.", for: ["all"], setup: "1 day", value: "Increases retention" },
              ].map((auto, i) => (
                <div key={i} style={{ background: T.surface, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <Mono color={T.textMute} size={9}>{String(i + 1).padStart(2, "0")}</Mono>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: T.text, fontWeight: 600, marginBottom: 3 }}>{auto.name}</div>
                    <div style={{ fontSize: 11, color: T.textDim, marginBottom: 6 }}>{auto.desc}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {auto.for.map(f => <Mono key={f} color={T.blue} size={9}>{f}</Mono>)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: T.gold, fontFamily: T.mono }}>{auto.value}</div>
                    <div style={{ fontSize: 10, color: T.textDim, fontFamily: T.mono, marginTop: 2 }}>Setup: {auto.setup}</div>
                  </div>
                  <button style={{ fontSize: 9, fontFamily: T.mono, color: T.textDim, background: "none", border: `1px solid ${T.border}`, padding: "5px 10px", cursor: "pointer", letterSpacing: "0.08em", flexShrink: 0 }}>
                    GENERATE BLUEPRINT
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
