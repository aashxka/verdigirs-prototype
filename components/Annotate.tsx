"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

/* Agentation design-review toolbar. Always on in dev. On a deployed
 * build it loads only when the page is opened with ?annotate, so
 * nobody viewing the demo sees it or downloads it. Notes stay in the
 * reviewer's browser; Copy turns them into markdown for an agent. */
const Agentation = dynamic(() => import("agentation").then((m) => m.Agentation), { ssr: false });

const subscribe = () => () => {};
const wanted = () => process.env.NODE_ENV === "development" || new URLSearchParams(window.location.search).has("annotate");

export function Annotate() {
  const on = useSyncExternalStore(subscribe, wanted, () => false);
  return on ? <Agentation /> : null;
}
