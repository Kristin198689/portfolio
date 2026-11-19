"use client";

import { readOrb, setOrb } from "@/lib/orb";
import styles from "./DontTouch.module.css";

// A button nobody was asked to press. It lets the creature break loose for a few seconds: it races from
// wall to wall, shocked each time, angry, and then goes home. On a screen without a mouse it is hidden.
export function DontTouch({ label }: { label: string }) {
  const go = () => {
    const wasLiquid = readOrb() === 1;
    if (!wasLiquid) setOrb(1); // wake the creature up first
    window.setTimeout(() => window.dispatchEvent(new CustomEvent("creature-rampage")), wasLiquid ? 0 : 450);
  };
  return (
    <button type="button" className={styles.btn} onClick={go}>
      {label}
    </button>
  );
}
