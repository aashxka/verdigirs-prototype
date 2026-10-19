# Signals Assistant · RCA prototype

Coded prototype of the Verdigris Signals Assistant, built from the Figma flows
**01 · Root cause analysis** and **05 · Ask a follow-up** (file `AAbo1Bf4bDVmq8UxfLGBpE`),
using the Verdigris design tokens.

Everything is scripted. There is no AI model, API key or network call, so the demo
cannot fail live. All copy and numbers live in `lib/data.ts`; every timing and curve
lives in `lib/motion.ts`.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000. Press **R** at any point to restart from the alert.

## Flow

1. Alert → **Investigate with AI** (gradient ring sweeps, drawer opens)
2. Live investigation trace → likely causes resolve one by one
3. Expand cause #1 → Show / Hide reasoning → **Confirm**
4. Causes re-tag, recommended steps re-rank, toast with Undo
5. **Schedule** → dialog → Scheduled · Tue 09:00
6. Any time after the analysis: click the composer, the question auto-types,
   press Enter → search steps → answer → what-if simulator (drag or tap the stops)
7. Source chip / View in Signals → sensor page with the Assistant minimized → Back to root cause
