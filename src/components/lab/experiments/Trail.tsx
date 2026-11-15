"use client";

import { useEffect, useRef } from "react";
import { colors, createLoop, dprCap, observeSize, trackPointer } from "../kit";
import { num, type ExperimentProps } from "../types";
import styles from "./exp.module.css";

// Cursor trail: a chain of points, each easing toward the one before it, drawn as a tapering ribbon.
// With no pointer the head follows a Lissajous curve, so the stage is alive before you touch it.
export default function Trail({ paramsRef, reduced }: ExperimentProps) {
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
    const N = 90;
    const pts = Array.from({ length: N }, () => ({ x: 0, y: 0 }));
    let seeded = false;
    const loop = createLoop(
      canvas,
      (t) => {
        const len = Math.round(num(paramsRef.current, "length", 45));
        const width = num(paramsRef.current, "width", 18);
        const hx = p.inside ? p.x : w / 2 + Math.sin(t * 0.9) * w * 0.34;
        const hy = p.inside ? p.y : h / 2 + Math.sin(t * 1.7) * h * 0.3;
        if (!seeded) {
          pts.forEach((q) => ((q.x = hx), (q.y = hy)));
          seeded = true;
        }
        pts[0].x += (hx - pts[0].x) * 0.35;
        pts[0].y += (hy - pts[0].y) * 0.35;
        for (let i = 1; i < N; i++) {
          pts[i].x += (pts[i - 1].x - pts[i].x) * 0.45;
          pts[i].y += (pts[i - 1].y - pts[i].y) * 0.45;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        for (let i = len - 1; i > 0; i--) {
          const k = 1 - i / len;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[i - 1].x, pts[i - 1].y);
          ctx.lineCap = "round";
          ctx.lineWidth = Math.max(0.5, width * k * k);
          ctx.strokeStyle = i % 9 < 4 ? accent : fg;
          ctx.globalAlpha = 0.15 + k * 0.85;
          ctx.stroke();
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
  }, [paramsRef, reduced]);

  return <canvas ref={cv} className={styles.canvas} aria-hidden="true" />;
}
