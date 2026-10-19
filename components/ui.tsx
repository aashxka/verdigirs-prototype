"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Confidence, Source } from "@/lib/data";
import { DUR, EASE } from "@/lib/motion";

/* Lucide icons exported from the Figma file (stroke baked in). */
export function Icon({ src, size = 16, className = "" }: { src: string; size?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" width={size} height={size} className={`block shrink-0 ${className}`} style={{ width: size, height: size }} draggable={false} />;
}

const SOURCE_ICON: Record<Source["type"], string> = {
  sensor: "/figma/drawer/activity.svg",
  change: "/figma/drawer/git-commit.svg",
  incident: "/figma/drawer/history.svg",
};

/* Source chip — where an AI claim came from. */
export function SourceChip({ source, onOpen }: { source: Source; onOpen?: () => void }) {
  const body = (
    <>
      <Icon src={SOURCE_ICON[source.type]} size={12} />
      <span className="text-[12px] font-medium leading-4 text-foreground-secondary whitespace-nowrap">{source.label}</span>
    </>
  );
  if (!onOpen) {
    return <span className="inline-flex items-center gap-1 rounded-[6px] bg-secondary py-0.5 pl-1.5 pr-2">{body}</span>;
  }
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      className="inline-flex items-center gap-1 rounded-[6px] bg-secondary py-0.5 pl-1.5 pr-2 transition-colors duration-150 hover:bg-border"
      title={`Open ${source.label} in Signals`}
    >
      {body}
    </button>
  );
}

/* Confidence label — 3-bar meter + level. */
const CONF_TONE: Record<Confidence, { bar: string; off: string; text: string; lit: number }> = {
  High: { bar: "bg-verdigris-on-light", off: "bg-verdigris-on-light", text: "text-verdigris-on-light", lit: 3 },
  Medium: { bar: "bg-warning-fg", off: "bg-border", text: "text-warning-fg", lit: 2 },
  Low: { bar: "bg-neutral-500", off: "bg-border", text: "text-foreground-tertiary", lit: 1 },
};

export function ConfidenceLabel({ level }: { level: Confidence }) {
  const tone = CONF_TONE[level];
  return (
    <span className="inline-flex shrink-0 items-center gap-1" aria-label={`${level} confidence`}>
      <span className="flex items-end gap-0.5" aria-hidden>
        {[6, 9, 12].map((h, i) => (
          <span key={h} className={`w-[3px] rounded-[1px] ${i < tone.lit ? tone.bar : tone.off}`} style={{ height: h }} />
        ))}
      </span>
      <span className={`text-[12px] font-medium leading-4 ${tone.text}`}>{level}</span>
    </span>
  );
}

/* Badge — 20px, radius 6, Medium 12. */
export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "teal" | "warning" | "danger" | "muted"; children: React.ReactNode }) {
  const cls = {
    neutral: "bg-secondary text-foreground-secondary",
    muted: "bg-secondary text-muted-foreground",
    teal: "bg-accent-muted text-verdigris-on-light",
    warning: "bg-warning-bg text-warning-fg",
    danger: "bg-pastel-red-subtle text-pastel-red",
  }[tone];
  return <span className={`inline-flex h-5 shrink-0 items-center whitespace-nowrap rounded-[6px] px-2 text-[12px] font-medium leading-4 ${cls}`}>{children}</span>;
}

export function Spinner({ size = 16, light = false }: { size?: number; light?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="spin shrink-0" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke={light ? "rgba(250,250,250,0.25)" : "#e4e4e7"} strokeWidth="1.6" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke={light ? "#fafafa" : "#007571"} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/* Button / Small — 32px. Primary = main CTA, Secondary = row CTAs, Ghost = tertiary. */
export function Button({
  kind = "secondary",
  loading = false,
  disabled = false,
  onClick,
  children,
  className = "",
  ariaLabel,
}: {
  kind?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const cls = {
    primary: "bg-primary text-primary-foreground hover:bg-[#27272a]",
    secondary: "bg-background text-foreground border border-border hover:bg-secondary",
    ghost: "text-foreground-secondary hover:bg-secondary",
  }[kind];
  return (
    <motion.button
      type="button"
      whileTap={disabled || loading ? undefined : { scale: 0.97 }}
      transition={{ duration: DUR.press, ease: EASE.out }}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled && !loading) onClick?.();
      }}
      aria-busy={loading || undefined}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`relative inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-button px-3 text-[14px] font-medium leading-5 whitespace-nowrap transition-[background-color,opacity] duration-150 disabled:opacity-50 ${cls} ${className}`}
    >
      <span className={`inline-flex items-center gap-1.5 transition-opacity duration-150 ${loading ? "opacity-0" : "opacity-100"}`}>{children}</span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner size={14} light={kind === "primary"} />
        </span>
      )}
    </motion.button>
  );
}

/* Height transition without DOM measurement (see .vg-collapse in globals.css). */
export function Collapse({ open, children, inMs = 300, outMs = 200 }: { open: boolean; children: React.ReactNode; inMs?: number; outMs?: number }) {
  return (
    <div
      className="vg-collapse"
      data-open={open}
      style={{ "--collapse-in": `${inMs}ms`, "--collapse-out": `${outMs}ms` } as React.CSSProperties}
      aria-hidden={!open}
      inert={!open}
    >
      <div className="vg-collapse-inner">{children}</div>
    </div>
  );
}

export function Rank({ n, tone = "neutral" }: { n: number; tone?: "neutral" | "dark" | "teal" }) {
  const cls = {
    neutral: "bg-secondary text-foreground-secondary",
    dark: "bg-primary text-primary-foreground",
    teal: "bg-verdigris-on-light text-white",
  }[tone];
  return (
    <span className={`flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[12px] leading-4 transition-colors duration-200 ${cls}`}>{n}</span>
  );
}

/* DS: Checkbox — 16px, radius 4. */
export function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={`relative flex size-4 shrink-0 items-center justify-center rounded-[4px] transition-[background-color,box-shadow] duration-150 ${
        checked ? "bg-verdigris-on-light" : "bg-background shadow-[inset_0_0_0_1.5px_var(--color-ring)]"
      }`}
    >
      <AnimatePresence initial={false}>
        {checked && (
          <motion.span
            key="check"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.1 } }}
            transition={{ duration: 0.18, ease: EASE.snap }}
            className="flex"
          >
            <Icon src="/figma/handoff/check.svg" size={12} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
