"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  RELATED_FILTER_TAGS,
  RELATED_ISSUES,
  RELATED_RANGES,
  RELATED_SORTS,
  formatIssueDate,
  type IssueStatus,
  type MatchTag,
  type RelatedIssue,
  type SortKey,
} from "@/lib/data";
import { DUR, EASE } from "@/lib/motion";
import { usePrototype, type RelatedFilter } from "@/lib/store";
import { Badge, Button, Checkbox, Collapse, Icon } from "../ui";

/* Related issues tab (02 · Related issues, 03.2–03.5). Past issues
 * connected to this alert, each tagged with why it's related.
 * Date and Sort apply on pick; Filter applies on Apply. */
export function RelatedPanel() {
  const { state, actions } = usePrototype();
  const { sort, filter, menu } = state.related;
  const groups = arrange(RELATED_ISSUES.filter((i) => matches(i, filter)), sort);
  const count = groups.reduce((n, g) => n + g.issues.length, 0);
  const active = filter.tags.length > 0 || filter.resolvedOnly;
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const capture = useFlip(cardRef, groups.map((g) => `${g.label}:${g.issues.map((i) => i.id).join(",")}`).join("|"));

  // A menu closes on Escape or a click anywhere outside the toolbar.
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) actions.openRelatedMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") actions.openRelatedMenu(null);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu, actions]);

  const range = RELATED_RANGES.find((r) => r.key === filter.range)!;
  const sortLabel = RELATED_SORTS.find((s) => s.key === sort)!.label;

  return (
    <div className="flex w-full flex-col gap-3">
      <div ref={rootRef} className="flex items-center gap-2">
        <p className="min-w-0 flex-1 text-[14px] font-semibold leading-5 text-foreground" aria-live="polite">
          {count} related {count === 1 ? "issue" : "issues"}
        </p>

        <div className="relative">
          <Trigger label="Date:" value={range.label} open={menu === "date"} onClick={() => actions.openRelatedMenu("date")} />
          <AnimatePresence>
            {menu === "date" && (
              <Menu label="Date range" align="left" width={200}>
                {RELATED_RANGES.map((r) => (
                  <MenuItem
                    key={r.key}
                    label={r.label}
                    selected={r.key === filter.range}
                    onSelect={() => {
                      capture();
                      actions.setRelatedRange(r.key);
                    }}
                  />
                ))}
              </Menu>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <motion.button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={menu === "filter"}
            aria-label={active ? `Filter, ${filter.tags.length + (filter.resolvedOnly ? 1 : 0)} active` : "Filter"}
            onClick={() => actions.openRelatedMenu("filter")}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: DUR.press, ease: EASE.out }}
            className={`flex h-[34px] items-center rounded-button border px-3 text-[14px] font-medium leading-5 text-foreground transition-colors duration-150 ${
              active ? "border-verdigris-on-light bg-accent-subtle" : "border-border bg-background hover:bg-surface-subtle"
            } ${menu === "filter" && !active ? "bg-surface-subtle" : ""}`}
          >
            Filter
          </motion.button>
          <AnimatePresence>
            {menu === "filter" && (
              <FilterPopover
                onApply={() => {
                  capture();
                  actions.applyRelatedFilter();
                }}
              />
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <Trigger label="Sort:" value={sortLabel} open={menu === "sort"} onClick={() => actions.openRelatedMenu("sort")} />
          <AnimatePresence>
            {menu === "sort" && (
              <Menu label="Sort by" align="right" width={230}>
                {RELATED_SORTS.map((s) => (
                  <MenuItem
                    key={s.key}
                    label={s.label}
                    detail={s.detail}
                    selected={s.key === sort}
                    onSelect={() => {
                      capture();
                      actions.setRelatedSort(s.key);
                    }}
                  />
                ))}
              </Menu>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div ref={cardRef} className="relative w-full overflow-hidden rounded-lg border border-border bg-background">
        {count === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <p className="text-[14px] leading-5 text-muted-foreground">No related issues match these filters.</p>
            <Button
              kind="secondary"
              onClick={() => {
                capture();
                actions.clearRelatedFilter();
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          groups.map((g, gi) => (
            <div key={g.label ?? "all"} className="contents">
              {g.label && (
                <div data-flip={`group:${g.label}`} className="flex items-center gap-2 border-b border-border bg-surface-subtle px-4 py-2">
                  <span className="flex-1 font-mono text-[12px] leading-4 text-foreground-tertiary">{g.label}</span>
                  <span className="font-mono text-[12px] leading-4 text-muted-foreground tabular">{g.issues.length}</span>
                </div>
              )}
              {g.issues.map((issue, i) => (
                <IssueRow key={issue.id} issue={issue} last={gi === groups.length - 1 && i === g.issues.length - 1} />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function matches(issue: RelatedIssue, f: RelatedFilter) {
  const since = RELATED_RANGES.find((r) => r.key === f.range)!.since;
  if (issue.date < since) return false;
  if (f.tags.length > 0 && !issue.tags.some((t) => f.tags.includes(t))) return false;
  if (f.resolvedOnly && issue.status !== "Resolved") return false;
  return true;
}

/* Relevance keeps the source order; Date is newest first (ties stay
 * in relevance order); Equipment groups by panel or UPS, groups in
 * order of their best match. */
function arrange(issues: RelatedIssue[], sort: SortKey): { label: string | null; issues: RelatedIssue[] }[] {
  if (sort === "date") return [{ label: null, issues: [...issues].sort((a, b) => b.date.localeCompare(a.date)) }];
  if (sort === "relevance") return [{ label: null, issues }];
  const groups = new Map<string, RelatedIssue[]>();
  for (const i of issues) groups.set(i.equipment, [...(groups.get(i.equipment) ?? []), i]);
  return [...groups].map(([label, list]) => ({ label, issues: list }));
}

/* FLIP for reorders. capture() records where rows sit before a sort
 * or filter change; when the arrangement changes, rows slide from
 * there to their new place and new rows fade in. offsetTop is
 * layout px, so this stays correct inside the scaled stage. */
function useFlip(container: React.RefObject<HTMLDivElement | null>, arrangement: string) {
  const first = useRef<{ tops: Map<string, number>; height: number } | null>(null);
  const capture = () => {
    const el = container.current;
    if (!el) return;
    const tops = new Map<string, number>();
    el.querySelectorAll<HTMLElement>("[data-flip]").forEach((n) => tops.set(n.dataset.flip!, n.offsetTop));
    first.current = { tops, height: el.offsetHeight };
  };

  useLayoutEffect(() => {
    const snap = first.current;
    first.current = null;
    const el = container.current;
    if (!snap || !el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const easing = `cubic-bezier(${EASE.reveal.join(",")})`;
    const height = el.offsetHeight;
    if (height !== snap.height) el.animate([{ height: `${snap.height}px` }, { height: `${height}px` }], { duration: 300, easing });
    let entering = 0;
    el.querySelectorAll<HTMLElement>("[data-flip]").forEach((n) => {
      const before = snap.tops.get(n.dataset.flip!);
      if (before === undefined) {
        n.animate(
          [
            { opacity: 0, transform: "translateY(4px)", filter: "blur(4px)" },
            { opacity: 1, transform: "none", filter: "none" },
          ],
          { duration: 260, easing, delay: 80 + entering++ * 30, fill: "backwards" },
        );
        return;
      }
      const dy = before - n.offsetTop;
      if (dy) n.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 300, easing });
    });
  }, [arrangement, container]);

  return capture;
}

/* DS: Related issue row (1268:2114). Default / Hover / Expanded;
 * expanded shows how the issue was resolved. */
function IssueRow({ issue, last }: { issue: RelatedIssue; last: boolean }) {
  const { state, actions } = usePrototype();
  const open = state.related.open.includes(issue.id);
  return (
    <div
      data-flip={issue.id}
      className={`relative transition-colors duration-200 ${open ? "bg-surface-subtle" : "bg-background hover:bg-surface-subtle"} ${
        last ? "" : "border-b border-border"
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => actions.toggleIssue(issue.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            actions.toggleIssue(issue.id);
          }
        }}
        className="flex cursor-pointer items-start gap-3 p-4"
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-col gap-1">
            <span className="text-[14px] font-medium leading-5 text-foreground">{issue.title}</span>
            <span className="font-mono text-[12px] leading-4 text-foreground-tertiary">
              {formatIssueDate(issue.date)} {issue.equipment}
              {issue.ref && ` · ${issue.ref}`}
            </span>
          </div>
          <div className="mt-3 flex items-start justify-between gap-3">
            <span className="flex flex-wrap gap-2">
              {issue.tags.map((t) => (
                <Badge key={t} tone="muted">
                  {t}
                </Badge>
              ))}
            </span>
            <StatusChip status={issue.status} />
          </div>
          <Collapse open={open} inMs={300} outMs={200}>
            <motion.div
              initial={false}
              animate={{ opacity: open ? 1 : 0, y: open ? 0 : -4 }}
              transition={{ duration: open ? 0.26 : 0.12, ease: EASE.reveal, delay: open ? 0.06 : 0 }}
              className="flex flex-col gap-1 pt-4"
            >
              <span className="text-[12px] font-medium leading-4 text-muted-foreground">
                {issue.status === "Resolved" ? "How it was resolved" : "Where it stands"}
              </span>
              <p className="text-[14px] leading-5 text-foreground-secondary">{issue.resolution}</p>
            </motion.div>
          </Collapse>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: open ? DUR.expand : DUR.collapse, ease: EASE.reveal }}
          className="flex"
        >
          <Icon src="/figma/drawer/chevron.svg" size={16} />
        </motion.span>
      </div>
    </div>
  );
}

/* DS: Issue status (1268:2024). The DS only has Resolved; In progress
 * borrows the warning tone. */
function StatusChip({ status }: { status: IssueStatus }) {
  const resolved = status === "Resolved";
  return (
    <span
      className={`inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded-[6px] pl-1.5 pr-2 text-[12px] font-medium leading-4 ${
        resolved ? "bg-accent-muted text-verdigris-on-light" : "bg-warning-bg text-warning-fg"
      }`}
    >
      {resolved ? <Icon src="/figma/chat/resolved-dot.svg" size={6} /> : <span className="size-1.5 rounded-full bg-warning-fg" aria-hidden />}
      {status}
    </span>
  );
}

/* DS: Dropdown trigger — "Label: Value ⌄". */
function Trigger({ label, value, open, onClick }: { label: string; value: string; open: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: DUR.press, ease: EASE.out }}
      className={`flex h-[34px] items-center gap-1.5 rounded-md border border-border px-2.5 text-[14px] leading-5 transition-colors duration-150 ${
        open ? "bg-surface-subtle" : "bg-background hover:bg-surface-subtle"
      }`}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
      <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: DUR.routine, ease: EASE.reveal }} className="flex">
        <Icon src="/figma/related/chevron-down-14.svg" size={14} />
      </motion.span>
    </motion.button>
  );
}

/* Menus and the filter popover grow from the edge they hang off. */
const surface = {
  initial: { opacity: 0, scale: 0.97, y: -4 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: DUR.routine, ease: EASE.reveal } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: DUR.dialogOut, ease: EASE.standard } },
};

function Menu({ label, align, width, children }: { label: string; align: "left" | "right"; width: number; children: React.ReactNode }) {
  return (
    <motion.div
      role="menu"
      aria-label={label}
      {...surface}
      style={{ width, transformOrigin: align === "right" ? "top right" : "top left" }}
      className={`absolute top-[calc(100%+6px)] z-30 flex flex-col gap-0.5 rounded-md border border-border bg-background p-1 shadow-menu ${
        align === "right" ? "right-0" : "left-0"
      }`}
    >
      {children}
    </motion.div>
  );
}

/* DS: Menu item — check, label, optional detail. */
function MenuItem({ label, detail, selected, onSelect }: { label: string; detail?: string; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      onClick={onSelect}
      className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left transition-colors duration-150 hover:bg-secondary"
    >
      <span className="flex size-3.5 shrink-0" aria-hidden>
        {selected && <Icon src="/figma/related/check.svg" size={14} />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 whitespace-nowrap">
        <span className={`text-[14px] font-medium leading-5 ${selected ? "text-foreground" : "text-foreground-secondary"}`}>{label}</span>
        {detail && <span className="text-[12px] leading-4 text-muted-foreground">{detail}</span>}
      </span>
    </button>
  );
}

/* 03.5 Filter popover: why related, status, time range. Counts are
 * live for the time range being edited. */
function FilterPopover({ onApply }: { onApply: () => void }) {
  const { state, actions } = usePrototype();
  const { draft } = state.related;
  const [rangeOpen, setRangeOpen] = useState(false);
  const since = RELATED_RANGES.find((r) => r.key === draft.range)!.since;
  const inRange = RELATED_ISSUES.filter((i) => i.date >= since);

  const toggleTag = (tag: MatchTag) =>
    actions.editRelatedDraft({ tags: draft.tags.includes(tag) ? draft.tags.filter((t) => t !== tag) : [...draft.tags, tag] });

  return (
    <motion.div
      role="dialog"
      aria-label="Filter related issues"
      {...surface}
      style={{ transformOrigin: "top right" }}
      className="absolute right-0 top-[calc(100%+6px)] z-30 flex w-[280px] flex-col gap-2.5 rounded-lg border border-border bg-background px-4 py-3.5 shadow-menu"
    >
      <p className="text-[14px] font-medium leading-[17px] text-foreground-secondary">Why related</p>
      {RELATED_FILTER_TAGS.map((tag) => (
        <CheckRow
          key={tag}
          label={tag}
          count={inRange.filter((i) => i.tags.includes(tag)).length}
          checked={draft.tags.includes(tag)}
          onToggle={() => toggleTag(tag)}
        />
      ))}
      <p className="text-[14px] font-medium leading-[17px] text-foreground-secondary">Status</p>
      <CheckRow
        label="Resolved only"
        count={inRange.filter((i) => i.status === "Resolved").length}
        checked={draft.resolvedOnly}
        onToggle={() => actions.editRelatedDraft({ resolvedOnly: !draft.resolvedOnly })}
      />
      <div className="relative flex flex-col gap-1.5">
        <span id="time-range" className="text-[14px] font-medium leading-5 text-foreground-secondary">
          Time range
        </span>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={rangeOpen}
          aria-labelledby="time-range"
          onClick={() => setRangeOpen(!rangeOpen)}
          className="flex h-[38px] w-full items-center gap-2 rounded-md border border-border bg-background px-3 text-left transition-colors duration-150 hover:border-[#d4d4d8]"
        >
          <span className="flex-1 text-[14px] leading-5 text-foreground">{RELATED_RANGES.find((r) => r.key === draft.range)!.label}</span>
          <motion.span animate={{ rotate: rangeOpen ? 180 : 0 }} transition={{ duration: DUR.routine, ease: EASE.reveal }} className="flex">
            <Icon src="/figma/drawer/chevron.svg" size={16} />
          </motion.span>
        </button>
        <AnimatePresence>
          {rangeOpen && (
            <motion.div
              role="listbox"
              aria-labelledby="time-range"
              {...surface}
              style={{ transformOrigin: "top center" }}
              className="absolute inset-x-0 top-[calc(100%+4px)] z-10 flex flex-col gap-0.5 rounded-md border border-border bg-background p-1 shadow-menu"
            >
              {RELATED_RANGES.map((r) => (
                <MenuItem
                  key={r.key}
                  label={r.label}
                  selected={r.key === draft.range}
                  onSelect={() => {
                    actions.editRelatedDraft({ range: r.key });
                    setRangeOpen(false);
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex justify-end gap-2">
        <Button kind="ghost" onClick={actions.clearRelatedDraft}>
          Clear
        </Button>
        <Button kind="primary" onClick={onApply}>
          Apply
        </Button>
      </div>
    </motion.div>
  );
}

/* DS: Checkbox row — box, label, count. */
function CheckRow({ label, count, checked, onToggle }: { label: string; count: number; checked: boolean; onToggle: () => void }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} onClick={onToggle} className="flex w-full items-center gap-2.5 py-1 text-left">
      <Checkbox checked={checked} />
      <span className="flex-1 text-[14px] leading-5 text-foreground">{label}</span>
      <span className="font-mono text-[12px] leading-4 text-muted-foreground tabular">{count}</span>
    </button>
  );
}
