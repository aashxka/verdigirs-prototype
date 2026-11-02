"use client";

import { InlineLoader } from "generative-loaders";
import { AnimatePresence, motion } from "motion/react";
import type { Confidence, Source } from "@/lib/data";
import { DUR, EASE } from "@/lib/motion";

/* Lucide icons exported from the Figma file (stroke baked in). */
export function Icon({ src, size = 16, className = "" }: { src: string; size?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" width={size} height={size} className={`block shrink-0 ${className}`} style={{ width: size, height: size }} draggable={false} />;
}

/* Lucide panel-right-open / panel-right-close, for the side panel's
 * toggles: 20px, a step up from the 16px default so it reads at a
 * glance, with the stroke held at the 1.33px of the drawer's other
 * icons. currentColor, so the button sets muted / hover colours. */
export function PanelIcon({ open }: { open: boolean }) {
  const size = 20;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={(1.33 * 24) / size} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M15 3v18" />
      <path d={open ? "m8 9 3 3-3 3" : "m10 15-3-3 3-3"} />
    </svg>
  );
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

/* Confidence: a grey tag, the DS Badge "secondary" variant
 * (design.verdigris.co/categories/web-components/data-display):
 * rounded-md px-2 py-0.5 text-xs font-medium, bg-secondary with
 * secondary-foreground text. No icon. */
export function ConfidenceLabel({ level, label }: { level: Confidence; label?: string }) {
  return (
    <span
      data-slot="badge"
      className="inline-flex shrink-0 items-center whitespace-nowrap rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
      aria-label={label ?? `${level} confidence`}
    >
      {label ?? level}
    </span>
  );
}

/* Badge — 20px, radius 6, Medium 13 (DS caption). */
export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "teal" | "warning" | "danger" | "muted"; children: React.ReactNode }) {
  const cls = {
    neutral: "bg-secondary text-foreground-secondary",
    muted: "bg-secondary text-muted-foreground",
    teal: "bg-accent-muted text-verdigris-on-light",
    warning: "bg-warning-bg text-warning-fg",
    danger: "bg-pastel-red-subtle text-pastel-red",
  }[tone];
  return <span className={`inline-flex h-5 shrink-0 items-center whitespace-nowrap rounded-[6px] px-2 text-[13px] font-medium leading-4 ${cls}`}>{children}</span>;
}

export function Spinner({ size = 16, light = false }: { size?: number; light?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="spin shrink-0" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke={light ? "rgba(250,250,250,0.25)" : "#e4e4e7"} strokeWidth="1.6" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke={light ? "#fafafa" : "#007571"} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/* Search activity: the generative-loaders matrix, its dots tinted along
 * the Verdigris linear gradient (.vg-loader in globals.css). Decorative:
 * the text beside it names what is happening. */
export function SearchLoader({ size = 24 }: { size?: number }) {
  return <InlineLoader variant="matrix" size={size} className="vg-loader" />;
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
  ariaExpanded,
  pressed,
}: {
  kind?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  /* Toggle buttons: pressed sinks into the secondary fill. */
  pressed?: boolean;
}) {
  const cls = {
    primary: "bg-primary text-primary-foreground hover:bg-[#27272a]",
    secondary: pressed
      ? "bg-secondary text-foreground border border-[#d4d4d8] shadow-[inset_0_1px_1px_rgba(0,0,0,0.04)]"
      : "bg-background text-foreground border border-border hover:bg-secondary",
    ghost: "text-foreground-secondary hover:bg-secondary",
  }[kind];
  return (
    <motion.button
      type="button"
      whileTap={disabled || loading ? undefined : { scale: 0.97 }}
      transition={{ duration: DUR.press, ease: EASE.standard }}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled && !loading) onClick?.();
      }}
      aria-busy={loading || undefined}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-pressed={pressed}
      disabled={disabled}
      className={`relative inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-button px-3 text-[14px] font-medium leading-5 whitespace-nowrap transition-[background-color,border-color,box-shadow,opacity] duration-150 disabled:opacity-50 ${cls} ${className}`}
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
            exit={{ opacity: 0, scale: 0.6, transition: { duration: DUR.fast } }}
            transition={{ duration: DUR.normal, ease: EASE.reveal }}
            className="flex"
          >
            <Icon src="/figma/handoff/check.svg" size={12} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
