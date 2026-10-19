"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { DUR, EASE, TIMING } from "@/lib/motion";
import { usePrototype, type Tab, type Toast as ToastT } from "@/lib/store";
import { Icon } from "../ui";
import { ComposerFooter } from "./Composer";
import { Conversation } from "./Conversation";
import { HandoffPanel } from "./HandoffPanel";
import { LogPanel } from "./LogPanel";
import { RcaPanel } from "./RcaPanel";
import { RelatedPanel } from "./RelatedPanel";

const TABS: { label: string; tab: Tab }[] = [
  { label: "Root cause", tab: "rca" },
  { label: "Related issues", tab: "related" },
  { label: "Log", tab: "log" },
  { label: "Handoff", tab: "handoff" },
];

/* Assistant drawer: non-modal, 600px, slides over the alert page. */
export function AssistantDrawer() {
  const { state, actions } = usePrototype();
  const open = state.drawer === "open";
  const scrollRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

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

  return (
    <motion.aside
      aria-label="Signals Assistant"
      aria-hidden={!open}
      inert={!open}
      initial={false}
      animate={{ transform: open ? "translateX(0px)" : "translateX(640px)" }}
      transition={{ duration: open ? DUR.drawer : DUR.drawerOut, ease: EASE.reveal }}
      className="absolute right-0 top-0 z-20 flex h-full w-[600px] flex-col items-center border-l border-border bg-background shadow-drawer"
    >
      <header className="flex w-full shrink-0 items-center gap-2 py-4 pl-6 pr-4">
        <h2 className="flex-1 text-[24px] font-semibold leading-6 text-foreground">Signals Assistant</h2>
        <motion.button
          type="button"
          onClick={actions.closeDrawer}
          whileTap={{ scale: 0.94 }}
          aria-label="Close Signals Assistant"
          className="flex size-8 items-center justify-center rounded-button transition-colors duration-150 hover:bg-secondary"
        >
          <Icon src="/figma/drawer/x.svg" size={16} />
        </motion.button>
      </header>

      <nav className="flex h-12 w-full shrink-0 items-end gap-6 border-b border-border px-6" aria-label="Assistant sections">
        {TABS.map(({ label, tab }) => {
          const active = tab === state.tab;
          return (
            <button key={label} type="button" onClick={() => actions.setTab(tab)} aria-current={active ? "page" : undefined} className="group flex flex-col">
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
      <ToastHost />
    </motion.aside>
  );
}

function ToastHost() {
  const { state } = usePrototype();
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[126px] z-10 flex justify-center">
      <AnimatePresence>{state.toast && <ToastView key={state.toast.id} toast={state.toast} />}</AnimatePresence>
    </div>
  );
}

function ToastView({ toast }: { toast: ToastT }) {
  const { actions } = usePrototype();
  const [hover, setHover] = useState(false);
  useEffect(() => {
    if (hover) return;
    const t = setTimeout(() => actions.dismissToast(toast.id), TIMING.toastLife);
    return () => clearTimeout(t);
  }, [hover, toast.id, actions]);
  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: 10, scale: 0.97, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: 6, scale: 0.98, transition: { duration: DUR.toastOut, ease: EASE.standard } }}
      transition={{ duration: DUR.toastIn, ease: EASE.reveal }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      className="pointer-events-auto flex items-center gap-4 whitespace-nowrap rounded-lg bg-primary px-4 py-3 text-[14px] leading-5 text-primary-foreground shadow-toast"
    >
      <span>{toast.text}</span>
      {toast.undo && (
        <button type="button" onClick={() => actions.undo(toast)} className="font-medium underline underline-offset-2 transition-opacity hover:opacity-80">
          Undo
        </button>
      )}
    </motion.div>
  );
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
          exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.15 } }}
          transition={{ duration: 0.3, ease: EASE.reveal, delay: 0.1 }}
          style={{ transformOrigin: "right bottom" }}
          className="absolute bottom-10 right-5 z-20 flex items-center gap-4 rounded-[12px] border border-border bg-white py-3 pl-4 pr-3 shadow-[0_1px_1.5px_rgba(0,0,0,0.06),0_8px_12px_rgba(0,0,0,0.12)]"
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
