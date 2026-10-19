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
    { result: "ruled-out", title: "UPS-2 rectifier wear is less likely", body: "Ripple rose 4%, below the 15% seen in capacitor failures. Kept as cause #2." },
    { result: "ruled-out", title: "Ambient temperature", body: "Room held 22–23 °C; no thermal correlation." },
  ],
} as const;

/* Recommended steps. Before a cause is confirmed the Assistant
 * suggests triage (DS: RCA – Results); once cause #1 is confirmed
 * the steps re-rank around it (02.6). */
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
  {
    key: "escalate",
    title: "Escalate to facilities lead",
    tag: "Optional",
    body: "Equipment downstream is at risk in 4–6 hrs if the load stays",
    cta: "Escalate",
    ctaKind: "secondary",
    done: "Escalated",
    toast: "Escalated to the facilities lead",
  },
];

export const CONFIRMED_STEPS: Step[] = [
  {
    key: "inspect-rack",
    title: "Inspect non-linear loads on rack 14",
    body: "5-min on-site check. Verifies cause #1.",
    cta: "Schedule",
    ctaKind: "primary",
    done: "Scheduled · Tue 09:00",
    toast: "Maintenance scheduled with Marco Diaz for Tue, Oct 20, 09:00–10:30",
    opensDialog: true,
  },
  {
    key: "inspect-ups",
    title: "Inspect UPS-2 rectifier",
    tag: "Optional",
    body: "Checks cause #2. Marco Diaz is free Tue 09:00.",
    cta: "Schedule",
    ctaKind: "secondary",
    done: "Scheduled · Tue 09:00",
    toast: "Maintenance scheduled with Marco Diaz for Tue, Oct 20, 09:00–10:30",
    opensDialog: true,
  },
];

export const SCHEDULE_DIALOG: Record<string, { subtitle: string; instructions: string }> = {
  "inspect-rack": {
    subtitle: "Inspect non-linear loads on rack 14 · confirms cause #1",
    instructions:
      "Check the 12 new servers on rack 14 for non-linear load switching. Measure Phase A THDi at the rack PDU. Compare with change CHG-2291.",
  },
  "inspect-ups": {
    subtitle: "Inspect UPS-2 rectifier · checks cause #2",
    instructions:
      "Check the UPS-2 rectifier capacitor bank for wear. Measure ripple on UPS-2 and compare with incident #482.",
  },
};

/* Follow-up (05 · Ask a follow-up) */
export const QUESTION = "Why is UPS-2 capacitor wear only Medium? Any related causes?";

export const SEARCH_STEPS = [
  { label: "Read the evidence for cause #2", time: "0.6s" },
  { label: "Searched 14 past incidents on this panel", active: "Searching 14 past incidents on this panel", time: "2.1s" },
  { label: "Compared with today’s readings", active: "Comparing with today’s readings", time: "1.5s" },
] as const;

export const SEARCH_SUMMARY = "Checked 14 past incidents and the UPS-2 waveform";

export const ANSWER = {
  leadTitle: "It doesn’t explain the 12:24 spike.",
  leadBody: "Rack 14 powering on does (cause #1). UPS-2 ripple is 6%; failures start at 15%.",
  relatedTitle: "Cause #1 is making it worse",
  related: [
    { rank: 1, cause: "Non-linear load switching", linked: true, note: "Its harmonics heat UPS-2’s capacitors.", source: "PDU-01-A9F sensor" },
    { rank: 3, cause: "Phase A load imbalance", linked: false, note: "Started 3 days before the spike.", source: "Panel B sensor" },
  ],
  pastTitle: "Today matches Mar 14, which ended in failure",
  match: [
    { signal: "Trigger", today: "Rack 14 power-on", past: "Rack 9 power-on" },
    { signal: "Phase A THDi", today: "180%", past: "165%" },
    { signal: "UPS-2 ripple, 1 h in", today: "6%", past: "6%" },
  ],
  pastIssue: {
    title: "UPS-2 capacitor bank failure",
    meta: "MAR 14, 2026 · UPS-2 · #482",
    tags: ["Same UPS", "Similar harmonics"],
    status: "Resolved",
  },
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

/* ─────────────────────────────────────────────────────────
 * Handoff (04 · Handoff, 09.1–09.3). Facts follow the 09.2
 * draft. Each person gets their own channels, and each
 * message is written for that reader: steps and timestamps
 * for the next tech, outcome and next step for leadership.
 * ───────────────────────────────────────────────────────── */
export type ChannelKey = "servicenow" | "slack" | "sms";
export type PersonKey = "tech" | "lead";

export type HandoffMessage =
  | { kind: "ticket"; title: string; fields: { label: string; value: string | { time: string; text: string }[] }[] }
  | { kind: "slack"; title: string; sections: { label: string; text: string }[]; link?: string }
  | { kind: "sms"; text: string };

export type Channel = { key: ChannelKey; label: string; to: string; message: HandoffMessage };
export type Recipient = { key: PersonKey; audience: string; name: string; channels: Channel[] };

export const HANDOFF = {
  intro: "Pick who it’s for and where to send it. Each message is written from the Log for its reader.",
  source: "From 6 Log entries, 12:24–14:12",
  sentAt: "14:25",
  disclaimer: "AI-drafted from the Log. Review before you send.",
  placeholder: "Ask about this handoff…",
};

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
        message: {
          kind: "ticket",
          title: "Shift handoff: PDU-01-A9F harmonic alert",
          fields: [
            { label: "Status", value: "Resolved. Watching PDU-02." },
            { label: "Root cause", value: "Rack 14’s 12 new servers pushed Phase A THDi to 180% at 12:24." },
            {
              label: "Actions",
              value: [
                { time: "12:40", text: "Opened T-2214 to inspect rack 14" },
                { time: "13:02", text: "Escalated to Jordan Lee" },
                { time: "13:58", text: "Moved rack 14 to PDU-02 · WO-1182" },
                { time: "14:10", text: "Sensor confirmed THDi at 4.2%" },
              ],
            },
            { label: "Still open", value: "UPS-2 rectifier inspection, Tue 09:00" },
            { label: "Watch", value: "PDU-02 load, now 70%" },
          ],
        },
      },
      {
        key: "slack",
        label: "Slack",
        to: "#sjc-night-shift",
        message: {
          kind: "slack",
          title: "Handoff: PDU-01-A9F harmonic alert (resolved)",
          sections: [
            { label: "What happened:", text: "Phase A THDi hit 180% at 12:24 after rack 14’s 12 new servers came online." },
            {
              label: "What I did:",
              text: "Created task T-2214 to inspect rack 14 (12:40). Escalated to Jordan Lee (13:02). Moved rack 14 to PDU-02, WO-1182 (13:58). Sensor confirmed 4.2% at 14:10.",
            },
            { label: "Still open:", text: "UPS-2 rectifier inspection, Tue 09:00." },
            { label: "Watch:", text: "PDU-02 load, now 70%." },
          ],
          link: "See full analysis",
        },
      },
      {
        key: "sms",
        label: "SMS",
        to: "Ana Ruiz",
        message: {
          kind: "sms",
          text: "SJC handoff: PDU-01-A9F alert resolved. Rack 14 moved to PDU-02 (WO-1182), THDi now 4.2%. Still open: UPS-2 inspection Tue 09:00. Details: sig.nl/a/8F2",
        },
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
        message: {
          kind: "slack",
          title: "SJC: PDU-01-A9F alert is resolved",
          sections: [
            { label: "What happened:", text: "New servers on rack 14 overloaded Phase A at 12:24." },
            { label: "Fix:", text: "The team moved rack 14 to PDU-02. Readings were back under the limit by 14:10." },
            { label: "Next:", text: "UPS-2 rectifier inspection, Tue 09:00." },
          ],
        },
      },
      {
        key: "sms",
        label: "SMS",
        to: "Jordan Lee",
        message: {
          kind: "sms",
          text: "SJC update: PDU-01-A9F alert resolved at 14:10. Cause: rack 14’s new servers. Load moved to PDU-02, now at 70%. Next: UPS-2 inspection Tue 09:00. sig.nl/a/8F2",
        },
      },
    ],
  },
];
