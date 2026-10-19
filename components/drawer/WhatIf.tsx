"use client";

import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { ODDS, ODDS_NOW, PROJECTION_ANGLE, RACK_STOPS, UPS_STOPS, riskFor, type Confidence } from "@/lib/data";
import { EASE, SPRING } from "@/lib/motion";
import { usePrototype } from "@/lib/store";
import { Badge, Icon } from "../ui";

/* ─────────────────────────────────────────────────────────
 * What-if / UPS-2 ripple odds (1560:5036).
 * Tap or drag a slider stop; odds digits roll and the projection
 * rotates about "Now" on the Figma spring (m1 k520 d44).
 * ───────────────────────────────────────────────────────── */

const W = "/figma/whatif";
const KNOB_RANGE = 469; // px the knob travels on a 485px track
const NOW = { x: 84, y: 84 }; // "Now · 6%" inside the 453×120 plot

const RISK_TEXT: Record<Confidence, string> = {
  High: "text-pastel-red",
  Medium: "text-warning-fg",
  Low: "text-verdigris-on-light",
};
const RISK_TONE: Record<Confidence, "danger" | "warning" | "teal"> = { High: "danger", Medium: "warning", Low: "teal" };

export function WhatIf() {
  const { state, actions } = usePrototype();
  const { rack, ups } = state.whatIf;
  const after = ODDS[ups][rack];
  const risk = riskFor(after);
  const delta = after - ODDS_NOW;
  const changed = rack !== 0 || ups !== 0;

  return (
    <section className="flex w-full flex-col items-center overflow-hidden rounded-lg border border-border bg-card p-2" aria-label="What-if: lower the odds of a UPS-2 failure">
      <div className="flex w-full flex-col gap-3 px-6 pb-2 pt-6">
        <h4 className="text-[14px] font-semibold leading-5 text-foreground">Failure odds · next 6 h</h4>
        <div className="flex w-full items-stretch gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-md bg-surface-subtle p-3">
            <span className="text-[12px] font-medium leading-4 text-muted-foreground">Now</span>
            <span className="flex items-center justify-between">
              <span className="text-[32px] font-semibold leading-9 tracking-[-0.64px] text-pastel-red tabular">{ODDS_NOW}%</span>
              <Badge tone="danger">High</Badge>
            </span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-md border border-border bg-background p-3">
            <span className="text-[12px] font-medium leading-4 text-foreground">After</span>
            <span className="flex items-center justify-between" aria-live="polite">
              <span className={`flex text-[32px] font-semibold leading-9 tracking-[-0.64px] transition-colors duration-300 ${RISK_TEXT[risk]}`}>
                <RollingNumber value={after} />%
              </span>
              <span className="flex items-center gap-1.5">
                <RiskChip level={risk} />
                <AnimatePresence initial={false}>
                  {changed && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9, filter: "blur(2px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.12 } }}
                      transition={SPRING.pop}
                      className="flex"
                    >
                      <Badge tone="teal">
                        <span className="tabular">−{Math.abs(delta)} pts</span>
                      </Badge>
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex w-[533px] flex-col">
        <RippleChart angle={PROJECTION_ANGLE[ups][rack]} />
        <div className="flex flex-col gap-4 px-6 pb-6 pt-2">
          <div className="flex h-8 items-center justify-between">
            <h4 className="text-[14px] font-semibold leading-5 text-foreground">Lower the odds</h4>
            <motion.button
              type="button"
              onClick={() => actions.setWhatIf(0, 0)}
              initial={false}
              animate={{ opacity: changed ? 1 : 0, pointerEvents: changed ? "auto" : "none" }}
              transition={{ duration: 0.18, ease: EASE.snap }}
              whileTap={{ scale: 0.97 }}
              className="flex h-8 items-center gap-1.5 rounded-button px-3 text-[14px] font-medium leading-5 text-foreground-secondary transition-colors duration-150 hover:bg-secondary"
              tabIndex={changed ? 0 : -1}
            >
              <Icon src={`${W}/undo.svg`} size={14} />
              Reset
            </motion.button>
          </div>
          <div className="flex flex-col gap-5">
            <StopSlider
              label="Move rack 14 load to PDU-02"
              stops={RACK_STOPS}
              value={rack}
              onChange={(v) => actions.setWhatIf(v, ups)}
            />
            <div className="flex flex-col gap-2">
              <StopSlider
                label="Shift UPS-2 load to UPS-1"
                stops={UPS_STOPS}
                value={ups}
                onChange={(v) => actions.setWhatIf(rack, v)}
              />
              <p className="text-[12px] leading-4 text-muted-foreground">
                {UPS_STOPS[ups].note}
                {UPS_STOPS[ups].risk && <span className="text-warning-fg"> · {UPS_STOPS[ups].risk}</span>}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RiskChip({ level }: { level: Confidence }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={level}
        initial={{ opacity: 0, y: 4, filter: "blur(2px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -4, filter: "blur(2px)" }}
        transition={{ duration: 0.2, ease: EASE.snap }}
        className="flex"
      >
        <Badge tone={RISK_TONE[level]}>{level}</Badge>
      </motion.span>
    </AnimatePresence>
  );
}

/* Odometer digits: each column springs to its digit. */
function RollingNumber({ value }: { value: number }) {
  const tens = Math.floor(value / 10);
  const ones = value % 10;
  return (
    <span className="relative inline-flex tabular" aria-label={`${value}`}>
      <motion.span
        className="relative inline-flex overflow-hidden"
        initial={false}
        animate={{ width: tens > 0 ? "0.62em" : "0em", opacity: tens > 0 ? 1 : 0 }}
        transition={SPRING.whatIf}
      >
        <DigitColumn digit={tens} />
      </motion.span>
      <span className="relative inline-flex w-[0.62em] overflow-hidden">
        <DigitColumn digit={ones} />
      </span>
    </span>
  );
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function DigitColumn({ digit }: { digit: number }) {
  return (
    <span className="relative block h-9 w-[0.62em]" aria-hidden>
      <motion.span className="absolute left-0 top-0 flex flex-col" initial={false} animate={{ y: `${-digit * 2.25}rem` }} transition={SPRING.whatIf}>
        {DIGITS.map((d) => (
          <span key={d} className="block h-9 w-[0.62em] text-center">
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

function RippleChart({ angle }: { angle: number }) {
  const ticks = [
    { t: "20%", top: -2, tone: "text-subtle-foreground" },
    { t: "15%", top: 28, tone: "text-destructive" },
    { t: "10%", top: 58, tone: "text-subtle-foreground" },
    { t: "5%", top: 88, tone: "text-subtle-foreground" },
    { t: "0%", top: 118, tone: "text-subtle-foreground" },
  ];
  const xs = [
    { t: "12:00", left: 32 },
    { t: "14:00", left: 127.25 },
    { t: "16:00", left: 240.5 },
    { t: "18:00", left: 353.75 },
    { t: "20:00", left: 449 },
  ];
  return (
    <div className="flex flex-col gap-3 p-6">
      <span className="text-[12px] font-medium leading-4 text-muted-foreground">UPS-2 ripple</span>
      <div className="relative h-[148px] w-full overflow-hidden" role="img" aria-label="UPS-2 ripple: today, projection and the Mar 14 failure path">
        {ticks.map((t) => (
          <span key={t.t} className={`absolute left-[26px] w-[26px] -translate-x-full text-right font-mono text-[12px] leading-4 ${t.tone}`} style={{ top: t.top }}>
            {t.t}
          </span>
        ))}
        <div className="absolute left-8 top-1.5 h-[120px] w-[453px] overflow-hidden">
          {[0, 60, 90, 119].map((top) => (
            <span key={top} className="absolute left-0 h-px w-[453px] bg-border" style={{ top }} />
          ))}
          <ChartImg src={`${W}/failure-level.svg`} style={{ left: 0, top: 28.5, width: 453, height: 1.5 }} />
          <motion.div
            className="absolute"
            style={{ left: NOW.x - 440, top: NOW.y - 24, width: 880, height: 48, transformOrigin: "440px 24px" }}
            initial={false}
            animate={{ rotate: -angle }}
            transition={SPRING.whatIf}
          >
            <ChartImg src={`${W}/projection.svg`} style={{ inset: 0, width: 880, height: 48 }} />
          </motion.div>
          <ChartImg src={`${W}/mar14.svg`} style={{ left: 0, top: 0, width: 453, height: 120 }} />
          <ChartImg src={`${W}/today.svg`} style={{ left: 0, top: 0, width: 453, height: 120 }} />
          <span className="absolute left-[84px] top-0 h-[120px] w-px bg-neutral-500" />
          <ChartImg src={`${W}/failure-marker.svg`} style={{ left: 352.68, top: 24, width: 12, height: 12 }} />
          <span className="absolute left-[91.93px] top-1 rounded-[6px] bg-patina-ink-hover px-1.5 py-0.5 font-mono text-[12px] leading-4 text-primary-foreground">Now · 6%</span>
          <span className="absolute left-[178.68px] top-0.5 rounded-[6px] bg-patina-ink-hover px-1.5 py-0.5 font-mono text-[12px] leading-4 text-primary-foreground">
            Mar 14 · failed 6 h in
          </span>
        </div>
        {xs.map((x) => (
          <span key={x.t} className="absolute top-[132px] font-mono text-[12px] leading-4 text-subtle-foreground" style={{ left: x.left }}>
            {x.t}
          </span>
        ))}
      </div>
    </div>
  );
}

function ChartImg({ src, style }: { src: string; style: React.CSSProperties }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="absolute block max-w-none" style={style} draggable={false} />;
}

/* A track with snap stops. Tap a stop, or drag: the knob follows the
 * pointer, the value snaps to the nearest stop, release springs home. */
function StopSlider({
  label,
  stops,
  value,
  onChange,
}: {
  label: string;
  stops: { label: string; x: number }[];
  value: number;
  onChange: (v: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const knobX = useMotionValue(stops[value].x);
  const fillW = useTransform(() => knobX.get() + 8);

  useEffect(() => {
    if (!dragging.current) {
      const ctl = animate(knobX, stops[value].x, SPRING.whatIf);
      return () => ctl.stop();
    }
  }, [value, stops, knobX]);

  const nearest = (px: number) => {
    let best = 0;
    for (let i = 1; i < stops.length; i++) if (Math.abs(stops[i].x - px) < Math.abs(stops[best].x - px)) best = i;
    return best;
  };

  const pxFromEvent = (e: React.PointerEvent) => {
    const rect = trackRef.current!.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    return Math.min(KNOB_RANGE, Math.max(0, f * 485 - 8));
  };

  const changed = value !== 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-[14px] leading-5">
        <span className="flex-1 font-medium text-foreground-secondary">{label}</span>
        <span className={`font-mono transition-colors duration-200 tabular ${changed ? "text-verdigris-on-light" : "text-foreground"}`}>{stops[value].label}</span>
      </div>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={stops.length - 1}
        aria-valuenow={value}
        aria-valuetext={stops[value].label}
        className="relative h-4 w-[485px] cursor-pointer touch-none select-none rounded-full outline-offset-4"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          dragging.current = true;
          const px = pxFromEvent(e);
          animate(knobX, px, SPRING.drag);
          onChange(nearest(px));
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          const px = pxFromEvent(e);
          knobX.set(px);
          onChange(nearest(px));
        }}
        onPointerUp={(e) => {
          if (!dragging.current) return;
          dragging.current = false;
          const v = nearest(pxFromEvent(e));
          onChange(v);
          animate(knobX, stops[v].x, SPRING.whatIf);
        }}
        onPointerCancel={() => {
          dragging.current = false;
          animate(knobX, stops[value].x, SPRING.whatIf);
        }}
        onKeyDown={(e) => {
          const next =
            e.key === "ArrowRight" || e.key === "ArrowUp"
              ? Math.min(stops.length - 1, value + 1)
              : e.key === "ArrowLeft" || e.key === "ArrowDown"
                ? Math.max(0, value - 1)
                : e.key === "Home"
                  ? 0
                  : e.key === "End"
                    ? stops.length - 1
                    : null;
          if (next !== null) {
            e.preventDefault();
            onChange(next);
          }
        }}
      >
        <span className="absolute -inset-y-2 inset-x-0" aria-hidden />
        <span className="absolute left-0 top-1.5 h-1 w-[485px] rounded-[2px] bg-secondary" aria-hidden />
        {stops.map((s) => (
          <ChartImg key={s.label} src={`${W}/tick.svg`} style={{ left: s.x + 6, top: 6, width: 4, height: 4 }} />
        ))}
        <motion.span className="absolute left-0 top-1.5 h-1 rounded-[2px] bg-verdigris-on-light" style={{ width: fillW }} aria-hidden />
        <motion.span className="absolute left-0 top-0 size-4" style={{ x: knobX }} aria-hidden>
          <ChartImg src={`${W}/knob.svg`} style={{ left: -3, top: -2, width: 22, height: 22 }} />
        </motion.span>
      </div>
    </div>
  );
}
