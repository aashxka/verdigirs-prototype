"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { causeById, type Cause } from "@/lib/data";
import { EASE } from "@/lib/motion";
import { isRoot, usePrototype, type Side } from "@/lib/store";
import { Collapse, Icon } from "../ui";
import { RecommendedSteps, causeActions } from "./Steps";
import { CauseSimulator } from "./WhatIf";

/* The drawer's extension: the drawer widens and this column arrives
 * from the right edge with one cause's boxes, Simulation and/or
 * Recommended actions, held in a faint verdigris tray (the same glow
 * the active tile wears). Recommend actions under the simulation
 * opens its box below it. The column keeps showing the last cause
 * while it rides back out, and settles in each time it opens.
 * 600px fits the simulator's fixed 485px chart and lever. */
export const SIDE_W = 600;

export function SidePanel({ shown }: { shown: boolean }) {
  const { state, actions } = usePrototype();
  const side = state.side;
  const [held, setHeld] = useState<Side | null>(side);
  const [epoch, setEpoch] = useState(0);
  const [wasShown, setWasShown] = useState(shown);
  if (side && (side.cause !== held?.cause || side.boxes.join() !== held?.boxes.join())) setHeld(side);
  if (shown !== wasShown) {
    setWasShown(shown);
    if (shown) setEpoch(epoch + 1);
  }

  const key = held ? `${held.cause}-${epoch}` : "none";
  const scrollRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [key]);

  const cause = held ? causeById(held.cause) : null;
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
      aria-label={cause ? `${cause.headline}: simulation and recommended actions` : "Side panel"}
      aria-hidden={!shown}
      inert={!shown}
      className="flex h-full shrink-0 flex-col bg-background"
      style={{ width: SIDE_W }}
    >
      <div className="flex h-12 shrink-0 items-center justify-end border-b border-border px-3">
        <motion.button
          type="button"
          onClick={actions.closeSide}
          whileTap={{ scale: 0.94 }}
          aria-label="Close side panel"
          title="Close (Esc)"
          className="flex size-8 shrink-0 items-center justify-center rounded-button transition-colors duration-150 hover:bg-secondary"
        >
          <Icon src="/figma/drawer/panel-close.svg" size={16} />
        </motion.button>
      </div>

      <div ref={scrollRef} className="scroll-quiet relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          {held && (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(3px)", transition: { duration: 0.12, ease: EASE.standard } }}
              transition={{ duration: 0.34, ease: EASE.reveal, delay: 0.06 }}
              className="w-full p-5"
            >
              {/* Tray: 16px of the active tile's glow around the boxes; corners concentric with them. */}
              <div className="flex flex-col rounded-[30px] border border-accent-muted bg-accent-subtle p-4">
                <Collapse open={hasSim} inMs={300} outMs={220}>
                  <Box title="Simulation">
                    <div className="pt-5">
                      <CauseSimulator id={held.cause} />
                    </div>
                    <Collapse open={!hasActions} inMs={200} outMs={200}>
                      <button
                        type="button"
                        onClick={() => showActions(held.cause)}
                        className="group mt-5 flex h-12 w-full items-center gap-2 border-t border-border pt-4 text-[14px] font-medium leading-5 text-verdigris-on-light"
                      >
                        Recommend actions
                        <Icon
                          src="/figma/whatif/arrow-right.svg"
                          size={14}
                          className="rotate-90 transition-transform duration-200 ease-[var(--ease-snap)] group-hover:translate-y-0.5"
                        />
                      </button>
                    </Collapse>
                  </Box>
                </Collapse>
                <Collapse open={hasActions} inMs={300} outMs={220}>
                  <div ref={actionsRef} className={`transition-[padding] duration-300 ease-[var(--ease-reveal)] ${hasSim ? "pt-4" : ""}`}>
                    <Box title="Recommended actions">
                      <ActionsBody id={held.cause} />
                    </Box>
                  </div>
                </Collapse>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* A box in the tray: white on the tray's glow, no outline. */
function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col rounded-xl bg-background p-5">
      <h3 className="text-[16px] font-semibold leading-6 text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function ActionsBody({ id }: { id: Cause["id"] }) {
  const { state } = usePrototype();
  const { intro } = causeActions(id, isRoot(state, id));
  return (
    <div className="flex flex-col pt-1">
      <div className="grid pb-4">
        <AnimatePresence initial={false}>
          <motion.p
            key={intro}
            initial={{ opacity: 0, filter: "blur(2px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(2px)", transition: { duration: 0.12 } }}
            transition={{ duration: 0.24, ease: EASE.snap }}
            className="text-pretty text-[14px] leading-5 text-muted-foreground [grid-area:1/1]"
          >
            {intro}
          </motion.p>
        </AnimatePresence>
      </div>
      <RecommendedSteps cause={id} />
      <p className="border-t border-border pt-4 text-[12px] leading-4 text-muted-foreground">Each action you take is added to the Log.</p>
    </div>
  );
}
