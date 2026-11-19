"use client";

import { useEffect, useRef } from "react";
import { createAlt, type Alt } from "./companionAlt";
import { onOrb, readOrb } from "@/lib/orb";
import styles from "./Companion.module.css";

type V3 = [number, number, number];

const N = 260;
const LINKS = 3;

// Point sets that share one topology: point i is the same vertex in every shape,
// so the mesh melts from one solid into another instead of cross-fading.
function build(): { shapes: V3[][]; edges: Array<[number, number]> } {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const sphere: V3[] = Array.from({ length: N }, (_, i) => {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const a = i * golden;
    return [Math.cos(a) * r, y, Math.sin(a) * r];
  });
  const cube: V3[] = sphere.map(([x, y, z]) => {
    const m = Math.max(Math.abs(x), Math.abs(y), Math.abs(z));
    return [x / m, y / m, z / m].map((v) => v * 0.8) as V3;
  });
  const torus: V3[] = sphere.map((_, i) => {
    const u = ((i * 0.6180339887) % 1) * Math.PI * 2;
    const v = (i / N) * Math.PI * 2 * 5;
    const R = 0.72;
    const r = 0.3;
    return [(R + r * Math.cos(v)) * Math.cos(u), r * Math.sin(v) * 1.4, (R + r * Math.cos(v)) * Math.sin(u)];
  });
  const octa: V3[] = sphere.map(([x, y, z]) => {
    const m = Math.abs(x) + Math.abs(y) + Math.abs(z);
    return [(x / m) * 1.25, (y / m) * 1.25, (z / m) * 1.25];
  });

  // Edges: each sphere point links to its nearest neighbours, deduplicated
  const seen = new Set<string>();
  const edges: Array<[number, number]> = [];
  sphere.forEach((p, i) => {
    sphere
      .map((q, j) => ({ j, d: (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2 }))
      .filter((o) => o.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, LINKS)
      .forEach(({ j }) => {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!seen.has(key)) {
          seen.add(key);
          edges.push([i, j]);
        }
      });
  });
  return { shapes: [sphere, cube, torus, octa], edges };
}

const ease = (t: number) => t * t * (3 - 2 * t);

// Lightning between a wall and the creature: a jagged arc to its body, and a crackle running along the
// wall. Redrawn every frame with fresh jitter, so it flickers for about a third of a second.
type Bolt = { x: number; y: number; wall: "l" | "r" | "t" | "b"; age: number };
function drawBolts(g: CanvasRenderingContext2D, bolts: Bolt[], ax: number, ay: number, light: boolean) {
  g.clearRect(0, 0, g.canvas.width, g.canvas.height);
  for (let i = bolts.length - 1; i >= 0; i--) {
    bolts[i].age += 1;
    if (bolts[i].age > 20) bolts.splice(i, 1);
  }
  if (!bolts.length) return;
  const zig = (x0: number, y0: number, x1: number, y1: number, amp: number, steps: number) => {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    g.beginPath();
    g.moveTo(x0, y0);
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      const j = (Math.random() - 0.5) * amp;
      g.lineTo(x0 + dx * t + nx * j, y0 + dy * t + ny * j);
    }
    g.lineTo(x1, y1);
  };
  g.lineCap = "round";
  g.lineJoin = "round";
  g.globalCompositeOperation = light ? "source-over" : "lighter";
  for (const b of bolts) {
    const life = 1 - b.age / 20;
    const flick = Math.random() > 0.25 ? 1 : 0.3;
    // wall point and the direction along the wall
    const wx = b.wall === "l" ? 0 : b.wall === "r" ? g.canvas.width : b.x;
    const wy = b.wall === "t" ? 0 : b.wall === "b" ? g.canvas.height : b.y;
    const along = b.wall === "l" || b.wall === "r" ? [0, 1] : [1, 0];
    const paths: Array<[number, number, number, number, number, number]> = [
      [wx, wy, ax, ay, 26, 9],
      [wx - along[0] * 110, wy - along[1] * 110, wx, wy, 14, 8],
      [wx, wy, wx + along[0] * 110, wy + along[1] * 110, 14, 8],
      [wx, wy, ax + (Math.random() - 0.5) * 70, ay + (Math.random() - 0.5) * 70, 30, 8],
    ];
    for (const [x0, y0, x1, y1, amp, steps] of paths) {
      zig(x0, y0, x1, y1, amp, steps);
      g.strokeStyle = light ? `rgba(40, 20, 200, ${0.35 * life * flick})` : `rgba(60, 200, 255, ${0.5 * life * flick})`;
      g.lineWidth = 7;
      g.stroke();
      g.strokeStyle = light ? `rgba(10, 0, 90, ${0.95 * life * flick})` : `rgba(255, 255, 255, ${0.95 * life * flick})`;
      g.lineWidth = 1.8;
      g.stroke();
    }
  }
  g.globalCompositeOperation = "source-over";
}

// Is the page behind the companion light? Walks up from the element under its centre to the first
// opaque background and checks its brightness.
function isLightBehind(box: HTMLElement): boolean {
  const r = box.getBoundingClientRect();
  let el: Element | null = document.elementFromPoint(
    Math.min(window.innerWidth - 1, Math.max(0, r.left + r.width / 2)),
    Math.min(window.innerHeight - 1, Math.max(0, r.top + r.height / 2)),
  );
  while (el) {
    const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
    if (m && (m.length < 4 || Number(m[3]) > 0.5)) {
      return (0.299 * Number(m[0]) + 0.587 * Number(m[1]) + 0.114 * Number(m[2])) / 255 > 0.55;
    }
    el = el.parentElement;
  }
  return false;
}

// A wireframe mesh that travels with the visitor down the page. It drifts along the right edge on a
// wavy path, spins with scroll speed and the pointer, and morphs sphere → cube → torus → octahedron.
// The cursor pushes points away (they spring back), a click bursts the mesh, colours shimmer.
export function Companion() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const fx = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const box = wrap.current;
    const cv = canvas.current;
    const fxCv = fx.current;
    if (!box || !cv || !fxCv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const { shapes, edges } = build();
    const pts: V3[] = shapes[0].map((p) => [...p] as V3);
    let size = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = box.getBoundingClientRect().width;
      cv.width = Math.round(size * dpr);
      cv.height = Math.round(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fxCv.width = window.innerWidth;
      fxCv.height = window.innerHeight;
    };
    resize();

    let angle = 0;
    let tilt = 0.35;
    let spin = 0.003;
    let lastY = window.scrollY;
    let mx = 0;
    let my = 0;
    let cx0 = -9999; // pointer in client px
    let cy0 = -9999;
    let time = 0;
    let alt: Alt | null = null;
    let light = false;
    let burst = 0;
    // "Alien" behaviour of the liquid look (desktop, fine pointer): it hunts the cursor across the whole
    // window. The window edges are electrified: touching one shocks it and throws it back.
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const fxCtx = fxCv.getContext("2d");
    let lastMove = 0;
    let ax = 0;
    let ay = 0;
    let avx = 0;
    let avy = 0;
    let roamInit = false;
    let shock = 0;
    let shockCool = 0;
    let lungeT = 0;
    let lungeCool = 0;
    const bolts: Array<{ x: number; y: number; wall: "l" | "r" | "t" | "b"; age: number }> = [];
    // Per-point spring offsets: the cursor pushes points away, they spring back
    const off = Array.from({ length: N }, () => [0, 0]);
    const vel = Array.from({ length: N }, () => [0, 0]);
    const BUCKETS = 14;
    let frame = 0;
    let visible = true;

    const draw = () => {
      frame = 0;
      // hidden on small screens (display: none gives size 0); wake again on resize
      if (size < 10) return;
      const vh = window.innerHeight;
      const max = Math.max(1, document.documentElement.scrollHeight - vh);
      const prog = Math.min(1, Math.max(0, window.scrollY / max));

      // Position: wavy path along the right edge
      const vw = window.innerWidth;
      const waveX = Math.sin(prog * Math.PI * 4) * vh * 0.04;
      const waveY = Math.sin(prog * Math.PI * 3) * vh * 0.16;
      if (vw < 896) {
        // Phones: on the first hero screen the mesh is big and sits in the empty space above the
        // name. While the hero scenes slide by it shrinks and settles into its normal path.
        const scenes = document.querySelectorAll("[data-scene]").length;
        const hp = scenes > 1 ? Math.min(1, Math.max(0, window.scrollY / ((scenes - 1) * vw))) : 1;
        const e = ease(hp);
        const sc = 1 - e * 0.66;
        const vis = size * sc;
        // after the hero it rests at the very edge, half off screen, so it never covers text
        const cxN = vw - vis * 0.18 + waveX * 0.3;
        const cyN = vh * 0.5 + waveY;
        const cx = vw / 2 + (cxN - vw / 2) * e;
        const cy = vh * 0.28 + (cyN - vh * 0.28) * e;
        box.style.transform = `translate3d(${cx - size / 2 - (vw - size)}px, ${cy - size / 2}px, 0) scale(${sc})`;
      } else {
        const x = waveX - size * 0.15;
        const y = vh * 0.5 - size / 2 + waveY;
        const homeX = vw - size / 2 + x;
        const homeY = y + size / 2;
        if (alt && fine && !reduce) {
          const ra = size * 0.33;
          if (!roamInit) {
            roamInit = true;
            ax = homeX;
            ay = homeY;
          }
          const hunting = cx0 > -9000 && performance.now() - lastMove < 5000;
          const tx = hunting ? cx0 : homeX;
          const ty = hunting ? cy0 : homeY;
          const dx = tx - ax;
          const dy = ty - ay;
          const dist = Math.hypot(dx, dy) || 1;
          // it is slower than a hurried hand, so you can run; it lunges when you let it get close
          if (hunting && dist < size * 1.1 && lungeCool <= 0) {
            lungeT = 16;
            lungeCool = 150;
          }
          const top = lungeT > 0 ? 7 : hunting ? 3.4 : 2.4;
          const sp = Math.min(top, dist * 0.07);
          avx += (((dx / dist) * sp) - avx) * 0.09;
          avy += (((dy / dist) * sp) - avy) * 0.09;
          if (lungeT > 0) lungeT -= 1;
          if (lungeCool > 0) lungeCool -= 1;
          ax += avx;
          ay += avy;
          // the electrified walls
          const hit = (wall: "l" | "r" | "t" | "b") => {
            avx = wall === "l" ? Math.abs(avx) + 5 : wall === "r" ? -Math.abs(avx) - 5 : avx * -0.6;
            avy = wall === "t" ? Math.abs(avy) + 5 : wall === "b" ? -Math.abs(avy) - 5 : avy * -0.6;
            if (shockCool <= 0) {
              shock = 1;
              shockCool = 30;
              burst = 1;
              bolts.push({ x: Math.min(vw, Math.max(0, ax)), y: Math.min(vh, Math.max(0, ay)), wall, age: 0 });
            }
          };
          if (ax < ra) {
            ax = ra;
            hit("l");
          } else if (ax > vw - ra) {
            ax = vw - ra;
            hit("r");
          }
          if (ay < ra) {
            ay = ra;
            hit("t");
          } else if (ay > vh - ra) {
            ay = vh - ra;
            hit("b");
          }
          if (shockCool > 0) shockCool -= 1;
          box.style.transform = `translate3d(${ax - vw + size / 2}px, ${ay - size / 2}px, 0)`;
        } else {
          roamInit = false;
          box.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }
      }

      // Morph between shapes by scroll progress
      const f = prog * (shapes.length - 1);
      const k = Math.min(shapes.length - 2, Math.floor(f));
      const t = ease(f - k);
      for (let i = 0; i < N; i++) {
        const a = shapes[k][i];
        const b = shapes[k + 1][i];
        pts[i][0] = a[0] + (b[0] - a[0]) * t;
        pts[i][1] = a[1] + (b[1] - a[1]) * t;
        pts[i][2] = a[2] + (b[2] - a[2]) * t;
      }

      // Rotation: idle spin + scroll speed + pointer
      const dy = window.scrollY - lastY;
      lastY = window.scrollY;
      spin += (0.003 + Math.min(Math.abs(dy), 80) * 0.0008 - spin) * 0.08;
      angle += spin;
      tilt += ((0.35 + my * 0.5) - tilt) * 0.05;
      const ry = angle + mx * 0.8;
      const cy = Math.cos(ry);
      const sy = Math.sin(ry);
      const cx = Math.cos(tilt);
      const sx = Math.sin(tilt);

      if (alt) {
        // an alternative look takes over the drawing; position, spin and pointer logic stay shared
        time += 1;
        burst *= 0.94;
        const r0 = box.getBoundingClientRect();
        const scale = r0.width / size || 1;
        const ptr = cx0 > -9000 ? { x: (cx0 - r0.left) / scale, y: (cy0 - r0.top) / scale } : null;
        if (time % 10 === 1) light = isLightBehind(box);
        shock *= 0.93;
        alt({ ctx, size, time, ry, tilt, prog, speed: Math.min(1, Math.abs(dy) / 80), burst, ptr, light, shock });
        if (fxCtx) drawBolts(fxCtx, bolts, ax, ay, light);
        if (!reduce && visible) frame = requestAnimationFrame(draw);
        return;
      }

      const proj: Array<[number, number, number]> = pts.map(([px, py, pz]) => {
        const x1 = px * cy + pz * sy;
        const z1 = -px * sy + pz * cy;
        const y2 = py * cx - z1 * sx;
        const z2 = py * sx + z1 * cx;
        const s = 1 / (1.9 - z2 * 0.55);
        return [size / 2 + x1 * s * size * 0.46, size / 2 + y2 * s * size * 0.46, z2];
      });

      // Cursor: points near the pointer are pushed away, then spring back
      time += 1;
      const rect = box.getBoundingClientRect();
      const lx = cx0 - rect.left;
      const ly = cy0 - rect.top;
      const reach = size * 0.55;
      let near = 0;
      for (let i = 0; i < N; i++) {
        const dx = proj[i][0] - lx;
        const dy2 = proj[i][1] - ly;
        const d = Math.hypot(dx, dy2) || 1;
        if (d < reach) {
          const f = (1 - d / reach) ** 2;
          vel[i][0] += (dx / d) * f * 2.4;
          vel[i][1] += (dy2 / d) * f * 2.4;
          near = Math.max(near, f);
        }
        vel[i][0] += -off[i][0] * 0.05;
        vel[i][1] += -off[i][1] * 0.05;
        vel[i][0] *= 0.87;
        vel[i][1] *= 0.87;
        off[i][0] += vel[i][0];
        off[i][1] += vel[i][1];
        proj[i][0] += off[i][0];
        proj[i][1] += off[i][1];
      }

      // Colour: one acid gradient that flows across the mesh (and drifts with time and scroll):
      // neon aqua → electric blue → violet → hot magenta → pink, then back. No stray accent dots.
      const tone = (i: number) => {
        const v = (proj[i][1] / size) * 0.9 + (proj[i][0] / size) * 0.5 + proj[i][2] * 0.08 + time * 0.0035 + prog * 2;
        const f = v - Math.floor(v);
        return f < 0.5 ? f * 2 : 2 - f * 2;
      };
      const toHue = (t: number) => 168 + t * 172;

      ctx.clearRect(0, 0, size, size);
      ctx.lineWidth = 0.8 + near * 0.6;
      const groups: Array<Array<[number, number]>> = Array.from({ length: BUCKETS }, () => []);
      for (const e of edges) {
        const t = (tone(e[0]) + tone(e[1])) / 2;
        groups[Math.min(BUCKETS - 1, Math.floor(t * BUCKETS))].push(e);
      }
      groups.forEach((g, gi) => {
        if (!g.length) return;
        ctx.strokeStyle = `hsla(${toHue((gi + 0.5) / BUCKETS)}, 100%, 62%, ${0.78 + near * 0.22})`;
        ctx.beginPath();
        for (const [i, j] of g) {
          ctx.moveTo(proj[i][0], proj[i][1]);
          ctx.lineTo(proj[j][0], proj[j][1]);
        }
        ctx.stroke();
      });
      for (let i = 0; i < N; i++) {
        const [px, py, pz] = proj[i];
        const r = 0.9 + (pz + 1) * 0.55 + Math.min(1.5, Math.hypot(vel[i][0], vel[i][1]) * 0.4);
        ctx.fillStyle = `hsl(${toHue(tone(i))}, 100%, 66%)`;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduce && visible) frame = requestAnimationFrame(draw);
    };

    const kick = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const onMove = (e: PointerEvent) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
      cx0 = e.clientX;
      lastMove = performance.now();
      cy0 = e.clientY;
    };
    // Click anywhere: the mesh bursts outward and settles back
    const onDown = () => {
      burst = 1;
      for (let i = 0; i < N; i++) {
        const a = Math.random() * Math.PI * 2;
        vel[i][0] += Math.cos(a) * 5;
        vel[i][1] += Math.sin(a) * 5;
      }
      kick();
    };
    const onLeave = () => {
      cx0 = -9999;
      cy0 = -9999;
    };
    const onVis = () => {
      visible = !document.hidden;
      if (visible) kick();
    };

    const onResize = () => {
      resize();
      kick();
    };

    const setMode = (n: number) => {
      alt = createAlt(n);
      roamInit = false;
      bolts.length = 0;
      fxCtx?.clearRect(0, 0, fxCv.width, fxCv.height);
      kick();
    };
    setMode(readOrb());
    const offOrb = onOrb(setMode);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", onResize);
    if (reduce) window.addEventListener("scroll", kick, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      offOrb();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", kick);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <>
      <div ref={wrap} className={styles.wrap} aria-hidden="true">
        <canvas ref={canvas} className={styles.canvas} />
      </div>
      <canvas ref={fx} className={styles.fx} aria-hidden="true" />
    </>
  );
}
