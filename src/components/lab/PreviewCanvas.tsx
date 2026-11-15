"use client";

import { useEffect, useRef } from "react";
import { colors, createLoop, dprCap, observeSize, trackPointer } from "./kit";

// Home-page teaser: a field of dots on springs that scatter away from the pointer. Canvas 2D only (no extra
// WebGL context on the home page), and the loop sleeps whenever the section is off screen.
export default function PreviewCanvas({ reduced }: { reduced: boolean }) {
  const cv = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = cv.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = dprCap();
    let w = 0;
    let h = 0;
    type D = { hx: number; hy: number; x: number; y: number; vx: number; vy: number };
    let dots: D[] = [];
    const { fg, accent } = colors(canvas);
    const stopSize = observeSize(canvas, (cw, ch) => {
      w = cw;
      h = ch;
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      const gap = Math.max(16, Math.round(Math.min(cw, ch) / 18));
      dots = [];
      for (let y = gap / 2; y < ch; y += gap)
        for (let x = gap / 2; x < cw; x += gap) dots.push({ hx: x, hy: y, x, y, vx: 0, vy: 0 });
    });
    const { p, dispose } = trackPointer(canvas);
    const loop = createLoop(
      canvas,
      (t) => {
        const mx = p.inside ? p.x : w / 2 + Math.sin(t * 0.7) * w * 0.3;
        const my = p.inside ? p.y : h / 2 + Math.cos(t * 0.9) * h * 0.3;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        for (const d of dots) {
          const dx = d.x - mx;
          const dy = d.y - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < 130 * 130 && d2 > 0.1) {
            const dist = Math.sqrt(d2);
            const f = (1 - dist / 130) * 5;
            d.vx += (dx / dist) * f;
            d.vy += (dy / dist) * f;
          }
          d.vx += (d.hx - d.x) * 0.06;
          d.vy += (d.hy - d.y) * 0.06;
          d.vx *= 0.82;
          d.vy *= 0.82;
          d.x += d.vx;
          d.y += d.vy;
          const away = Math.min(1, Math.hypot(d.x - d.hx, d.y - d.hy) / 30);
          ctx.fillStyle = away > 0.12 ? accent : fg;
          ctx.globalAlpha = 0.35 + away * 0.65;
          ctx.beginPath();
          ctx.arc(d.x, d.y, 1.6 + away * 2.4, 0, Math.PI * 2);
          ctx.fill();
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
  }, [reduced]);

  return <canvas ref={cv} aria-hidden="true" style={{ display: "block", width: "100%", height: "100%", touchAction: "pan-y" }} />;
}
