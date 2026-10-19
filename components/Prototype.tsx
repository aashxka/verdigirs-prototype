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

/* The Figma frames are 1579 × 993. The stage scales that artboard to
 * fit any window, so it reads the same on a laptop or a screen share. */
const ARTBOARD = { w: 1579, h: 993 };

export function Prototype() {
  return (
    <MotionConfig reducedMotion="user">
      <PrototypeProvider>
        <Stage>
          <Screen />
        </Stage>
      </PrototypeProvider>
    </MotionConfig>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState<number | null>(null);
  useLayoutEffect(() => {
    const fit = () => {
      const pad = window.innerWidth > 900 ? 24 : 8;
      setScale(Math.min((window.innerWidth - pad * 2) / ARTBOARD.w, (window.innerHeight - pad * 2) / ARTBOARD.h));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-clip bg-[#eceef1]">
      {scale !== null && scale < 0.5 && (
        <p className="absolute inset-x-4 top-4 z-50 rounded-lg bg-primary px-3 py-2 text-center text-[13px] leading-5 text-primary-foreground shadow-toast">
          Signals is a desktop tool. Open this on a laptop for the full prototype.
        </p>
      )}
      <div
        className="relative shrink-0"
        style={{ width: ARTBOARD.w * (scale ?? 1), height: ARTBOARD.h * (scale ?? 1), opacity: scale === null ? 0 : 1 }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left overflow-clip rounded-[20px] bg-surface-subtle shadow-[0_1px_2px_rgba(0,0,0,0.06),0_24px_64px_-24px_rgba(11,34,38,0.28)] ring-1 ring-black/5"
          style={{ width: ARTBOARD.w, height: ARTBOARD.h, transform: `scale(${scale ?? 1})` }}
        >
          {children}
        </div>
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
              transition={{ duration: DUR.routine, ease: EASE.out }}
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
        transition={{ duration: dimmed ? DUR.drawer : DUR.drawerOut, ease: EASE.reveal }}
        aria-hidden
      />
      <AssistantDrawer />
      <AssistantMinimized />
      <ScheduleDialog />
    </div>
  );
}
