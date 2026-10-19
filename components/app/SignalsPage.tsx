"use client";

import { IdChip, MapPin, MetricCards, PhaseTabs } from "./AppShell";
import { PhaseChart } from "./PhaseChart";

/* 02.51 · Signals / PDU-01-A9F sensor — the evidence the Assistant cited. */
export function SignalsPage() {
  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-br-[24px] bg-background">
      <section className="flex flex-col gap-3 border-b border-border bg-background pb-5 shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
        <div className="flex h-12 items-center border-b border-border px-5">
          <h1 className="font-lato text-[20px] font-bold leading-[30px] tracking-[-0.45px] text-foreground">PDU-01-A9F sensor</h1>
        </div>
        <div className="flex flex-col gap-3 px-5">
          <div className="flex h-[18px] items-center justify-between">
            <span className="text-[14px] font-medium leading-[23px] text-foreground-secondary">Power distribution unit</span>
            <span className="text-[14px] leading-[21px] text-foreground-tertiary">Live · last reading 13:30</span>
          </div>
          <div className="flex items-start justify-between">
            <span className="flex items-center gap-2 text-[14px] leading-[21px] text-foreground">
              <MapPin />
              T-Mobile SJC / Distribution Panel / PDU-01-A9F
            </span>
            <IdChip id="PDU-01-A9F" />
          </div>
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-lato text-[18px] font-bold leading-[27px] tracking-[-0.44px] text-foreground">Phase A · Current and harmonics</h2>
          <span className="flex h-[29px] items-center gap-2 rounded-full bg-accent-muted px-2.5 text-[14px] font-medium leading-[17px] text-verdigris-on-light">
            <span className="size-1.5 rounded-full bg-verdigris-on-light" aria-hidden />
            Cited in investigation · 12:22 to 12:30
          </span>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-background p-6">
            <PhaseTabs />
            <div className="flex flex-col gap-1">
              <p className="text-[14px] font-semibold leading-[27px] tracking-[-0.44px] text-foreground">
                THDi on Phase A rose from 3% to 180% between 12:22 and 12:30.
              </p>
              <p className="text-[14px] leading-[21px] tracking-[-0.15px] text-foreground-secondary">
                Readings from the PDU-01-A9F sensor. The Signals Assistant cited the 12:22 to 12:30 window as evidence for the likely cause.
              </p>
            </div>
            <PhaseChart />
          </div>
          <MetricCards />
        </div>
      </section>
    </main>
  );
}
