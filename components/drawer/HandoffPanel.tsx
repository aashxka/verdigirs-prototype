"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { HANDOFF, RECIPIENTS, type Channel, type HandoffMessage, type Recipient } from "@/lib/data";
import { DUR, EASE } from "@/lib/motion";
import { pickedMessages, usePrototype } from "@/lib/store";
import { Badge, Button, Checkbox, Collapse, Icon, Spinner } from "../ui";

/* Handoff tab (04 · Handoff). Pick people → pick their channels →
 * Generate writes one message per channel, each for its reader →
 * Send. Scripted: every message is predefined in lib/data. */
export function HandoffPanel() {
  const { state, actions } = usePrototype();
  const messages = pickedMessages(state.picks);
  const n = messages.length;
  const phase = state.handoff;
  const showMessages = phase !== "pick";
  const locked = phase === "writing" || phase === "sending" || phase === "sent";
  const headingRef = useRef<HTMLDivElement>(null);

  // Writing: bring the messages into view. Sent: lift the confirmation
  // clear of the toast that rises over the bottom of the panel.
  useEffect(() => {
    if (phase !== "writing" && phase !== "sent") return;
    // Sent waits for the Send button's exit so the scroll isn't cut short.
    const t = setTimeout(
      () => {
        const el = headingRef.current;
        const sc = el?.closest<HTMLElement>(".scroll-quiet");
        if (!el || !sc) return;
        if (phase === "sent") {
          sc.scrollTo({ top: sc.scrollHeight, behavior: "smooth" });
          return;
        }
        const scale = sc.getBoundingClientRect().height / sc.offsetHeight || 1;
        const top = (el.getBoundingClientRect().top - sc.getBoundingClientRect().top) / scale + sc.scrollTop;
        sc.scrollTo({ top: Math.max(0, top - 16), behavior: "smooth" });
      },
      phase === "sent" ? 200 : 16,
    );
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h3 className="text-[18px] font-semibold leading-7 text-foreground">Handoff</h3>
        <p className="text-[14px] leading-5 text-muted-foreground">{HANDOFF.intro}</p>
      </div>

      <section className="flex flex-col gap-3" aria-labelledby="send-to">
        <h4 id="send-to" className="text-[16px] font-semibold leading-6 text-foreground">
          Send to
        </h4>
        <div className="w-full overflow-hidden rounded-lg border border-border bg-background">
          {RECIPIENTS.map((r, i) => (
            <PersonRow key={r.key} recipient={r} last={i === RECIPIENTS.length - 1} locked={locked} />
          ))}
        </div>
      </section>

      <AnimatePresence initial={false}>
        {showMessages && (
          <motion.section
            key="messages"
            aria-labelledby="messages"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4, filter: "blur(3px)", transition: { duration: DUR.collapse, ease: EASE.standard } }}
            transition={{ duration: DUR.reveal, ease: EASE.reveal }}
            className="flex flex-col gap-3"
          >
            <div ref={headingRef} className="flex items-center gap-2">
              <h4 id="messages" className="flex-1 text-[16px] font-semibold leading-6 text-foreground">
                Messages
              </h4>
              <span className="flex items-center gap-1.5 text-[12px] leading-4 text-muted-foreground" aria-live="polite">
                {phase === "writing" ? (
                  <>
                    <Spinner size={12} />
                    Writing from the Log
                  </>
                ) : (
                  HANDOFF.source
                )}
              </span>
            </div>
            {messages.map(({ recipient, channel }, i) => (
              <MessageCard
                key={`${recipient.key}-${channel.key}`}
                recipient={recipient}
                channel={channel}
                written={state.written > i}
                sent={phase === "sent"}
                index={i}
              />
            ))}
          </motion.section>
        )}
      </AnimatePresence>

      <div className="flex min-h-8 items-center gap-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {phase === "sent" ? (
            <motion.p
              key="sent"
              initial={{ opacity: 0, filter: "blur(4px)", y: 4 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ duration: 0.3, ease: EASE.reveal }}
              className="flex items-center gap-2 text-[14px] font-medium leading-5 text-foreground"
            >
              <Icon src="/figma/cause/circle-check.svg" size={16} />
              Sent at {HANDOFF.sentAt}
            </motion.p>
          ) : phase === "ready" || phase === "sending" ? (
            <motion.span key="send" initial={{ opacity: 0, filter: "blur(3px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} exit={{ opacity: 0, transition: { duration: 0.12 } }}>
              <Button kind="primary" loading={phase === "sending"} onClick={actions.sendHandoff}>
                Send {n} {n === 1 ? "message" : "messages"}
              </Button>
            </motion.span>
          ) : (
            <motion.span key="generate" className="flex items-center gap-3" exit={{ opacity: 0, filter: "blur(3px)", transition: { duration: 0.12 } }}>
              <Button kind="primary" disabled={n === 0} loading={phase === "writing"} onClick={actions.generate}>
                {n === 0 ? "Generate messages" : `Generate ${n} ${n === 1 ? "message" : "messages"}`}
              </Button>
              {n === 0 && <span className="text-[14px] leading-5 text-muted-foreground">Pick a person and a channel.</span>}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* One person: picking them reveals the channels they can be reached on. */
function PersonRow({ recipient, last, locked }: { recipient: Recipient; last: boolean; locked: boolean }) {
  const { state, actions } = usePrototype();
  const picked = state.picks[recipient.key];
  const on = picked !== null;
  return (
    <div className={last ? "" : "border-b border-border"}>
      <button
        type="button"
        aria-pressed={on}
        disabled={locked}
        onClick={() => actions.togglePerson(recipient.key)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors duration-150 enabled:hover:bg-surface-subtle disabled:cursor-default"
      >
        <Checkbox checked={on} />
        <span className="flex-1 text-[14px] font-medium leading-5 text-foreground">{recipient.audience}</span>
        <span className="text-[14px] leading-5 text-muted-foreground">{recipient.name}</span>
      </button>
      <Collapse open={on} inMs={300} outMs={200}>
        <div className="flex flex-wrap gap-2 pb-4 pl-[42px] pr-4" role="group" aria-label={`Channels for ${recipient.name}`}>
          {recipient.channels.map((c) => (
            <ChannelChip
              key={c.key}
              label={c.label}
              checked={!!picked?.includes(c.key)}
              disabled={locked}
              onClick={() => actions.toggleChannel(recipient.key, c.key)}
            />
          ))}
        </div>
      </Collapse>
    </div>
  );
}

/* DS: Channel chip (Channel · Slack / SMS / Email in 09.2). */
function ChannelChip({ label, checked, disabled, onClick }: { label: string; checked: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={onClick}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: DUR.press, ease: EASE.out }}
      className={`flex items-center gap-2 rounded-md border py-1.5 pl-2.5 pr-3 transition-colors duration-150 disabled:cursor-default ${
        checked ? "border-verdigris-on-light bg-accent-subtle" : "border-border bg-background enabled:hover:bg-surface-subtle"
      }`}
    >
      <Checkbox checked={checked} />
      <span className={`text-[14px] font-medium leading-5 ${checked ? "text-foreground" : "text-foreground-secondary"}`}>{label}</span>
    </motion.button>
  );
}

/* DS: Channel card. Header names the channel and recipient; the body
 * resolves out of a skeleton once its message is written. */
function MessageCard({
  recipient,
  channel,
  written,
  sent,
  index,
}: {
  recipient: Recipient;
  channel: Channel;
  written: boolean;
  sent: boolean;
  index: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.reveal, ease: EASE.reveal, delay: index * 0.06 }}
      className="flex w-full flex-col gap-3 rounded-lg border border-border bg-background p-4"
      aria-busy={!written || undefined}
    >
      <header className="flex items-center gap-1.5">
        <span className="text-[14px] font-semibold leading-5 text-foreground">{channel.label}</span>
        <span className="text-[12px] leading-4 text-muted-foreground">to</span>
        <span className="min-w-0 flex-1 truncate text-[14px] font-medium leading-5 text-foreground">{channel.to}</span>
        <AnimatePresence mode="popLayout" initial={false}>
          {sent ? (
            <motion.span
              key="sent"
              initial={{ opacity: 0, scale: 0.85, filter: "blur(2px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ type: "spring", stiffness: 520, damping: 32, mass: 0.8, delay: index * 0.07 }}
            >
              <Badge tone="teal">Sent</Badge>
            </motion.span>
          ) : (
            <motion.span key="audience" exit={{ opacity: 0, transition: { duration: 0.12 } }}>
              <Badge tone="muted">{recipient.audience}</Badge>
            </motion.span>
          )}
        </AnimatePresence>
      </header>
      <div className="w-full overflow-hidden rounded-md bg-surface-subtle p-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {written ? (
            <motion.div
              key="body"
              initial="hidden"
              animate="shown"
              variants={{ hidden: {}, shown: { transition: { staggerChildren: 0.07 } } }}
            >
              <MessageBody message={channel.message} />
            </motion.div>
          ) : (
            <motion.div key="skeleton" exit={{ opacity: 0, transition: { duration: 0.12 } }} className="flex flex-col gap-2 py-1" aria-hidden>
              {SKELETON[channel.message.kind].map((w, i) => (
                <span key={i} className="shimmer block h-3 rounded-[4px]" style={{ width: w }} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}

const SKELETON: Record<HandoffMessage["kind"], string[]> = {
  ticket: ["58%", "92%", "84%", "70%", "46%"],
  slack: ["40%", "96%", "88%", "74%", "52%"],
  sms: ["64%", "90%", "52%"],
};

/* Each line resolves out of a soft blur, in reading order. */
const line = {
  hidden: { opacity: 0, y: 4, filter: "blur(5px)" },
  shown: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: DUR.reveal, ease: EASE.reveal } },
};

function MessageBody({ message }: { message: HandoffMessage }) {
  if (message.kind === "ticket") {
    return (
      <div className="flex flex-col gap-3 text-[14px] leading-5">
        <motion.p variants={line} className="font-semibold text-foreground">
          {message.title}
        </motion.p>
        <dl className="flex flex-col gap-2">
          {message.fields.map((f) => (
            <motion.div key={f.label} variants={line} className="grid grid-cols-[84px_1fr] gap-x-4">
              <dt className="text-muted-foreground">{f.label}</dt>
              <dd className="text-foreground-secondary">
                {typeof f.value === "string" ? (
                  f.value
                ) : (
                  <ul className="flex flex-col gap-1">
                    {f.value.map((a) => (
                      <li key={a.time} className="flex gap-3">
                        <span className="font-mono text-[12px] leading-5 text-muted-foreground tabular">{a.time}</span>
                        <span>{a.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </dd>
            </motion.div>
          ))}
        </dl>
      </div>
    );
  }

  if (message.kind === "slack") {
    return (
      <div className="flex flex-col gap-3 font-lato">
        <motion.div variants={line} className="flex items-center gap-1.5">
          <span className="text-[15px] font-bold leading-5 text-foreground">Signals Assistant</span>
          <span className="rounded-[4px] bg-secondary px-1 text-[11px] font-bold leading-4 text-muted-foreground">APP</span>
          <span className="text-[12px] leading-4 text-muted-foreground">2:25 PM</span>
        </motion.div>
        <div className="flex flex-col gap-3 text-[14px] leading-[21px] text-foreground">
          <motion.p variants={line} className="text-[15px] font-bold">
            {message.title}
          </motion.p>
          {message.sections.map((s) => (
            <motion.p key={s.label} variants={line}>
              <span className="font-bold">{s.label}</span> {s.text}
            </motion.p>
          ))}
          {message.link && (
            <motion.span variants={line} className="flex items-center gap-1 text-[14px] font-bold text-verdigris-on-light">
              {message.link}
              <Icon src="/figma/drawer/paperclip-attachment.svg" size={12} />
            </motion.span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <motion.p
        variants={{
          hidden: { opacity: 0, scale: 0.94, filter: "blur(4px)" },
          shown: { opacity: 1, scale: 1, filter: "blur(0px)", transition: { duration: DUR.reveal, ease: EASE.reveal } },
        }}
        style={{ transformOrigin: "right bottom" }}
        className="w-[340px] rounded-[18px] rounded-br-[4px] bg-verdigris-on-light px-4 py-3 text-[14px] leading-5 text-white"
      >
        {message.text}
      </motion.p>
    </div>
  );
}
