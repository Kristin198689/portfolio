"use client";

import { useEffect, useRef } from "react";
import { colors, createLoop, dprCap, observeSize, trackPointer } from "../kit";
import { num, type ExperimentProps } from "../types";
import styles from "./exp.module.css";

// Elastic cursor: a chain of circles joined by springs. Stiffness and count are live; a press makes the
// whole chain pulse. Real spring integration (semi-implicit Euler), not a CSS ease.
export default function Elastic({ paramsRef, reduced }: ExperimentProps) {
  const cv = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = cv.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = dprCap();
    let w = 0;
    let h = 0;
    const stopSize = observeSize(canvas, (cw, ch) => {
      w = cw;
      h = ch;
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
    });
    const { fg, accent } = colors(canvas);
    const { p, dispose } = trackPointer(canvas);
    const MAX = 24;
    const b = Array.from({ length: MAX }, () => ({ x: 0, y: 0, vx: 0, vy: 0 }));
    let seeded = false;
    let pulse = 0;
    const press = () => (pulse = 1);
    canvas.addEventListener("pointerdown", press);
    const loop = createLoop(
      canvas,
      (t, dt) => {
        const k = 40 + num(paramsRef.current, "strength", 55) * 3.2;
        const count = Math.round(num(paramsRef.current, "count", 12));
        const damp = 7;
        const hx = p.inside ? p.x : w / 2 + Math.cos(t * 0.8) * w * 0.3;
        const hy = p.inside ? p.y : h / 2 + Math.sin(t * 1.3) * h * 0.25;
        if (!seeded) {
          b.forEach((q) => ((q.x = hx), (q.y = hy)));
          seeded = true;
        }
        pulse *= 0.92;
        b[0].x += (hx - b[0].x) * 0.5;
        b[0].y += (hy - b[0].y) * 0.5;
        const steps = 2;
        for (let s = 0; s < steps; s++) {
          const d = dt / steps;
          for (let i = 1; i < count; i++) {
            const a = b[i - 1];
            const q = b[i];
            q.vx += ((a.x - q.x) * k - q.vx * damp) * d;
            q.vy += ((a.y - q.y) * k - q.vy * damp) * d;
            q.x += q.vx * d;
            q.y += q.vy * d;
          }
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        for (let i = count - 1; i >= 0; i--) {
          const r = (6 + (count - i) * 1.5) * (1 + pulse * 0.6 * Math.sin(i * 0.7));
          ctx.beginPath();
          ctx.arc(b[i].x, b[i].y, r, 0, Math.PI * 2);
          ctx.fillStyle = i === 0 ? fg : accent;
          ctx.globalAlpha = i === 0 ? 1 : 0.18 + 0.6 * (1 - i / count);
          ctx.fill();
          if (i > 0) {
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = fg;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(b[i].x, b[i].y);
            ctx.lineTo(b[i - 1].x, b[i - 1].y);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
      },
      reduced,
    );
    return () => {
      loop.stop();
      dispose();
      stopSize();
      canvas.removeEventListener("pointerdown", press);
    };
  }, [paramsRef, reduced]);

  return <canvas ref={cv} className={styles.canvas} aria-hidden="true" />;
}
