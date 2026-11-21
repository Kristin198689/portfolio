"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// The pet is not part of the first screen, so its code (the creature, the liquid, the water events)
// is fetched as a separate piece and started once the page is idle. First paint and first input do not wait for it.
const Companion = dynamic(() => import("./Companion").then((m) => m.Companion), { ssr: false });

export function CompanionLazy() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Wait until the page has finished loading and the hero has painted, then several seconds more:
    // the pet must never compete with the first screen for the processor.
    let timer = 0;
    let idle = 0;
    const start = () => setReady(true);
    const arm = () => {
      timer = window.setTimeout(() => {
        if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(start, { timeout: 2000 });
        else start();
      }, 5000);
    };
    if (document.readyState === "complete") arm();
    else window.addEventListener("load", arm, { once: true });
    return () => {
      window.removeEventListener("load", arm);
      window.clearTimeout(timer);
      if (idle) window.cancelIdleCallback(idle);
    };
  }, []);
  return ready ? <Companion /> : null;
}
