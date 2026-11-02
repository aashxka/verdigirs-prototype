"use client";

import { AnimatePresence, motion, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DUR, EASE, TIMING } from "@/lib/motion";
import { usePrototype } from "@/lib/store";

/* Point and ask. Rest the pointer on the line and it tints; after the
 * DS tooltip delay an "Ask" tooltip rises above it and follows the
 * pointer along the line. Ask (or a click or Enter on the line itself)
 * hands the line to the composer as a quote, and the composer sends it
 * on its own.
 *
 * Tooltip per design.verdigris.co/categories/web-components/tooltips:
 * bg-primary, text-xs, rounded-md, px-3 py-1.5, side top, 4px offset
 * past its arrow, 300ms delay, fade + zoom from 95% + a short rise.
 * It arrives at duration.normal on the reveal curve and leaves at
 * duration.fast, scaling from the arrow's tip so it grows out of the
 * line. The tile clips its content, so the tooltip renders into the
 * tab panel instead and scrolls with it. */
const OFFSET = 9; // sideOffset 4 + the 5px arrow
const HALF = 28; // half the tooltip, so it never hangs past the line
const GRACE = 150; // ms to cross from the line onto the tooltip

export function AskLine({ text }: { text: string }) {
  const { state, actions } = usePrototype();
  const reduce = useReducedMotion();
  const askable = state.tab === "rca" && state.analysis === "done" && state.chat === "idle" && !state.asked;
  // Handed to the composer: the line holds its tint until it sends.
  const handed = state.chat === "asking" && state.quote === text;
  const lineRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastX = useRef<number | undefined>(undefined);
  const [pointing, setPointing] = useState(false);
  const [open, setOpen] = useState(false);
  // Where the tooltip sits; kept after it closes so it can animate out.
  const [tip, setTip] = useState<{ host: HTMLElement; top: number } | null>(null);
  // Critically damped follow (response ≈ 0.3s): it trails the pointer, never overshoots.
  const x = useSpring(0, { stiffness: 400, damping: 40 });

  // The line in tab-panel layout px, so it holds inside the scaled stage.
  const measure = (clientX?: number) => {
    const line = lineRef.current;
    const host = line?.closest<HTMLElement>(".tab-panel");
    if (!line || !host) return null;
    const hr = host.getBoundingClientRect();
    const lr = line.getBoundingClientRect();
    const s = hr.width / host.offsetWidth || 1;
    const left = (lr.left - hr.left) / s;
    const right = (lr.right - hr.left) / s;
    const at = clientX === undefined ? (left + right) / 2 : (clientX - hr.left) / s;
    return { host, top: (lr.top - hr.top) / s - OFFSET, x: Math.min(Math.max(at, left + HALF), right - HALF) };
  };

  const show = () => {
    const m = measure(lastX.current);
    if (!m) return;
    x.jump(m.x);
    setTip({ host: m.host, top: m.top });
    setOpen(true);
  };
  const close = () => {
    clearTimeout(timer.current);
    setPointing(false);
    setOpen(false);
  };
  const stay = () => clearTimeout(timer.current);
  const leave = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(close, GRACE);
  };
  const ask = () => {
    close();
    actions.ask(text);
  };

  // Once it's asked (or the line can't be asked yet), drop any hover state.
  const [wasAskable, setWasAskable] = useState(askable);
  if (wasAskable !== askable) {
    setWasAskable(askable);
    if (!askable) {
      setOpen(false);
      setPointing(false);
    }
  }
  useEffect(() => () => clearTimeout(timer.current), []);

  const lit = (askable && pointing) || handed;

  return (
    <>
      <span
        ref={lineRef}
        role={askable ? "button" : undefined}
        tabIndex={askable ? 0 : undefined}
        aria-label={askable ? `Ask about: ${text}` : undefined}
        onPointerEnter={(e) => {
          // Hover is for fine pointers (DS); a tap on the line just asks.
          if (!askable || e.pointerType === "touch") return;
          lastX.current = e.clientX;
          stay();
          setPointing(true);
          if (!open) timer.current = setTimeout(show, TIMING.askTooltip);
        }}
        onPointerMove={(e) => {
          lastX.current = e.clientX;
          if (!open) return;
          const m = measure(e.clientX);
          if (!m) return;
          if (reduce) x.jump(m.x);
          else x.set(m.x);
        }}
        onPointerLeave={() => askable && leave()}
        onFocus={() => {
          if (!askable) return;
          lastX.current = undefined;
          setPointing(true);
          show();
        }}
        onBlur={close}
        onClick={() => askable && ask()}
        onKeyDown={(e) => {
          if (askable && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            ask();
          }
        }}
        className={`-mx-0.5 rounded-[4px] px-0.5 py-[3px] outline-none [box-decoration-break:clone] transition-[background-color,color] duration-150 ease-[var(--ease-standard)] focus-visible:shadow-[0_0_0_2px_var(--color-accent-border)] ${
          lit ? "bg-accent-muted text-foreground-secondary" : ""
        }`}
      >
        {text}
      </span>
      {tip &&
        createPortal(
          <AnimatePresence>
            {askable && open && (
              <motion.div
                key="ask"
                className="pointer-events-none absolute left-0 z-30"
                style={{ top: tip.top, x }}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={reduce ? { opacity: 0, transition: { duration: DUR.fast } } : { opacity: 0, scale: 0.95, y: 4, transition: { duration: DUR.fast, ease: EASE.standard } }}
                transition={{ duration: DUR.normal, ease: EASE.reveal }}
              >
                {/* The anchor is a 0×0 point at the arrow's base, so
                    the zoom above grows out of it. */}
                <div className="absolute bottom-0 left-0 -translate-x-1/2">
                  <motion.button
                    type="button"
                    tabIndex={-1}
                    aria-hidden
                    onPointerEnter={stay}
                    onPointerLeave={leave}
                    onClick={ask}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: DUR.press, ease: EASE.standard }}
                    className="pointer-events-auto relative flex items-center whitespace-nowrap rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground transition-colors duration-150 before:absolute before:inset-x-0 before:top-full before:h-[9px] hover:bg-[#27272a]"
                  >
                    Ask
                    <span className="absolute left-1/2 top-full size-2.5 -translate-x-1/2 -translate-y-[calc(50%+2px)] rotate-45 rounded-[2px] bg-inherit" aria-hidden />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          tip.host,
        )}
    </>
  );
}
