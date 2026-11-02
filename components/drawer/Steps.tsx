"use client";

import { AnimatePresence, motion } from "motion/react";
import { CAUSE_ACTIONS, type Cause, type Step } from "@/lib/data";
import { DUR, EASE } from "@/lib/motion";
import { isRoot, usePrototype } from "@/lib/store";
import { Badge, Button } from "../ui";

/* A cause's recommended actions, in the side panel's Recommended
 * actions box, as a DS Table (design.verdigris.co/categories/
 * web-components/tables): text-sm, h-10 medium headers, p-2 cells,
 * row dividers, hover tint. Rack 14 shows triage (Create task /
 * Escalate) until it's confirmed, then the rows turn to the fix. */
export function causeActions(id: Cause["id"], confirmed: boolean) {
  const a = CAUSE_ACTIONS[id];
  return confirmed && a.confirmed ? a.confirmed : a;
}

export function RecommendedSteps({ cause }: { cause: Cause["id"] }) {
  const { state } = usePrototype();
  const confirmed = isRoot(state, cause) && !!CAUSE_ACTIONS[cause].confirmed;
  const { steps } = causeActions(cause, confirmed);
  return (
    // -mx-2 lines the first column's text up with the box title.
    <div className="-mx-2 overflow-auto">
      <table className="w-full caption-bottom text-[14px] leading-5">
        <thead className="[&_tr]:border-b [&_tr]:border-border">
          <tr>
            <th className="h-10 px-2 text-left font-medium text-foreground">Action</th>
            <th className="h-10 px-2 text-left font-medium text-foreground">Why</th>
            <th className="h-10 px-2">
              <span className="sr-only">Status</span>
            </th>
          </tr>
        </thead>
        <AnimatePresence mode="wait" initial={false}>
          <motion.tbody
            key={confirmed ? "confirmed" : "triage"}
            exit={{ opacity: 0, transition: { duration: DUR.exit, ease: EASE.standard } }}
            className="[&_tr:last-child]:border-0"
          >
            {steps.map((step, i) => (
              <StepRow key={step.key} step={step} i={i} />
            ))}
          </motion.tbody>
        </AnimatePresence>
      </table>
    </div>
  );
}

function StepRow({ step, i }: { step: Step; i: number }) {
  const { state, actions } = usePrototype();
  const status = state.steps[step.key] ?? "idle";
  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.reveal, ease: EASE.reveal, delay: 0.06 + i * 0.06 }}
      className="border-b border-border transition-colors hover:bg-table-row-hover"
    >
      <td className="p-2 align-middle">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-medium text-foreground">{step.title}</span>
          {step.tag && <Badge tone="muted">{step.tag}</Badge>}
        </span>
      </td>
      <td className="p-2 align-middle text-muted-foreground tabular-nums">{step.why}</td>
      <td className="p-2 text-right align-middle">
        <span className="relative inline-flex h-8 items-center justify-end">
          <AnimatePresence mode="popLayout" initial={false}>
            {status === "done" ? (
              <motion.span
                key="done"
                initial={{ opacity: 0, x: 4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: DUR.moderate, ease: EASE.reveal }}
                className="flex items-center gap-3 whitespace-nowrap"
              >
                <span className="font-medium text-foreground">{step.done}</span>
                <button
                  type="button"
                  onClick={() => actions.undoStep(step.key)}
                  className="font-medium text-verdigris-on-light underline-offset-4 hover:underline"
                  aria-label={`Undo: ${step.title}`}
                >
                  Undo
                </button>
              </motion.span>
            ) : (
              <motion.span key="cta" exit={{ opacity: 0, transition: { duration: DUR.fast } }}>
                <Button kind={step.ctaKind} loading={status === "working"} onClick={() => actions.runStep(step.key)}>
                  {step.cta}
                </Button>
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </td>
    </motion.tr>
  );
}
