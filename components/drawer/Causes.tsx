"use client";

import { AnimatePresence, motion } from "motion/react";
import { CAUSE_SUMMARY, CAUSES, EVIDENCE, REASONING, type Cause } from "@/lib/data";
import { DUR, EASE, SPRING } from "@/lib/motion";
import { usePrototype } from "@/lib/store";
import { Badge, Button, Collapse, ConfidenceLabel, Icon, SourceChip } from "../ui";
import { EvidenceChart } from "./EvidenceChart";
import { CauseSimulator, OddsBlock } from "./WhatIf";

const C = "/figma/cause";

/* Likely causes: rows resolve out of skeletons one by one. It is one
 * card drawn as two halves that meet seamlessly (cause #1's bottom
 * border is the divider), so when a cause is confirmed the halves can
 * part: "Other possible causes" opens between them, the corners round
 * off, and the remaining causes renumber from 1. Undo closes it back. */
export function CauseList() {
  const { state } = usePrototype();
  const split = state.feedback === "confirmed";
  const [root, ...others] = CAUSES;
  const corners = "transition-[border-radius] duration-300 ease-[var(--ease-reveal)]";
  return (
    <div className="flex w-full flex-col">
      <div className={`overflow-clip border border-border bg-background ${corners} ${split ? "rounded-lg" : "rounded-t-lg rounded-b-none"}`}>
        <CauseSlot cause={root} i={0} />
      </div>
      <Collapse open={split} inMs={300} outMs={200}>
        <motion.h3
          initial={false}
          animate={split ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: -4, filter: "blur(3px)" }}
          transition={{ duration: split ? DUR.reveal : 0.12, ease: EASE.reveal, delay: split ? 0.08 : 0 }}
          className="pb-3 pt-6 text-[16px] font-semibold leading-6 text-foreground"
        >
          Other possible causes
        </motion.h3>
      </Collapse>
      <div className={`overflow-clip border-x border-b border-border bg-background ${corners} ${split ? "rounded-lg border-t" : "rounded-b-lg rounded-t-none"}`}>
        {others.map((cause, j) => (
          <div key={cause.id} className={j < others.length - 1 ? "border-b border-border" : ""}>
            <CauseSlot cause={cause} i={j + 1} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CauseSlot({ cause, i }: { cause: Cause; i: number }) {
  const { state } = usePrototype();
  return (
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
  );
}

/* A cause's place in the list. The confirmed root cause trades its
 * number for a check; the others count up from 1 under "Other
 * possible causes", each digit rolling up into its new value. */
export function CauseRank({ id, dark = false }: { id: Cause["id"]; dark?: boolean }) {
  const { state } = usePrototype();
  const confirmed = state.feedback === "confirmed";
  const root = confirmed && id === 1;
  const n = confirmed ? id - 1 : id;
  const tone = root ? "bg-verdigris-on-light text-white" : dark ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground-secondary";
  return (
    <span
      className={`relative flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full font-mono text-[12px] leading-4 transition-colors duration-200 ${tone}`}
      aria-label={root ? "Root cause" : `Cause ${n}`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={root ? "check" : n}
          initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
          transition={{ duration: 0.28, ease: EASE.reveal, delay: confirmed && !root ? 0.12 + id * 0.06 : 0 }}
          className="flex"
          aria-hidden
        >
          {root ? <Icon src="/figma/handoff/check.svg" size={12} /> : n}
        </motion.span>
      </AnimatePresence>
    </span>
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
  const confirmedHere = primary && state.feedback === "confirmed";
  const simOpen = state.simOpen.includes(cause.id);

  const header = (
    <>
      <CauseRank id={cause.id} dark={expanded} />
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-[14px] font-medium leading-5 text-foreground">{cause.title}</span>
        <span className="flex flex-wrap gap-x-2 gap-y-1.5">
          {cause.sources.map((s) => (
            <SourceChip key={s.label} source={s} onOpen={primary && s.type === "sensor" ? actions.openSignals : undefined} />
          ))}
        </span>
        <AnimatePresence initial={false}>
          {confirmedHere && (
            <motion.span
              key="confirmed"
              className="flex"
              initial={{ opacity: 0, scale: 0.92, filter: "blur(3px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.12 } }}
              transition={{ ...SPRING.pop, delay: 0.06 }}
              style={{ transformOrigin: "left center" }}
            >
              <Badge tone="teal">Confirmed by you</Badge>
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

  // The odds block sits outside the clickable header (no buttons inside
  // a button); :has() still tints the whole row when the header is hovered.
  const odds = (
    <div className="pb-4 pl-12 pr-4 pt-3">
      <OddsBlock id={cause.id} />
    </div>
  );
  const open = expanded || simOpen;

  return (
    <div
      id={`cause-${cause.id}`}
      className={`transition-colors duration-200 ${open ? "bg-surface-subtle" : "bg-background has-[[data-head]:hover]:bg-surface-subtle"}`}
    >
      {primary ? (
        <div
          data-head
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
          className="flex cursor-pointer items-start gap-3 px-4 pt-4"
        >
          {header}
        </div>
      ) : (
        <div className="flex items-start gap-3 px-4 pt-4">{header}</div>
      )}
      {odds}
      <Collapse open={simOpen} inMs={300} outMs={200}>
        <CauseSimulator id={cause.id} open={simOpen} />
      </Collapse>
      {primary && (
        <Collapse open={expanded} inMs={300} outMs={200}>
          <div className="border-t border-border">
            <CauseDetail open={expanded} />
          </div>
        </Collapse>
      )}
    </div>
  );
}

/* Expanded cause #1: reasoning, summary, chart, evidence, then the
 * verdict, so the question comes after the proof. */
function CauseDetail({ open }: { open: boolean }) {
  const { actions } = usePrototype();
  return (
    <motion.div
      initial={false}
      animate={{ opacity: open ? 1 : 0, y: open ? 0 : -4 }}
      transition={{ duration: open ? 0.26 : 0.12, ease: EASE.reveal, delay: open ? 0.06 : 0 }}
      className="flex flex-col gap-5 pb-5 pl-12 pr-4 pt-3"
    >
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

      <Verdict />
    </motion.div>
  );
}

/* Sits after the evidence, and while the evidence is on screen it
 * rides the bottom edge of the scroll, so the decision is always one
 * tap away. Content fades out beneath it instead of meeting a rule. */
function Verdict() {
  const { state, actions } = usePrototype();
  const confirming = state.feedback === "confirming";
  const confirmed = state.feedback === "confirmed";
  return (
    <div className="sticky bottom-0 z-[1] -mb-5 flex min-h-[60px] items-center gap-1 bg-surface-subtle pb-5 pt-3 before:pointer-events-none before:absolute before:inset-x-0 before:bottom-full before:h-5 before:bg-linear-to-t before:from-surface-subtle before:to-transparent">
      {confirmed ? (
        <span className="flex flex-1 items-center gap-2 text-[14px] font-medium leading-5 text-foreground">
          <Icon src={`${C}/circle-check.svg`} size={16} />
          You confirmed this as the root cause.
        </span>
      ) : (
        <>
          <span className="flex-1 text-[14px] font-medium leading-5 text-foreground">Is this the cause?</span>
          <Button kind="secondary" loading={confirming} onClick={actions.confirm}>
            Confirm
          </Button>
          <Button kind="secondary" disabled={confirming}>
            Rule out
          </Button>
        </>
      )}
    </div>
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
                  Why confidence is <ConfidenceLabel level="High" />
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
