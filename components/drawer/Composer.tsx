"use client";

import { AnimatePresence, motion } from "motion/react";
import { HANDOFF, LOG, QUESTION, RELATED } from "@/lib/data";
import { DUR, EASE } from "@/lib/motion";
import { usePrototype } from "@/lib/store";
import { Icon, SearchLoader } from "../ui";

/* Chat composer (1363:9234): Disabled → Default → Typing → Searching.
 * Clicking auto-types the scripted question; Enter or Send asks it. */
export function Composer() {
  const { state, actions } = usePrototype();
  const { analysis } = state;
  // The scripted question belongs to Root cause; on other tabs the composer rests.
  const chat = state.tab === "rca" ? state.chat : "idle";
  const disabled = analysis !== "done";
  const typing = chat === "typing" || chat === "ready";
  const searching = chat === "searching" || chat === "answering";
  const canSend = typing && state.typed > 0;

  const placeholder =
    state.tab === "handoff"
      ? HANDOFF.placeholder
      : state.tab === "related"
        ? RELATED.placeholder
        : state.tab === "log"
          ? LOG.placeholder
          : disabled
          ? "You can ask questions once the analysis finishes"
          : "Ask about this alert or its causes…";

  return (
    <div
      role="textbox"
      aria-readonly
      aria-disabled={disabled || undefined}
      aria-label="Ask Signals Assistant"
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && actions.focusComposer()}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (canSend) actions.send();
          else actions.focusComposer();
        }
      }}
      className={`flex h-11 w-full items-center gap-2 rounded-md border pl-3.5 pr-1.5 transition-[border-color,box-shadow,background-color] duration-200 ease-[var(--ease-snap)] focus-visible:outline-none ${
        disabled
          ? "cursor-not-allowed border-border bg-surface-subtle"
          : typing
            ? "cursor-text border-verdigris-on-light bg-background shadow-[0_0_0_2px_var(--ring-focus),var(--shadow-xs)]"
            : "cursor-text border-border bg-background shadow-xs hover:border-[#d4d4d8] focus-visible:border-verdigris-on-light"
      }`}
    >
      {/* Placeholder, typed question and search status share one cell and crossfade. */}
      <span className="grid h-6 min-w-0 flex-1 items-center overflow-hidden text-[14px] leading-5">
        <AnimatePresence initial={false}>
          {typing ? (
            <motion.span key="typing" {...swap} className="truncate text-foreground [grid-area:1/1]">
              {QUESTION.slice(0, state.typed)}
              <span className="caret ml-px inline-block h-4 w-px translate-y-[3px] bg-foreground" aria-hidden />
            </motion.span>
          ) : searching ? (
            <motion.span key="searching" {...swap} className="flex items-center gap-2 text-muted-foreground [grid-area:1/1]">
              <SearchLoader size={24} />
              Searching…
            </motion.span>
          ) : (
            <motion.span key="placeholder" {...swap} className={`truncate [grid-area:1/1] ${disabled ? "text-subtle-foreground" : "text-muted-foreground"}`}>
              {placeholder}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <SendButton mode={searching ? "stop" : canSend ? "send" : "idle"} onSend={actions.send} onStop={actions.stop} />
    </div>
  );
}

function SendButton({ mode, onSend, onStop }: { mode: "idle" | "send" | "stop"; onSend: () => void; onStop: () => void }) {
  const stop = mode === "stop";
  return (
    /* No surface in any state: the icon alone carries it. Grey at rest,
     * verdigris when there's a question to send or a search to stop. */
    <motion.button
      type="button"
      aria-label={stop ? "Stop" : "Send"}
      disabled={mode === "idle"}
      onClick={(e) => {
        e.stopPropagation();
        if (stop) onStop();
        else if (mode === "send") onSend();
      }}
      whileTap={mode === "idle" ? undefined : { scale: 0.9 }}
      transition={{ duration: DUR.press, ease: EASE.out }}
      className="relative flex size-8 shrink-0 items-center justify-center rounded-[6px] transition-opacity duration-150 enabled:hover:opacity-75"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {stop ? (
          <motion.span
            key="stop"
            initial={{ scale: 0.4, opacity: 0, filter: "blur(1px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            exit={{ scale: 0.4, opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: 0.25, ease: EASE.snap }}
            className="block size-2.5 rounded-[2.5px] bg-verdigris-on-light"
          />
        ) : (
          <motion.span
            key={mode === "send" ? "send" : "idle"}
            initial={{ scale: 0.6, opacity: 0, filter: "blur(2px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            exit={{ scale: 0.6, opacity: 0, filter: "blur(2px)", transition: { duration: 0.15 } }}
            transition={{ duration: 0.22, ease: EASE.snap }}
            className="flex"
          >
            <Icon src={mode === "send" ? "/figma/drawer/send-green.svg" : "/figma/drawer/send.svg"} size={16} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* Composer text states crossfade in place (snap curve, like the field). */
const swap = {
  initial: { opacity: 0, filter: "blur(2px)" },
  animate: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.22, ease: EASE.snap } },
  exit: { opacity: 0, filter: "blur(2px)", transition: { duration: 0.12, ease: EASE.standard } },
};

export function ComposerFooter() {
  const { state } = usePrototype();
  return (
    /* Full-width dock: plain white, rounded top, square bottom, no
     * stroke, a soft shadow along the top edge only. */
    <div
      className="flex w-full shrink-0 flex-col gap-3 rounded-t-[14px] bg-background p-4"
      style={{ boxShadow: "0 -1px 2px rgba(0,0,0,0.04), 0 -10px 24px -12px rgba(0,8,20,0.12)" }}
    >
      <Composer />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <AttachPill icon="/figma/drawer/camera.svg" label="Image" />
          <AttachPill icon="/figma/drawer/paperclip.svg" label="Document" />
        </div>
        <p className="flex-1 text-right text-[12px] leading-4 text-muted-foreground">
          {state.tab === "handoff" ? HANDOFF.disclaimer : "AI-generated analysis. Verify before acting on critical loads."}
        </p>
      </div>
    </div>
  );
}

function AttachPill({ icon, label }: { icon: string; label: string }) {
  return (
    <button
      type="button"
      className="flex h-6 items-center gap-1 rounded-[6px] border border-border bg-background pl-1.5 pr-2 shadow-xs transition-colors duration-150 ease-out hover:bg-secondary"
    >
      <Icon src={icon} size={14} />
      <span className="text-[12px] font-medium leading-4 text-foreground-secondary">{label}</span>
    </button>
  );
}
