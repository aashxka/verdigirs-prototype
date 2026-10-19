/* Evidence chart / THDi spike — static snapshot at alert time (1256:318). */
const C = "/figma/cause";

function Img({ src, className = "", style }: { src: string; className?: string; style?: React.CSSProperties }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className={`block max-w-none ${className}`} style={style} draggable={false} />;
}

const GRID = [-0.06, 36.94, 74.94];
const Y = [
  { t: "180%", top: -6 },
  { t: "120%", top: 31.33 },
  { t: "60%", top: 68.67 },
  { t: "0%", top: 106 },
];
const X = [
  { t: "11:30", left: 32 },
  { t: "12:00", left: 120.09 },
  { t: "12:30", left: 222.09 },
  { t: "13:00", left: 324.09 },
  { t: "13:30", left: 412.18 },
];

export function EvidenceChart() {
  return (
    <figure className="flex w-full flex-col gap-8 p-4" aria-label="THDi on Phase A rose from 3% to 180% after rack 14 servers came on at 12:22">
      <figcaption className="flex items-center gap-3">
        <span className="flex-1 text-[14px] font-medium leading-5 text-foreground-secondary">THDi · Phase A · PDU-01-A9F</span>
        <span className="flex items-center gap-1.5 text-[14px] leading-5 text-muted-foreground">
          <Img src={`${C}/legend-measured.svg`} style={{ width: 14, height: 2 }} />
          Measured
        </span>
        <span className="flex items-center gap-1.5 text-[14px] leading-5 text-muted-foreground">
          <Img src={`${C}/legend-limit.svg`} style={{ width: 14, height: 2 }} />
          Limit 5%
        </span>
      </figcaption>
      <div className="relative h-[140px] w-[448px] shrink-0" aria-hidden>
        {GRID.map((top) => (
          <Img key={top} src={`${C}/grid.svg`} className="absolute" style={{ left: 45, top: top - 1, width: 395, height: 1 }} />
        ))}
        <Img src={`${C}/axis.svg`} className="absolute" style={{ left: 45.5, top: 111, width: 394.5, height: 1 }} />
        {Y.map((y) => (
          <span key={y.t} className="absolute left-0 font-mono text-[12px] leading-4 text-foreground-tertiary" style={{ top: y.top }}>
            {y.t}
          </span>
        ))}
        <Img src={`${C}/area.svg`} className="absolute" style={{ left: 45, top: 2, width: 395, height: 110 }} />
        <Img src={`${C}/line.svg`} className="absolute" style={{ left: 45, top: 1, width: 395, height: 109 }} />
        <Img src={`${C}/limit.svg`} className="absolute" style={{ left: 45, top: 107.44, width: 395, height: 1.5 }} />
        <span className="absolute left-[217.45px] top-0 h-[112px] w-px bg-neutral-500" />
        <span className="absolute left-[78.36px] top-[52px] rounded-sm bg-primary px-1.5 py-0.5 font-mono text-[12px] leading-4 text-primary-foreground">
          12:22 Rack 14 servers on
        </span>
        {X.map((x) => (
          <span key={x.t} className="absolute top-[122px] font-mono text-[12px] leading-4 text-foreground-tertiary" style={{ left: x.left }}>
            {x.t}
          </span>
        ))}
      </div>
    </figure>
  );
}
