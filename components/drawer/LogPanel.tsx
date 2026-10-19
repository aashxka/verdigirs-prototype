"use client";

import { motion } from "motion/react";
import { HANDOFF, LOG, LOG_ENTRIES, RECIPIENTS, type LogEntry } from "@/lib/data";
import { EASE } from "@/lib/motion";
import { pickedMessages, usePrototype, type Picks } from "@/lib/store";
import { Badge } from "../ui";

/* Log tab (03 · Log, 08.1). A read-only timeline of the alert,
 * newest first: nothing here is interactive, it only scrolls.
 * Mounts on first open, so the entries settle in once; a handoff
 * sent from the Handoff tab lands on top, as its toast promises. */
export function LogPanel() {
  const { state } = usePrototype();
  const entries = state.handoff === "sent" ? [handoffEntry(state.picks), ...LOG_ENTRIES] : LOG_ENTRIES;

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h3 className="text-[18px] font-semibold leading-7 text-foreground">Log</h3>
        <p className="text-[14px] leading-5 text-muted-foreground">{LOG.intro}</p>
      </div>

      <section className="flex flex-col gap-3" aria-labelledby="log-day">
        <div className="flex items-baseline gap-2">
          <h4 id="log-day" className="flex-1 text-[16px] font-semibold leading-6 text-foreground">
            {LOG.day}
          </h4>
          <span className="text-[12px] leading-4 text-muted-foreground">
            {entries.length} entries, {LOG.order}
          </span>
        </div>
        <ol className="flex flex-col">
          {entries.map((entry, i) => (
            <Entry key={entry.id} entry={entry} index={i} last={i === entries.length - 1} />
          ))}
        </ol>
      </section>
    </div>
  );
}

/* The handoff's own entry, written from what was actually sent. */
function handoffEntry(picks: Picks): LogEntry {
  const n = pickedMessages(picks).length;
  const names = RECIPIENTS.filter((r) => picks[r.key]?.length).map((r) => r.name);
  return {
    id: "handoff",
    time: HANDOFF.sentAt,
    title: "Handoff sent",
    body: `${n} ${n === 1 ? "message" : "messages"} to ${names.join(" and ")}.`,
    who: "Signals Assistant · sent by you",
    ai: true,
  };
}

/* DS: Log item (1424:4491), collapsed. Time and dot sit on the
 * title line; the rail runs dot to dot behind them. */
const TITLE_LINE = 27; // card border 1 + padding 16 + half the 20px title line

function Entry({ entry, index, last }: { entry: LogEntry; index: number; last: boolean }) {
  const delay = 0.06 + Math.min(index, 8) * 0.04;
  return (
    <motion.li
      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.36, ease: EASE.reveal, delay }}
      className={`grid grid-cols-[40px_10px_minmax(0,1fr)] gap-x-3 ${last ? "" : "pb-3"}`}
    >
      <time className="pt-[17px] font-mono text-[12px] leading-5 text-muted-foreground tabular">{entry.time}</time>

      <span className="relative" aria-hidden>
        {!last && (
          <motion.span
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.4, ease: EASE.reveal, delay: delay + 0.1 }}
            className="absolute left-1/2 w-0.5 -translate-x-1/2 origin-top rounded-full bg-border"
            style={{ top: TITLE_LINE, bottom: -TITLE_LINE }}
          />
        )}
        <span
          className="absolute left-0 size-2.5 rounded-full bg-verdigris shadow-[0_0_0_3px_var(--color-background)]"
          style={{ top: TITLE_LINE - 5 }}
        />
      </span>

      <article className="flex min-w-0 flex-col rounded-lg border border-border bg-background p-4">
        <div className="flex items-start gap-3">
          <h5 className="flex-1 text-[14px] font-semibold leading-5 text-foreground">{entry.title}</h5>
          {entry.ai && <Badge tone="teal">AI</Badge>}
        </div>
        <p className="mt-1 text-pretty text-[14px] leading-5 text-foreground-secondary">{entry.body}</p>
        <p className="mt-2 text-[12px] leading-4 text-muted-foreground">{entry.who}</p>
      </article>
    </motion.li>
  );
}
