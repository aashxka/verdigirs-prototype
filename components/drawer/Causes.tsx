"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useLayoutEffect, useRef } from "react";
import { ASK_CAUSE, CAUSES, CAUSE_ODDS, POWER_ON, causeById, type Cause, type CauseChart } from "@/lib/data";
import { DUR, EASE, SPRING, TWEEN } from "@/lib/motion";
import { isRoot, usePrototype } from "@/lib/store";
import { Badge, Button, Collapse, ConfidenceLabel, Icon } from "../ui";
import { AskLine } from "./AskLine";
import { OddsFigures } from "./WhatIf";

const C = "/figma/cause";

/* Before anything is confirmed, the sheet is just the likely causes.
 * The first Yes opens a Root causes tab (count in brackets) and parks
 * the rest under Likely causes, in the same segmented control. */
export function CauseSections() {
  const { state } = usePrototype();
  const roots = state.roots.map(causeById);
  const likely = CAUSES.filter((c) => !state.roots.includes(c.id));
  const rootOrder = roots.map((c) => c.id).join(",");
  const likelyOrder = likely.map((c) => c.id).join(",");
  const rootRef = useRef<HTMLDivElement>(null);
  const likelyRef = useRef<HTMLDivElement>(null);
  useTileFlip(rootRef, rootOrder, state.roots.at(-1) ?? null, true);
  useTileFlip(likelyRef, likelyOrder, null, false);
  const showRoot = state.causeView === "root" && roots.length > 0;
  const reduce = useReducedMotion();
  const slide = reduce ? { duration: 0 } : SPRING.pane;

  return (
    <div className="flex w-full flex-col">
      {roots.length > 0 && <CauseViewToggle />}
      <div className="overflow-hidden">
        <motion.div
          className="flex w-[200%] items-start"
          initial={false}
          animate={{ x: showRoot ? "0%" : "-50%" }}
          transition={slide}
        >
          <div ref={rootRef} className="flex w-1/2 flex-col" inert={!showRoot} aria-hidden={!showRoot}>
            {roots.map((cause, pos) => (
              <div key={cause.id} data-flip={cause.id} className={pos < roots.length - 1 ? "pb-4" : ""}>
                <CauseSlot cause={cause} i={CAUSES.indexOf(cause)} rank={pos + 1} />
              </div>
            ))}
          </div>
          <div ref={likelyRef} className="flex w-1/2 flex-col" inert={showRoot} aria-hidden={showRoot}>
            {likely.map((cause, pos) => (
              <div key={cause.id} data-flip={cause.id} className={pos < likely.length - 1 ? "pb-4" : ""}>
                <CauseSlot cause={cause} i={CAUSES.indexOf(cause)} rank={pos + 1} />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      <span className="sr-only" aria-live="polite">
        {roots.length === 0 ? "No root causes confirmed." : `${roots.length} root ${roots.length === 1 ? "cause" : "causes"} confirmed.`}
      </span>
    </div>
  );
}

/* Same segmented control as Phase A / B / C. Hidden until the first
 * confirmation, then Root causes leads and Likely causes follows.
 * Each name carries its count in brackets. */
function CauseViewToggle() {
  const { state, actions } = usePrototype();
  const reduce = useReducedMotion();
  const views = [
    { id: "root" as const, label: "Root causes", count: state.roots.length },
    { id: "likely" as const, label: "Likely causes", count: CAUSES.length - state.roots.length },
  ];
  const activeIndex = state.causeView === "likely" ? 1 : 0;
  return (
    <div className="relative mb-5 flex w-full items-center rounded-lg bg-secondary p-1" role="tablist" aria-label="Cause lists">
      <motion.span
        aria-hidden
        className="absolute bottom-1 top-1 rounded-button bg-background shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.1)]"
        initial={false}
        animate={{ left: `calc(${activeIndex * 50}% + 4px)`, width: "calc(50% - 8px)" }}
        transition={reduce ? { duration: 0 } : SPRING.pane}
      />
      {views.map(({ id, label, count }) => {
        const active = state.causeView === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => actions.setCauseView(id)}
            className={`relative z-[1] flex h-[33px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-button text-[14px] font-medium leading-[21px] tracking-[-0.15px] transition-colors duration-150 ${
              active ? "text-foreground" : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            <span className="truncate">{label}</span>
            <span className={`tabular ${active ? "text-foreground-tertiary" : "text-subtle-foreground"}`}>({count})</span>
          </button>
        );
      })}
    </div>
  );
}

/* FLIP for a reorder. Positions are taken after every commit, so on
 * the commit that moves a tile, it slides from where it last sat.
 * offsetTop is layout px, so this stays right inside the scaled stage.
 * A cause that just became a root cause is scrolled into view. */
function useTileFlip(list: React.RefObject<HTMLDivElement | null>, order: string, focusId: Cause["id"] | null, scrollToNew: boolean) {
  const last = useRef<{ order: string; tops: Map<string, number> } | null>(null);
  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    const tiles = [...el.querySelectorAll<HTMLElement>("[data-flip]")];
    const prev = last.current;
    last.current = { order, tops: new Map(tiles.map((n) => [n.dataset.flip!, n.offsetTop])) };
    if (!prev || prev.order === order || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const easing = `cubic-bezier(${EASE.reveal.join(",")})`;
    for (const n of tiles) {
      const dy = (prev.tops.get(n.dataset.flip!) ?? n.offsetTop) - n.offsetTop;
      if (dy) n.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: DUR.slow * 1000, easing });
    }
    if (scrollToNew && focusId && !prev.order.split(",").includes(String(focusId))) {
      const sc = el.closest<HTMLElement>(".scroll-quiet");
      const tile = el.querySelector<HTMLElement>(`[data-flip="${focusId}"]`);
      if (sc && tile) {
        const top = tile.offsetTop + el.offsetTop - 16;
        if (sc.scrollTop > top) sc.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      }
    }
  });
}

function CauseSlot({ cause, i, rank }: { cause: Cause; i: number; rank: number }) {
  const { state } = usePrototype();
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {state.causesShown > i ? (
        <motion.div key="tile" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DUR.reveal, ease: EASE.reveal }}>
          <CauseTile cause={cause} rank={rank} />
        </motion.div>
      ) : (
        <motion.div key="skeleton" exit={{ opacity: 0, transition: { duration: DUR.fast } }}>
          <TileSkeleton />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CauseTile({ cause, rank }: { cause: Cause; rank: number }) {
  const { state, actions } = usePrototype();
  const ruledOut = state.ruledOut.includes(cause.id);
  const root = isRoot(state, cause.id);
  // The ring follows whatever the side panel shows for this tile: its
  // Thinking (when a click on it opened Thinking) or its own boxes.
  const rca = state.tab === "rca";
  const thinkingHere = rca && state.thinking && state.thinkingFor === cause.id;
  const boxesHere = rca && !state.thinking && state.side?.cause === cause.id;
  const active = thinkingHere || boxesHere;
  const boxes = boxesHere ? state.side!.boxes : [];

  // A click anywhere on the tile but its own controls opens Thinking in
  // the side panel. Keyboard users reach it from the tab bar's toggle.
  const onTileClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, a, input, [role=button]")) return;
    actions.showThinking(cause.id);
  };

  return (
    <article
      id={`cause-${cause.id}`}
      aria-label={cause.headline}
      onClick={onTileClick}
      className={`cursor-pointer overflow-clip rounded-lg border transition-[border-color,box-shadow,background-color] duration-200 ease-[var(--ease-reveal)] ${
        active
          ? "border-accent-border bg-background shadow-accent-glow"
          : ruledOut
            ? "border-border bg-surface-subtle hover:border-[#d4d4d8]"
            : "border-border bg-background shadow-xs hover:border-[#d4d4d8]"
      }`}
    >
      <header className={`flex items-start gap-3 px-6 transition-[padding] duration-300 ease-[var(--ease-reveal)] ${ruledOut ? "py-4" : "pb-2 pt-6"}`}>
        <span className="flex h-7 shrink-0 items-center">
          <RankBadge n={rank} root={root} />
        </span>
        <h3 className={`type-section min-w-0 flex-1 text-pretty transition-colors duration-200 ${ruledOut ? "text-muted-foreground" : "text-foreground"}`}>
          {cause.headline}
        </h3>
        <span className="relative flex h-7 shrink-0 items-center">
          <AnimatePresence mode="popLayout" initial={false}>
            {ruledOut ? (
              <motion.span key="ruled" {...swap} className="flex items-center gap-3 text-[14px] leading-5">
                <span className="text-muted-foreground">Ruled out</span>
                <button type="button" onClick={() => actions.restoreCause(cause.id)} className="font-medium text-verdigris-on-light underline-offset-4 hover:underline">
                  Undo
                </button>
              </motion.span>
            ) : root ? (
              <motion.span
                key="root"
                className="flex"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: DUR.fast } }}
                transition={{ ...TWEEN.pop, delay: 0.06 }}
                style={{ transformOrigin: "right center" }}
              >
                <Badge tone="teal">Root cause</Badge>
              </motion.span>
            ) : (
              <motion.span key="confidence" {...swap} className="flex">
                <ConfidenceLabel level={cause.confidence} label={cause.confidence === "High" ? "Most likely" : undefined} />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </header>

      <Collapse open={!ruledOut} inMs={300} outMs={240}>
        <div className="flex flex-col px-6 pb-6">
          <p className="type-body text-pretty text-foreground-tertiary">{cause.id === ASK_CAUSE ? <AskLine text={cause.summary} /> : cause.summary}</p>

          {/* The odds, the risk line, the chart, then the actions. A
              hairline above and below — no box, no radius — so the
              evidence reads as part of the tile rather than a card
              nested inside it. */}
          <section aria-label="UPS-2 failure risk" className="mt-6 flex flex-col gap-6 border-y border-border py-6 text-foreground">
            <div className="grid gap-2">
              <div className="font-semibold leading-none">
                <OddsFigures id={cause.id} size="lg" />
              </div>
              <p className="truncate text-sm text-muted-foreground" title={CAUSE_ODDS[cause.id].line}>
                {CAUSE_ODDS[cause.id].line}
              </p>
            </div>
            <TileChart chart={cause.chart} />
            <div className="flex items-center gap-2">
              <Button pressed={boxes.includes("simulate")} onClick={() => actions.openSide(cause.id, "simulate")}>
                Simulate
              </Button>
              <Button pressed={boxes.includes("actions")} onClick={() => actions.openSide(cause.id, "actions")}>
                Recommend actions
              </Button>
            </div>
          </section>

          <Verdict id={cause.id} />
        </div>
      </Collapse>
    </article>
  );
}

/* A cause's number in its list, or a check once it's a root cause.
 * The digit rolls when it changes. Both states are held 24 wide so
 * headlines line up from tile to tile. */
function RankBadge({ n, root }: { n: number; root: boolean }) {
  return (
    <span
      data-slot="badge"
      className={`relative inline-flex h-5 min-w-6 shrink-0 items-center justify-center overflow-hidden rounded-md py-0.5 text-[13px] font-medium leading-4 tabular-nums transition-colors duration-200 ${
        root ? "bg-primary px-1.5 text-primary-foreground" : "bg-secondary px-2 text-secondary-foreground"
      }`}
      aria-label={root ? "Root cause" : `Number ${n}`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={root ? "check" : n}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: DUR.moderate, ease: EASE.reveal }}
          className="flex"
          aria-hidden
        >
          {root ? <Icon src="/figma/handoff/check.svg" size={12} /> : n}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

const swap = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: DUR.fast } },
  transition: { duration: DUR.normal, ease: EASE.reveal },
};

function Verdict({ id }: { id: Cause["id"] }) {
  const { state, actions } = usePrototype();
  const confirming = state.confirming === id;
  const busy = state.confirming !== null;
  const root = isRoot(state, id);
  return (
    <div className="relative mt-6 flex border-t border-border pt-4">
      <AnimatePresence mode="popLayout" initial={false}>
        {root ? (
          <motion.span key="done" {...swap} className="flex h-8 flex-1 items-center gap-3 text-[14px] leading-5">
            <span className="flex min-w-0 flex-1 items-center gap-2 font-medium text-foreground">
              <Icon src={`${C}/circle-check.svg`} size={16} />
              <span className="truncate">You confirmed this as a root cause.</span>
            </span>
            <button type="button" onClick={() => actions.undoRoot(id)} className="shrink-0 font-medium text-verdigris-on-light underline-offset-4 hover:underline">
              Undo
            </button>
          </motion.span>
        ) : (
          <motion.span key="ask" {...swap} className="flex h-8 flex-1 items-center gap-2">
            <span className="flex-1 text-[14px] font-medium leading-5 text-foreground">Is this the cause?</span>
            <Button kind="primary" className="min-w-[52px]" loading={confirming} disabled={busy && !confirming} onClick={() => actions.confirm(id)}>
              Yes
            </Button>
            <Button kind="primary" className="min-w-[52px]" disabled={busy} onClick={() => actions.ruleOut(id)}>
              No
            </Button>
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

const CW = 500;
const PH = 88;
const TOP = 22;

function TileChart({ chart }: { chart: CauseChart }) {
  const gid = useId();
  const [d0, d1] = chart.domain;
  const x = (m: number) => (m / 120) * CW;
  const y = (v: number) => PH - ((v - d0) / (d1 - d0)) * PH;
  const line = chart.points.map(([m, v], i) => `${i ? "L" : "M"}${x(m).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${CW} ${PH} L0 ${PH} Z`;
  const yLim = y(chart.limit.value);
  const yEnd = y(chart.points[chart.points.length - 1][1]);
  const labelBelow = yEnd < yLim && yLim - yEnd < 28;
  const mx = x(POWER_ON.at);

  return (
    <figure className="relative h-[134px] w-full" aria-label={`${chart.label}, 11:30 to 13:30, ${chart.limit.label.toLowerCase()} dashed`}>
      <svg className="absolute left-0 overflow-visible" style={{ top: TOP }} width={CW} height={PH} viewBox={`0 0 ${CW} ${PH}`} aria-hidden>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0fc8c3" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#0fc8c3" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" x2={CW} y1={PH - 0.5} y2={PH - 0.5} stroke="var(--color-border)" />
        <motion.path d={area} fill={`url(#${gid})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: DUR.draw, ease: EASE.reveal, delay: 0.45 }} />
        <line x1="0" x2={CW} y1={yLim} y2={yLim} stroke="var(--color-pastel-red)" strokeWidth="1" strokeDasharray="3 3" />
        <motion.path
          d={line}
          fill="none"
          stroke="var(--color-verdigris-on-light)"
          strokeWidth="1.75"
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: DUR.draw, ease: EASE.reveal, delay: 0.2 }}
        />
      </svg>
      <span className="absolute w-px bg-neutral-500/70" style={{ left: mx, top: 4, height: TOP - 4 + PH }} aria-hidden />
      <span className="absolute top-0 whitespace-nowrap text-[13px] font-medium leading-4 text-foreground-secondary" style={{ left: mx + 6 }}>
        {POWER_ON.label}
      </span>
      <span className="absolute right-0 text-[13px] font-medium leading-4 text-destructive" style={{ top: labelBelow ? TOP + yLim + 4 : TOP + yLim - 19 }}>
        {chart.limit.label}
      </span>
      <span className="absolute left-0 font-mono text-[13px] leading-4 text-subtle-foreground tabular-nums" style={{ top: TOP + PH + 8 }}>
        11:30
      </span>
      <span className="absolute right-0 font-mono text-[13px] leading-4 text-subtle-foreground tabular-nums" style={{ top: TOP + PH + 8 }}>
        13:30
      </span>
    </figure>
  );
}

function TileSkeleton() {
  return (
    <div className="flex flex-col rounded-lg border border-border bg-background shadow-xs" aria-hidden>
      <div className="flex items-center gap-3 px-6 pb-2 pt-6">
        <span className="shimmer h-5 w-6 shrink-0 rounded-md" />
        <span className="flex h-7 flex-1 items-center">
          <span className="shimmer h-4 w-[58%] rounded-[4px]" />
        </span>
        <span className="shimmer h-3 w-16 rounded-[4px]" />
      </div>
      <div className="flex flex-col px-6 pb-6">
        <span className="flex h-11 flex-col justify-center gap-3">
          <span className="shimmer h-2.5 w-[86%] rounded-[4px]" />
          <span className="shimmer h-2.5 w-[52%] rounded-[4px]" />
        </span>
        <span className="shimmer mt-6 h-[280px]" />
        <span className="mt-6 flex border-t border-border pt-4">
          <span className="flex h-8 flex-1 items-center">
            <span className="shimmer h-3 w-28 rounded-[4px]" />
          </span>
        </span>
      </div>
    </div>
  );
}

export function CauseRank({ id }: { id: Cause["id"] }) {
  const { state } = usePrototype();
  return <RankBadge n={id} root={isRoot(state, id)} />;
}
