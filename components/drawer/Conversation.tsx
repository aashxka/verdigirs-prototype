"use client";

import { AnimatePresence, motion } from "motion/react";
import { ANSWER, QUESTION, SEARCH_STEPS, SEARCH_SUMMARY } from "@/lib/data";
import { DUR, EASE, resolveIn } from "@/lib/motion";
import { usePrototype } from "@/lib/store";
import { Badge, Icon, SearchLoader, SourceChip } from "../ui";
import { CauseRank } from "./Causes";
import { OddsBlock } from "./WhatIf";

/* Follow-up exchange (05 · Ask a follow-up, 10.3 → 10.6).
 * Scripted: the answer is predefined, nothing calls a model. */
export function Conversation({ bubbleRef }: { bubbleRef: React.Ref<HTMLDivElement> }) {
  const { state, actions } = usePrototype();
  if (!state.asked) return null;
  const shown = state.answerShown;

  // The simulator lives in the side panel, beside the conversation.
  const simulateRoot = () => {
    actions.openSide(1, "simulate", "show");
  };
  return (
    <div className="flex min-h-[640px] w-full flex-col gap-4 pt-6">
      <motion.div
        ref={bubbleRef}
        className="flex w-full justify-end"
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: DUR.moderate, ease: EASE.reveal }}
        style={{ transformOrigin: "right bottom" }}
      >
        <p className="type-body rounded-[14px] rounded-br-[4px] bg-secondary px-3.5 py-2.5 text-foreground">{QUESTION}</p>
      </motion.div>

      <div className="flex w-full flex-col gap-8" aria-live="polite">
        <div className="flex flex-col gap-4">
          <SearchStatus />
          <AnimatePresence>
            {shown >= 1 && (
              <Block key="lead">
                <div className="flex flex-col gap-1">
                  <StreamText as="h4" className={`type-section ${HEADING}`} text={ANSWER.leadTitle} />
                  <StreamText className="type-body text-pretty text-foreground-secondary" text={ANSWER.leadBody} delay={0.12} />
                </div>
              </Block>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {shown >= 2 && (
            <Block key="related">
              <Section title={ANSWER.relatedTitle}>
                <div className="overflow-hidden rounded-lg border border-border bg-background">
                  {ANSWER.related.map((r, i) => (
                    <div key={r.rank} className={`flex items-start gap-3 p-4 ${i < ANSWER.related.length - 1 ? "border-b border-border" : ""}`}>
                      <CauseRank id={r.rank} />
                      <span className="flex min-w-0 flex-1 flex-col gap-2">
                        <span className="type-body flex flex-col">
                          <span className="font-medium text-foreground">{r.cause}</span>
                          <span className="text-muted-foreground">{r.note}</span>
                        </span>
                        <span className="flex">
                          <SourceChip source={{ label: r.source, type: "sensor" }} />
                        </span>
                      </span>
                      <Badge tone={r.linked ? "teal" : "muted"}>{r.linked ? "Linked" : "Not linked"}</Badge>
                    </div>
                  ))}
                </div>
              </Section>
            </Block>
          )}
          {shown >= 3 && (
            <Block key="past">
              <Section title={ANSWER.pastTitle}>
                <div className="overflow-hidden rounded-lg border border-border bg-background">
                  <div className={`${MATCH_ROW} type-label border-b border-border bg-surface-subtle py-2 text-muted-foreground`}>
                    <span>Signal</span>
                    <span>Today</span>
                    <span>Mar 14</span>
                  </div>
                  {ANSWER.match.map((m) => (
                    <div key={m.signal} className={`${MATCH_ROW} type-body border-b border-border py-2 text-foreground`}>
                      <span className="text-foreground-secondary">{m.signal}</span>
                      <span className="tabular">{m.today}</span>
                      <span className="tabular">{m.past}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Icon src="/figma/drawer/history.svg" size={16} />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="type-body font-medium text-foreground">{ANSWER.pastIssue.title}</span>
                      <span className="font-mono text-[12px] leading-4 text-foreground-tertiary">{ANSWER.pastIssue.meta}</span>
                    </span>
                    <span className="inline-flex h-5 items-center gap-1 rounded-[6px] bg-accent-muted pl-1.5 pr-2 text-[13px] font-medium leading-4 text-verdigris-on-light">
                      <Icon src="/figma/chat/resolved-dot.svg" size={6} />
                      {ANSWER.pastIssue.status}
                    </span>
                    <Icon src="/figma/chat/chevron-right.svg" size={16} />
                  </div>
                </div>
              </Section>
            </Block>
          )}
          {shown >= 4 && (
            <Block key="whatif">
              <Section title={ANSWER.whatIfTitle}>
                <OddsBlock
                  id={1}
                  cta={{ label: "Simulate", onClick: simulateRoot }}
                />
              </Section>
            </Block>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* Answer type, on the Verdigris type roles (globals.css): the lead
 * is the answer, so it alone takes the section headline (18/28);
 * sections step down to titles (16/24); prose and rows are body-small
 * at 1.6 (14/22); labels are caption (13); times and IDs are 12px
 * mono, as in the trace and Related issues. Sections sit 32 apart
 * with 12 between heading and content. */
const HEADING = "text-balance text-foreground";
const MATCH_ROW = "grid grid-cols-[minmax(0,1fr)_140px_140px] gap-3 px-4";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h4 className={`type-title ${HEADING}`}>{title}</h4>
      {children}
    </section>
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
function StreamText({ text, className, delay = 0, as: Tag = "p" }: { text: string; className?: string; delay?: number; as?: "p" | "h4" }) {
  const words = text.split(" ");
  return (
    <Tag className={className} aria-label={text}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: DUR.moderate, ease: EASE.reveal, delay: delay + i * 0.028 }}
        >
          {w}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </Tag>
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: DUR.moderate, ease: EASE.reveal }}
            className="flex items-center gap-2.5 py-1.5"
          >
            <Icon src="/figma/cause/circle-check.svg" size={16} />
            <span className="flex-1 text-[14px] leading-5 text-foreground-secondary">{SEARCH_SUMMARY}</span>
          </motion.div>
        ) : (
          <motion.div key="steps" exit={{ opacity: 0, transition: { duration: DUR.fast } }} className="flex flex-col">
            {SEARCH_STEPS.map((s, i) => {
              const status = i < state.searchDone ? "done" : i === state.searchDone ? "active" : "pending";
              const label = status === "done" ? s.label : "active" in s && s.active ? s.active : s.label;
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: DUR.moderate, ease: EASE.reveal, delay: 0.25 + i * 0.08 }}
                  className="flex items-center gap-2.5 py-1.5"
                >
                  <span className="flex size-4 shrink-0 items-center justify-center">
                    {status === "done" ? (
                      <Icon src="/figma/cause/circle-check.svg" size={16} />
                    ) : status === "active" ? (
                      <SearchLoader size={20} />
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
                  <span className="font-mono text-[12px] text-subtle-foreground tabular">{status === "done" ? s.time : ""}</span>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
