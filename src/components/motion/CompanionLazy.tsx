"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// The pet is not part of the first screen, so its code (the creature, the liquid, the water events)
// is fetched as a separate piece and started once the page is idle. First paint and first input do not wait for it.
const Companion = dynamic(() => import("./Companion").then((m) => m.Companion), { ssr: false });

export function CompanionLazy() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const start = () => setReady(true);
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(start, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const t = window.setTimeout(start, 1500);
    return () => window.clearTimeout(t);
  }, []);
  return ready ? <Companion /> : null;
}
