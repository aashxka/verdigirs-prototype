"use client";

import { ASSET, FilterSelect, IdChip, Img, MapPin, MetricCards, MoreButton, PhaseTabs, SegmentedPair } from "./AppShell";
import { InvestigateButton } from "./InvestigateButton";
import { PhaseChart } from "./PhaseChart";

/* 02.0 · Alert — the UPS Rectifier Degradation alert in Signals. */
export function AlertPage({ investigating, onInvestigate }: { investigating: boolean; onInvestigate: () => void }) {
  return (
    <div className="flex min-h-0 flex-1">
      <Inbox />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-br-[24px] bg-background">
        <section className="flex flex-col gap-3 border-b border-border bg-background pb-5 shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
          <div className="flex h-12 items-center justify-between border-b border-border px-5">
            <h1 className="font-lato text-[20px] font-bold leading-[30px] tracking-[-0.45px] text-foreground">UPS Rectifier Degradation</h1>
            <div className="flex items-center gap-3">
              <SegmentedPair left="In Progress" right="Closed" leftActive={false} />
              <MoreButton />
            </div>
          </div>
          <div className="flex flex-col gap-3 px-5">
            <div className="flex h-[18px] items-center justify-between">
              <span className="text-[14px] font-semibold leading-[23px] tracking-[-0.15px] text-destructive">Critical</span>
              <span className="text-[14px] leading-[21px] text-foreground-tertiary">Updated Monday, Today, 4:00 PM</span>
            </div>
            <div className="flex items-start justify-between">
              <span className="flex items-center gap-2 text-[14px] leading-[21px] text-foreground">
                <MapPin />
                T-Mobile SJC / Distribution Panel / PDU-01-A9F
              </span>
              <IdChip id="#H5YsIWNrkQUCwYPwjIprq" />
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-lato text-[18px] font-bold leading-[27px] tracking-[-0.44px] text-foreground">Symptom Description</h2>
            <InvestigateButton loading={investigating} onClick={onInvestigate} />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-background p-6">
              <PhaseTabs />
              <div className="flex flex-col gap-1">
                <p className="text-[14px] font-semibold leading-[27px] tracking-[-0.44px] text-foreground">
                  Phase A current spiked 16% above threshold at 12:30 PM.
                </p>
                <ul className="list-disc text-[14px] leading-[21px] tracking-[-0.15px] text-foreground-secondary">
                  <li className="ms-[21px]">Harmonic distortion at 180%, 36× above safe limit</li>
                  <li className="ms-[21px]">Non-linear load switching on PDU-01-A9F identified as likely cause</li>
                  <li className="ms-[21px]">Downstream equipment at risk if unresolved within 4–6 hours</li>
                </ul>
              </div>
              <PhaseChart />
            </div>
            <MetricCards />
          </div>
        </section>
      </main>
    </div>
  );
}

function Inbox() {
  return (
    <aside className="flex h-full w-[363px] shrink-0 flex-col overflow-hidden bg-surface-subtle p-px" aria-label="Inbox">
      <div className="flex h-12 items-center justify-between border-b border-border px-5">
        <h2 className="font-lato text-[20px] font-bold leading-none tracking-[0.07px] text-foreground">Inbox</h2>
        <SegmentedPair left="Alerts" right="Handoff notes" />
      </div>
      <div className="flex items-center justify-between border-b border-border px-[15px] py-3">
        <div className="flex items-center gap-2">
          <FilterSelect label="Severity" />
          <FilterSelect label="Status" />
        </div>
        <span className="flex h-[34px] items-center gap-1.5 rounded-button border border-border bg-background px-[9px] text-[14px] font-medium leading-[23px] tracking-[-0.15px] text-foreground">
          <Img src={ASSET.calendar} w={16} h={16} />
          Date
          <Img src={ASSET.chevronDown} w={16} h={16} />
        </span>
      </div>
      <ul className="flex flex-col bg-background">
        <li className="relative flex flex-col gap-1 border-b border-border bg-secondary px-5 py-3 shadow-[inset_8px_0_0_#18181b]" aria-current="true">
          <div className="flex items-start justify-between text-[14px] leading-[23px] tracking-[-0.15px]">
            <span className="font-lato font-bold text-[#db000a]">Critical</span>
            <span className="text-foreground">Today</span>
          </div>
          <div className="flex h-6 items-start justify-between">
            <span className="font-lato text-[16px] font-bold leading-[27px] tracking-[-0.44px] text-foreground">UPS Rectifier Degradation</span>
            <span className="rounded-md bg-primary px-2 py-0.5 text-[14px] leading-[20px] tracking-[-0.15px] text-primary-foreground">Open</span>
          </div>
          <span className="flex h-6 items-center text-[14px] leading-5 tracking-[-0.15px] text-foreground-tertiary">T-Mobile SJC / PDU-01-A9F</span>
        </li>
        <li className="flex flex-col gap-1 border-b border-border px-5 py-3">
          <div className="flex items-start justify-between text-[14px] leading-[23px] tracking-[-0.15px]">
            <span className="font-lato font-bold text-warning-fg">Warning</span>
            <span className="text-foreground">May 3</span>
          </div>
          <div className="flex h-6 items-start justify-between">
            <span className="font-lato text-[16px] font-bold leading-[27px] tracking-[-0.44px] text-foreground">Cooling Fan Failure</span>
            <span className="flex h-6 items-center rounded-md border border-verdigris-on-light bg-accent-muted px-[11px] text-[14px] font-semibold text-verdigris-on-light">
              In Progress
            </span>
          </div>
          <span className="flex h-6 items-center text-[14px] leading-5 tracking-[-0.15px] text-foreground-tertiary">Distribution Panel / PDU-01-A9F</span>
        </li>
      </ul>
    </aside>
  );
}
