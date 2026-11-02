"use client";

import { useId } from "react";
import { PHASE_AREA, PHASE_LINE } from "./phaseTrace";

/* Phase A current + THDi chart (static snapshot from the Signals alert page).
 * Covers the same 11:30–13:30 window the Assistant analyses; the Figma
 * line was re-timed so its peak sits on 12:30, the spike in the headline.
 * The plot stretches to whatever room the page gives it: the trace is
 * drawn in its export coordinates and scaled, with a stroke that stays
 * 1.5px, while labels and limits are laid out in CSS. */

const Y_LEFT = ["60 A", "45 A", "30 A", "15 A", "0 A"];
const Y_RIGHT = ["20%", "15%", "10%", "5%", "0%"];
const X = ["11:30", "12:00", "12:30", "13:00", "13:30"];

/* The plot window in trace coordinates: 11:30–13:30 across, 60 A–0 A down. */
const VIEW = "71.7 -5.9 719.1 260";
/* Limits as a share of the plot height from the top: 50 of 60 A, 5 of 20%. */
const CURRENT_LIMIT = "16.667%";
const THD_LIMIT = "75%";

export function PhaseChart() {
  const fill = useId();
  return (
    <figure
      role="img"
      aria-label="Phase A current and harmonic distortion, 11:30 to 13:30. Current peaks near 58 A at 12:30, above the 50 A threshold."
      className="grid min-h-[200px] w-full flex-1 grid-cols-[16px_40px_minmax(0,1fr)_40px_16px] grid-rows-[minmax(0,1fr)_24px] pt-1.5"
    >
      <AxisTitle side="left">Current (RMS)</AxisTitle>
      <Ticks labels={Y_LEFT} side="left" />

      <div className="relative">
        <svg className="absolute inset-0 size-full" viewBox={VIEW} preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id={fill} x1="0" y1="0" x2="0" y2="254.757" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0FC8C3" stopOpacity="0.5" />
              <stop offset="1" stopColor="#0FC8C3" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path d={PHASE_AREA} fill={`url(#${fill})`} fillOpacity="0.6" />
          <path d={PHASE_LINE} transform="translate(-1.611 -0.75)" fill="none" stroke="#0FC8C3" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="absolute inset-x-0 h-[1.5px] -translate-y-1/2 bg-verdigris" style={{ top: CURRENT_LIMIT }} aria-hidden />
        <span className="absolute inset-x-0 h-[1.5px] -translate-y-1/2 bg-midnight-purple" style={{ top: THD_LIMIT }} aria-hidden />
        <span className="absolute inset-x-0 bottom-0 h-px bg-border" aria-hidden />
        <span
          className="absolute left-0 flex h-[20.5px] items-center rounded-sm bg-verdigris-on-light px-2 text-[11px] font-medium leading-[16.5px] tracking-[0.06px] text-primary-foreground"
          style={{ top: `calc(${CURRENT_LIMIT} + 7px)` }}
        >
          Current &gt; 50 A
        </span>
        <span
          className="absolute left-0 flex h-[20.5px] items-center rounded-sm bg-midnight-purple px-2 text-[11px] font-medium leading-[16.5px] tracking-[0.06px] text-primary-foreground"
          style={{ top: `calc(${CURRENT_LIMIT} + 33px)` }}
        >
          THDi &gt; 5%
        </span>
      </div>

      <Ticks labels={Y_RIGHT} side="right" />
      <AxisTitle side="right">Harmonic distortion (THDi)</AxisTitle>

      <div className="col-start-3 flex items-end justify-between">
        {X.map((t) => (
          <span key={t} className="font-mono text-[11px] leading-[13px] text-foreground-tertiary tabular-nums">
            {t}
          </span>
        ))}
      </div>
    </figure>
  );
}

function Ticks({ labels, side }: { labels: string[]; side: "left" | "right" }) {
  return (
    <div className="relative" aria-hidden>
      {labels.map((t, i) => (
        <span
          key={t}
          className={`absolute -translate-y-1/2 whitespace-nowrap font-mono text-[11px] leading-[13px] text-foreground-tertiary tabular-nums ${side === "left" ? "right-2" : "left-2"}`}
          style={{ top: `${(i / (labels.length - 1)) * 100}%` }}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

function AxisTitle({ side, children }: { side: "left" | "right"; children: React.ReactNode }) {
  return (
    <span
      className={`flex items-center justify-center whitespace-nowrap text-[11px] leading-4 text-foreground-tertiary [writing-mode:vertical-rl] ${side === "left" ? "rotate-180" : ""}`}
      aria-hidden
    >
      {children}
    </span>
  );
}
