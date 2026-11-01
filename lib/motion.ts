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
 * CONFIRM CAUSE #1  (the verdict sits after the evidence and rides
 * the bottom of the scroll while the evidence is on screen)
 *     0   Confirm shows a spinner, Rule out dims
 *   700   detail collapses (200ms), "Likely causes" → "Root cause",
 *         rank 1 turns into a check, "Confirmed by you" pops in
 *   700   the list parts: "Other possible causes" opens between the
 *         halves (300ms) as their corners round off
 *   820   the other causes' numbers roll up, 2 → 1, 3 → 2 (staggered 60ms)
 *   850   steps re-rank: fix, escalate, watch UPS-2
 *   950   toast rises from the footer, dismisses after 5s
 *
 * SIMULATE (any likely cause)
 *     0   the cause row tints and its simulator opens under the odds
 *         block (300ms), contents fade up at +60ms
 *   380   the lever glides to its recommended stop; After rolls down
 *         and the projection swings toward the 15% failure line
 *
 * FOLLOW-UP QUESTION (ms after Send)
 *     0   question bubble lands; composer reads "Searching…" beside
 *         the matrix loader, Send turns into Stop
 *   300   search steps tick off (matrix loader while active)
 *  3200   steps fold into one summary line
 *  3400   answer streams in block by block (staggered 180ms)
 *
 * RELATED ISSUES
 *     0   Date / Sort / Filter menus grow from their trigger edge (200ms)
 *         and shrink away faster (150ms)
 *     0   on a sort or filter change, kept rows slide to their new
 *         place (FLIP, 300ms) and new rows fade up (staggered 30ms)
 *     0   a row expands like a cause (300ms), body fades in at +60ms
 *
 * LOG (first open only)
 *    60   entries settle in top to bottom (staggered 40ms, 360ms)
 *  +100   each rail segment draws down to the next dot (400ms)
 *
 * HANDOFF (ms after Generate)
 *     0   message cards land with skeleton bodies, button spins
 *   600   first message resolves out of its skeleton
 *  +650   each next message, in order (person, then channel)
 *  +450   Generate turns into Send
 *  Send → 700 spinner → cards flip to "Sent", toast rises
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
  simPrime: 380, // Simulate → lever glides to its recommended stop
  toastLife: 5000,
  actionSpinner: 520,
  typeChar: 26, // base ms per character when auto-typing
  searchStep: [600, 2000, 2900], // each search step finishes (after Send)
  searchFolds: 3150,
  answerStarts: 3350,
  answerStagger: 180,
  writeStart: 600, // first handoff message resolves (after Generate)
  writeStagger: 650,
  writeSettle: 450, // last message done → Send appears
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
