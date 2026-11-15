"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { colors, createLoop, dprCap, observeSize, trackPointer } from "../kit";
import { num, type ExperimentProps } from "../types";
import styles from "./exp.module.css";

type P = { hx: number; hy: number; x: number; y: number; vx: number; vy: number };

// Repulsion particles: the word is rasterised off screen, sampled into hundreds of particles, and each one
// is tied to its spot by a spring while the pointer pushes it away. Density re-samples live.
export default function Repulse({ paramsRef, reduced }: ExperimentProps) {
  const t = useTranslations("lab");
  const cv = useRef<HTMLCanvasElement>(null);
  const word = t("exp.repulse.text");

  useEffect(() => {
    const canvas = cv.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = dprCap();
    let w = 0;
    let h = 0;
    let parts: P[] = [];
    let sampledFor = -1;
    let sampledW = 0;
    const { fg, accent } = colors(canvas);
    const sample = (step: number) => {
      const off = document.createElement("canvas");
      off.width = Math.max(1, Math.round(w));
      off.height = Math.max(1, Math.round(h));
      const o = off.getContext("2d");
      if (!o) return;
      let size = Math.min(w / (word.length * 0.62), h * 0.7);
      o.font = `800 ${size}px system-ui, sans-serif`;
      while (o.measureText(word).width > w * 0.9 && size > 12) {
        size *= 0.94;
        o.font = `800 ${size}px system-ui, sans-serif`;
      }
      o.textAlign = "center";
      o.textBaseline = "middle";
      o.fillStyle = "#fff";
      o.fillText(word, w / 2, h / 2);
      const data = o.getImageData(0, 0, off.width, off.height).data;
      const out: P[] = [];
      for (let y = 0; y < off.height; y += step)
        for (let x = 0; x < off.width; x += step)
          if (data[(y * off.width + x) * 4 + 3] > 128) {
            const rx = Math.random() * w;
            const ry = Math.random() * h;
            out.push({ hx: x, hy: y, x: reduced ? x : rx, y: reduced ? y : ry, vx: 0, vy: 0 });
          }
      parts = out;
      sampledFor = step;
      sampledW = w;
    };
    const stopSize = observeSize(canvas, (cw, ch) => {
      w = cw;
      h = ch;
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      sampledFor = -1;
    });
    const { p, dispose } = trackPointer(canvas);
    const loop = createLoop(
      canvas,
      (time) => {
        const step = Math.max(3, Math.round(20 - num(paramsRef.current, "density", 10)));
        if (step !== sampledFor || sampledW !== w) sample(step);
        const str = num(paramsRef.current, "strength", 60);
        const R = 70 + str * 0.9;
        const mx = p.inside ? p.x : w / 2 + Math.sin(time * 0.8) * w * 0.3;
        const my = p.inside ? p.y : h / 2 + Math.cos(time * 1.1) * h * 0.12;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        const r = Math.max(1, step * 0.28);
        for (const q of parts) {
          const dx = q.x - mx;
          const dy = q.y - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < R * R && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const f = (1 - d / R) * str * 0.06;
            q.vx += (dx / d) * f;
            q.vy += (dy / d) * f;
          }
          q.vx += (q.hx - q.x) * 0.045;
          q.vy += (q.hy - q.y) * 0.045;
          q.vx *= 0.86;
          q.vy *= 0.86;
          q.x += q.vx;
          q.y += q.vy;
          const away = Math.min(1, Math.hypot(q.x - q.hx, q.y - q.hy) / 40);
          ctx.fillStyle = away > 0.15 ? accent : fg;
          ctx.globalAlpha = 0.55 + away * 0.45;
          ctx.fillRect(q.x - r, q.y - r, r * 2, r * 2);
        }
        ctx.globalAlpha = 1;
      },
      reduced,
    );
    return () => {
      loop.stop();
      dispose();
      stopSize();
    };
  }, [paramsRef, reduced, word]);

  return <canvas ref={cv} className={styles.canvas} aria-hidden="true" />;
}
