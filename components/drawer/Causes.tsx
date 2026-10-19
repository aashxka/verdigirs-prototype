"use client";

import { AnimatePresence, motion } from "motion/react";
import { CAUSE_SUMMARY, CAUSES, EVIDENCE, REASONING, type Cause } from "@/lib/data";
import { DUR, EASE, SPRING } from "@/lib/motion";
import { usePrototype } from "@/lib/store";
import { Badge, Button, Collapse, ConfidenceLabel, Icon, Rank, SourceChip } from "../ui";
import { EvidenceChart } from "./EvidenceChart";

const C = "/figma/cause";

/* Likely causes card: rows resolve out of skeletons one by one. */
export function CauseList() {
  const { state } = usePrototype();
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-lg border border-border bg-background">
      {CAUSES.map((cause, i) => (
        <div key={cause.id} className={i < CAUSES.length - 1 ? "border-b border-border" : ""}>
          <AnimatePresence mode="popLayout" initial={false}>
            {state.causesShown > i ? (
              <motion.div
                key="row"
                initial={{ opacity: 0, filter: "blur(6px)", y: 4 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{ duration: DUR.reveal, ease: EASE.reveal }}
              >
                <CauseRow cause={cause} />
              </motion.div>
            ) : (
              <motion.div key="skeleton" exit={{ opacity: 0, transition: { duration: 0.12 } }}>
                <SkeletonRow widths={SKELETON[i]} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

const SKELETON: [number, number][] = [
  [260, 150],
  [220, 120],
  [180, 100],
];

function SkeletonRow({ widths }: { widths: [number, number] }) {
  return (
    <div className="flex items-start gap-3 p-4" aria-hidden>
      <span className="shimmer size-[22px] shrink-0 rounded-full" />
      <span className="flex flex-col gap-2 pt-0.5">
        <span className="shimmer h-3 rounded-[4px]" style={{ width: widths[0] }} />
        <span className="shimmer h-2.5 rounded-[4px]" style={{ width: widths[1] }} />
      </span>
    </div>
  );
}

function CauseRow({ cause }: { cause: Cause }) {
  const { state, actions } = usePrototype();
  const primary = cause.id === 1;
  const expanded = primary && state.expanded;
  const confirmed = state.feedback === "confirmed";
  const feedbackChip = confirmed ? (primary ? "Confirmed by you" : "Unlikely root cause") : null;

  const header = (
    <>
      <Rank n={cause.id} tone={expanded ? "dark" : "neutral"} />
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-[14px] font-medium leading-5 text-foreground">{cause.title}</span>
        <span className="flex flex-wrap gap-x-2 gap-y-1.5">
          {cause.sources.map((s) => (
            <SourceChip key={s.label} source={s} onOpen={primary && s.type === "sensor" ? actions.openSignals : undefined} />
          ))}
        </span>
        <AnimatePresence initial={false}>
          {feedbackChip && (
            <motion.span
              key={feedbackChip}
              className="flex"
              initial={{ opacity: 0, scale: 0.92, filter: "blur(3px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.12 } }}
              transition={{ ...SPRING.pop, delay: primary ? 0.06 : 0.12 + cause.id * 0.07 }}
              style={{ transformOrigin: "left center" }}
            >
              <Badge tone={primary ? "teal" : "muted"}>{feedbackChip}</Badge>
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <ConfidenceLabel level={cause.confidence} />
      <motion.span
        animate={{ rotate: expanded ? 180 : 0 }}
        transition={{ duration: expanded ? DUR.expand : DUR.collapse, ease: EASE.reveal }}
        className="flex"
      >
        <Icon src="/figma/drawer/chevron.svg" size={16} />
      </motion.span>
    </>
  );

  if (!primary) {
    return <div className="flex items-start gap-3 bg-background p-4">{header}</div>;
  }

  return (
    <div className={`transition-colors duration-200 ${expanded ? "bg-surface-subtle" : "bg-background"}`}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={actions.toggleCause}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            actions.toggleCause();
          }
        }}
        className={`flex cursor-pointer items-start gap-3 p-4 transition-colors duration-150 ${
          expanded ? "border-b border-border" : "hover:bg-surface-subtle"
        }`}
      >
        {header}
      </div>
      <Collapse open={expanded} inMs={300} outMs={200}>
        <CauseDetail open={expanded} />
      </Collapse>
    </div>
  );
}

/* Expanded cause #1: verdict, reasoning, summary, chart, evidence. */
function CauseDetail({ open }: { open: boolean }) {
  const { state, actions } = usePrototype();
  const confirming = state.feedback === "confirming";
  return (
    <motion.div
      initial={false}
      animate={{ opacity: open ? 1 : 0, y: open ? 0 : -4 }}
      transition={{ duration: open ? 0.26 : 0.12, ease: EASE.reveal, delay: open ? 0.06 : 0 }}
      className="flex flex-col gap-5 pb-5 pl-12 pr-4 pt-3"
    >
      <div className="flex items-center gap-1 py-0.5">
        <span className="flex-1 text-[14px] font-medium leading-5 text-foreground">Is this the cause?</span>
        <Button kind="secondary" loading={confirming} onClick={actions.confirm}>
          Confirm
        </Button>
        <Button kind="secondary" disabled={confirming}>
          Rule out
        </Button>
      </div>

      <Reasoning />

      <div className="flex flex-col gap-4">
        <p className="text-[14px] leading-5 text-foreground-secondary">{CAUSE_SUMMARY}</p>
        <EvidenceChart />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[14px] font-semibold leading-5 text-foreground">Evidence ({EVIDENCE.length})</span>
        <div className="flex flex-col gap-2">
          {EVIDENCE.map((e) => (
            <div key={e.title} className="flex items-start gap-3 rounded-md border border-border bg-background p-4">
              <span className="flex min-w-0 flex-1 flex-col gap-4">
                <span className="text-[14px] font-medium leading-5 text-foreground">{e.title}</span>
                <span className="font-mono text-[12px] leading-4 text-foreground-tertiary">{e.meta}</span>
              </span>
              {e.opensSignals ? (
                <button
                  type="button"
                  onClick={actions.openSignals}
                  className="text-[14px] font-medium leading-5 text-verdigris-on-light underline-offset-4 transition-colors hover:underline"
                >
                  View in Signals
                </button>
              ) : (
                <span className="text-[14px] font-medium leading-5 text-verdigris-on-light">View in Signals</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

const RESULT_ICON = {
  supported: `${C}/circle-check.svg`,
  checked: `${C}/circle.svg`,
  "ruled-out": `${C}/circle-x.svg`,
} as const;

function Reasoning() {
  const { state, actions } = usePrototype();
  const open = state.reasoningOpen;
  return (
    <div className="flex flex-col rounded-[12px] bg-background px-4 py-2">
      <button
        type="button"
        onClick={actions.toggleReasoning}
        aria-expanded={open}
        className="flex h-8 items-center gap-1.5 self-start text-[14px] font-medium leading-5 text-verdigris-on-light"
      >
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: open ? DUR.expand : DUR.collapse, ease: EASE.reveal }} className="flex">
          <Icon src={`${C}/reasoning-chevron.svg`} size={14} />
        </motion.span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={open ? "hide" : "show"}
            initial={{ opacity: 0, filter: "blur(2px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(2px)" }}
            transition={{ duration: 0.16, ease: EASE.snap }}
          >
            {open ? "Hide reasoning" : "Show reasoning"}
          </motion.span>
        </AnimatePresence>
      </button>
      <Collapse open={open} inMs={300} outMs={200}>
        <div className="pb-2 pt-3">
          <div className="flex flex-col gap-4 rounded-md border border-border bg-card p-4">
            <Stagger open={open} i={0}>
              <div className="flex flex-col gap-2 rounded-md bg-secondary px-3.5 py-3 text-[14px] leading-5">
                <span className="font-semibold text-foreground">{REASONING.checked.title}</span>
                <span className="text-foreground-secondary">{REASONING.checked.body}</span>
              </div>
            </Stagger>
            <Stagger open={open} i={1}>
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-2 text-[14px] font-semibold leading-5 text-foreground">
                  Why it’s <ConfidenceLabel level="High" /> confidence
                </span>
                <span className="flex flex-col text-[14px] leading-5 text-foreground-secondary">
                  {REASONING.why.map((w) => (
                    <span key={w}>{w}</span>
                  ))}
                </span>
              </div>
            </Stagger>
            <div className="flex flex-col gap-1">
              {REASONING.steps.map((s, i) => (
                <Stagger key={s.title} open={open} i={i + 2}>
                  <div className="flex items-start gap-3 py-2">
                    <Icon src={RESULT_ICON[s.result]} size={16} className="mt-0.5" />
                    <span className="flex min-w-0 flex-1 flex-col gap-2 text-[14px] leading-5">
                      <span
                        className={`font-medium ${
                          s.result === "supported" ? "text-foreground" : s.result === "checked" ? "text-foreground-secondary" : "text-muted-foreground"
                        }`}
                      >
                        {s.title}
                      </span>
                      <span className="text-muted-foreground">{s.body}</span>
                    </span>
                  </div>
                </Stagger>
              ))}
            </div>
          </div>
        </div>
      </Collapse>
    </div>
  );
}

function Stagger({ open, i, children }: { open: boolean; i: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: open ? 1 : 0, y: open ? 0 : 4 }}
      transition={{ duration: open ? 0.28 : 0.1, ease: EASE.reveal, delay: open ? 0.08 + i * 0.035 : 0 }}
    >
      {children}
    </motion.div>
  );
}
