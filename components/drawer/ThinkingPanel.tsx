"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { THINKING, THINKING_INTRO, causeById, type Finding, type ThinkingIcon, type ThinkingSource, type ThinkingStep } from "@/lib/data";
import { DUR, EASE } from "@/lib/motion";
import { usePrototype } from "@/lib/store";
import { Collapse, ConfidenceLabel, Icon } from "../ui";

/* Show thinking, in the drawer's side panel: the investigation trace as
 * a timeline. Each step is a card with what it did, how long it took,
 * and the sources it looked at (pills; the ones with a page open it).
 * Open a step to see what it found; the last step is the reasoning
 * behind the ranking. Rail and dots follow the Log tab, cards and type
 * follow the DS (shared radius, 1px border, 14/1.6 body, 13 caption). */
export function ThinkingPanel() {
  return (
    <div className="flex flex-col gap-6 px-6 pb-8">
      <header className="flex flex-col gap-1">
        <h3 className="type-section text-foreground">Thinking</h3>
        <p className="type-body text-pretty text-muted-foreground">{THINKING_INTRO}</p>
      </header>
      <ol className="flex flex-col" aria-label="Investigation steps">
        {THINKING.map((step, i) => (
          <Step key={step.title} step={step} index={i} last={i === THINKING.length - 1} />
        ))}
      </ol>
    </div>
  );
}

/* Dot centre: card border 1 + header padding 12 + half the 22px title line. */
const TITLE_LINE = 24;

function Step({ step, index, last }: { step: ThinkingStep; index: number; last: boolean }) {
  const [open, setOpen] = useState(false);
  // Steps land after the panel's own settle, one by one.
  const delay = 0.2 + index * 0.07;
  const bodyId = `thinking-step-${index}`;
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.slow, ease: EASE.reveal, delay }}
      className={`grid grid-cols-[10px_minmax(0,1fr)] gap-x-3 ${last ? "" : "pb-3"}`}
    >
      <span className="relative" aria-hidden>
        {!last && (
          <span className="absolute left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-border" style={{ top: TITLE_LINE, bottom: -TITLE_LINE }} />
        )}
        <span className="absolute left-0 size-2.5 rounded-full bg-verdigris shadow-[0_0_0_3px_var(--color-background)]" style={{ top: TITLE_LINE - 5 }} />
      </span>

      <article className="flex min-w-0 flex-col overflow-clip rounded-lg border border-border bg-background">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={bodyId}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-table-row-hover"
        >
          <Glyph name={step.icon} />
          <span className="type-body min-w-0 flex-1 font-medium text-foreground">{step.title}</span>
          <span className="font-mono text-[13px] leading-5 text-muted-foreground tabular-nums">{step.time}</span>
          <Icon
            src="/figma/drawer/chevron.svg"
            size={16}
            className={`transition-transform duration-200 ease-[var(--ease-reveal)] ${open ? "rotate-180" : ""}`}
          />
        </button>

        {step.sources.length > 0 && (
          <ul className="flex flex-wrap gap-2 px-4 pb-3" aria-label="Sources">
            {step.sources.map((s) => (
              <li key={s.label} className="flex">
                <SourcePill source={s} />
              </li>
            ))}
          </ul>
        )}

        <div id={bodyId}>
          <Collapse open={open}>
            <div className="border-t border-border px-4 py-3">
              {step.ranked ? <Ranked ranked={step.ranked} /> : <Findings findings={step.findings} />}
            </div>
          </Collapse>
        </div>
      </article>
    </motion.li>
  );
}

const RESULT: Record<Finding["result"], { icon: string; label: string }> = {
  supported: { icon: "/figma/cause/circle-check.svg", label: "Supports the cause" },
  checked: { icon: "/figma/cause/circle.svg", label: "Checked" },
  "ruled-out": { icon: "/figma/cause/circle-x.svg", label: "Ruled out" },
};

function Findings({ findings }: { findings: Finding[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {findings.map((f) => (
        <li key={f.text} className="flex items-start gap-2.5">
          <span className="flex h-[22px] shrink-0 items-center" aria-label={RESULT[f.result].label} role="img">
            <Icon src={RESULT[f.result].icon} size={16} />
          </span>
          <span className={`type-body text-pretty ${f.result === "ruled-out" ? "text-muted-foreground" : "text-foreground-secondary"}`}>{f.text}</span>
        </li>
      ))}
    </ul>
  );
}

function Ranked({ ranked }: { ranked: NonNullable<ThinkingStep["ranked"]> }) {
  return (
    <ol className="flex flex-col gap-3">
      {ranked.map((r) => {
        const cause = causeById(r.cause);
        return (
          <li key={r.cause} className="flex flex-col gap-0.5">
            <span className="flex items-start gap-3">
              <span className="type-body min-w-0 flex-1 font-medium text-foreground">{cause.headline}</span>
              <span className="flex h-[22px] items-center">
                <ConfidenceLabel level={cause.confidence} label={cause.confidence === "High" ? "Most likely" : undefined} />
              </span>
            </span>
            <span className="type-body text-pretty text-muted-foreground">{r.why}</span>
          </li>
        );
      })}
    </ol>
  );
}

/* A source the step looked at. Pill per the DS shape.pill; one with a
 * page in the prototype is a link (teal-on-light text and ↗). */
function SourcePill({ source }: { source: ThinkingSource }) {
  const { actions } = usePrototype();
  const pill = "inline-flex h-7 items-center gap-1.5 rounded-full border border-border px-3 type-meta";
  const link = source.link;
  if (!link) return <span className={`${pill} bg-surface-subtle text-foreground-secondary`}>{source.label}</span>;
  const open = () => (link.kind === "signals" ? actions.openSignals() : actions.openRelatedIssue(link.id));
  return (
    <button
      type="button"
      onClick={open}
      title={link.kind === "signals" ? "Open in Signals" : "Open in Related issues"}
      className={`${pill} bg-background font-medium text-verdigris-on-light transition-colors hover:bg-accent-subtle`}
    >
      {source.label}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M7 7h10v10" />
        <path d="M7 17 17 7" />
      </svg>
    </button>
  );
}

/* Lucide icons, drawn at 16px with the Figma exports' 1.33 stroke. */
const GLYPHS: Record<ThinkingIcon, string[]> = {
  alert: ["m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3", "M12 9v4", "M12 17h.01"],
  readings: ["M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"],
  change: ["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", "M3 12h6", "M15 12h6"],
  incidents: ["M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", "M3 3v5h5", "M12 7v5l4 2"],
  records: [
    "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
    "M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z",
    "M12 11h4",
    "M12 16h4",
    "M8 11h.01",
    "M8 16h.01",
  ],
  rank: ["M10 12h11", "M10 18h11", "M10 6h11", "M4 10h2", "M4 6h1v4", "M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"],
};

function Glyph({ name }: { name: ThinkingIcon }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground" aria-hidden>
      {GLYPHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
