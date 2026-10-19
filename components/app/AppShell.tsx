/* Signals app chrome: breadcrumb bar and icon rail (from "Alert page (reference)"). */
const A = "/figma/app";

function Img({ src, w, h, className = "" }: { src: string; w: number; h: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" width={w} height={h} className={`block shrink-0 ${className}`} style={{ width: w, height: h }} draggable={false} />;
}

export function TopBar() {
  return (
    <header className="flex h-[55px] shrink-0 items-center justify-between rounded-t-[24px] border-b border-border bg-surface-subtle px-[19px]">
      <nav aria-label="Breadcrumb" className="flex items-center gap-4 text-[15.73px] leading-6 tracking-[-0.09px] text-foreground-tertiary">
        <Img src={`${A}/logo.png`} w={25} h={28} className="object-cover" />
        <span aria-hidden>/</span>
        <span className="flex items-center gap-2.5">
          T-Mobile <Img src={`${A}/chevrons.svg`} w={12} h={12} />
        </span>
        <span aria-hidden>/</span>
        <span className="flex items-center gap-2.5">
          SJC Data Center <Img src={`${A}/chevrons.svg`} w={12} h={12} />
        </span>
      </nav>
      <div className="flex items-center gap-[11px]">
        <div className="flex h-8 w-[192px] items-center gap-[9px] rounded-md border border-border bg-background px-3">
          <Img src={`${A}/search.svg`} w={16} h={16} />
          <span className="flex-1 text-[14px] tracking-[0.1px] text-foreground-tertiary">Search</span>
          <span className="flex h-5 w-[29px] items-center justify-center gap-px rounded-sm bg-secondary text-[14px] text-foreground-tertiary">
            <Img src={`${A}/command.svg`} w={10} h={10} />K
          </span>
        </div>
        <div className="relative size-8 overflow-hidden rounded-md bg-surface-subtle">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${A}/avatar.png`} alt="Marco Diaz" className="absolute left-[0.31%] top-[-3.65%] h-[149.69%] w-full max-w-none" />
        </div>
      </div>
    </header>
  );
}

export function Rail() {
  const top = [
    { src: "rail-1.svg", pad: "h-5" },
    { src: "rail-2.svg", pad: "h-12" },
    { src: "rail-3.svg", pad: "h-[22px]" },
    { src: "rail-4.svg", pad: "h-10" },
  ];
  return (
    <aside className="flex h-full w-[42px] shrink-0 flex-col justify-between rounded-bl-[24px] border-r border-border bg-surface-subtle" aria-label="Signals navigation">
      <div className="flex flex-col pl-[14px] pt-3">
        {top.map((i) => (
          <span key={i.src} className={`flex items-center ${i.pad}`}>
            <Img src={`${A}/${i.src}`} w={16} h={16} />
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-[2.4px] border-t border-border pt-[10.9px]">
        <span className="flex h-[38px] items-center px-[9.7px]">
          <Img src={`${A}/help.svg`} w={17} h={20} />
        </span>
        <span className="flex h-[38px] items-center px-[9.7px]">
          <Img src={`${A}/sparkles.svg`} w={16} h={16} />
        </span>
        <span className="flex h-[38px] items-center border-b border-border px-[9.7px]">
          <Img src={`${A}/braces.svg`} w={16} h={16} />
        </span>
        <span className="flex h-[38px] items-center px-[9.7px]">
          <span className="relative block size-4 -scale-y-100 rotate-180">
            <span className="absolute inset-[12.5%]">
              <span className="absolute" style={{ inset: "-5.56% -6.72%" }}>
                <Img src={`${A}/panel-a.svg`} w={13.6} h={13.4} className="size-full" />
              </span>
            </span>
            <span className="absolute" style={{ inset: "12.5% 62.5% 12.5% 37.5%" }}>
              <span className="absolute" style={{ inset: "-5.56% -0.81px" }}>
                <Img src={`${A}/panel-b.svg`} w={1.6} h={13.4} className="size-full" />
              </span>
            </span>
            <span className="absolute" style={{ inset: "37.5% 33.34% 37.5% 54.16%" }}>
              <span className="absolute" style={{ inset: "-16.67% -40.33%" }}>
                <Img src={`${A}/panel-c.svg`} w={3.6} h={5.3} className="size-full" />
              </span>
            </span>
          </span>
        </span>
      </div>
    </aside>
  );
}

export function SegmentedPair({ left, right, leftActive = true, tall = false }: { left: string; right: string; leftActive?: boolean; tall?: boolean }) {
  return (
    <div className={`flex ${tall ? "h-8" : "h-8"} items-stretch overflow-hidden rounded-md border border-border p-px`}>
      <span className={`flex items-center border-r border-border px-2 text-[14px] font-medium leading-6 tracking-[-0.31px] ${leftActive ? "bg-secondary text-foreground" : "bg-background text-foreground"}`}>
        {left}
      </span>
      <span className={`flex items-center px-2 text-[14px] font-medium leading-6 tracking-[-0.31px] ${leftActive ? "bg-background text-foreground-secondary" : "bg-secondary text-foreground-tertiary"}`}>
        {right}
      </span>
    </div>
  );
}

export function FilterSelect({ label }: { label: string }) {
  return (
    <span className="flex h-[34px] items-stretch overflow-hidden rounded-md border border-border bg-background p-px">
      <span className="flex items-center border-r border-border bg-secondary pl-2 pr-[9px] text-[14px] font-medium leading-[23px] tracking-[-0.15px] text-foreground">{label}</span>
      <span className="flex w-8 items-center justify-center">
        <Img src={`${A}/select-chevron.svg`} w={9.33} h={5.33} />
      </span>
    </span>
  );
}

export function MetricCards({ wide = false }: { wide?: boolean }) {
  const cards = [
    { label: "Current (RMS)", value: "12.5 A", threshold: "Threshold: > 50 A" },
    { label: "Total Harmonic...", value: "180.00 %", threshold: "Threshold: > 5.00 %" },
    { label: "Voltage", value: "1650 W" },
  ];
  return (
    <div className={`flex w-full items-stretch ${wide ? "gap-3" : "gap-3"}`}>
      {cards.map((c) => (
        <div key={c.label} className="flex min-w-0 flex-1 flex-col gap-6 rounded-xl border-[0.5px] border-border bg-background p-[17px] shadow-metric">
          <span className="text-[14px] leading-[21px] tracking-[-0.15px] text-foreground-secondary">{c.label}</span>
          <span className="flex flex-col gap-2">
            <span className="font-lato text-[26px] font-bold leading-[26px] tracking-[0.22px] text-destructive">{c.value}</span>
            {c.threshold && <span className="text-[14px] leading-[18px] text-foreground-tertiary">{c.threshold}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PhaseTabs() {
  return (
    <div className="flex w-[312.78px] items-center rounded-lg bg-secondary p-1" role="tablist" aria-label="Phase">
      {["Phase A", "Phase B", "Phase C"].map((p, i) => (
        <span
          key={p}
          role="tab"
          aria-selected={i === 0}
          className={`flex h-[33px] w-[101.5px] items-center justify-center rounded-button text-[14px] font-medium leading-[21px] tracking-[-0.15px] ${
            i === 0 ? "bg-background text-foreground shadow-[0_1px_1.5px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.1)]" : "text-foreground-secondary"
          }`}
        >
          {p}
        </span>
      ))}
    </div>
  );
}

export function IdChip({ id }: { id: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="rounded-sm bg-secondary px-2 py-0.5 font-mono text-[14px] leading-[21px] text-foreground-secondary">{id}</span>
      <span className="relative block size-[22px] p-1" aria-label="Copy">
        <span className="relative block size-[14px] overflow-hidden">
          <span className="absolute" style={{ inset: "33.33% 8.33% 8.33% 33.33%" }}>
            <span className="absolute" style={{ inset: "-5.71%" }}>
              <Img src={`${A}/copy-a.svg`} w={9} h={9} className="size-full" />
            </span>
          </span>
          <span className="absolute" style={{ inset: "8.33% 33.33% 33.33% 8.33%" }}>
            <span className="absolute" style={{ inset: "-5.71%" }}>
              <Img src={`${A}/copy-b.svg`} w={9} h={9} className="size-full" />
            </span>
          </span>
        </span>
      </span>
    </span>
  );
}

export function MapPin() {
  return <Img src={`${A}/map-pin.svg`} w={16} h={16} />;
}

export function MoreButton() {
  return (
    <span className="relative flex size-[26px] items-center justify-center rounded-button border border-border" aria-label="More">
      <span className="flex gap-[3.3px]">
        {[0, 1, 2].map((i) => (
          <Img key={i} src={`${A}/dot.svg`} w={2.67} h={2.67} />
        ))}
      </span>
    </span>
  );
}

export const ASSET = { calendar: `${A}/calendar.svg`, chevronDown: `${A}/chevron-down.svg` };
export { Img };
