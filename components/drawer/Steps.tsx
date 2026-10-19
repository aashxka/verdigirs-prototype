"use client";

import { AnimatePresence, motion } from "motion/react";
import { CONFIRMED_STEPS, TRIAGE_STEPS, type Step } from "@/lib/data";
import { DUR, EASE } from "@/lib/motion";
import { usePrototype } from "@/lib/store";
import { Badge, Button, Rank } from "../ui";

/* Recommended steps. Triage (Create task / Escalate) until a cause is
 * confirmed, then the list re-ranks around cause #1 (Schedule). */
export function RecommendedSteps() {
  const { state } = usePrototype();
  const confirmed = state.feedback === "confirmed";
  const steps = confirmed ? CONFIRMED_STEPS : TRIAGE_STEPS;
  return (
    <div className="w-full overflow-hidden rounded-lg border border-border bg-card">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={confirmed ? "confirmed" : "triage"}
          exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: DUR.toastOut, ease: EASE.standard } }}
        >
          {steps.map((step, i) => (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, y: 6, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: DUR.reveal, ease: EASE.reveal, delay: i * 0.09 }}
              className={i < steps.length - 1 ? "border-b border-border" : ""}
            >
              <StepRow step={step} rank={i + 1} />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function StepRow({ step, rank }: { step: Step; rank: number }) {
  const { state, actions } = usePrototype();
  const status = state.steps[step.key] ?? "idle";
  return (
    <div className="flex items-center gap-3 p-4">
      <span className="flex self-stretch">
        <Rank n={rank} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[14px] font-medium leading-5 text-foreground">{step.title}</span>
          {step.tag && <Badge tone="muted">{step.tag}</Badge>}
        </span>
        <span className="text-[14px] leading-5 text-muted-foreground">{step.body}</span>
      </span>
      <span className="relative flex h-8 shrink-0 items-center justify-end">
        <AnimatePresence mode="popLayout" initial={false}>
          {status === "done" ? (
            <motion.span
              key="done"
              initial={{ opacity: 0, filter: "blur(4px)", x: 4 }}
              animate={{ opacity: 1, filter: "blur(0px)", x: 0 }}
              transition={{ duration: 0.3, ease: EASE.reveal }}
              className="whitespace-nowrap px-3 text-[14px] font-medium leading-5 text-foreground"
            >
              {step.done}
            </motion.span>
          ) : (
            <motion.span key="cta" exit={{ opacity: 0, filter: "blur(3px)", transition: { duration: 0.12 } }}>
              <Button kind={step.ctaKind} loading={status === "working"} onClick={() => actions.runStep(step.key)}>
                {step.cta}
              </Button>
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </div>
  );
}
