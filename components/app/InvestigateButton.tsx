"use client";

import { AnimatePresence, motion } from "motion/react";
import { DUR, EASE } from "@/lib/motion";

/* ─────────────────────────────────────────────────────────
 * "Investigate with AI" (Signals Assistant button 1251:107).
 * Rest (State11): 1.5px teal → blue → green ring around a light
 * zinc surface with a verdigris label. The surface and label keep
 * those colours through hover and click. Click: ring becomes a
 * clockwise conic sweep (1.6s/turn), label swaps to
 * "Investigating…", width hugs 149 → 123px.
 * ───────────────────────────────────────────────────────── */

const WIDTH = { rest: 149, loading: 123 };

export function InvestigateButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-busy={loading || undefined}
      initial={false}
      animate={{ width: loading ? WIDTH.loading : WIDTH.rest }}
      whileTap={loading ? undefined : { scale: 0.97 }}
      transition={{ duration: DUR.routine, ease: EASE.snap }}
      className="relative isolate flex h-[34px] items-center overflow-hidden rounded-md p-[1.5px] [filter:drop-shadow(-1px_0_1.5px_rgba(0,0,0,0.06))_drop-shadow(-12px_0_16px_rgba(0,0,0,0.08))]"
    >
      <span className={`ring-rest absolute inset-0 -z-10 transition-opacity duration-200 ${loading ? "opacity-0" : "opacity-100"}`} aria-hidden />
      <span className={`ring-sweep absolute inset-0 -z-10 transition-opacity duration-200 ${loading ? "opacity-100" : "opacity-0"}`} aria-hidden />
      <span className="relative flex h-full w-full items-center overflow-hidden rounded-[6.5px] bg-[#e4e4e7] pl-2.5 pr-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={loading ? "loading" : "rest"}
            initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
            transition={{ duration: DUR.routine, ease: EASE.snap }}
            className="whitespace-nowrap text-[14px] font-medium leading-5 text-verdigris-on-light"
          >
            {loading ? "Investigating…" : "Investigate with AI"}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.button>
  );
}
