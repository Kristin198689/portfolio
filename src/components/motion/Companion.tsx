"use client";

import { useEffect, useRef } from "react";
import { createAlt, type Alt } from "./companionAlt";
import { onOrb, readOrb } from "@/lib/orb";
import { createLife, strike, type Box, type Seg } from "./creatureLife";
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

// Rectangles of the text and controls currently on screen. The creature stays off them.
function readTextBoxes(): Box[] {
  const out: Box[] = [];
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  document.querySelectorAll<HTMLElement>("h1, h2, h3, p, li, dt, dd, label, input, textarea, button, a[href]").forEach((el) => {
    const hasText = el.tagName === "INPUT" || el.tagName === "TEXTAREA" || (el.textContent ?? "").trim().length > 0;
    if (!hasText || el.closest("[aria-hidden='true']")) return;
    const r = el.getBoundingClientRect();
    if (r.width < 24 || r.height < 10 || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) return;
    if (r.width > vw * 0.95 && r.height > vh * 0.5) return; // a wrapper, not a text line
    out.push({ l: r.left, t: r.top, r: r.right, b: r.bottom });
  });
  return out;
}

// Lightning between a wall and the creature. Each strike is a fractal: a line is split at its middle,
// the middle is pushed sideways, and both halves are split again. Forks branch off the main path and
// thin out. A real flash restrikes a few times along a slightly different path, which is what makes
// it read as lightning and not as a zigzag.
type Bolt = { x: number; y: number; wall: "l" | "r" | "t" | "b"; age: number; segs: Seg[] };
const BOLT_LIFE = 22;
const RESTRIKE = [0, 3, 7, 12];

function drawBolts(g: CanvasRenderingContext2D, bolts: Bolt[], ax: number, ay: number, light: boolean) {
  const W = g.canvas.width;
  const H = g.canvas.height;
  g.clearRect(0, 0, W, H);
  for (let i = bolts.length - 1; i >= 0; i--) {
    bolts[i].age += 1;
    if (bolts[i].age > BOLT_LIFE) bolts.splice(i, 1);
  }
  if (!bolts.length) return;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.globalCompositeOperation = light ? "source-over" : "lighter";
  for (const b of bolts) {
    if (RESTRIKE.includes(b.age)) {
      b.segs = [];
      const wx = b.wall === "l" ? 0 : b.wall === "r" ? W : b.x;
      const wy = b.wall === "t" ? 0 : b.wall === "b" ? H : b.y;
      const along = b.wall === "l" || b.wall === "r" ? [0, 1] : [1, 0];
      const reach = Math.hypot(ax - wx, ay - wy);
      strike(wx, wy, ax + (Math.random() - 0.5) * 24, ay + (Math.random() - 0.5) * 24, reach * 0.42, 1.7, b.segs);
      // a crackle that runs along the wall in both directions
      for (const dir of [-1, 1]) {
        const len = 60 + Math.random() * 120;
        strike(wx, wy, wx + along[0] * dir * len, wy + along[1] * dir * len, 22, 1.2, b.segs);
      }
    }
    const life = 1 - b.age / BOLT_LIFE;
    // the light stutters, strongest right at each restrike
    const since = b.age - Math.max(...RESTRIKE.filter((r) => r <= b.age));
    const flick = Math.max(0.28, 1 - since * 0.16) * life;
    const wx = b.wall === "l" ? 0 : b.wall === "r" ? W : b.x;
    const wy = b.wall === "t" ? 0 : b.wall === "b" ? H : b.y;
    // a bright pool of light where it touches the wall
    const pool = g.createRadialGradient(wx, wy, 0, wx, wy, 110);
    pool.addColorStop(0, `rgba(30, 110, 255, ${0.55 * flick})`);
    pool.addColorStop(0.4, `rgba(0, 70, 255, ${0.18 * flick})`);
    pool.addColorStop(1, "rgba(0, 40, 255, 0)");
    g.fillStyle = pool;
    g.beginPath();
    g.arc(wx, wy, 110, 0, Math.PI * 2);
    g.fill();
    for (const [mul, color] of [
      [3.2, light ? `rgba(30, 0, 255, ${0.2 * flick})` : `rgba(40, 60, 255, ${0.22 * flick})`], // faint bloom
      [1.5, light ? `rgba(20, 30, 255, ${0.55 * flick})` : `rgba(10, 90, 255, ${0.6 * flick})`], // halo
      [0.8, `rgba(0, 140, 255, ${flick})`], // electric blue line
      [0.35, `rgba(200, 245, 255, ${flick})`], // hot thin core
    ] as const) {
      g.strokeStyle = color;
      for (const [x0, y0, x1, y1, w] of b.segs) {
        g.lineWidth = Math.max(0.5, w * mul);
        g.beginPath();
        g.moveTo(x0, y0);
        g.lineTo(x1, y1);
        g.stroke();
      }
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
    const life = createLife();
    let mouseSpd = 0; // cursor speed in px per second, smoothed
    let lastMoveT = 0;
    let lifeOut: ReturnType<typeof life.step> | null = null;
    let lastMove = 0;
    let ax = 0;
    let ay = 0;
    let avx = 0;
    let avy = 0;
    let roamInit = false;
    let shock = 0;
    let shockCool = 0;
    // every few seconds it tries to break out through a wall; the wall always wins
    let mood: "rest" | "hunt" | "escape" = "rest";
    let moodT = 120;
    let ex = 0;
    let ey = 0;
    let escapeAge = 0;
    let walls: number[] = []; // a shuffled bag, so every wall gets its turn
    let tint = 0;
    let textBoxes: Box[] = [];
    let grip = 0; // how firmly the cursor holds it, 0 to 1
    let ccx = 0;
    let ccy = 0;
    let dirx = 1;
    let diry = 0;
    let tintTarget = 0;
    const bolts: Bolt[] = [];
    // Per-point spring offsets: the cursor pushes points away, they spring back
    const off = Array.from({ length: N }, () => [0, 0]);
    const vel = Array.from({ length: N }, () => [0, 0]);
    const BUCKETS = 14;
    let frame = 0;
    let visible = true;

    const startEscape = (vw: number, vh: number, ra: number, boxes: Box[]) => {
      if (!walls.length) walls = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
      const wall = walls.pop() ?? 0;
      // try several spots along the wall and take the one with the least text next to it
      let best = Infinity;
      for (let k = 0; k < 9; k++) {
        const along = 0.1 + Math.random() * 0.8;
        const px = wall === 0 ? ra : wall === 1 ? vw - ra : along * vw;
        const py = wall === 2 ? ra : wall === 3 ? vh - ra : along * vh;
        let cost = Math.random() * 0.2;
        for (const r of boxes) {
          const ox = Math.max(0, Math.min(px + ra, r.r) - Math.max(px - ra, r.l));
          const oy = Math.max(0, Math.min(py + ra, r.b) - Math.max(py - ra, r.t));
          cost += ox * oy;
        }
        if (cost < best) {
          best = cost;
          ex = wall === 0 ? -160 : wall === 1 ? vw + 160 : px;
          ey = wall === 2 ? -160 : wall === 3 ? vh + 160 : py;
        }
      }
      mood = "escape";
      escapeAge = 0;
    };

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
          const cursorOn = cx0 > -9000 && performance.now() - lastMove < 5000;
          // Text blocks on screen, re-read now and then: the creature steers around them.
          if (time % 24 === 0) textBoxes = readTextBoxes();
          const body = size * 0.38; // the visible body is an oval with drops around it, so count a generous radius
          // the creature's inner life: feeding, sniffing, fear, sleep, portals... it may take over the controls
          mouseSpd *= 0.93;
          life.setEnabled(true);
          const L = life.step({ time, ax, ay, avx, avy, size, body, vw, vh, cx: cx0, cy: cy0, cursorOn, cursorSpeed: mouseSpd, led: mood === "hunt", light, tint, boxes: textBoxes });
          if (L.teleport) {
            ax = L.teleport.x;
            ay = L.teleport.y;
            avx = 0;
            avy = 0;
          }
          const ctrl = L.control;
          lifeOut = L;
          if (ctrl && mood === "hunt") {
            mood = "rest";
            moodT = 40;
          }
          // It obeys a cursor that comes close to its body (about 25 px from the edge) and then keeps a
          // fixed gap to it: the cursor stays outside, the creature follows at arm's length. The grip
          // holds while the cursor stays near and lets go slowly when it is clearly gone, so it never
          // flickers between "led" and "free".
          const cd = Math.hypot(ax - cx0, ay - cy0);
          if (!ctrl && cursorOn && cd < body + 28) grip = Math.min(1, grip + 0.2);
          else if (!ctrl && cursorOn && cd < body + 80) grip = grip > 0 ? grip : 0; // in the band: keep what it has
          else grip = Math.max(0, grip - 0.03);
          const led = grip > 0.3;
          if (led) {
            if (mood !== "hunt") {
              mood = "hunt";
              ccx = cx0;
              ccy = cy0;
              const r0 = Math.hypot(ax - cx0, ay - cy0) || 1;
              dirx = (ax - cx0) / r0;
              diry = (ay - cy0) / r0;
            }
          } else if (mood === "hunt") {
            mood = "rest";
            moodT = 60;
          }
          if (mood === "escape" && (escapeAge += 1) > 600) mood = "rest";
          if (mood === "rest") {
            moodT -= 1;
            if (moodT <= 0) startEscape(vw, vh, ra, textBoxes);
          }
          let tx = ax;
          let ty = ay;
          if (ctrl) {
            tx = ctrl.tx;
            ty = ctrl.ty;
          } else if (mood === "escape") {
            tx = ex;
            ty = ey;
          } else if (mood === "hunt" && cursorOn) {
            // smooth the cursor and the side it is on, so mouse jitter never reaches the creature
            ccx += (cx0 - ccx) * 0.3;
            ccy += (cy0 - ccy) * 0.3;
            const rx = ax - ccx;
            const ry = ay - ccy;
            const rl = Math.hypot(rx, ry) || 1;
            dirx += (rx / rl - dirx) * 0.1;
            diry += (ry / rl - diry) * 0.1;
            const dl = Math.hypot(dirx, diry) || 1;
            tx = ccx + (dirx / dl) * (body + 20);
            ty = ccy + (diry / dl) * (body + 20);
            // the target never goes past the electrified walls: a led creature stops at the wall
            tx = Math.min(vw - ra, Math.max(ra, tx));
            ty = Math.min(vh - ra, Math.max(ra, ty));
          }
          const dx = tx - ax;
          const dy = ty - ay;
          const dist = Math.hypot(dx, dy) || 1;
          if (ctrl) {
            // something special is going on: its own speed and eagerness
            const sp = Math.min(ctrl.top, dist * ctrl.gain * 1.6);
            const k = Math.min(0.3, 0.04 + ctrl.gain);
            avx += ((dx / dist) * sp - avx) * k;
            avy += ((dy / dist) * sp - avy) * k;
          } else if (mood === "hunt") {
            // a damped spring: eases in, eases out, no overshoot, no twitching
            avx += dx * 0.035 - avx * 0.34;
            avy += dy * 0.035 - avy * 0.34;
            const v = Math.hypot(avx, avy);
            if (v > 9) {
              avx = (avx / v) * 9;
              avy = (avy / v) * 9;
            }
          } else {
            const top = (mood === "escape" ? 4.75 : 0.68) * L.speedMul;
            const sp = mood === "escape" ? top : Math.min(top, dist * 0.07);
            avx += (((dx / dist) * sp) - avx) * (mood === "escape" ? 0.1 : 0.05);
            avy += (((dy / dist) * sp) - avy) * (mood === "escape" ? 0.1 : 0.05);
          }
          // steer around text: inside a padded text box it is pushed out by the shortest way
          if (!ctrl || ctrl.avoidText > 0) {
            for (const r of textBoxes) {
              const pad = ra * 0.9;
              if (ax > r.l - pad && ax < r.r + pad && ay > r.t - pad && ay < r.b + pad) {
                const toL = ax - (r.l - pad);
                const toR = r.r + pad - ax;
                const toT = ay - (r.t - pad);
                const toB = r.b + pad - ay;
                const m = Math.min(toL, toR, toT, toB);
                const push = ctrl ? 0.22 * ctrl.avoidText : mood === "escape" ? 0.05 : mood === "hunt" ? 0.02 : 0.22; // a dash for the wall only bends around text
                if (m === toL) avx -= push;
                else if (m === toR) avx += push;
                else if (m === toT) avy -= push;
                else avy += push;
              }
            }
          }
          ax += avx;
          ay += avy;
          // swimming makes waves: over a water section every movement stirs the surface
          if (tintTarget > 0.5) {
            const speedNow = Math.hypot(avx, avy);
            if (speedNow > 0.25 && time % 2 === 0) {
              window.dispatchEvent(new CustomEvent("waterdrop", { detail: { x: ax, y: ay, amp: 6 + speedNow * 12, r: 3 } }));
            } else if (time % 45 === 0) {
              window.dispatchEvent(new CustomEvent("waterdrop", { detail: { x: ax, y: ay, amp: 55, r: 3 } })); // a slow breath of its own
            }
          }
          // the electrified walls
          const hit = (wall: "l" | "r" | "t" | "b") => {
            if (mood === "hunt" || (ctrl && !ctrl.shock)) {
              // being led into a wall: it just stops there, no bounce
              if (wall === "l" || wall === "r") avx = 0;
              else avy = 0;
              return;
            }
            avx = wall === "l" ? Math.abs(avx) + 3 : wall === "r" ? -Math.abs(avx) - 3 : avx * -0.6;
            avy = wall === "t" ? Math.abs(avy) + 3 : wall === "b" ? -Math.abs(avy) - 3 : avy * -0.6;
            if (mood === "escape") {
              mood = "rest";
              moodT = 20 + Math.random() * 40; // catches its breath before the next try
            }
            if (shockCool <= 0) {
              shock = 1;
              shockCool = 30;
              life.onWallHit();
              burst = 1;
              if (tintTarget > 0.5) window.dispatchEvent(new CustomEvent("waterdrop", { detail: { x: ax, y: ay, amp: 420, r: 5 } }));
              bolts.push({ x: Math.min(vw, Math.max(0, ax)), y: Math.min(vh, Math.max(0, ay)), wall, age: 0, segs: [] });
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
          box.style.transform = `translate3d(${ax - vw + size / 2}px, ${ay - size / 2}px, 0) scale(${L.sx.toFixed(3)}, ${L.sy.toFixed(3)})`;
        } else {
          roamInit = false;
          life.setEnabled(false);
          lifeOut = null;
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
        if (time % 8 === 1) {
          // over a water section the liquid turns acid green
          const r1 = box.getBoundingClientRect();
          const mx0 = r1.left + r1.width / 2;
          const my0 = r1.top + r1.height / 2;
          tintTarget = 0;
          document.querySelectorAll<HTMLElement>("[data-waterfx]").forEach((el) => {
            const e = el.getBoundingClientRect();
            if (mx0 > e.left && mx0 < e.right && my0 > e.top && my0 < e.bottom) tintTarget = 1;
          });
        }
        tint += (tintTarget - tint) * 0.08;
        alt({ ctx, size, time, ry, tilt, prog, speed: Math.min(1, Math.abs(dy) / 80), burst, ptr: mood === "hunt" ? null : ptr, light, shock, vx: avx, vy: avy, tint, dim: lifeOut?.dim ?? 0, flash: lifeOut?.flash ?? 0, rage: lifeOut?.rage ?? 0 });
        if (fxCtx) {
          drawBolts(fxCtx, bolts, ax, ay, light);
          if (lifeOut) life.draw(fxCtx, light, tint);
        }
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
      const dtMs = e.timeStamp - lastMoveT;
      if (dtMs > 0 && dtMs < 200 && cx0 > -9000) mouseSpd = mouseSpd * 0.5 + (Math.hypot(e.clientX - cx0, e.clientY - cy0) / dtMs) * 1000 * 0.5;
      lastMoveT = e.timeStamp;
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
      life.dispose();
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
