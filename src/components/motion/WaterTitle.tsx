"use client";

import { useEffect, useRef } from "react";
import { startWater } from "./water";
import styles from "./WaterTitle.module.css";

// A heading that lives on water: ripples under the cursor, a click drops a stone, it breathes on
// its own. The real <h2> stays in the DOM for screen readers and search engines.
// Splits words into `n` lines of similar length.
function balance(text: string, n: number): string[] {
  if (n <= 1) return [text];
  const words = text.split(" ");
  const target = text.length / n;
  const rows: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur && cur.length + 1 + w.length > target * 1.15 && rows.length < n - 1) {
      rows.push(cur);
      cur = w;
    } else cur = cur ? `${cur} ${w}` : w;
  }
  rows.push(cur);
  return rows;
}

export function WaterTitle({ text, id, multiline = false }: { text: string; id?: string; multiline?: boolean }) {
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
      const rows = multiline ? balance(upper, Math.min(3, Math.max(1, Math.ceil(upper.length / 18)))) : [upper];
      const unit = Math.max(...rows.map((r) => probe.measureText(r).width)) / 100;
      let size = (width * 0.97) / unit;
      // a sentence must not become huge: cap by width, and give Arabic more room between lines
      if (multiline) size = Math.min(size, width * (rtl ? 0.1 : 0.14));
      const gap = rtl ? 1.2 : 0.95;
      const height = Math.ceil(size * (rtl ? 1.35 : 0.92) + size * gap * (rows.length - 1));
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
        rows.forEach((row, i) => {
          const y = fs * dpr * ((rtl ? 0.9 : 0.83) + gap * i);
          if (rtl) {
            c.direction = "rtl";
            c.textAlign = "right";
            c.fillText(row, tc.width, y);
          } else {
            c.fillText(row, 0, y);
          }
        });
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
  }, [text, multiline]);

  return (
    <div ref={wrap} className={styles.wrap} data-waterfx>
      <h2 id={id} className={styles.title}>{text}</h2>
      <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
    </div>
  );
}
