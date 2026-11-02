"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useEffect, useLayoutEffect, useState } from "react";
import { DUR, EASE } from "@/lib/motion";
import { PrototypeProvider, usePrototype } from "@/lib/store";
import { AlertPage } from "./app/AlertPage";
import { Rail, TopBar } from "./app/AppShell";
import { SignalsPage } from "./app/SignalsPage";
import { AssistantDrawer, AssistantMinimized } from "./drawer/Drawer";
import { ScheduleDialog } from "./ScheduleDialog";
import { ToastBridge, Toaster } from "./Toaster";

/* Signals fills the window edge to edge, like the real product. It
 * lays out at no less than 1280 × 820 (the Figma frames are
 * 1579 × 993): a smaller window gets that minimum scaled down to fit,
 * rather than a cramped layout. */
const MIN = { w: 1280, h: 820 };

export function Prototype() {
  return (
    <MotionConfig reducedMotion="user">
      <PrototypeProvider>
        <Stage>
          <Screen />
        </Stage>
        {/* Outside the stage, so toasts sit on the window's corner at full size. */}
        <Toaster />
        <ToastBridge />
      </PrototypeProvider>
    </MotionConfig>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  const [fit, setFit] = useState<{ scale: number; w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const { innerWidth: w, innerHeight: h } = window;
      const scale = Math.min(1, w / MIN.w, h / MIN.h);
      // A tall, narrow window (a phone) would stretch the layout into a
      // tower; past square, the extra height is left as background.
      setFit({ scale, w: w / scale, h: Math.min(h / scale, Math.max(MIN.h, w / scale)) });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const scaled = fit !== null && fit.scale < 1;
  return (
    <div className="fixed inset-0 overflow-clip bg-surface-subtle">
      {fit !== null && fit.scale < 0.5 && (
        <p className="absolute inset-x-4 top-4 z-50 rounded-lg bg-primary px-3 py-2 text-center text-[13px] leading-5 text-primary-foreground shadow-toast">
          Signals is a desktop tool. Open this on a laptop for the full prototype.
        </p>
      )}
      <div
        className="absolute left-0 top-0 origin-top-left overflow-clip bg-surface-subtle"
        style={{
          width: scaled ? fit.w : "100%",
          height: scaled ? fit.h : "100%",
          transform: scaled ? `scale(${fit.scale})` : undefined,
          opacity: fit === null ? 0 : 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Screen() {
  const { state, actions } = usePrototype();

  // R restarts the demo from the alert.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "r" || e.key === "R") actions.reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [actions]);

  const dimmed = state.drawer === "open";

  return (
    <div className="relative flex h-full w-full flex-col">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <Rail />
        <div className="relative flex min-w-0 flex-1">
          <AnimatePresence initial={false}>
            <motion.div
              key={state.view}
              className="absolute inset-0 flex"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUR.routine, ease: EASE.standard }}
            >
              {state.view === "alert" ? <AlertPage investigating={state.investigating} onInvestigate={actions.investigate} /> : <SignalsPage />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Light, non-blocking dim behind the drawer (8%). */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-10 bg-[#09090b]"
        initial={false}
        animate={{ opacity: dimmed ? 0.08 : 0 }}
        transition={{ duration: dimmed ? DUR.dim : DUR.dimOut, ease: EASE.reveal }}
        aria-hidden
      />
      <AssistantDrawer />
      <AssistantMinimized />
      <ScheduleDialog />
    </div>
  );
}
