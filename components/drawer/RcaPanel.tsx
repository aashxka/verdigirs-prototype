"use client";

import { AnimatePresence, motion } from "motion/react";
import { DATA_WINDOW, TRACE_META, TRACE_STEPS } from "@/lib/data";
import { DUR, EASE } from "@/lib/motion";
import { usePrototype } from "@/lib/store";
import { Collapse, Icon, Spinner } from "../ui";
import { CauseList } from "./Causes";
import { RecommendedSteps } from "./Steps";

/* Root cause tab: live investigation trace → likely causes → steps. */
export function RcaPanel() {
  const { state } = usePrototype();
  const tracing = !state.traceFolded;
  return (
    <div className="flex w-full flex-col">
      <Collapse open={tracing} inMs={300} outMs={260}>
        <motion.div
          initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
          animate={tracing ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: -4, filter: "blur(3px)" }}
          transition={{ duration: tracing ? DUR.reveal : 0.2, ease: EASE.reveal, delay: tracing ? 0.15 : 0 }}
          className="flex flex-col gap-4 pb-6"
        >
          <p className="text-[14px] leading-5 text-muted-foreground">{TRACE_META}</p>
          <Trace />
        </motion.div>
      </Collapse>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h3 className="flex-1 text-[16px] font-semibold leading-6 text-foreground">Likely causes</h3>
          <AnimatePresence>
            {state.causesShown > 0 && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, ease: EASE.reveal }}
                className="text-[12px] leading-4 text-muted-foreground"
              >
                {DATA_WINDOW}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <CauseList />

        <AnimatePresence>
          {state.stepsShown && (
            <motion.div
              key="steps"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DUR.reveal, ease: EASE.reveal }}
              className="flex flex-col gap-3 pt-5"
            >
              <h3 className="text-[16px] font-semibold leading-6 text-foreground">Recommended steps</h3>
              <RecommendedSteps />
            </motion.div>
          )}
        </AnimatePresence>
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
                  initial={{ opacity: 0, scale: 0.6, filter: "blur(2px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.22, ease: EASE.snap }}
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
