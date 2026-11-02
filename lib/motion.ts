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
 *  3350   three cause tiles resolve out of their skeletons (staggered
 *         260ms); each tile's signal line draws left to right (900ms)
 *  4250   analysis done: the composer wakes up
 *
 * SIMULATE / RECOMMEND ACTIONS (any tile)
 *     0   the drawer widens 600 → 1200 on a critically damped spring
 *         (~420ms). The tiles ride its leading edge left; the side
 *         panel arrives from the right edge, the way it will leave.
 *         The tile it belongs to takes a verdigris ring.
 *    60   side panel contents settle in (fade, 12px, blur 4 → 0)
 *     0   Recommend actions under the simulation: its box opens below
 *         (300ms) and the panel scrolls to it
 *   560   (Simulate) the lever glides to its recommended stop; After
 *         rolls down and the projection swings toward the 15% line
 *     0   another tile: contents crossfade in place; the same tile's
 *         other button adds or removes that box (300ms)
 *     0   close (⇥, Esc, or the pressed button again): the drawer
 *         narrows and the panel rides out to the right
 *
 * YES (confirm a tile)
 *     0   Yes shows a spinner, No dims
 *   700   confidence swaps for "Root cause", the footer reads "You
 *         confirmed this", rack 14's actions turn to the fix steps
 *   950   toast rises from the footer, dismisses after 5s
 *
 * NO (rule a tile out)
 *     0   the tile folds to its headline (300ms) beside Undo
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
  analysisDone: 3500,
  confirmSpinner: 700,
  simPrime: 380, // Simulate in an open side panel → lever glides to its recommended stop
  simPrimeOpening: 560, // same, while the side panel is still widening
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
  // Drawer widening for the side panel: critically damped, no
  // overshoot (a button opened it, not a flick)
  panel: { type: "spring" as const, bounce: 0, visualDuration: 0.42 },
};

/* A reveal that resolves out of a soft blur: used for AI output. */
export const resolveIn = {
  initial: { opacity: 0, y: 6, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -4, filter: "blur(4px)" },
};
