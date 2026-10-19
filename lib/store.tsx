"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useReducer, useRef } from "react";
import {
  CAUSES,
  CONFIRMED_STEPS,
  QUESTION,
  RECIPIENTS,
  SEARCH_STEPS,
  TRACE_STEPS,
  TRIAGE_STEPS,
  type ChannelKey,
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
export type Undo = { kind: "confirm" } | { kind: "step"; key: string };
export type Toast = { id: number; text: string; undo?: Undo };
export type ChatPhase = "idle" | "typing" | "ready" | "searching" | "answering" | "done";
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
  stepsShown: boolean;
  expanded: boolean;
  reasoningOpen: boolean;
  feedback: "none" | "confirming" | "confirmed";
  steps: Record<string, StepStatus>;
  dialog: { stepKey: string; submitting: boolean } | null;
  toast: Toast | null;
  chat: ChatPhase;
  typed: number;
  searchDone: number;
  searchFolded: boolean;
  answerShown: number;
  asked: boolean;
  whatIf: { rack: number; ups: number };
  picks: Picks;
  handoff: HandoffPhase;
  written: number;
  related: Related;
  /* The Log plays its entrance once, the first time it opens. */
  logSeen: boolean;
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
  stepsShown: false,
  expanded: false,
  reasoningOpen: false,
  feedback: "none",
  steps: {},
  dialog: null,
  toast: null,
  chat: "idle",
  typed: 0,
  searchDone: 0,
  searchFolded: false,
  answerShown: 0,
  asked: false,
  whatIf: { rack: 0, ups: 0 },
  picks: { tech: null, lead: null },
  handoff: "pick",
  written: 0,
  related: { sort: "relevance", filter: NO_FILTER, draft: NO_FILTER, menu: null, open: [] },
  logSeen: false,
};

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
  | { type: "toast"; text: string; undo?: Undo }
  | { type: "dismissToast"; id: number };

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
      return { ...state, toast: { id: ++toastId, text: action.text, undo: action.undo } };
    case "dismissToast":
      return state.toast?.id === action.id ? { ...state, toast: null } : state;
  }
}

/* Natural typing cadence: a beat after spaces, longer after
 * punctuation, and a little deterministic unevenness. */
function typingDelay(char: string, i: number) {
  const jitter = ((i * 37) % 17) - 6;
  if (char === "?" || char === ".") return TIMING.typeChar + 220 + jitter;
  if (char === ",") return TIMING.typeChar + 110 + jitter;
  if (char === " ") return TIMING.typeChar + 22 + jitter;
  return TIMING.typeChar + jitter;
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
  const toast = useCallback((text: string, undo?: Undo) => dispatch({ type: "toast", text, undo }), []);

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
    after("analysis", t0 + TIMING.stepsAppear, () => patch({ stepsShown: true, analysis: "done" }));
  }, [after, clear, patch]);

  const actions = useMemo(
    () => ({
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
      toggleCause() {
        const s = ref.current;
        if (s.feedback === "confirming") return;
        patch({ expanded: !s.expanded, reasoningOpen: s.expanded ? false : s.reasoningOpen });
      },
      toggleReasoning() {
        patch({ reasoningOpen: !ref.current.reasoningOpen });
      },
      confirm() {
        if (ref.current.feedback !== "none") return;
        patch({ feedback: "confirming" });
        clear("confirm");
        after("confirm", TIMING.confirmSpinner, () => {
          patch({ feedback: "confirmed", expanded: false, reasoningOpen: false });
          after("confirm", 260, () => toast("Marked as the root cause.", { kind: "confirm" }));
        });
      },
      runStep(key: string) {
        const step = [...TRIAGE_STEPS, ...CONFIRMED_STEPS].find((s) => s.key === key);
        if (!step || ref.current.steps[key] === "working" || ref.current.steps[key] === "done") return;
        if (step.opensDialog) {
          patch({ dialog: { stepKey: key, submitting: false } });
          return;
        }
        dispatch({ type: "step", key, status: "working" });
        after("step", TIMING.actionSpinner, () => {
          dispatch({ type: "step", key, status: "done" });
          toast(step.toast, { kind: "step", key });
        });
      },
      closeDialog() {
        patch({ dialog: null });
      },
      submitDialog() {
        const d = ref.current.dialog;
        if (!d || d.submitting) return;
        const step = CONFIRMED_STEPS.find((s) => s.key === d.stepKey);
        patch({ dialog: { ...d, submitting: true } });
        after("step", TIMING.actionSpinner, () => {
          patch({ dialog: null });
          dispatch({ type: "step", key: d.stepKey, status: "done" });
          after("step", 180, () => step && toast(step.toast, { kind: "step", key: d.stepKey }));
        });
      },
      undo(t: Toast) {
        dispatch({ type: "dismissToast", id: t.id });
        if (!t.undo) return;
        if (t.undo.kind === "confirm") {
          const steps = { ...ref.current.steps };
          CONFIRMED_STEPS.forEach((s) => delete steps[s.key]);
          patch({ feedback: "none", steps });
        } else {
          dispatch({ type: "step", key: t.undo.key, status: "idle" });
        }
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
        patch({ handoff: "writing", written: 0 });
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
          after("handoff", 180, () => toast(`Handoff sent to ${names.join(" and ")}. Added to the Log.`));
        });
      },
      focusComposer() {
        const s = ref.current;
        if (s.tab !== "rca" || s.analysis !== "done" || s.chat !== "idle" || s.asked) return;
        patch({ chat: "typing", typed: 0 });
        clear("chat");
        let at = 140;
        for (let i = 0; i < QUESTION.length; i++) {
          at += typingDelay(QUESTION[i], i);
          const n = i + 1;
          after("chat", at, () => patch({ typed: n }));
        }
        after("chat", at + 40, () => patch({ chat: "ready" }));
      },
      send() {
        const s = ref.current;
        if (s.tab !== "rca") return;
        if (s.chat !== "ready" && s.chat !== "typing") return;
        clear("chat");
        patch({ chat: "searching", typed: QUESTION.length, asked: true, searchDone: 0, searchFolded: false, answerShown: 0 });
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
        patch({ chat: "idle", typed: 0, asked: false, searchDone: 0, searchFolded: false, answerShown: 0 });
      },
      setWhatIf(rack: number, ups: number) {
        const w = ref.current.whatIf;
        if (w.rack !== rack || w.ups !== ups) patch({ whatIf: { rack, ups } });
      },
    }),
    [after, clear, patch, runAnalysis, toast],
  );

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
