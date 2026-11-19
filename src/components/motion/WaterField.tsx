"use client";

import { useEffect, useRef } from "react";
import { startWater } from "./water";
import styles from "./WaterField.module.css";

// A whole hero scene lives on water. Its headline is painted into one texture that fills the scene,
// so ripples run across the entire screen, not only inside one word. The real <h1>
// stays in the DOM (transparent) for screen readers and search engines; buttons and text stay real.

// Paints the text of one element (any number of wrapped lines, or a vertical label) into the water
// texture, exactly where the real text sits, so the whole scene ripples and not only the headline.
function paintText(c: CanvasRenderingContext2D, el: HTMLElement, box: DOMRect, dpr: number, scene: HTMLElement) {
  const cs = getComputedStyle(el);
  let alpha = 1;
  for (let n: HTMLElement | null = el; n && n !== scene.parentElement; n = n.parentElement) {
    alpha *= parseFloat(getComputedStyle(n).opacity) || 1;
  }
  const fs = parseFloat(cs.fontSize) * dpr;
  c.font = `${cs.fontStyle} ${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
  const ls = parseFloat(cs.letterSpacing);
  if ("letterSpacing" in c) (c as unknown as { letterSpacing: string }).letterSpacing = `${(Number.isFinite(ls) ? ls : 0) * dpr}px`;
  c.fillStyle = cs.color;
  c.globalAlpha = alpha;
  const tf = (t: string) => (cs.textTransform === "uppercase" ? t.toLocaleUpperCase() : cs.textTransform === "lowercase" ? t.toLocaleLowerCase() : t);
  const rtl = cs.direction === "rtl";
  c.direction = rtl ? "rtl" : "ltr";

  if (cs.writingMode.startsWith("vertical")) {
    // a vertical label: draw it turned, centred on where it is on screen
    // the box of the glyphs themselves (not of the element), so the centre is exact
    const tr = document.createRange();
    tr.selectNodeContents(el);
    const r = tr.getBoundingClientRect();
    c.save();
    c.translate(((r.left + r.right) / 2 - box.left) * dpr, ((r.top + r.bottom) / 2 - box.top) * dpr);
    c.rotate(-Math.PI / 2);
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(tf((el.textContent ?? "").trim()), 0, 0);
    c.restore();
    c.globalAlpha = 1;
    return;
  }

  // horizontal text: find every word's box, group the words into the lines the browser made
  type Word = { t: string; l: number; r: number; top: number; h: number };
  const words: Word[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n.textContent ?? "";
    for (const m of text.matchAll(/\S+/g)) {
      range.setStart(n, m.index ?? 0);
      range.setEnd(n, (m.index ?? 0) + m[0].length);
      const rr = range.getClientRects()[0];
      if (rr && rr.width > 0) words.push({ t: m[0], l: rr.left, r: rr.right, top: rr.top, h: rr.height });
    }
  }
  const lines: Word[][] = [];
  for (const w of words) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(last[0].top - w.top) < w.h * 0.5) last.push(w);
    else lines.push([w]);
  }
  c.textBaseline = "alphabetic";
  c.textAlign = rtl ? "right" : "left";
  const m = c.measureText("Hg");
  const asc = m.fontBoundingBoxAscent ?? fs * 0.8;
  const desc = m.fontBoundingBoxDescent ?? fs * 0.2;
  for (const line of lines) {
    const text = tf(line.map((w) => w.t).join(" "));
    const top = line[0].top;
    const h = line[0].h;
    const base = (top - box.top) * dpr + (h * dpr - (asc + desc)) / 2 + asc;
    const x = rtl ? (Math.max(...line.map((w) => w.r)) - box.left) * dpr : (Math.min(...line.map((w) => w.l)) - box.left) * dpr;
    c.fillText(text, x, base);
  }
  c.globalAlpha = 1;
}

export function WaterField({ reveal = false, tilt = false }: { reveal?: boolean; tilt?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = box.current;
    const cv = canvas.current;
    const scene = el?.parentElement;
    if (!el || !cv || !scene) return;
    return startWater(
      el,
      cv,
      (b) => {
        const hero = scene.closest("section") ?? document.body;
        const hs = getComputedStyle(hero);
        const bg = hs.backgroundColor;
        const fg = hs.color;
        const r = b.getBoundingClientRect();
        if (r.width < 10 || r.height < 10) return null;
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        const tc = document.createElement("canvas");
        tc.width = Math.round(r.width * dpr);
        tc.height = Math.round(r.height * dpr);
        const c = tc.getContext("2d")!;
        c.fillStyle = bg;
        c.fillRect(0, 0, tc.width, tc.height);

        // the name, painted exactly where the real heading sits
        scene.querySelectorAll<HTMLElement>("[data-wline]").forEach((line) => {
          const s = getComputedStyle(line);
          const lr = line.getBoundingClientRect();
          const fs = parseFloat(s.fontSize) * dpr;
          c.font = `${s.fontWeight} ${fs}px ${s.fontFamily}`;
          if ("letterSpacing" in c) (c as unknown as { letterSpacing: string }).letterSpacing = `${parseFloat(s.letterSpacing) * dpr || 0}px`;
          const m = c.measureText("Hg");
          const asc = m.fontBoundingBoxAscent ?? fs * 0.8;
          const desc = m.fontBoundingBoxDescent ?? fs * 0.2;
          const top = (lr.top - r.top) * dpr;
          const base = top + (lr.height * dpr - (asc + desc)) / 2 + asc;
          const text = s.textTransform === "uppercase" ? (line.textContent ?? "").toLocaleUpperCase() : (line.textContent ?? "");
          c.fillStyle = fg;
          c.textBaseline = "alphabetic";
          const rtl = s.direction === "rtl";
          c.direction = rtl ? "rtl" : "ltr";
          c.textAlign = rtl ? "right" : "left";
          const x = (rtl ? lr.right - r.left : lr.left - r.left) * dpr;
          const stroke = parseFloat(s.getPropertyValue("-webkit-text-stroke-width")) || 0;
          if (stroke > 0) {
            // outline headline: draw the stroke only
            c.strokeStyle = fg;
            c.lineWidth = stroke * dpr;
            c.lineJoin = "round";
            c.strokeText(text, x, base);
          } else {
            c.fillText(text, x, base);
          }
        });
        scene.querySelectorAll<HTMLElement>("[data-wtext]").forEach((el) => paintText(c, el, r, dpr, scene));
        return tc;
      },
      { watchHeight: true, eager: true },
    );
  }, []);

  // the headline leans toward the pointer in 3D, eased so it never snaps (fine pointers only)
  useEffect(() => {
    const el = box.current;
    const cv = canvas.current;
    if (!tilt || !el || !cv) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    let ty = 0;
    let tx = 0;
    let ry = 0;
    let rx = 0;
    let raf = 0;
    const step = () => {
      ry += (ty - ry) * 0.08;
      rx += (tx - rx) * 0.08;
      cv.style.transform = `perspective(1400px) rotateY(${ry.toFixed(3)}deg) rotateX(${rx.toFixed(3)}deg)`;
      raf = Math.abs(ty - ry) + Math.abs(tx - rx) > 0.01 ? requestAnimationFrame(step) : 0;
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (r.right < 0 || r.left > window.innerWidth) return; // scene is off screen
      ty = (e.clientX / window.innerWidth - 0.5) * 5;
      tx = -(e.clientY / window.innerHeight - 0.5) * 4;
      if (!raf) raf = requestAnimationFrame(step);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [tilt]);

  return (
    <div ref={box} className={styles.field} data-water data-waterfx aria-hidden="true">
      <canvas ref={canvas} className={styles.canvas} {...(reveal ? { "data-hfade": "" } : {})} />
    </div>
  );
}
