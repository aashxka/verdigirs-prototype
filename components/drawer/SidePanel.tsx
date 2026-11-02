"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { CAUSE_ODDS, causeById, type Cause } from "@/lib/data";
import { DUR, EASE } from "@/lib/motion";
import { isRoot, usePrototype, type Side } from "@/lib/store";
import { Collapse, PanelIcon } from "../ui";
import { RecommendedSteps, causeActions } from "./Steps";
import { ThinkingPanel } from "./ThinkingPanel";
import { CauseSimulator } from "./WhatIf";

/* The drawer's extension: the drawer widens and this column arrives
 * from the right edge with one cause's boxes, Simulation and/or
 * Recommended actions. Each box is a DS Dialog surface (design.
 * verdigris.co/categories/web-components/modals): bg-background,
 * border, shared radius, shadow-lg, p-6, gap-4, a text-lg semibold
 * title over a muted text-sm description. Recommend actions under the
 * simulation opens its box below it. The column keeps showing the last
 * cause while it rides back out, and settles in each time it opens.
 * 600px fits the simulator's fixed 485px chart and lever. */
export const SIDE_W = 600;

export function SidePanel({ shown }: { shown: boolean }) {
  const { state, actions } = usePrototype();
  // What the panel holds: Show thinking, or one cause's boxes. It keeps
  // the last one while it rides out.
  const content: Side | "thinking" | null = state.thinking ? "thinking" : state.side;
  const [shownContent, setShownContent] = useState(content);
  const [epoch, setEpoch] = useState(0);
  const [wasShown, setWasShown] = useState(shown);
  if (content && contentKey(content) !== contentKey(shownContent)) setShownContent(content);
  if (shown !== wasShown) {
    setWasShown(shown);
    if (shown) setEpoch(epoch + 1);
  }
  const thinking = shownContent === "thinking";
  const held = thinking ? null : shownContent;

  const key = thinking ? `thinking-${epoch}` : held ? `${held.cause}-${epoch}` : "none";
  const scrollRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [key]);

  const cause = held ? causeById(held.cause) : null;
  // The card whose details the panel shows: its boxes, or its Thinking
  // when a click on it opened Thinking.
  const named = thinking ? (state.thinkingFor ? causeById(state.thinkingFor) : null) : cause;
  const hasSim = !!held?.boxes.includes("simulate");
  const hasActions = !!held?.boxes.includes("actions");

  // Open the actions box under the simulation, then bring it into view once it has room.
  const showActions = (id: Cause["id"]) => {
    actions.openSide(id, "actions", "show");
    setTimeout(() => {
      const sc = scrollRef.current;
      const box = actionsRef.current;
      if (sc && box) sc.scrollTo({ top: Math.max(0, box.offsetTop - 20), behavior: "smooth" });
    }, 320);
  };

  return (
    <section
      id="assistant-side-panel"
      aria-label={thinking ? "How the Assistant reached these causes" : cause ? `${cause.headline}: simulation and recommended actions` : "Side panel"}
      aria-hidden={!shown}
      inert={!shown}
      className="flex h-full shrink-0 flex-col bg-background"
      style={{ width: SIDE_W }}
    >
      {/* Header: the card it's showing, set like the tab labels beside
          it (14 medium, foreground) at the content's 24px inset, then
          the panel's one close button. */}
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-3">
        <span className="grid min-w-0 flex-1 pl-3">
          <AnimatePresence initial={false}>
            {named && (
              <motion.span
                key={named.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: DUR.fast } }}
                transition={{ duration: DUR.normal, ease: EASE.reveal }}
                className="truncate text-[14px] font-medium leading-5 text-foreground [grid-area:1/1]"
              >
                {named.headline}
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <motion.button
          type="button"
          onClick={actions.closeSide}
          whileTap={{ scale: 0.94 }}
          aria-label="Close side panel"
          title="Close (Esc)"
          className="flex size-9 shrink-0 items-center justify-center rounded-button text-muted-foreground transition-colors duration-150 hover:bg-secondary hover:text-foreground"
        >
          <PanelIcon open />
        </motion.button>
      </div>

      <div ref={scrollRef} className="scroll-quiet relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          {thinking && (
            <motion.div
              key={key}
              {...settle}
              className="w-full pt-6"
            >
              <ThinkingPanel />
            </motion.div>
          )}
          {held && (
            <motion.div
              key={key}
              {...settle}
              className="w-full pt-6"
            >
              {/* Each box sits in px-6 pb-6 inside its collapse, so the collapse's clip never cuts its shadow. */}
              <Collapse open={hasSim} inMs={300} outMs={220}>
                <div className="px-6 pb-6">
                  <Box
                    title="Simulation"
                    description={CAUSE_ODDS[held.cause].lever ? "See how a fix changes UPS-2’s failure risk." : undefined}
                  >
                    <CauseSimulator id={held.cause} />
                    <Collapse open={!hasActions} inMs={200} outMs={200}>
                      <div className="pt-6">
                        <button
                          type="button"
                          onClick={() => showActions(held.cause)}
                          className="flex h-12 w-full items-center border-t border-border pt-4 text-[14px] font-medium leading-5 text-verdigris-on-light underline-offset-4 hover:underline"
                        >
                          Recommend actions
                        </button>
                      </div>
                    </Collapse>
                  </Box>
                </div>
              </Collapse>
              <Collapse open={hasActions} inMs={300} outMs={220}>
                <div ref={actionsRef} className="px-6 pb-6">
                  <Box title="Recommended actions" description={<ActionsIntro id={held.cause} />}>
                    <RecommendedSteps cause={held.cause} />
                  </Box>
                </div>
              </Collapse>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* Contents settle in a beat behind the sheet's edge, from the side it
 * came in on, so the panel reads as arriving and then filling. */
const settle = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, transition: { duration: DUR.fast, ease: EASE.standard } },
  transition: { duration: DUR.slow, ease: EASE.reveal, delay: 0.15 },
};

const contentKey = (c: Side | "thinking" | null) => (c === null ? "" : c === "thinking" ? c : `${c.cause}:${c.boxes.join()}`);

/* DS Dialog surface: header (title + description), then the body. */
function Box({ title, description, children }: { title: string; description?: React.ReactNode; children: React.ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4 rounded-lg border border-border bg-background p-6 shadow-lg">
      <header className="flex flex-col gap-1">
        <h3 id={id} className="type-section text-foreground">
          {title}
        </h3>
        {description && <div className="type-body text-pretty text-muted-foreground">{description}</div>}
      </header>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

/* The actions box's description; it changes when rack 14 is confirmed. */
function ActionsIntro({ id }: { id: Cause["id"] }) {
  const { state } = usePrototype();
  const { intro } = causeActions(id, isRoot(state, id));
  return (
    <span className="grid">
      <AnimatePresence initial={false}>
        <motion.span
          key={intro}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: DUR.fast } }}
          transition={{ duration: DUR.normal, ease: EASE.reveal }}
          className="[grid-area:1/1]"
        >
          {intro}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
