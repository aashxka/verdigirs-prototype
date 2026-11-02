"use client";

import { BorderBeam } from "border-beam";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { HANDOFF, LOG, RELATED } from "@/lib/data";
import { DUR, EASE } from "@/lib/motion";
import { usePrototype } from "@/lib/store";
import { Icon, SearchLoader } from "../ui";

/* Border Beam (libraries.dev/beam) circles the field while it
 * searches. Its presets aren't Verdigris colours, so its css hook
 * repaints the stroke, inner glow and bloom with the colour
 * foundation's teal → purple chart stops (design.verdigris.co/
 * foundations/color). Teal leads, as the DS asks of accents. */
const BEAM_STOPS = [
  "oklch(0.753 0.128 191.6)", // verdigris
  "oklch(0.64 0.13 216)", // teal mix-1
  "oklch(0.52 0.14 240.5)", // teal mix-2
  "oklch(0.41 0.15 264.9)", // teal mix-3
  "oklch(0.39 0.16 313)", // midnight purple step-1
];
const beamGradient = (alpha = 1) =>
  `linear-gradient(90deg, ${BEAM_STOPS.map((c) => (alpha < 1 ? c.replace(")", ` / ${alpha})`) : c)).join(", ")})`;
const BEAM_CSS = `
[data-beam="{id}"][data-active]::after,
[data-beam="{id}"][data-fading]::after {
  background: ${beamGradient()};
  opacity: calc(var(--beam-opacity-{id}) * 0.9 * var(--beam-strength, 1));
}
[data-beam="{id}"][data-active]::before,
[data-beam="{id}"][data-fading]::before {
  background: ${beamGradient(0.35)};
  box-shadow: none;
}
[data-beam="{id}"] [data-beam-bloom] {
  background: conic-gradient(
    from var(--beam-angle-{id}),
    transparent 0%, transparent 60%,
    oklch(0.753 0.128 191.6 / 0.5) 68%,
    oklch(0.52 0.14 240.5 / 0.6) 72%,
    transparent 80%, transparent 100%
  );
  filter: blur(6px);
}
`;

/* Chat composer (1363:9234): Disabled → Default → Asking → Thinking.
 * Nothing is typed here: a line pointed at and asked about (AskLine)
 * lands as a quote chip and sends itself; Enter or Send sends it now. */
export function Composer() {
  const { state, actions } = usePrototype();
  const reduce = useReducedMotion();
  const { analysis } = state;
  // The scripted question belongs to Root cause; on other tabs the composer rests.
  const chat = state.tab === "rca" ? state.chat : "idle";
  const disabled = analysis !== "done";
  const asking = chat === "asking";
  const searching = chat === "searching" || chat === "answering";

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
    /* overflow stays visible so the typing focus ring isn't clipped;
     * the beam's own layers clip to the field's radius. */
    <BorderBeam
      size="md"
      theme="light"
      staticColors
      duration={2.4}
      active={searching && !reduce}
      css={BEAM_CSS}
      className="w-full"
      style={{ overflow: "visible" }}
    >
      <div
        role="textbox"
        aria-readonly
        aria-disabled={disabled || undefined}
        aria-label="Ask Signals Assistant"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === "Enter" && asking) {
            e.preventDefault();
            actions.send();
          }
        }}
        className={`flex h-11 w-full items-center gap-2 rounded-md border pl-3.5 pr-1.5 transition-[border-color,box-shadow,background-color] duration-200 ease-[var(--ease-standard)] focus-visible:outline-none ${
          disabled
            ? "cursor-not-allowed border-border bg-surface-subtle"
            : asking
              ? "cursor-text border-verdigris-on-light bg-background shadow-[0_0_0_2px_var(--ring-focus),var(--shadow-xs)]"
              : "cursor-text border-border bg-background shadow-xs hover:border-[#d4d4d8] focus-visible:border-verdigris-on-light"
        }`}
      >
        {/* Placeholder, the quoted line and search status share one cell and crossfade. */}
        <span className="grid h-6 min-w-0 flex-1 items-center overflow-hidden text-[14px] leading-5">
          <AnimatePresence initial={false}>
            {asking && state.quote ? (
              <motion.span key="quote" {...swap} className="flex min-w-0 [grid-area:1/1]">
                {/* Same chip as a source: secondary fill, r6, 12px icon. */}
                <span className="inline-flex min-w-0 items-center gap-1.5 rounded-[6px] bg-secondary py-0.5 pl-1.5 pr-2 text-[13px] leading-5 text-foreground-secondary">
                  <QuoteIcon />
                  <span className="truncate">{state.quote}</span>
                </span>
              </motion.span>
            ) : searching ? (
              <motion.span key="searching" {...swap} className="flex items-center gap-2 text-muted-foreground [grid-area:1/1]">
                <SearchLoader size={24} />
                Thinking…
              </motion.span>
            ) : (
              <motion.span key="placeholder" {...swap} className={`truncate [grid-area:1/1] ${disabled ? "text-subtle-foreground" : "text-muted-foreground"}`}>
                {placeholder}
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <SendButton mode={searching ? "stop" : asking ? "send" : "idle"} onSend={actions.send} onStop={actions.stop} />
      </div>
    </BorderBeam>
  );
}

/* Lucide text-quote, 12px, at the drawer icons' 1.33px stroke. */
function QuoteIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={(1.33 * 24) / 12} strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground" aria-hidden>
      <path d="M17 5H3" />
      <path d="M21 12H8" />
      <path d="M21 19H8" />
      <path d="M3 12v7" />
    </svg>
  );
}

/* Lucide corner-down-left, the Enter key's arrow, at 16px with the
 * drawer icons' 1.33px stroke. */
function EnterIcon({ className }: { className: string }) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 4v7a4 4 0 0 1-4 4H4" />
      <path d="m9 10-5 5 5 5" />
    </svg>
  );
}

function SendButton({ mode, onSend, onStop }: { mode: "idle" | "send" | "stop"; onSend: () => void; onStop: () => void }) {
  const stop = mode === "stop";
  return (
    /* No surface in any state: the icon alone carries it. An Enter
     * arrow (↵), grey at rest and verdigris when there's a question
     * to send; the Stop square is the resting grey. */
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
      transition={{ duration: DUR.press, ease: EASE.standard }}
      className="relative flex size-8 shrink-0 items-center justify-center rounded-[6px] transition-opacity duration-150 enabled:hover:opacity-75"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {stop ? (
          <motion.span
            key="stop"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0, transition: { duration: DUR.fast } }}
            transition={{ duration: DUR.normal, ease: EASE.reveal }}
            className="block size-2.5 rounded-[2.5px] bg-subtle-foreground"
          />
        ) : (
          <motion.span
            key={mode === "send" ? "send" : "idle"}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0, transition: { duration: DUR.fast } }}
            transition={{ duration: DUR.normal, ease: EASE.reveal }}
            className="flex"
          >
            <EnterIcon className={mode === "send" ? "text-verdigris-on-light" : "text-subtle-foreground"} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* Composer text states crossfade in place (snap curve, like the field). */
const swap = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: DUR.normal, ease: EASE.reveal } },
  exit: { opacity: 0, transition: { duration: DUR.fast, ease: EASE.standard } },
};

export function ComposerFooter() {
  return (
    /* Full-width dock on DS neutral.50 (the field stays white on it),
     * rounded top, square bottom, no stroke, a soft shadow along the
     * top edge only. */
    <div
      className="flex w-full shrink-0 flex-col gap-3 rounded-t-[14px] bg-neutral-50 p-4"
      style={{ boxShadow: "0 -1px 2px rgba(0,0,0,0.04), 0 -10px 24px -12px rgba(0,8,20,0.12)" }}
    >
      <Composer />
      <div className="flex items-center gap-1.5">
        <AttachPill icon="/figma/drawer/camera.svg" label="Image" />
        <AttachPill icon="/figma/drawer/paperclip.svg" label="Document" />
      </div>
    </div>
  );
}

/* DS Button, ghost, size xs (design.verdigris.co/categories/web-
 * components/buttons): no border or fill at rest, muted fill on hover;
 * h-6, text-xs medium, px-1.5 with an icon, the icon at size-3. Radius
 * is the product-ui control shape, radius.md (8px). */
function AttachPill({ icon, label }: { icon: string; label: string }) {
  return (
    <button
      type="button"
      className="inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-button px-1.5 text-[12px] font-medium leading-4 text-foreground transition-colors duration-150 hover:bg-secondary"
    >
      <Icon src={icon} size={12} />
      {label}
    </button>
  );
}
