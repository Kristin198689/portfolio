"use client";

import { useEffect, useRef } from "react";
import { colors, createLoop, dprCap, observeSize, trackPointer } from "../kit";
import { num, type ExperimentProps } from "../types";
import styles from "./exp.module.css";

type Ball = { x: number; y: number; vx: number; vy: number; r: number; hue: number };

// Gravity and collisions: circles fall, bounce off walls and each other with impulse-based collision
// response. Grab one with the pointer to drag it, release to throw it. Gravity, bounce and count are live.
export default function Gravity({ paramsRef, reduced }: ExperimentProps) {
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
    const balls: Ball[] = [];
    let held: Ball | null = null;
    const spawn = () => {
      const r = 16 + Math.random() * 22;
      balls.push({ x: r + Math.random() * Math.max(1, w - 2 * r), y: reduced ? r + Math.random() * Math.max(1, h * 0.5) : -r - Math.random() * 120, vx: (Math.random() - 0.5) * 200, vy: 0, r, hue: Math.random() });
    };
    const down = () => {
      held = null;
      let best = Infinity;
      for (const b of balls) {
        const d = Math.hypot(b.x - p.x, b.y - p.y);
        if (d < b.r + 10 && d < best) {
          best = d;
          held = b;
        }
      }
    };
    const up = () => {
      if (held) {
        held.vx = p.vx * 60;
        held.vy = p.vy * 60;
      }
      held = null;
    };
    canvas.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    const loop = createLoop(
      canvas,
      (_t, dt) => {
        const g = num(paramsRef.current, "gravity", 60) * 18;
        const bounce = num(paramsRef.current, "bounce", 70) / 100;
        const n = Math.round(num(paramsRef.current, "count", 14));
        while (balls.length < n) spawn();
        if (balls.length > n) balls.length = n;
        const steps = 3;
        for (let s = 0; s < steps; s++) {
          const d = dt / steps;
          for (const b of balls) {
            if (b === held) {
              b.vx = (p.x - b.x) * 18;
              b.vy = (p.y - b.y) * 18;
            } else b.vy += g * d;
            b.x += b.vx * d;
            b.y += b.vy * d;
            if (b.x < b.r) {
              b.x = b.r;
              b.vx = Math.abs(b.vx) * bounce;
            }
            if (b.x > w - b.r) {
              b.x = w - b.r;
              b.vx = -Math.abs(b.vx) * bounce;
            }
            if (b.y > h - b.r) {
              b.y = h - b.r;
              b.vy = -Math.abs(b.vy) * bounce;
              b.vx *= 0.985;
              if (Math.abs(b.vy) < 12) b.vy = 0;
            }
          }
          for (let i = 0; i < balls.length; i++)
            for (let j = i + 1; j < balls.length; j++) {
              const a = balls[i];
              const c = balls[j];
              const dx = c.x - a.x;
              const dy = c.y - a.y;
              const dist = Math.hypot(dx, dy);
              const min = a.r + c.r;
              if (dist > 0 && dist < min) {
                const nx = dx / dist;
                const ny = dy / dist;
                const push = (min - dist) / 2;
                a.x -= nx * push;
                a.y -= ny * push;
                c.x += nx * push;
                c.y += ny * push;
                const rel = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
                if (rel < 0) {
                  const j2 = (-(1 + bounce) * rel) / 2;
                  a.vx -= j2 * nx;
                  a.vy -= j2 * ny;
                  c.vx += j2 * nx;
                  c.vy += j2 * ny;
                }
              }
            }
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        for (const b of balls) {
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fillStyle = b.hue > 0.5 ? accent : fg;
          ctx.globalAlpha = b === held ? 1 : 0.85;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      },
      reduced,
    );
    return () => {
      loop.stop();
      dispose();
      stopSize();
      canvas.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, [paramsRef, reduced]);

  return <canvas ref={cv} className={styles.canvasDrag} aria-hidden="true" />;
}
