"use client";

import { useEffect, useRef } from "react";
import { Toaster as Sonner, toast } from "sonner";
import { TIMING } from "@/lib/motion";
import { usePrototype } from "@/lib/store";

/* DS toasts (design.verdigris.co/categories/web-components/toasts):
 * Sonner, one Toaster at the root, on the popover surface pair with
 * the shared border and radius. Bottom right, 4s, paused on hover,
 * close button on hover, Undo as the action. Lucide icons per variant;
 * success takes the darker brand teal (positive state on light). */
export function Toaster() {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      duration={TIMING.toastLife}
      closeButton
      icons={{
        success: <ToastIcon className="text-verdigris-on-light" d={["M9 12l2 2 4-4"]} circle />,
        info: <ToastIcon d={["M12 16v-4", "M12 8h.01"]} circle />,
        warning: <ToastIcon className="text-warning-fg" d={["m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3", "M12 9v4", "M12 17h.01"]} />,
        error: (
          <ToastIcon
            className="text-destructive"
            d={[
              "M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z",
              "m15 9-6 6",
              "m9 9 6 6",
            ]}
          />
        ),
        loading: <ToastIcon className="spin" d={["M21 12a9 9 0 1 1-6.219-8.56"]} />,
      }}
      style={
        {
          "--normal-bg": "var(--color-popover)",
          "--normal-text": "var(--color-popover-foreground)",
          "--normal-border": "var(--color-border)",
          "--border-radius": "var(--radius-lg)",
        } as React.CSSProperties
      }
      toastOptions={{ className: "vg-toast" }}
    />
  );
}

function ToastIcon({ d, circle = false, className = "" }: { d: string[]; circle?: boolean; className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {circle && <circle cx="12" cy="12" r="10" />}
      {d.map((p) => (
        <path key={p} d={p} />
      ))}
    </svg>
  );
}

/* The prototype's store decides when a toast happens (it times them
 * into the story and owns Undo); this hands each one to Sonner and
 * reports back when Sonner closes it. */
export function ToastBridge() {
  const { state, actions } = usePrototype();
  const t = state.toast;
  const shown = useRef<number | null>(null);

  useEffect(() => {
    if (!t) {
      if (shown.current !== null) toast.dismiss(shown.current);
      shown.current = null;
      return;
    }
    if (shown.current === t.id) return;
    shown.current = t.id;
    toast.success(t.text, {
      id: t.id,
      description: t.description,
      action: t.undo ? { label: "Undo", onClick: () => actions.undo(t) } : undefined,
      onDismiss: () => actions.dismissToast(t.id),
      onAutoClose: () => actions.dismissToast(t.id),
    });
  }, [t, actions]);

  return null;
}
