/* ─────────────────────────────────────────────────────────
 * Scripted content for the prototype. Copy is taken from the
 * Figma flows "01 · Root cause analysis" and "05 · Ask a
 * follow-up". Every number shown on screen lives here.
 * ───────────────────────────────────────────────────────── */

export type SourceType = "sensor" | "change" | "incident";
export type Confidence = "High" | "Medium" | "Low";

export type Source = { label: string; type: SourceType };

export type Cause = {
  id: 1 | 2 | 3;
  title: string;
  confidence: Confidence;
  sources: Source[];
};

export const CAUSES: Cause[] = [
  {
    id: 1,
    title: "Non-linear load switching on PDU-01-A9F",
    confidence: "High",
    sources: [
      { label: "PDU-01-A9F sensor", type: "sensor" },
      { label: "CHG-2291", type: "change" },
    ],
  },
  {
    id: 2,
    title: "UPS-2 rectifier capacitor wear",
    confidence: "Medium",
    sources: [
      { label: "UPS-2 waveform", type: "sensor" },
      { label: "Incident #482", type: "incident" },
    ],
  },
  {
    id: 3,
    title: "Phase A load imbalance on Panel B",
    confidence: "Low",
    sources: [{ label: "Panel B sensor", type: "sensor" }],
  },
];

export const DATA_WINDOW = "Data from 11:30–13:30";

/* Investigation trace (DS: Drawer content / RCA – Loading) */
export const TRACE_META = "Checking data from 11:30 to 13:30 on PDU-01-A9F and UPS-2.";
export const TRACE_STEPS = [
  { label: "Read alert on PDU-01-A9F", time: "0.4s" },
  { label: "Pulled 24h of PDU-01-A9F and UPS-2 readings", time: "1.8s" },
  { label: "Checked change log for this panel", time: "0.9s" },
  { label: "Compared with 14 past incidents on this panel", active: "Comparing with 14 past incidents on this panel", time: "2.6s" },
  { label: "Checked maintenance records", active: "Checking maintenance records", time: "0.7s" },
  { label: "Ranked likely causes", active: "Ranking likely causes", time: "1.1s" },
] as const;

/* Expanded cause #1 (02.3 / 02.4) */
export const CAUSE_SUMMARY =
  "Rack 14’s 12 new servers came online at 12:22. Their switch-mode power supplies pushed Phase A THDi from 3% to 180% within 8 minutes. This matches 2 past incidents on this panel.";

export const EVIDENCE = [
  { title: "THDi on Phase A rose from 3% to 180%", meta: "PDU-01-A9F sensor at 12:22–12:30", opensSignals: true },
  { title: "Rack 14: 12 servers powered on", meta: "Change log · CHG-2291 at 12:22", opensSignals: false },
  { title: "Same harmonic pattern on this panel", meta: "Incident #482 · Mar 14, 2026", opensSignals: false },
];

export const REASONING = {
  checked: {
    title: "What was checked",
    body: "11:30–13:30 on PDU-01-A9F, UPS-2 and Panel B · 4 data sources · 14 past incidents",
  },
  why: ["Event timing aligns within 40s.", "3 of 3 independent sources agree.", "Matches 2 confirmed past incidents."],
  steps: [
    { result: "supported", title: "Phase A THDi crossed the 5% limit at 12:24", body: "Rose from 3% to 180% in 8 min. Phases B and C stayed under 6%." },
    { result: "supported", title: "Rack 14 powered on 12 servers at 12:22", body: "Change CHG-2291 started 2 min before the rise. Timing matches within 40s." },
    { result: "checked", title: "Compared with 14 past incidents on this panel", body: "2 matched this harmonic pattern; both traced to new switch-mode PSU loads." },
    { result: "ruled-out", title: "UPS-2 rectifier wear is less likely", body: "Ripple rose 4%, below the 15% seen in capacitor failures. Kept as a possible cause." },
    { result: "ruled-out", title: "Ambient temperature", body: "Room held 22–23 °C; no thermal correlation." },
  ],
} as const;

/* Recommended steps. Before a cause is confirmed the Assistant
 * suggests triage (DS: RCA – Results). Once cause #1 is confirmed
 * there is nothing left to verify, so the steps turn to the fix,
 * keep the escalation (the UPS-2 risk hasn't changed), and watch
 * the UPS-2 rectifier that the harmonics are wearing down. */
export type Step = {
  key: string;
  title: string;
  body: string;
  tag?: string;
  cta: string;
  ctaKind: "primary" | "secondary";
  done: string;
  toast: string;
  opensDialog?: boolean;
};

const ESCALATE: Step = {
  key: "escalate",
  title: "Escalate to facilities lead",
  body: "UPS-2 has a 76% chance of failing in the next 6 h if the load stays.",
  cta: "Escalate",
  ctaKind: "secondary",
  done: "Escalated",
  toast: "Escalated to the facilities lead",
};

export const TRIAGE_STEPS: Step[] = [
  {
    key: "task",
    title: "Inspect non-linear loads on rack 14",
    body: "Confirms cause #1 on site in about 5 min",
    cta: "Create task",
    ctaKind: "primary",
    done: "Task T-2214 created",
    toast: "Task T-2214 created for the rack 14 inspection",
  },
  ESCALATE,
];

export const CONFIRMED_STEPS: Step[] = [
  {
    key: "move-load",
    title: "Move rack 14 load to PDU-02",
    body: "Brings Phase A THDi under 5%. UPS-2 failure odds drop from 76% to 12%.",
    cta: "Create work order",
    ctaKind: "primary",
    done: "WO-1182 created",
    toast: "Work order WO-1182 created to move rack 14 load to PDU-02",
  },
  ESCALATE,
  {
    key: "inspect-ups",
    title: "Inspect UPS-2 rectifier",
    tag: "Optional",
    body: "Rack 14’s harmonics are wearing its capacitors. Marco Diaz is free Tue 09:00.",
    cta: "Schedule",
    ctaKind: "secondary",
    done: "Scheduled · Tue 09:00",
    toast: "Maintenance scheduled with Marco Diaz for Tue, Oct 20, 09:00–10:30",
    opensDialog: true,
  },
];

/* Steps that only exist once a cause is confirmed (undo clears these). */
export const CONFIRMED_ONLY = CONFIRMED_STEPS.filter((s) => !TRIAGE_STEPS.includes(s)).map((s) => s.key);

export const SCHEDULE_DIALOG: Record<string, { subtitle: string; instructions: string }> = {
  "inspect-ups": {
    subtitle: "Inspect UPS-2 rectifier · capacitor wear",
    instructions:
      "Check the UPS-2 rectifier capacitor bank for wear. Measure ripple on UPS-2 and compare with incident #482.",
  },
};

/* Follow-up (05 · Ask a follow-up) */
export const QUESTION = "Why is UPS-2 capacitor wear only Medium? Any related causes?";

export const SEARCH_STEPS = [
  { label: "Read the evidence for UPS-2 capacitor wear", time: "0.6s" },
  { label: "Searched 14 past incidents on this panel", active: "Searching 14 past incidents on this panel", time: "2.1s" },
  { label: "Compared with today’s readings", active: "Comparing with today’s readings", time: "1.5s" },
] as const;

export const SEARCH_SUMMARY = "Checked 14 past incidents and the UPS-2 waveform";

export const ANSWER = {
  leadTitle: "Capacitor wear doesn’t explain the 12:30 spike",
  leadBody: "Rack 14 powering on does. UPS-2 ripple is only 6%; failures start at 15%.",
  relatedTitle: "Rack 14’s harmonics are speeding up the wear",
  related: [
    { rank: 1 as const, cause: "Non-linear load switching", linked: true, note: "Its harmonics heat UPS-2’s capacitors.", source: "PDU-01-A9F sensor" },
    { rank: 3 as const, cause: "Phase A load imbalance", linked: false, note: "Started 3 days before the spike.", source: "Panel B sensor" },
  ],
  pastTitle: "Today matches Mar 14, when UPS-2 failed",
  match: [
    { signal: "Trigger", today: "Rack 14 power-on", past: "Rack 9 power-on" },
    { signal: "Phase A THDi", today: "180%", past: "165%" },
    { signal: "UPS-2 ripple after 1 h", today: "6%", past: "6%" },
  ],
  pastIssue: {
    title: "UPS-2 capacitor bank failure",
    meta: "Incident #482 · Mar 14, 2026",
    status: "Resolved",
  },
  whatIfTitle: "Failure odds · next 6 h",
};

/* What-if simulator. Values per stop combination come from the
 * 12 variants of "What-if / UPS-2 ripple odds" (1560:5036). */
export const RACK_STOPS = [
  { label: "0 kW", x: 0 },
  { label: "1.0 kW", x: 123.42 },
  { label: "2.0 kW", x: 246.84 },
  { label: "3.8 kW", x: 469 },
];

export const UPS_STOPS = [
  { label: "0%", x: 0, note: "UPS-1 at 52%", risk: "" },
  { label: "15%", x: 234.5, note: "UPS-1 at 63–65%", risk: "" },
  { label: "30%", x: 469, note: "UPS-1 at 74–78%", risk: "N+1 at risk" },
];

export const ODDS_NOW = 76;

/* [ups][rack] */
export const ODDS: number[][] = [
  [76, 58, 35, 12],
  [64, 47, 27, 9],
  [52, 36, 19, 6],
];

/* Projection angle about "Now", degrees counter-clockwise (Figma rotation). */
export const PROJECTION_ANGLE: number[][] = [
  [10.62, 8.14, 4.93, 1.7],
  [8.97, 6.61, 3.81, 1.27],
  [7.31, 5.07, 2.68, 0.85],
];

export function riskFor(odds: number): Confidence {
  if (odds >= 70) return "High";
  if (odds >= 30) return "Medium";
  return "Low";
}

/* UPS-2 failure odds per likely cause: where they stand now, and
 * what fixing that cause does to them. #1 and #2 each own one lever
 * of the what-if, and their Simulate opens on that lever's
 * recommended stop (all of rack 14's 3.8 kW; 15% of UPS-2's load,
 * which keeps N+1). The follow-up found #3 isn't linked to UPS-2
 * wear, so fixing it leaves the odds where they are. */
export type Lever = "rack" | "ups";
export type CauseOdds = { lever: Lever | null; preset: number; fix: string; note?: string };

export const CAUSE_ODDS: Record<Cause["id"], CauseOdds> = {
  1: { lever: "rack", preset: 3, fix: "if rack 14’s load moves to PDU-02" },
  2: { lever: "ups", preset: 1, fix: "if 15% of UPS-2’s load shifts to UPS-1" },
  3: {
    lever: null,
    preset: 0,
    fix: "not linked to UPS-2 wear",
    note: "Panel B’s imbalance started 3 days before the spike and isn’t linked to UPS-2 wear, so fixing it doesn’t move these odds.",
  },
};

export function oddsAt(lever: Lever | null, stop: number) {
  return lever === "rack" ? ODDS[0][stop] : lever === "ups" ? ODDS[stop][0] : ODDS_NOW;
}

export function angleAt(lever: Lever | null, stop: number) {
  return lever === "rack" ? PROJECTION_ANGLE[0][stop] : lever === "ups" ? PROJECTION_ANGLE[stop][0] : PROJECTION_ANGLE[0][0];
}

/* ─────────────────────────────────────────────────────────
 * Handoff (04 · Handoff, 09.1–09.3). Layout follows the 09.2
 * draft, but the facts come from this session's Log: the alert
 * is still open at handoff, so each message says what was done,
 * what is still open, and what to watch. Each person gets their
 * own channels, and each message is written for that reader:
 * steps and timestamps for the next tech, plan and risk for
 * leadership.
 * ───────────────────────────────────────────────────────── */
export type ChannelKey = "servicenow" | "slack" | "sms";
export type PersonKey = "tech" | "lead";

export type HandoffMessage =
  | { kind: "ticket"; title: string; fields: { label: string; value: string | { time: string; text: string }[] }[] }
  | { kind: "slack"; title: string; sections: { label: string; text: string }[]; link?: string }
  | { kind: "sms"; text: string };

export type Channel = { key: ChannelKey; label: string; to: string; write: (log: LogItem[]) => HandoffMessage };
export type Recipient = { key: PersonKey; audience: string; name: string; channels: Channel[] };

export const HANDOFF = {
  intro: "Pick who it’s for and where to send it. Each message is written from the Log for its reader.",
  disclaimer: "AI-drafted from the Log. Review before you send.",
  placeholder: "Ask about this handoff…",
};

/* What each Log event reads as in a handoff, in the sender's voice. */
const DID: Record<Exclude<LogKey, "handoff">, string> = {
  analysis: "Ran the root cause analysis",
  confirm: "Confirmed rack 14’s new servers as the cause",
  task: "Opened T-2214 to inspect rack 14",
  escalate: "Escalated to Jordan Lee",
  "move-load": "Opened WO-1182 to move rack 14 load to PDU-02",
  "inspect-ups": "Booked the UPS-2 inspection for Tue 09:00",
};

function did(log: LogItem[]) {
  return log.flatMap((e) => (e.key === "handoff" ? [] : [{ time: e.time, text: DID[e.key] }]));
}

function stillOpen(log: LogItem[]) {
  const has = (k: LogKey) => log.some((e) => e.key === k);
  return [
    !has("confirm") && "Confirm the root cause",
    has("move-load") ? "Move rack 14 load to PDU-02 (WO-1182)" : "Move rack 14 load to PDU-02",
    has("task") && "T-2214: inspect rack 14",
    has("inspect-ups") && "UPS-2 rectifier inspection, Tue 09:00",
  ].filter((x): x is string => !!x);
}

const confirmed = (log: LogItem[]) => log.some((e) => e.key === "confirm");
const sentence = (parts: string[]) => parts.join(". ") + ".";
const WATCH = `UPS-2 has a ${ODDS_NOW}% chance of failing in the next 6 h while the load stays.`;

export const RECIPIENTS: Recipient[] = [
  {
    key: "tech",
    audience: "Next shift tech",
    name: "Ana Ruiz",
    channels: [
      {
        key: "servicenow",
        label: "ServiceNow",
        to: "T-2214 work notes",
        write: (log) => ({
          kind: "ticket",
          title: "Shift handoff: PDU-01-A9F harmonic alert",
          fields: [
            { label: "Status", value: "Open. Phase A THDi is still above the 5% limit." },
            {
              label: "Root cause",
              value: confirmed(log)
                ? "Rack 14’s 12 new servers pushed Phase A THDi to 180% by 12:30."
                : "Not confirmed yet. Most likely rack 14’s 12 new servers (High).",
            },
            { label: "Actions", value: did(log).length ? did(log) : "None yet." },
            { label: "Still open", value: sentence(stillOpen(log)) },
            { label: "Watch", value: WATCH },
          ],
        }),
      },
      {
        key: "slack",
        label: "Slack",
        to: "#sjc-night-shift",
        write: (log) => ({
          kind: "slack",
          title: "Handoff: PDU-01-A9F harmonic alert (still open)",
          sections: [
            { label: "What happened:", text: "Phase A THDi hit 180% by 12:30 after rack 14’s 12 new servers came online at 12:22." },
            {
              label: "What I did:",
              text: did(log).length ? sentence(did(log).map((a) => `${a.text} (${a.time})`)) : "Nothing yet.",
            },
            { label: "Still open:", text: sentence(stillOpen(log)) },
            { label: "Watch:", text: WATCH },
          ],
          link: "See full analysis",
        }),
      },
      {
        key: "sms",
        label: "SMS",
        to: "Ana Ruiz",
        write: (log) => ({
          kind: "sms",
          text: `SJC handoff: PDU-01-A9F alert still open. Cause: rack 14’s new servers${confirmed(log) ? "" : " (likely)"}. First: move rack 14 load to PDU-02. UPS-2 at ${ODDS_NOW}% failure risk in 6 h. Details: sig.nl/a/8F2`,
        }),
      },
    ],
  },
  {
    key: "lead",
    audience: "Leadership",
    name: "Jordan Lee",
    channels: [
      {
        key: "slack",
        label: "Slack",
        to: "Jordan Lee",
        write: (log) => {
          const booked = stillOpen(log).filter((x) => x.endsWith("Tue 09:00"));
          return {
            kind: "slack",
            title: "SJC: PDU-01-A9F alert is still open",
            sections: [
              { label: "What happened:", text: "New servers on rack 14 overloaded Phase A at 12:24." },
              { label: "Plan:", text: "Ana Ruiz moves rack 14 load to PDU-02 at the start of the next shift." },
              { label: "Risk:", text: `UPS-2 has a ${ODDS_NOW}% chance of failing in the next 6 h until the load moves.` },
              ...(booked.length ? [{ label: "Next:", text: sentence(booked) }] : []),
            ],
          };
        },
      },
      {
        key: "sms",
        label: "SMS",
        to: "Jordan Lee",
        write: () => ({
          kind: "sms",
          text: `SJC update: PDU-01-A9F alert still open. Cause: rack 14’s new servers. Plan: move the load to PDU-02 at the start of the next shift. UPS-2 at ${ODDS_NOW}% failure risk until then. sig.nl/a/8F2`,
        }),
      },
    ],
  },
];

/* ─────────────────────────────────────────────────────────
 * Related issues (02 · Related issues, 03.2–03.5). Titles,
 * dates, equipment and tags come from 03.2; filter counts from
 * 03.5. Row 1's resolution is the Incident #482 record (02.53).
 * The other resolutions are illustrative and need checking.
 * Cooling fan failure is In progress, as on the alert inbox,
 * which is what makes 03.5's "Resolved only · 7" add up.
 * ───────────────────────────────────────────────────────── */
export type MatchTag = "Same panel" | "Same symptom" | "Same cause" | "Same UPS" | "Similar harmonics" | "Same panel group";
export type IssueStatus = "Resolved" | "In progress";

export type RelatedIssue = {
  id: string;
  title: string;
  date: string; // ISO, for sorting and the time range
  equipment: string;
  ref?: string;
  tags: MatchTag[];
  status: IssueStatus;
  resolution: string;
};

/* In relevance order (closest match first). */
export const RELATED_ISSUES: RelatedIssue[] = [
  {
    id: "harmonic-spike",
    title: "Harmonic spike after rack power-on",
    date: "2026-03-14",
    equipment: "PDU-01-A9F",
    tags: ["Same panel", "Same symptom", "Same cause"],
    status: "Resolved",
    resolution:
      "Rack 9 brought 10 new servers online. Moved rack 9 load to PDU-02, and THDi dropped under 5% within 15 minutes. A harmonic filter was added in the next change window.",
  },
  {
    id: "ups2-capacitor",
    title: "UPS-2 capacitor bank failure",
    date: "2026-03-14",
    equipment: "UPS-2",
    ref: "#482",
    tags: ["Same UPS", "Similar harmonics"],
    status: "Resolved",
    resolution: "Failed 6 h after the Mar 14 harmonic spike. The UPS-2 rectifier capacitor bank was replaced.",
  },
  {
    id: "thdi-phase-a",
    title: "THDi above 5% on Phase A",
    date: "2026-01-22",
    equipment: "PDU-01-A9F",
    tags: ["Same panel", "Same symptom"],
    status: "Resolved",
    resolution: "THDi crossed 5% during a scheduled load test and cleared when it ended. No fix needed.",
  },
  {
    id: "gpu-rack",
    title: "Harmonics after GPU rack install",
    date: "2025-11-18",
    equipment: "PDU-03-B12",
    tags: ["Same cause"],
    status: "Resolved",
    resolution: "The new GPU servers’ switch-mode power supplies raised THDi. A harmonic filter was added on PDU-03-B12.",
  },
  {
    id: "panel-b-imbalance",
    title: "Phase imbalance on Panel B",
    date: "2025-12-03",
    equipment: "Panel B",
    tags: ["Same panel group"],
    status: "Resolved",
    resolution: "Phase A carried more load than B and C. Circuits were rebalanced across the three phases.",
  },
  {
    id: "phase-a-current",
    title: "Phase A current spike",
    date: "2025-10-02",
    equipment: "PDU-01-A9F",
    tags: ["Same panel"],
    status: "Resolved",
    resolution: "A failed server power supply drew excess current on Phase A. The supply was replaced.",
  },
  {
    id: "cooling-fan",
    title: "Cooling fan failure",
    date: "2026-05-03",
    equipment: "PDU-01-A9F",
    tags: ["Same panel"],
    status: "In progress",
    resolution: "Still open. A fan replacement is in progress.",
  },
  {
    id: "ups2-battery",
    title: "UPS-2 battery test alarm",
    date: "2025-08-09",
    equipment: "UPS-2",
    tags: ["Same UPS"],
    status: "Resolved",
    resolution: "One battery string failed its self-test. It passed on retest after the string was replaced.",
  },
];

/* The "Why related" checkboxes in the filter (03.5). */
export const RELATED_FILTER_TAGS: MatchTag[] = ["Same panel", "Same symptom", "Same cause", "Same UPS"];

export type SortKey = "relevance" | "date" | "equipment";
export const RELATED_SORTS: { key: SortKey; label: string; detail: string }[] = [
  { key: "relevance", label: "Relevance", detail: "Closest match to this alert" },
  { key: "date", label: "Date", detail: "Newest first" },
  { key: "equipment", label: "Equipment", detail: "Grouped by panel and UPS" },
];

/* Cutoffs are fixed so the 03.2 default (8 issues in the last
 * 12 months) holds; they read as if today were early Jun 2026. */
export type RangeKey = "3m" | "6m" | "12m";
export const RELATED_RANGES: { key: RangeKey; label: string; since: string }[] = [
  { key: "3m", label: "Last 3 months", since: "2026-03-01" },
  { key: "6m", label: "Last 6 months", since: "2025-12-01" },
  { key: "12m", label: "Last 12 months", since: "2025-06-01" },
];

export const RELATED = {
  placeholder: "Ask about past incidents on this panel…",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function formatIssueDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/* ─────────────────────────────────────────────────────────
 * Log (03 · Log, 08.1). The alert's timeline, newest first.
 * It opens with the alert itself; everything after that is
 * written by what happens in this session (the analysis, your
 * confirm, tasks, escalation, bookings, the handoff), so the
 * Log never claims more than the Root cause tab shows. "Now"
 * is 13:30, the end of the analysed window; each event moves
 * the clock on 2 min. Layout and entry anatomy follow the DS
 * "Log item" (1424:4491).
 * ───────────────────────────────────────────────────────── */
export type LogEntry = { id: string; time: string; title: string; body: string; who: string; ai?: boolean };
export type LogKey = "analysis" | "confirm" | "task" | "escalate" | "move-load" | "inspect-ups" | "handoff";
export type LogItem = { key: LogKey; time: string };

export const LOG = {
  intro: "Every action on this alert, by people and the Assistant.",
  day: "Today",
  order: "newest first",
  placeholder: "Ask about what happened on this alert…",
};

export const LOG_CLOCK = { start: 13 * 60 + 30, step: 2 };

export function clockTime(tick: number) {
  const m = LOG_CLOCK.start + tick * LOG_CLOCK.step;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/* Before the session: the alert. */
export const LOG_SEED: LogEntry[] = [
  {
    id: "raised",
    time: "12:24",
    title: "Alert raised",
    body: "Phase A THDi crossed the 5% limit on PDU-01-A9F.",
    who: "Signals · automatic detection",
  },
];

/* Session events. "handoff" is written from what was sent (LogPanel). */
export const LOG_EVENTS: Record<Exclude<LogKey, "handoff">, Omit<LogEntry, "id" | "time">> = {
  analysis: {
    title: "Root cause analysis",
    body: "Ranked 3 likely causes. Top: non-linear load switching on PDU-01-A9F (High).",
    who: "Signals Assistant · started by you",
    ai: true,
  },
  confirm: {
    title: "Root cause confirmed",
    body: "Non-linear load switching from rack 14’s new servers.",
    who: "You",
  },
  task: {
    title: "Task created",
    body: "T-2214: inspect non-linear loads on rack 14.",
    who: "Signals Assistant · approved by you",
    ai: true,
  },
  escalate: {
    title: "Alert escalated",
    body: "Sent to Jordan Lee, facilities lead.",
    who: "You",
  },
  "move-load": {
    title: "Work order created",
    body: "WO-1182: move rack 14 load to PDU-02.",
    who: "Signals Assistant · approved by you",
    ai: true,
  },
  "inspect-ups": {
    title: "Inspection scheduled",
    body: "UPS-2 rectifier, with Marco Diaz, Tue 09:00.",
    who: "You",
  },
};
