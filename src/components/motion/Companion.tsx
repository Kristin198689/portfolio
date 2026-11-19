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

  useEffect(() => {
    const box = wrap.current;
    const cv = canvas.current;
    if (!box || !cv) return;
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
        box.style.transform = `translate3d(${x}px, ${y}px, 0)`;
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
        alt({ ctx, size, time, ry, tilt, prog, speed: Math.min(1, Math.abs(dy) / 80), burst, ptr, light });
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
    <div ref={wrap} className={styles.wrap} aria-hidden="true">
      <canvas ref={canvas} className={styles.canvas} />
    </div>
  );
}
