"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type RefObject } from "react";
import type { Cause } from "@/lib/data";
import { DUR, EASE, SPRING } from "@/lib/motion";
import { usePrototype, type Tab } from "@/lib/store";
import { Icon, PanelIcon } from "../ui";
import { ComposerFooter } from "./Composer";
import { Conversation } from "./Conversation";
import { HandoffPanel } from "./HandoffPanel";
import { LogPanel } from "./LogPanel";
import { RcaPanel } from "./RcaPanel";
import { RelatedPanel } from "./RelatedPanel";
import { SIDE_W, SidePanel } from "./SidePanel";

const TABS: { label: string; tab: Tab }[] = [
  { label: "Root cause", tab: "rca" },
  { label: "Related issues", tab: "related" },
  { label: "Log", tab: "log" },
  { label: "Handoff", tab: "handoff" },
];

const DRAWER_W = 600;
const FULL_W = DRAWER_W + SIDE_W;

/* Assistant drawer: non-modal, 600px, slides over the alert page.
 * Simulate and Recommend actions widen it leftward by SIDE_W: the
 * main column rides the leading edge, the side panel arrives from
 * the right edge, and the header's close button stays put. The side
 * panel belongs to Root cause, so other tabs narrow it back.
 * The drawer is always FULL_W wide and only moves (transform only,
 * per the DS): narrow, its side-panel half waits past the right edge
 * of the window, and the header actions (thinking link, close) are
 * held back by the same amount so they never move. */
export function AssistantDrawer() {
  const { state, actions } = usePrototype();
  const open = state.drawer === "open";
  const extended = state.tab === "rca" && (state.side !== null || state.thinking);
  const reduce = useReducedMotion();
  // Which change the drawer is animating: opening/closing, or making room for the side panel.
  const [seen, setSeen] = useState({ open, extended, by: "open" as "open" | "side" });
  if (seen.open !== open || seen.extended !== extended) setSeen({ open, extended, by: seen.open !== open ? "open" : "side" });
  // One spring both ways for opening and for widening, so either can be reversed mid-flight.
  const slide = reduce && seen.by === "side" ? { duration: 0 } : (seen.by === "open" ? open : extended) ? SPRING.sheet : SPRING.sheetOut;
  const tuck = extended ? 0 : SIDE_W;
  const scrollRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Esc closes the side panel first.
  useEffect(() => {
    if (!open || !extended) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") actions.closeSide();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, extended, actions]);

  // Bring the question to the top of the panel when it's sent.
  useEffect(() => {
    if (state.chat !== "searching") return;
    const id = requestAnimationFrame(() => {
      const el = bubbleRef.current;
      const sc = scrollRef.current;
      if (el && sc) sc.scrollTo({ top: Math.max(0, el.offsetTop - 16), behavior: "smooth" });
    });
    return () => cancelAnimationFrame(id);
  }, [state.chat]);

  // Each tab starts at the top.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [state.tab]);

  // The card the side panel belongs to (its boxes, or its Thinking) stays in view.
  const panelCard = open && state.tab === "rca" ? (state.thinking ? state.thinkingFor : (state.side?.cause ?? null)) : null;
  useCardInView(scrollRef, panelCard, actions.closeSide, !!reduce);

  return (
    <motion.aside
      aria-label="Signals Assistant"
      aria-hidden={!open}
      inert={!open}
      initial={false}
      animate={{ x: open ? tuck : FULL_W + 48 }}
      transition={slide}
      className="absolute right-0 top-0 z-20 flex h-full flex-col overflow-hidden border-l border-border bg-background shadow-drawer"
      style={{ width: FULL_W }}
    >
      <header className="relative flex w-full shrink-0 items-center gap-2 py-4 pl-6 pr-4">
        <h2 className="flex-1 text-[24px] font-semibold leading-6 text-foreground">Signals Assistant</h2>
        {/* Header actions, held at the window's right edge as the drawer
            widens. The thinking link (Root cause only) sits beside the
            close button: gap-2 (8px) plus the button's 8px inset puts
            16px between its text and the X, on the DS 4px grid. Show
            opens or switches to Thinking; Hide goes back to the boxes,
            or closes the panel. */}
        <motion.div className="flex items-center gap-2" initial={false} animate={{ x: -tuck }} transition={slide}>
          <button
            type="button"
            onClick={() => (state.thinking ? actions.hideThinking() : actions.showThinking())}
            disabled={state.analysis !== "done"}
            hidden={state.tab !== "rca"}
            aria-pressed={state.thinking}
            aria-controls="assistant-side-panel"
            className="type-label whitespace-nowrap text-verdigris-on-light underline-offset-4 hover:underline disabled:pointer-events-none disabled:opacity-40"
          >
            {state.thinking ? "Hide thinking" : "Show thinking"}
          </button>
          <motion.button
            type="button"
            onClick={actions.closeDrawer}
            whileTap={{ scale: 0.94 }}
            aria-label="Close Signals Assistant"
            className="flex size-8 items-center justify-center rounded-button transition-colors duration-150 hover:bg-secondary"
          >
            <Icon src="/figma/drawer/x.svg" size={16} />
          </motion.button>
        </motion.div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="relative flex h-full shrink-0 flex-col" style={{ width: DRAWER_W }}>
          <nav className="flex h-12 w-full shrink-0 items-end gap-6 border-b border-border px-6" aria-label="Assistant sections">
            {TABS.map(({ label, tab }) => {
              const active = tab === state.tab;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => actions.setTab(tab)}
                  aria-current={active ? "page" : undefined}
                  className="group flex flex-col"
                >
                  <span
                    className={`py-3 text-[14px] font-medium leading-5 transition-colors duration-150 ${
                      active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground-secondary"
                    }`}
                  >
                    {label}
                  </span>
                  <span
                    className={`h-0.5 w-full origin-center rounded-t-[2px] bg-verdigris-on-light transition-[opacity,transform] duration-200 ease-[var(--ease-reveal)] ${
                      active ? "scale-x-100 opacity-100" : "scale-x-50 opacity-0"
                    }`}
                  />
                </button>
              );
            })}
            {/* Side panel button (DS icon button, ghost, 36px) on the tab
                bar's right edge: opens the panel on Thinking. While the
                panel is out, its own close button is the only one, so
                this one steps aside. Root cause only, once the analysis
                has finished. */}
            <AnimatePresence initial={false}>
              {state.tab === "rca" && !extended && (
                <motion.button
                  key="panel-open"
                  type="button"
                  onClick={() => actions.showThinking()}
                  disabled={state.analysis !== "done"}
                  aria-expanded={false}
                  aria-controls="assistant-side-panel"
                  aria-label="Open side panel"
                  title="Open side panel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: DUR.fast } }}
                  whileTap={state.analysis === "done" ? { scale: 0.94 } : undefined}
                  transition={{ duration: DUR.normal, ease: EASE.reveal }}
                  className="-mr-2 ml-auto flex size-9 shrink-0 items-center justify-center self-center rounded-button text-muted-foreground transition-colors duration-150 hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                >
                  <PanelIcon open={false} />
                </motion.button>
              )}
            </AnimatePresence>
          </nav>

          <div ref={scrollRef} className="scroll-quiet relative min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden">
            {/* Panels stay mounted so switching tabs never replays the analysis. */}
            <div className="tab-panel relative flex flex-col px-6 pb-8 pt-6" hidden={state.tab !== "rca"}>
              <RcaPanel />
              <Conversation bubbleRef={bubbleRef} />
            </div>
            <div className="tab-panel relative flex flex-col px-6 pb-8 pt-6" hidden={state.tab !== "related"}>
              <RelatedPanel />
            </div>
            <div className="tab-panel relative flex flex-col px-6 pb-8 pt-6" hidden={state.tab !== "log"}>
              {state.logSeen && <LogPanel />}
            </div>
            <div className="tab-panel relative flex flex-col px-6 pb-20 pt-6" hidden={state.tab !== "handoff"}>
              <HandoffPanel />
            </div>
          </div>

          <ComposerFooter />
          {/* DS Separator (design.verdigris.co/categories/web-components/layout):
              a vertical 1px bg-border line on the column's right edge, shown
              while the side panel is out. It starts under the 48px tab row,
              so the tab bar and the panel's header read as one toolbar. */}
          <div
            data-slot="separator"
            role="none"
            className={`pointer-events-none absolute bottom-0 right-0 top-12 z-[1] w-px bg-border transition-opacity duration-500 ${extended ? "opacity-100" : "opacity-0"}`}
          />
        </div>
        <SidePanel shown={open && extended} />
      </div>
    </motion.aside>
  );
}

/* While the side panel shows a card's details, the whole card is in
 * view: opening scrolls it fully in (16px clear of the edges), and
 * once the user scrolls it more than half out of view the panel
 * collapses. The scroll-in is ignored until it settles. Positions are
 * measured in the scroller's layout px, so this holds inside the
 * scaled stage. */
const AWAY = 0.5;

function useCardInView(scroller: RefObject<HTMLDivElement | null>, id: Cause["id"] | null, onAway: () => void, reduce: boolean) {
  useEffect(() => {
    const sc = scroller.current;
    const card = id ? document.getElementById(`cause-${id}`) : null;
    if (!sc || !card) return;
    const place = () => {
      const sr = sc.getBoundingClientRect();
      const cr = card.getBoundingClientRect();
      const s = sr.height / sc.offsetHeight || 1;
      return { top: (cr.top - sr.top) / s, bottom: (cr.bottom - sr.top) / s, h: cr.height / s };
    };

    let settling = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const settle = () => {
      settling = false;
      clearTimeout(timer);
    };
    const pad = 16;
    const r = place();
    const view = sc.clientHeight;
    const delta = r.top < pad ? r.top - pad : r.bottom > view - pad ? Math.min(r.bottom - (view - pad), r.top - pad) : 0;
    if (delta) {
      settling = true;
      sc.addEventListener("scrollend", settle, { once: true });
      timer = setTimeout(settle, 900);
      sc.scrollBy({ top: delta, behavior: reduce ? "auto" : "smooth" });
    }

    const onScroll = () => {
      if (settling) return;
      const p = place();
      const seen = Math.max(0, Math.min(p.bottom, sc.clientHeight) - Math.max(p.top, 0));
      if (seen < p.h * AWAY) onAway();
    };
    sc.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      sc.removeEventListener("scroll", onScroll);
      sc.removeEventListener("scrollend", settle);
      clearTimeout(timer);
    };
  }, [scroller, id, onAway, reduce]);
}

/* Collapsed assistant while the user follows evidence into Signals. */
export function AssistantMinimized() {
  const { state, actions } = usePrototype();
  return (
    <AnimatePresence>
      {state.drawer === "minimized" && (
        <motion.div
          key="min"
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: DUR.fast } }}
          transition={{ duration: DUR.moderate, ease: EASE.reveal, delay: 0.1 }}
          style={{ transformOrigin: "right bottom" }}
          className="absolute bottom-10 right-5 z-20 flex items-center gap-4 rounded-lg border border-border bg-popover py-3 pl-4 pr-3 shadow-md"
        >
          <span className="text-[24px] font-semibold leading-6 text-foreground">Signals Assistant</span>
          <motion.button
            type="button"
            onClick={actions.backToRootCause}
            whileTap={{ scale: 0.97 }}
            className="flex h-8 items-center rounded-button bg-primary px-3 text-[14px] font-medium leading-5 text-primary-foreground transition-colors hover:bg-[#27272a]"
          >
            Back to root cause
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
