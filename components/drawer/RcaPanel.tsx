"use client";

import { AnimatePresence, motion } from "motion/react";
import { TRACE_META, TRACE_STEPS } from "@/lib/data";
import { DUR, EASE } from "@/lib/motion";
import { usePrototype } from "@/lib/store";
import { Collapse, Icon, Spinner } from "../ui";
import { CauseTiles } from "./Causes";

/* Root cause tab: live investigation trace → three cause tiles. Their
 * simulation and recommended actions open in the side panel. Once a
 * cause is confirmed it heads the list as the likely root cause. */
export function RcaPanel() {
  const { state, actions } = usePrototype();
  const tracing = !state.traceFolded;
  const rooted = state.root !== null;
  return (
    <div className="flex w-full flex-col">
      <Collapse open={tracing} inMs={300} outMs={260}>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={tracing ? { opacity: 1, y: 0 } : { opacity: 0, y: -4 }}
          transition={{ duration: tracing ? DUR.reveal : 0.2, ease: EASE.reveal, delay: tracing ? 0.15 : 0 }}
          className="flex flex-col gap-4 pb-6"
        >
          <p className="text-[14px] leading-5 text-muted-foreground">{TRACE_META}</p>
          <Trace />
        </motion.div>
      </Collapse>

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <h3 className="type-section grid flex-1 text-foreground">
            <AnimatePresence initial={false}>
              <motion.span
                key={rooted ? "root" : "likely"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: DUR.fast } }}
                transition={{ duration: DUR.normal, ease: EASE.reveal }}
                className="[grid-area:1/1]"
              >
                {rooted ? "Likely root cause" : "Likely causes"}
              </motion.span>
            </AnimatePresence>
          </h3>
          <AnimatePresence>
            {state.causesShown > 0 && (
              <motion.button
                type="button"
                onClick={actions.toggleThinking}
                aria-expanded={state.thinking}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: DUR.moderate, ease: EASE.reveal }}
                className="type-label text-verdigris-on-light underline-offset-4 hover:underline"
              >
                {state.thinking ? "Hide thinking" : "Show thinking"}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <CauseTiles />
      </div>
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
