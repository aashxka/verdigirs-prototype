/* Phase A current + THDi chart (static snapshot from the Signals alert page). */
const A = "/figma/app";

const Y_LEFT = ["60A", "45A", "30A", "15A", "0A"];
const Y_RIGHT = ["20%", "15%", "10%", "5%", "0%"];
const X = ["06 AM", "09 AM", "12 PM", "03 PM", "06 PM"];

export function PhaseChart() {
  return (
    <div className="relative h-[320px] w-[913px] shrink-0 overflow-hidden" aria-label="Phase A current and total harmonic distortion, 6 AM to 6 PM" role="img">
      {/* area + line, clipped to the plot like the original recharts clip path */}
      <div
        className="absolute"
        style={{
          left: "0.46%",
          right: "12.79%",
          top: "7.89%",
          bottom: "12.5%",
          WebkitMaskImage: `url(${A}/chart-mask.svg)`,
          maskImage: `url(${A}/chart-mask.svg)`,
          maskPosition: "69.95px -22.203px",
          WebkitMaskPosition: "69.95px -22.203px",
          maskSize: "791.979px 281px",
          WebkitMaskSize: "791.979px 281px",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${A}/chart-area.svg`} alt="" className="absolute inset-0 block size-full max-w-none" />
      </div>
      <div
        className="absolute"
        style={{
          left: "0.46%",
          right: "12.79%",
          top: "7.89%",
          bottom: "36.89%",
          WebkitMaskImage: `url(${A}/chart-mask.svg)`,
          maskImage: `url(${A}/chart-mask.svg)`,
          maskPosition: "69.95px -22.203px",
          WebkitMaskPosition: "69.95px -22.203px",
          maskSize: "791.979px 281px",
          WebkitMaskSize: "791.979px 281px",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
        }}
      >
        <div className="absolute" style={{ inset: "-0.42% 0" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${A}/chart-line.svg`} alt="" className="block size-full max-w-none" />
        </div>
      </div>

      {/* x axis */}
      <div className="absolute" style={{ top: "88.75%", right: "12.92%", bottom: "11.25%", left: "8.31%" }}>
        <div className="absolute" style={{ inset: "-0.5px 0" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${A}/chart-axis.svg`} alt="" className="block size-full max-w-none" />
        </div>
      </div>
      <div
        className="absolute flex h-[13px] w-[720px] -translate-x-1/2 -translate-y-1/2 items-center justify-between"
        style={{ left: "calc(50% - 21.5px)", top: "calc(50% + 136.29px)" }}
      >
        {X.map((t) => (
          <span key={t} className="font-mono text-[11px] text-foreground-tertiary">
            {t}
          </span>
        ))}
      </div>

      {/* left y axis */}
      <div
        className="absolute flex w-[30px] -translate-x-1/2 -translate-y-1/2 flex-col items-end gap-[52px]"
        style={{ left: "calc(50% - 420.5px)", top: "calc(50% - 10.71px)" }}
      >
        {Y_LEFT.map((t) => (
          <span key={t} className="font-mono text-[11px] leading-[13px] text-foreground-tertiary">
            {t}
          </span>
        ))}
      </div>
      <span
        className="absolute whitespace-nowrap text-[11px] text-foreground-tertiary"
        style={{ left: 10, top: "46.5%", transform: "translate(-50%, -50%) rotate(-90deg)" }}
      >
        Current (RMS)
      </span>

      {/* right y axis */}
      <div
        className="absolute flex w-[30px] -translate-x-1/2 -translate-y-1/2 flex-col items-start gap-[52px]"
        style={{ left: "calc(50% + 384.5px)", top: "calc(50% - 10.71px)" }}
      >
        {Y_RIGHT.map((t) => (
          <span key={t} className="font-mono text-[11px] leading-[13px] text-foreground-tertiary">
            {t}
          </span>
        ))}
      </div>
      <span
        className="absolute whitespace-nowrap text-[11px] text-foreground-tertiary"
        style={{ left: "95.2%", top: "calc(50% - 10.5px)", transform: "translate(-50%, -50%) rotate(90deg)" }}
      >
        Total Harmonic Distortion (Current)
      </span>

      {/* thresholds */}
      <div className="absolute" style={{ top: "19.79%", right: "12.9%", bottom: "80.21%", left: "8.05%" }}>
        <div className="absolute" style={{ inset: "-0.75px 0" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${A}/chart-limit-current.svg`} alt="" className="block size-full max-w-none" />
        </div>
      </div>
      <div className="absolute" style={{ top: "67.12%", right: "12.8%", bottom: "32.88%", left: "8.01%" }}>
        <div className="absolute" style={{ inset: "-0.75px 0" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${A}/chart-limit-thd.svg`} alt="" className="block size-full max-w-none" />
        </div>
      </div>
      <span className="absolute left-[76px] top-[70.4px] flex h-[20.5px] items-center rounded-sm bg-verdigris-on-light px-2 text-[11px] font-medium leading-[16.5px] tracking-[0.06px] text-primary-foreground">
        Current &gt; 50 A
      </span>
      <span className="absolute left-[76px] top-[96px] flex h-[20.5px] items-center rounded-sm bg-midnight-purple px-2 text-[11px] font-medium leading-[16.5px] tracking-[0.06px] text-primary-foreground">
        THDi &gt; 5%
      </span>
    </div>
  );
}
