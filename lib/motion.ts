/* ─────────────────────────────────────────────────────────
 * MOTION STORYBOARD — Signals Assistant prototype
 *
 * Curves and durations are the Verdigris motion tokens:
 *   reveal-cubic  cubic-bezier(0.33, 1, 0.68, 1)   arrivals, drawer, expand
 *   ease          cubic-bezier(0.25, 0.1, 0.25, 1) hover, press, exits
 *   fast 150 · normal 200 · moderate 300 · slow 500 (ms)
 *
 * INVESTIGATE → RESULTS (ms after click)
 *     0   ring turns into a clockwise conic sweep, label → "Investigating…"
 *   800   drawer slides in from the right (300ms), page dims to 8%
 *   950   trace card fades up; steps tick off one by one
 *  3150   trace folds away (250ms)
 *  3350   three cause tiles resolve out of their skeletons (staggered
 *         260ms); each tile's signal line draws left to right (500ms)
 *  4250   analysis done: the composer wakes up
 *
 * SIMULATE / RECOMMEND ACTIONS (any tile)
 *     0   the drawer slides 600px left to make room (300ms, transform
 *         only). The tiles ride its leading edge left; the side
 *         panel arrives from the right edge, the way it will leave.
 *         The tile it belongs to takes a verdigris ring.
 *    60   side panel contents settle in (fade, 12px)
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
 *   950   Sonner toast slides in bottom right, dismisses after 4s
 *
 * NO (rule a tile out)
 *     0   the tile folds to its headline (300ms) beside Undo
 *
 * POINT AND ASK (cause 2's summary)
 *     0   pointer rests on the line: it tints (150ms)
 *   300   DS tooltip delay: "Ask" rises above the line (200ms, fade,
 *         zoom from 95%, 8px up) and follows the pointer along it
 *  Ask    tooltip leaves (150ms); the line stays tinted and lands in
 *         the composer as a quote chip, Send turns green
 *  +700   it sends itself (Send or Enter sends it sooner)
 *
 * FOLLOW-UP QUESTION (ms after it sends)
 *     0   quote bubble lands; composer reads "Searching…" beside
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

/* Verdigris motion tokens (design.verdigris.co/foundations/motion and
 * tokens/motion/*.json). The product-ui profile runs interactions at
 * duration.normal with easing.default, and entrances at duration.slow
 * with an ease-out. Only transform and opacity animate (no blur), and
 * nothing outside the drag lever runs longer than duration.slow. */
export const EASE = {
  // easing.reveal-cubic, the DS's cubic ease-out: entrances, panels, expand
  reveal: [0.33, 1, 0.68, 1] as const,
  // easing.default (CSS `ease`): hover, press, exits and rows that move
  standard: [0.25, 0.1, 0.25, 1] as const,
};

/* duration.* in seconds, then the roles this prototype uses them for. */
const D = { fast: 0.15, normal: 0.2, moderate: 0.3, slow: 0.5 };

export const DUR = {
  ...D,
  press: D.fast,
  exit: D.fast,
  routine: D.normal,
  drawer: D.moderate, // panel reveal
  drawerOut: D.normal,
  expand: D.moderate,
  collapse: D.normal,
  dialogIn: D.normal,
  dialogOut: D.fast,
  reveal: D.slow, // AI output arriving: the product-ui entrance
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
  toastLife: 4000, // Sonner default, per the DS toast page
  actionSpinner: 520,
  askTooltip: 300, // DS TooltipProvider delayDuration
  askSends: 700, // Ask → the quoted line sends itself
  searchStep: [600, 2000, 2900], // each search step finishes (after Send)
  searchFolds: 3150,
  answerStarts: 3350,
  answerStagger: 180,
  writeStart: 600, // first handoff message resolves (after Generate)
  writeStagger: 650,
  writeSettle: 450, // last message done → Send appears
};

/* Tweens for the drawer and small pops. The DS has no spring tokens,
 * so only the what-if lever, which follows the pointer and settles
 * on a stop, keeps physics. */
export const TWEEN = {
  // The drawer sliding 600px to make room for the side panel: a panel reveal
  panel: { duration: D.moderate, ease: EASE.reveal },
  // Chips and badges arriving
  pop: { duration: D.normal, ease: EASE.reveal },
};

export const SPRING = {
  // What-if: Figma smart animate spring (mass 1, stiffness 520, damping 44)
  whatIf: { type: "spring" as const, mass: 1, stiffness: 520, damping: 44 },
  // Knob follows the pointer while dragging
  drag: { type: "spring" as const, stiffness: 900, damping: 60 },
};

/* AI output arriving: a short rise and fade. */
export const resolveIn = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};
