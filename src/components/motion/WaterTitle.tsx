"use client";

import { useEffect, useRef } from "react";
import { startWater } from "./water";
import styles from "./WaterTitle.module.css";

// A heading that lives on water: ripples under the cursor, a click drops a stone, it breathes on
// its own. The real <h2> stays in the DOM for screen readers and search engines.
export function WaterTitle({ text }: { text: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const box = wrap.current;
    const cv = canvas.current;
    if (!box || !cv) return;
    return startWater(box, cv, (el) => {
      // first ancestor with a real background colour (the section), so the canvas blends in
      let host: HTMLElement | null = el.parentElement;
      while (host && /rgba\(0, 0, 0, 0\)|transparent/.test(getComputedStyle(host).backgroundColor)) {
        host = host.parentElement;
      }
      const hostStyle = getComputedStyle(host ?? document.body);
      const bg = hostStyle.backgroundColor || "#0a0a0a";
      const fg = hostStyle.color || "#fafaf7";
      const width = Math.round(el.getBoundingClientRect().width);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const family = getComputedStyle(el).fontFamily;
      const rtl = /[\u0600-\u06FF]/.test(text);
      const upper = rtl ? text : text.toLocaleUpperCase();
      const probe = document.createElement("canvas").getContext("2d")!;
      probe.font = `800 100px ${family}`;
      if (!rtl && "letterSpacing" in probe) (probe as unknown as { letterSpacing: string }).letterSpacing = "-5.5px";
      const unit = probe.measureText(upper).width / 100;
      const size = (width * 0.97) / unit;
      const height = Math.ceil(size * 0.92);
      el.style.height = `${height}px`;

      const tc = document.createElement("canvas");
      tc.width = Math.round(width * dpr);
      tc.height = Math.round(height * dpr);
      const c = tc.getContext("2d", { willReadFrequently: true })!;
      // If the letters touch the right edge (canvas text measuring differs between browsers),
      // shrink a little and paint again.
      let fs = size;
      for (let attempt = 0; attempt < 8; attempt++) {
        c.fillStyle = bg;
        c.fillRect(0, 0, tc.width, tc.height);
        c.fillStyle = fg;
        c.font = `800 ${fs * dpr}px ${family}`;
        if (!rtl && "letterSpacing" in c) (c as unknown as { letterSpacing: string }).letterSpacing = `${-0.055 * fs * dpr}px`;
        c.textBaseline = "alphabetic";
        if (rtl) {
          c.direction = "rtl";
          c.textAlign = "right";
          c.fillText(upper, tc.width, fs * dpr * 0.83);
        } else {
          c.fillText(upper, 0, fs * dpr * 0.83);
        }
        const base = c.getImageData(0, 0, 1, 1).data[0];
        const edge = c.getImageData(rtl ? 0 : tc.width - 3, 0, 3, tc.height).data;
        let touches = false;
        for (let i = 0; i < edge.length; i += 4) {
          if (Math.abs(edge[i] - base) > 40) {
            touches = true;
            break;
          }
        }
        if (!touches) break;
        fs *= 0.96;
      }
      return tc;
    });
  }, [text]);

  return (
    <div ref={wrap} className={styles.wrap}>
      <h2 className={styles.title}>{text}</h2>
      <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
    </div>
  );
}
