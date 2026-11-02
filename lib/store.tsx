"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useReducer, useRef } from "react";
import {
  ALL_STEPS,
  CAUSE_ODDS,
  CAUSES,
  causeById,
  CONFIRMED_ONLY,
  RECIPIENTS,
  SEARCH_STEPS,
  TRACE_STEPS,
  clockTime,
  type Cause,
  type ChannelKey,
  type LogItem,
  type LogKey,
  type MatchTag,
  type PersonKey,
  type RangeKey,
  type SortKey,
} from "./data";
import { TIMING } from "./motion";

/* ─────────────────────────────────────────────────────────
 * Prototype state. Everything is scripted: no model, no
 * network. One reducer drives every screen of the flow, and
 * a small timer bag sequences the "AI is working" moments.
 * ───────────────────────────────────────────────────────── */

export type StepStatus = "idle" | "working" | "done";
export type Undo = { kind: "confirm"; prev: Cause["id"] | null } | { kind: "step"; key: string };
/* The drawer's extension: one cause's Simulation and/or Recommended
 * actions boxes, always in that order (actions sit below the sim). */
export type SideView = "simulate" | "actions";
export type Side = { cause: Cause["id"]; boxes: SideView[] };
const BOX_ORDER: SideView[] = ["simulate", "actions"];
export type Toast = { id: number; text: string; description?: string; undo?: Undo };
type ToastInput = Omit<Toast, "id">;
export type ChatPhase = "idle" | "asking" | "searching" | "answering" | "done";
export type Tab = "rca" | "related" | "log" | "handoff";
export type HandoffPhase = "pick" | "writing" | "ready" | "sending" | "sent";
/* null = person not picked; [] = picked, no channel yet. */
export type Picks = Record<PersonKey, ChannelKey[] | null>;
export type RelatedFilter = { tags: MatchTag[]; resolvedOnly: boolean; range: RangeKey };
export type RelatedMenu = "date" | "filter" | "sort" | null;
/* filter = applied; draft = what the open Filter popover is editing. */
export type Related = { sort: SortKey; filter: RelatedFilter; draft: RelatedFilter; menu: RelatedMenu; open: string[] };

export const NO_FILTER: RelatedFilter = { tags: [], resolvedOnly: false, range: "12m" };

export type State = {
  view: "alert" | "signals";
  drawer: "closed" | "open" | "minimized";
  tab: Tab;
  investigating: boolean;
  analysis: "idle" | "running" | "done";
  traceDone: number;
  traceFolded: boolean;
  causesShown: number;
  /* The confirmed root cause (only one at a time), and the cause
   * whose Yes is still spinning. The root keeps its place until the
   * new one lands. */
  root: Cause["id"] | null;
  confirming: Cause["id"] | null;
  ruledOut: Cause["id"][];
  side: Side | null;
  /* Thinking: the side panel shows the investigation timeline over a
   * cause's boxes (side keeps them, so Hide thinking returns to them). */
  thinking: boolean;
  /* The cause tile whose click opened Thinking (null when it was opened
   * from Show thinking or the tab bar). That tile keeps its ring. */
  thinkingFor: Cause["id"] | null;
  steps: Record<string, StepStatus>;
  dialog: { stepKey: string; submitting: boolean } | null;
  toast: Toast | null;
  chat: ChatPhase;
  /* The line the user pointed at and asked about; it is the question. */
  quote: string | null;
  searchDone: number;
  searchFolded: boolean;
  answerShown: number;
  asked: boolean;
  /* The stop each cause's what-if lever sits on. */
  simStop: Record<Cause["id"], number>;
  picks: Picks;
  handoff: HandoffPhase;
  written: number;
  related: Related;
  /* The Log plays its entrance once, the first time it opens. */
  logSeen: boolean;
  /* What this session has done, oldest first, and the Log clock
   * (one tick per event; undo removes the event, not the tick). */
  log: LogItem[];
  tick: number;
  /* The Log as it stood when the handoff was written. */
  handoffDraft: { log: LogItem[]; at: string } | null;
};

const initial: State = {
  view: "alert",
  drawer: "closed",
  tab: "rca",
  investigating: false,
  analysis: "idle",
  traceDone: 0,
  traceFolded: false,
  causesShown: 0,
  root: null,
  confirming: null,
  ruledOut: [],
  side: null,
  thinking: false,
  thinkingFor: null,
  steps: {},
  dialog: null,
  toast: null,
  chat: "idle",
  quote: null,
  searchDone: 0,
  searchFolded: false,
  answerShown: 0,
  asked: false,
  simStop: { 1: 0, 2: 0, 3: 0 },
  picks: { tech: null, lead: null },
  handoff: "pick",
  written: 0,
  related: { sort: "relevance", filter: NO_FILTER, draft: NO_FILTER, menu: null, open: [] },
  logSeen: false,
  log: [],
  tick: 0,
  handoffDraft: null,
};

export const isRoot = (s: State, id: Cause["id"]) => s.root === id;

/* Messages to write, in the order they appear: person, then channel. */
export function pickedMessages(picks: Picks) {
  return RECIPIENTS.flatMap((r) =>
    r.channels.filter((c) => picks[r.key]?.includes(c.key)).map((c) => ({ recipient: r, channel: c })),
  );
}

type Action =
  | { type: "reset" }
  | { type: "patch"; patch: Partial<State> }
  | { type: "step"; key: string; status: StepStatus }
  | { type: "toast"; toast: ToastInput }
  | { type: "dismissToast"; id: number }
  | { type: "log"; key: LogKey; cause?: Cause["id"] }
  | { type: "unlog"; keys: string[]; cause?: Cause["id"] };

let toastId = 0;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "reset":
      return initial;
    case "patch":
      return { ...state, ...action.patch };
    case "step":
      return { ...state, steps: { ...state.steps, [action.key]: action.status } };
    case "toast":
      return { ...state, toast: { id: ++toastId, ...action.toast } };
    case "dismissToast":
      return state.toast?.id === action.id ? { ...state, toast: null } : state;
    case "log":
      return { ...state, log: [...state.log, { key: action.key, time: clockTime(state.tick), cause: action.cause }], tick: state.tick + 1 };
    case "unlog":
      return {
        ...state,
        log: state.log.filter((e) => !(action.keys.includes(e.key) && (action.cause === undefined || e.cause === action.cause))),
      };
  }
}

function useTimers() {
  const bag = useRef(new Map<string, ReturnType<typeof setTimeout>[]>());
  const after = useCallback((group: string, ms: number, fn: () => void) => {
    const t = setTimeout(fn, ms);
    const list = bag.current.get(group) ?? [];
    list.push(t);
    bag.current.set(group, list);
  }, []);
  const clear = useCallback((group?: string) => {
    const groups = group ? [group] : [...bag.current.keys()];
    for (const g of groups) {
      (bag.current.get(g) ?? []).forEach(clearTimeout);
      bag.current.delete(g);
    }
  }, []);
  useEffect(() => () => clear(), [clear]);
  return { after, clear };
}

function useController() {
  const [state, dispatch] = useReducer(reducer, initial);
  const { after, clear } = useTimers();
  const ref = useRef(state);
  useLayoutEffect(() => {
    ref.current = state;
  });

  const patch = useCallback((p: Partial<State>) => dispatch({ type: "patch", patch: p }), []);
  const toast = useCallback((toast: ToastInput) => dispatch({ type: "toast", toast }), []);

  const runAnalysis = useCallback(() => {
    clear("analysis");
    const t0 = TIMING.drawerOpens;
    after("analysis", t0, () => patch({ drawer: "open", analysis: "running" }));
    TIMING.traceStep.forEach((ms, i) =>
      after("analysis", t0 + TIMING.traceAppears + ms, () => patch({ traceDone: i + 1 })),
    );
    after("analysis", t0 + TIMING.traceFolds, () => patch({ traceFolded: true }));
    CAUSES.forEach((_, i) =>
      after("analysis", t0 + TIMING.causesStart + i * TIMING.causeStagger, () => patch({ causesShown: i + 1 })),
    );
    after("analysis", t0 + TIMING.analysisDone, () => {
      patch({ analysis: "done" });
      dispatch({ type: "log", key: "analysis" });
    });
  }, [after, clear, patch]);

  const actions = useMemo(() => {
    const actions = {
      reset() {
        clear();
        dispatch({ type: "reset" });
      },
      investigate() {
        const s = ref.current;
        if (s.analysis !== "idle") {
          patch({ drawer: "open", investigating: true });
          return;
        }
        patch({ investigating: true });
        runAnalysis();
      },
      closeDrawer() {
        patch({ drawer: "closed", investigating: false });
      },
      /* Yes on a tile. Confirming another cause moves the root cause
       * to it; undo puts the previous root back. */
      confirm(id: Cause["id"]) {
        const s = ref.current;
        if (s.confirming || s.root === id || s.ruledOut.includes(id)) return;
        const prev = s.root;
        patch({ confirming: id });
        clear("confirm");
        after("confirm", TIMING.confirmSpinner, () => {
          patch({ root: id, confirming: null });
          if (prev) dispatch({ type: "unlog", keys: ["confirm"] });
          dispatch({ type: "log", key: "confirm", cause: id });
          after("confirm", 260, () =>
            toast({ text: "Root cause confirmed", description: causeById(id).headline, undo: { kind: "confirm", prev } }),
          );
        });
      },
      /* No on a tile: it folds down to its headline, with Undo beside it. */
      ruleOut(id: Cause["id"]) {
        const s = ref.current;
        if (s.ruledOut.includes(id) || s.root === id || s.confirming === id) return;
        patch({ ruledOut: [...s.ruledOut, id], side: s.side?.cause === id ? null : s.side });
        dispatch({ type: "log", key: "rule-out", cause: id });
      },
      restoreCause(id: Cause["id"]) {
        patch({ ruledOut: ref.current.ruledOut.filter((x) => x !== id) });
        dispatch({ type: "unlog", keys: ["rule-out"], cause: id });
      },
      /* Simulate and Recommend actions open the drawer's side panel,
       * each as its own box. For the cause already showing, a tile
       * button adds its box or takes it away (the last one closes the
       * panel); "show" only ever adds. Another cause starts fresh. On
       * Simulate, a beat after the panel lands the lever glides to its
       * recommended stop, so the odds visibly fall. */
      openSide(id: Cause["id"], view: SideView, mode: "toggle" | "show" = "toggle") {
        const s = ref.current;
        const same = s.side?.cause === id;
        const current = same ? s.side!.boxes : [];
        if (current.includes(view)) {
          // Under Thinking, the box is already there: bring it back.
          if (s.thinking) {
            patch({ thinking: false });
            return;
          }
          if (mode === "show") return;
          const boxes = current.filter((b) => b !== view);
          if (!boxes.length) {
            actions.closeSide();
            return;
          }
          if (view === "simulate") clear("sim");
          patch({ side: { cause: id, boxes } });
          return;
        }
        if (!same) clear("sim");
        patch({ side: { cause: id, boxes: BOX_ORDER.filter((b) => b === view || current.includes(b)) }, thinking: false });
        const { lever, preset } = CAUSE_ODDS[id];
        if (view === "simulate" && lever && s.simStop[id] === 0) {
          after("sim", s.side || s.thinking ? TIMING.simPrime : TIMING.simPrimeOpening, () =>
            patch({ simStop: { ...ref.current.simStop, [id]: preset } }),
          );
        }
      },
      closeSide() {
        clear("sim");
        patch({ side: null, thinking: false });
      },
      /* Thinking is the side panel's default: a click on any cause
       * tile (which names that tile), Show thinking, or the tab bar's
       * panel button shows it. A cause's boxes stay underneath, so
       * Hide thinking goes back to them. */
      showThinking(from?: Cause["id"]) {
        patch({ thinking: true, thinkingFor: from ?? null });
      },
      /* The side panel's Hide thinking: back to the cause's boxes if
       * there are any, otherwise the panel closes. */
      hideThinking() {
        if (ref.current.side) patch({ thinking: false });
        else actions.closeSide();
      },
      /* A source in Show thinking that is a past issue: open it in Related issues. */
      openRelatedIssue(id: string) {
        const r = ref.current.related;
        patch({ tab: "related", related: { ...r, menu: null, open: r.open.includes(id) ? r.open : [...r.open, id] } });
      },
      runStep(key: string) {
        const step = ALL_STEPS.find((s) => s.key === key);
        if (!step || ref.current.steps[key] === "working" || ref.current.steps[key] === "done") return;
        if (step.opensDialog) {
          patch({ dialog: { stepKey: key, submitting: false } });
          return;
        }
        dispatch({ type: "step", key, status: "working" });
        after("step", TIMING.actionSpinner, () => {
          dispatch({ type: "step", key, status: "done" });
          dispatch({ type: "log", key: key as LogKey });
          toast({ text: step.toast, undo: { kind: "step", key } });
        });
      },
      closeDialog() {
        patch({ dialog: null });
      },
      submitDialog() {
        const d = ref.current.dialog;
        if (!d || d.submitting) return;
        const step = ALL_STEPS.find((s) => s.key === d.stepKey);
        patch({ dialog: { ...d, submitting: true } });
        after("step", TIMING.actionSpinner, () => {
          patch({ dialog: null });
          dispatch({ type: "step", key: d.stepKey, status: "done" });
          dispatch({ type: "log", key: d.stepKey as LogKey });
          after("step", 180, () => step && toast({ text: step.toast, undo: { kind: "step", key: d.stepKey } }));
        });
      },
      undo(t: Toast) {
        dispatch({ type: "dismissToast", id: t.id });
        if (!t.undo) return;
        if (t.undo.kind === "confirm") {
          // Only the fix steps that appear after rack 14 is confirmed are
          // undone; escalation and the other causes' steps survive.
          const { prev } = t.undo;
          const steps = { ...ref.current.steps };
          if (prev !== 1) CONFIRMED_ONLY.forEach((k) => delete steps[k]);
          patch({ root: prev, steps });
          dispatch({ type: "unlog", keys: ["confirm", ...(prev === 1 ? [] : CONFIRMED_ONLY)] });
          if (prev) dispatch({ type: "log", key: "confirm", cause: prev });
        } else {
          actions.undoStep(t.undo.key);
        }
      },
      /* Undo beside a finished action (and the toast's Undo): the
       * action goes back to its button and leaves the Log. */
      undoStep(key: string) {
        if (ref.current.steps[key] !== "done") return;
        const t = ref.current.toast;
        if (t?.undo?.kind === "step" && t.undo.key === key) dispatch({ type: "dismissToast", id: t.id });
        dispatch({ type: "step", key, status: "idle" });
        dispatch({ type: "unlog", keys: [key] });
      },
      dismissToast(id: number) {
        dispatch({ type: "dismissToast", id });
      },
      openSignals() {
        patch({ view: "signals", drawer: "minimized" });
      },
      backToRootCause() {
        patch({ view: "alert", drawer: "open", tab: "rca" });
      },
      setTab(tab: Tab) {
        const s = ref.current;
        if (s.tab !== tab) patch({ tab, related: { ...s.related, menu: null }, logSeen: s.logSeen || tab === "log" });
      },
      /* Related issues: Date and Sort apply on pick; Filter edits a
       * draft that only lands on Apply. */
      openRelatedMenu(menu: RelatedMenu) {
        const r = ref.current.related;
        const next = r.menu === menu ? null : menu;
        patch({ related: { ...r, menu: next, draft: next === "filter" ? r.filter : r.draft } });
      },
      setRelatedSort(sort: SortKey) {
        patch({ related: { ...ref.current.related, sort, menu: null } });
      },
      setRelatedRange(range: RangeKey) {
        const r = ref.current.related;
        patch({ related: { ...r, filter: { ...r.filter, range }, menu: null } });
      },
      editRelatedDraft(draft: Partial<RelatedFilter>) {
        const r = ref.current.related;
        patch({ related: { ...r, draft: { ...r.draft, ...draft } } });
      },
      clearRelatedDraft() {
        patch({ related: { ...ref.current.related, draft: NO_FILTER } });
      },
      clearRelatedFilter() {
        patch({ related: { ...ref.current.related, filter: NO_FILTER, draft: NO_FILTER, menu: null } });
      },
      applyRelatedFilter() {
        const r = ref.current.related;
        patch({ related: { ...r, filter: r.draft, menu: null } });
      },
      toggleIssue(id: string) {
        const r = ref.current.related;
        patch({ related: { ...r, open: r.open.includes(id) ? r.open.filter((x) => x !== id) : [...r.open, id] } });
      },
      togglePerson(key: PersonKey) {
        const s = ref.current;
        if (s.handoff !== "pick" && s.handoff !== "ready") return;
        const on = s.picks[key] !== null;
        patch({ picks: { ...s.picks, [key]: on ? null : [] }, handoff: "pick", written: 0 });
      },
      toggleChannel(key: PersonKey, channel: ChannelKey) {
        const s = ref.current;
        const list = s.picks[key];
        if (!list || (s.handoff !== "pick" && s.handoff !== "ready")) return;
        const next = list.includes(channel) ? list.filter((c) => c !== channel) : [...list, channel];
        patch({ picks: { ...s.picks, [key]: next }, handoff: "pick", written: 0 });
      },
      generate() {
        const s = ref.current;
        const n = pickedMessages(s.picks).length;
        if (s.handoff !== "pick" || n === 0) return;
        clear("handoff");
        patch({ handoff: "writing", written: 0, handoffDraft: { log: s.log, at: clockTime(s.tick) } });
        for (let i = 0; i < n; i++) {
          after("handoff", TIMING.writeStart + i * TIMING.writeStagger, () => patch({ written: i + 1 }));
        }
        after("handoff", TIMING.writeStart + (n - 1) * TIMING.writeStagger + TIMING.writeSettle, () => patch({ handoff: "ready" }));
      },
      sendHandoff() {
        const s = ref.current;
        if (s.handoff !== "ready") return;
        patch({ handoff: "sending" });
        const names = RECIPIENTS.filter((r) => s.picks[r.key]?.length).map((r) => r.name);
        after("handoff", TIMING.actionSpinner + 180, () => {
          patch({ handoff: "sent" });
          dispatch({ type: "log", key: "handoff" });
          after("handoff", 180, () => toast({ text: `Handoff sent to ${names.join(" and ")}`, description: "Added to the Log" }));
        });
      },
      /* Point and ask: the pointed line lands in the composer as a
       * quote, then sends itself a beat later. Nobody types or
       * presses Send (Send or Enter just sends it sooner). */
      ask(quote: string) {
        const s = ref.current;
        if (s.tab !== "rca" || s.analysis !== "done" || s.chat !== "idle" || s.asked) return;
        clear("chat");
        patch({ chat: "asking", quote });
        after("chat", TIMING.askSends, () => actions.send());
      },
      send() {
        const s = ref.current;
        if (s.tab !== "rca" || s.chat !== "asking") return;
        clear("chat");
        patch({ chat: "searching", asked: true, searchDone: 0, searchFolded: false, answerShown: 0 });
        SEARCH_STEPS.forEach((_, i) => after("chat", TIMING.searchStep[i], () => patch({ searchDone: i + 1 })));
        after("chat", TIMING.searchFolds, () => patch({ searchFolded: true, chat: "answering" }));
        const blocks = 4;
        for (let i = 0; i < blocks; i++) {
          after("chat", TIMING.answerStarts + i * TIMING.answerStagger * (i === 3 ? 1.6 : 1), () =>
            patch({ answerShown: i + 1, chat: i === blocks - 1 ? "done" : "answering" }),
          );
        }
      },
      stop() {
        clear("chat");
        patch({ chat: "idle", quote: null, asked: false, searchDone: 0, searchFolded: false, answerShown: 0 });
      },
      setSimStop(id: Cause["id"], stop: number) {
        clear("sim");
        const s = ref.current.simStop;
        if (s[id] !== stop) patch({ simStop: { ...s, [id]: stop } });
      },
    };
    return actions;
  }, [after, clear, patch, runAnalysis, toast]);

  return { state, actions };
}

type Ctx = ReturnType<typeof useController>;
const PrototypeContext = createContext<Ctx | null>(null);

export function PrototypeProvider({ children }: { children: React.ReactNode }) {
  const ctl = useController();
  return <PrototypeContext.Provider value={ctl}>{children}</PrototypeContext.Provider>;
}

export function usePrototype() {
  const ctx = useContext(PrototypeContext);
  if (!ctx) throw new Error("usePrototype must be used inside PrototypeProvider");
  return ctx;
}

export const TRACE_COUNT = TRACE_STEPS.length;
