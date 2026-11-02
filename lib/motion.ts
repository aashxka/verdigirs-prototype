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
 *   900   drawer slides in from the right on the sheet spring (lands
 *         ~500ms), page dims to 8%
 *  1150   trace card fades up as the drawer lands; steps tick off
 *         one by one, ~0.5–0.8s each
 *  4350   "Investigation complete" holds, then the trace folds (340ms)
 *  4550   three cause tiles resolve out of their skeletons (staggered
 *         380ms); each tile's signal line draws left to right (700ms)
 *  6100   analysis done: the composer wakes up
 *
 * SIMULATE / RECOMMEND ACTIONS / THINKING (any tile)
 *     0   the drawer slides 600px left to make room (sheet spring,
 *         ~500ms, transform only). The tiles ride its leading edge
 *         left; the side panel arrives from the right edge, the way
 *         it will leave. The tile it belongs to takes a verdigris ring.
 *   150   side panel contents settle in behind the edge (fade, 16px, 500ms)
 *     0   Recommend actions under the simulation: its box opens below
 *         (300ms) and the panel scrolls to it
 *   760   (Simulate) the lever glides to its recommended stop; After
 *         rolls down and the projection swings toward the 15% line
 *     0   another tile: contents crossfade in place; the same tile's
 *         other button adds or removes that box (300ms)
 *     0   close (⇥, Esc, or the pressed button again): the drawer
 *         narrows and the panel rides out to the right. Both ways are
 *         one spring, so a reversal mid-flight carries its velocity.
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
 *  +900   it sends itself (Send or Enter sends it sooner)
 *
 * FOLLOW-UP QUESTION (ms after it sends)
 *     0   quote bubble lands; composer reads "Searching…" beside
 *         the matrix loader, Send turns into Stop
 *   800   search steps tick off (matrix loader while active)
 *  3950   steps fold into one summary line
 *  4250   answer streams in block by block (staggered 280ms)
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
 * with an ease-out. Only transform and opacity animate (no blur).
 * Press and hover stay fast; only system-paced things (loading, sheets,
 * AI output arriving) take duration.slow, and a chart line draws a
 * little longer so the jump reads as an event. */
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
  dim: D.slow, // the page dims as the sheet arrives
  dimOut: D.moderate,
  draw: 0.7, // a tile's signal line drawing in: data arriving, read at a walk
  expand: D.moderate,
  collapse: D.normal,
  dialogIn: D.normal,
  dialogOut: D.fast,
  reveal: D.slow, // AI output arriving: the product-ui entrance
};

export const TIMING = {
  drawerOpens: 900, // the ring sweeps a beat longer before the drawer comes
  traceAppears: 250, // after the drawer starts opening: as it lands
  traceStep: [560, 1140, 1640, 2440, 2940, 3440], // each trace step finishes
  traceFolds: 3950, // "Investigation complete" holds ~500ms first
  causesStart: 4150,
  causeStagger: 380,
  analysisDone: 5200,
  confirmSpinner: 700,
  simPrime: 380, // Simulate in an open side panel → lever glides to its recommended stop
  simPrimeOpening: 760, // same, while the side panel is still widening
  toastLife: 4000, // Sonner default, per the DS toast page
  actionSpinner: 520,
  askTooltip: 300, // DS TooltipProvider delayDuration
  askSends: 900, // Ask → the quoted line sends itself
  searchStep: [800, 2500, 3600], // each search step finishes (after it sends)
  searchFolds: 3950,
  answerStarts: 4250,
  answerStagger: 280,
  writeStart: 600, // first handoff message resolves (after Generate)
  writeStagger: 650,
  writeSettle: 450, // last message done → Send appears
};

/* Tweens for small pops. */
export const TWEEN = {
  // Chips and badges arriving
  pop: { duration: D.normal, ease: EASE.reveal },
};

export const SPRING = {
  /* Sheets: the drawer coming in and widening for the side panel
   * (apple-design). Critically damped (bounce 0): a click carries no
   * momentum, so nothing overshoots. A spring starts from wherever the
   * sheet is and keeps its velocity, so closing or toggling mid-flight
   * turns it around smoothly instead of restarting. visualDuration
   * holds the perceived length to the DS's duration.slow; it leaves
   * a little quicker than it came. */
  sheet: { type: "spring" as const, bounce: 0, visualDuration: D.slow },
  sheetOut: { type: "spring" as const, bounce: 0, visualDuration: 0.36 },
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
