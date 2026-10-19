/* ─────────────────────────────────────────────────────────
 * MOTION STORYBOARD — Signals Assistant prototype
 *
 * Curves come from the Verdigris motion tokens and the Figma
 * prototype links:
 *   reveal-cubic  cubic-bezier(0.33, 1, 0.68, 1)   arrivals, drawer, expand
 *   ease          cubic-bezier(0.25, 0.1, 0.25, 1) rows that move (confirm)
 *   snap          cubic-bezier(0.23, 1, 0.32, 1)   composer state changes
 *
 * INVESTIGATE → RESULTS (ms after click)
 *     0   ring turns into a clockwise conic sweep, label → "Investigating…"
 *   800   drawer slides in from the right (300ms), page dims to 8%
 *   950   trace card fades up; steps tick off one by one
 *  3150   trace folds away (250ms)
 *  3350   likely causes resolve out of their skeletons (staggered 260ms)
 *  4250   recommended steps settle in (staggered 90ms)
 *
 * CONFIRM CAUSE #1
 *     0   Confirm shows a spinner, Rule out dims
 *   700   detail collapses (200ms), "Confirmed by you" pops in
 *   780   other causes get "Unlikely root cause" (staggered 70ms)
 *   850   steps re-rank around cause #1
 *   950   toast rises from the footer, dismisses after 5s
 *
 * FOLLOW-UP QUESTION (ms after Send)
 *     0   question bubble lands, composer turns into a stop button
 *   300   search steps tick off (Verdigris spinner while active)
 *  3200   steps fold into one summary line
 *  3400   answer streams in block by block (staggered 180ms)
 * ───────────────────────────────────────────────────────── */

export const EASE = {
  reveal: [0.33, 1, 0.68, 1] as const,
  standard: [0.25, 0.1, 0.25, 1] as const,
  snap: [0.23, 1, 0.32, 1] as const,
  out: [0.16, 1, 0.3, 1] as const,
};

export const DUR = {
  press: 0.15,
  routine: 0.2,
  drawer: 0.3,
  drawerOut: 0.2,
  expand: 0.3,
  collapse: 0.2,
  dialogIn: 0.2,
  dialogOut: 0.15,
  toastIn: 0.24,
  toastOut: 0.15,
  reveal: 0.42,
};

export const TIMING = {
  drawerOpens: 800, // 02.1 → 02.2 after-timeout in Figma
  traceAppears: 150, // after drawer starts opening
  traceStep: [380, 760, 1080, 1620, 1940, 2260], // each trace step finishes
  traceFolds: 2400,
  causesStart: 2600,
  causeStagger: 260,
  stepsAppear: 3500,
  confirmSpinner: 700,
  toastLife: 5000,
  actionSpinner: 520,
  typeChar: 26, // base ms per character when auto-typing
  searchStep: [600, 2000, 2900], // each search step finishes (after Send)
  searchFolds: 3150,
  answerStarts: 3350,
  answerStagger: 180,
};

/* Springs */
export const SPRING = {
  // What-if: Figma smart animate spring (mass 1, stiffness 520, damping 44)
  whatIf: { type: "spring" as const, mass: 1, stiffness: 520, damping: 44 },
  // Small pops: chips and badges
  pop: { type: "spring" as const, stiffness: 520, damping: 32, mass: 0.8 },
  // Knob follows the pointer while dragging
  drag: { type: "spring" as const, stiffness: 900, damping: 60 },
};

/* A reveal that resolves out of a soft blur: used for AI output. */
export const resolveIn = {
  initial: { opacity: 0, y: 6, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -4, filter: "blur(4px)" },
};
