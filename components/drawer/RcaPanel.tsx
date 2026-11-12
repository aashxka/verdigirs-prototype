"use client";

import { AnimatePresence, motion } from "motion/react";
import { TRACE_META, TRACE_STEPS } from "@/lib/data";
import { DUR, EASE } from "@/lib/motion";
import { usePrototype } from "@/lib/store";
import { Collapse, Icon, Spinner } from "../ui";
import { CauseSections } from "./Causes";

/* Root cause tab: live investigation trace, then the cause lists.
 * Until a cause is confirmed, the list is the likely causes. The first
 * Yes opens Root causes and moves the rest under Likely causes. Simulation and recommended actions open
 * in the side panel; a click on a tile opens Thinking. */
export function RcaPanel() {
  const { state } = usePrototype();
  const tracing = !state.traceFolded;
  return (
    <div className="flex w-full flex-col">
      <Collapse open={tracing} inMs={300} outMs={340}>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={tracing ? { opacity: 1, y: 0 } : { opacity: 0, y: -4 }}
          transition={{ duration: tracing ? DUR.reveal : DUR.moderate, ease: EASE.reveal, delay: tracing ? 0.15 : 0 }}
          className="flex flex-col gap-4 pb-6"
        >
          <p className="text-[14px] leading-5 text-muted-foreground">{TRACE_META}</p>
          <Trace />
        </motion.div>
      </Collapse>

      <CauseSections />
    </div>
  );
}

function Trace() {
  const { state } = usePrototype();
  const done = state.traceDone;
  const finished = done >= TRACE_STEPS.length;
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-border bg-background px-5 py-4" role="status" aria-live="polite">
      <div className="flex items-center gap-2 pb-2">
        {finished ? <Icon src="/figma/cause/circle-check.svg" size={16} /> : <Spinner size={16} />}
        <span className="flex-1 text-[16px] font-semibold leading-6 text-foreground">{finished ? "Investigation complete" : "Investigating this alert"}</span>
        <span className="text-[14px] leading-5 text-muted-foreground">Usually ~20s</span>
      </div>
      {TRACE_STEPS.map((s, i) => {
        const status = i < done ? "done" : i === done ? "active" : "pending";
        const label = status === "done" ? s.label : "active" in s && s.active ? s.active : s.label;
        return (
          <div key={s.label} className="flex items-center gap-2.5 py-1.5">
            <span className="relative flex size-4 shrink-0 items-center justify-center">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={status}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: DUR.normal, ease: EASE.reveal }}
                  className="flex"
                >
                  {status === "done" ? (
                    <Icon src="/figma/cause/circle-check.svg" size={16} />
                  ) : status === "active" ? (
                    <Spinner size={16} />
                  ) : (
                    <Icon src="/figma/cause/circle.svg" size={16} />
                  )}
                </motion.span>
              </AnimatePresence>
            </span>
            <span
              className={`flex-1 text-[14px] leading-5 transition-colors duration-200 ${
                status === "done" ? "text-foreground-secondary" : status === "active" ? "font-medium text-foreground" : "text-subtle-foreground"
              }`}
            >
              {label}
            </span>
            <span className="font-mono text-[12px] text-subtle-foreground tabular">{status === "done" ? s.time : status === "active" ? "…" : ""}</span>
          </div>
        );
      })}
    </div>
  );
}
