"use client";

import { AnimatePresence, motion } from "motion/react";
import { ANSWER, QUESTION, SEARCH_STEPS, SEARCH_SUMMARY } from "@/lib/data";
import { DUR, EASE, resolveIn } from "@/lib/motion";
import { usePrototype } from "@/lib/store";
import { Badge, Icon, Rank, SourceChip, Spinner } from "../ui";
import { WhatIf } from "./WhatIf";

/* Follow-up exchange (05 · Ask a follow-up, 10.3 → 10.6).
 * Scripted: the answer is predefined, nothing calls a model. */
export function Conversation({ bubbleRef }: { bubbleRef: React.Ref<HTMLDivElement> }) {
  const { state } = usePrototype();
  if (!state.asked) return null;
  const shown = state.answerShown;
  return (
    <div className="flex min-h-[640px] w-full flex-col gap-4 pt-6">
      <motion.div
        ref={bubbleRef}
        className="flex w-full justify-end"
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: EASE.snap }}
        style={{ transformOrigin: "right bottom" }}
      >
        <p className="rounded-[14px] rounded-br-[4px] bg-secondary px-3.5 py-2.5 text-[14px] leading-5 text-foreground">{QUESTION}</p>
      </motion.div>

      <div className="flex w-full flex-col gap-4" aria-live="polite">
        <SearchStatus />
        <AnimatePresence>
          {shown >= 1 && (
            <Block key="lead">
              <div className="flex flex-col gap-1 text-[14px] leading-5">
                <StreamText className="font-semibold text-foreground" text={ANSWER.leadTitle} />
                <StreamText className="text-foreground-secondary" text={ANSWER.leadBody} delay={0.12} />
              </div>
            </Block>
          )}
          {shown >= 2 && (
            <Block key="related">
              <div className="flex flex-col gap-2.5">
                <h4 className="text-[14px] font-semibold leading-5 text-foreground">{ANSWER.relatedTitle}</h4>
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                  <div className="flex gap-3 border-b border-border bg-surface-subtle px-3 py-2 text-[12px] font-medium leading-4 text-muted-foreground">
                    <span className="w-[180px] shrink-0">Cause</span>
                    <span className="min-w-0 flex-1">Link to #2</span>
                    <span className="w-[145px] shrink-0">Source</span>
                  </div>
                  {ANSWER.related.map((r, i) => (
                    <div key={r.rank} className={`flex gap-3 p-3 ${i === 0 ? "border-b border-border" : ""}`}>
                      <span className="flex w-[180px] shrink-0 gap-2">
                        <Rank n={r.rank} />
                        <span className="text-[14px] font-medium leading-5 text-foreground">{r.cause}</span>
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                        <Badge tone={r.linked ? "teal" : "neutral"}>{r.linked ? "Linked" : "Not linked"}</Badge>
                        <span className="text-[12px] leading-4 text-muted-foreground">{r.note}</span>
                      </span>
                      <span className="flex w-[145px] shrink-0 items-start">
                        <SourceChip source={{ label: r.source, type: "sensor" }} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Block>
          )}
          {shown >= 3 && (
            <Block key="past">
              <div className="flex flex-col gap-2.5">
                <h4 className="text-[14px] font-semibold leading-5 text-foreground">{ANSWER.pastTitle}</h4>
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                  <div className="flex gap-3 border-b border-border bg-surface-subtle px-3 py-2 text-[12px] font-medium leading-4 text-muted-foreground">
                    <span className="min-w-0 flex-1">Signal</span>
                    <span className="w-[140px] shrink-0">Today</span>
                    <span className="w-[140px] shrink-0">Mar 14</span>
                  </div>
                  {ANSWER.match.map((m, i) => (
                    <div key={m.signal} className={`flex gap-3 px-3 py-2.5 text-[14px] leading-5 ${i < ANSWER.match.length - 1 ? "border-b border-border" : ""}`}>
                      <span className="min-w-0 flex-1 text-foreground-secondary">{m.signal}</span>
                      <span className="w-[140px] shrink-0 text-foreground">{m.today}</span>
                      <span className="w-[140px] shrink-0 text-foreground">{m.past}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 rounded-lg border border-border bg-background p-4">
                  <span className="flex min-w-0 flex-1 flex-col gap-3">
                    <span className="flex flex-col gap-1">
                      <span className="text-[14px] font-medium leading-5 text-foreground">{ANSWER.pastIssue.title}</span>
                      <span className="font-mono text-[12px] leading-4 text-muted-foreground">{ANSWER.pastIssue.meta}</span>
                    </span>
                    <span className="flex items-start justify-between">
                      <span className="flex gap-2">
                        {ANSWER.pastIssue.tags.map((t) => (
                          <Badge key={t}>{t}</Badge>
                        ))}
                      </span>
                      <span className="inline-flex h-5 items-center gap-1 rounded-[6px] bg-accent-muted pl-1.5 pr-2 text-[12px] font-medium leading-4 text-verdigris-on-light">
                        <Icon src="/figma/chat/resolved-dot.svg" size={6} />
                        {ANSWER.pastIssue.status}
                      </span>
                    </span>
                  </span>
                  <Icon src="/figma/chat/chevron-right.svg" size={16} />
                </div>
              </div>
            </Block>
          )}
          {shown >= 4 && (
            <Block key="whatif">
              <WhatIf />
            </Block>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Block({ children }: { children: React.ReactNode }) {
  return (
    <motion.div {...resolveIn} transition={{ duration: DUR.reveal, ease: EASE.reveal }}>
      {children}
    </motion.div>
  );
}

/* Words resolve in sequence, like a streamed reply. */
function StreamText({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <p className={className} aria-label={text}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          aria-hidden
          initial={{ opacity: 0, filter: "blur(4px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.32, ease: EASE.reveal, delay: delay + i * 0.028 }}
        >
          {w}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </p>
  );
}

function SearchStatus() {
  const { state } = usePrototype();
  const folded = state.searchFolded;
  return (
    <div className="flex flex-col">
      <AnimatePresence mode="popLayout" initial={false}>
        {folded ? (
          <motion.div
            key="summary"
            initial={{ opacity: 0, filter: "blur(3px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.3, ease: EASE.reveal }}
            className="flex items-center gap-2.5 py-1.5"
          >
            <Icon src="/figma/cause/circle-check.svg" size={16} />
            <span className="flex-1 text-[14px] leading-5 text-foreground-secondary">{SEARCH_SUMMARY}</span>
          </motion.div>
        ) : (
          <motion.div key="steps" exit={{ opacity: 0, filter: "blur(3px)", transition: { duration: 0.16 } }} className="flex flex-col">
            {SEARCH_STEPS.map((s, i) => {
              const status = i < state.searchDone ? "done" : i === state.searchDone ? "active" : "pending";
              const label = status === "done" ? s.label : "active" in s && s.active ? s.active : s.label;
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE.reveal, delay: 0.25 + i * 0.08 }}
                  className="flex items-center gap-2.5 py-1.5"
                >
                  <span className="flex size-4 shrink-0 items-center justify-center">
                    {status === "done" ? (
                      <Icon src="/figma/cause/circle-check.svg" size={16} />
                    ) : status === "active" ? (
                      <Spinner size={16} />
                    ) : (
                      <Icon src="/figma/cause/circle.svg" size={16} />
                    )}
                  </span>
                  <span
                    className={`flex-1 text-[14px] leading-5 transition-colors duration-200 ${
                      status === "done" ? "text-foreground-secondary" : status === "active" ? "font-medium text-foreground" : "text-subtle-foreground"
                    }`}
                  >
                    {label}
                  </span>
                  <span className="font-mono text-[11px] text-subtle-foreground tabular">{status === "done" ? s.time : ""}</span>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
