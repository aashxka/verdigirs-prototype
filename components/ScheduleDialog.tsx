"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { SCHEDULE_DIALOG } from "@/lib/data";
import { DUR, EASE } from "@/lib/motion";
import { usePrototype } from "@/lib/store";
import { Button, Icon } from "./ui";

/* Dialog / Schedule maintenance (02.13). Modal: scrim at 45%. */
export function ScheduleDialog() {
  const { state, actions } = usePrototype();
  const d = state.dialog;
  return (
    <AnimatePresence>
      {d && (
        <motion.div
          key="dialog"
          className="absolute inset-0 z-40 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: DUR.dialogOut } }}
          transition={{ duration: DUR.dialogIn, ease: EASE.reveal }}
        >
          <div className="absolute inset-0 bg-[#09090b]/45" onClick={actions.closeDialog} aria-hidden />
          <DialogBody key={d.stepKey} stepKey={d.stepKey} submitting={d.submitting} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DialogBody({ stepKey, submitting }: { stepKey: string; submitting: boolean }) {
  const { actions } = usePrototype();
  const copy = SCHEDULE_DIALOG[stepKey];
  const [instructions, setInstructions] = useState(copy.instructions);
  const primaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    primaryRef.current?.querySelector("button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") actions.closeDialog();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [actions]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-title"
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: 4, transition: { duration: DUR.dialogOut, ease: EASE.standard } }}
      transition={{ duration: DUR.dialogIn, ease: EASE.reveal }}
      className="relative flex w-[480px] flex-col gap-4 rounded-xl border border-border bg-background p-6 shadow-dialog"
    >
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 id="schedule-title" className="text-[18px] font-semibold text-foreground">
            Schedule maintenance
          </h2>
          <p className="text-[14px] text-foreground-tertiary">{copy.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={actions.closeDialog}
          aria-label="Close"
          className="flex size-8 items-center justify-center rounded-button transition-colors duration-150 hover:bg-secondary"
        >
          <Icon src="/figma/drawer/x.svg" size={16} />
        </button>
      </div>
      <div className="flex gap-3">
        <SelectField label="Date" value="Tue, Oct 20" />
        <SelectField label="Time" value="09:00 – 10:30" />
      </div>
      <SelectField label="Assign to" value="Marco Diaz · Electrical tech" />
      <label className="flex flex-col gap-1.5">
        <span className="text-[14px] font-medium leading-5 text-foreground-secondary">Instructions · drafted by Signals Assistant</span>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={3}
          className="resize-none rounded-md border border-border bg-background px-3 py-2.5 text-[14px] leading-5 text-foreground outline-none transition-[border-color,box-shadow] duration-200 focus:border-verdigris-on-light focus:shadow-[0_0_0_2px_var(--ring-focus)]"
        />
      </label>
      <p className="flex items-center gap-1.5 text-[14px] text-foreground-tertiary">
        <Icon src="/figma/drawer/paperclip-attachment.svg" size={12} />
        Root cause analysis attached
      </p>
      <div className="flex items-center justify-end gap-2 pt-2" ref={primaryRef}>
        <Button kind="secondary" onClick={actions.closeDialog} disabled={submitting}>
          Cancel
        </Button>
        <Button kind="primary" onClick={actions.submitDialog} loading={submitting}>
          Schedule
        </Button>
      </div>
    </motion.div>
  );
}

function SelectField({ label, value }: { label: string; value: string }) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="text-[14px] font-medium leading-5 text-foreground-secondary">{label}</span>
      <span className="relative flex">
        <select
          defaultValue={value}
          className="w-full appearance-none rounded-md border border-border bg-background py-2 pl-3 pr-9 text-[14px] leading-5 text-foreground outline-none transition-[border-color,box-shadow] duration-200 focus:border-verdigris-on-light focus:shadow-[0_0_0_2px_var(--ring-focus)]"
        >
          <option>{value}</option>
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <Icon src="/figma/drawer/chevron.svg" size={16} />
        </span>
      </span>
    </label>
  );
}
