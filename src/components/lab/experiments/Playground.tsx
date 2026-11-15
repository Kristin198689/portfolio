"use client";

import { CssPlayground } from "../../CssPlayground";

// The original CSS playground, now one experiment of the lab.
export default function Playground() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "auto", padding: "var(--space-4)", marginTop: "calc(-1 * var(--space-12))" }} data-lenis-prevent>
      <CssPlayground />
    </div>
  );
}
