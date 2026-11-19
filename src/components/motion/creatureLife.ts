// The creature's inner life, on top of the basic roaming in Companion.tsx. It decides when the creature
// is doing something special (feeding, sniffing a button, running from a fast cursor, falling asleep,
// stepping through a portal, rampaging) and draws everything that lives outside its own body
// (slime trail, food, little copies, sparks, rings, floating labels).
//
// One call per frame: step() reads what is going on and answers with a target to swim to, a squash or
// stretch, a dimming and so on. Companion.tsx stays in charge of the body and the walls.

import { createMini, type Alt } from "./companionAlt";

export type Box = { l: number; t: number; r: number; b: number };
export type Seg = [number, number, number, number, number]; // x0, y0, x1, y1, width

// A fractal bolt: split a line at its middle, push the middle sideways, repeat, with thinning forks.
export function strike(x0: number, y0: number, x1: number, y1: number, disp: number, w: number, out: Seg[]) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 7) {
    out.push([x0, y0, x1, y1, w]);
    return;
  }
  const nx = -dy / len;
  const ny = dx / len;
  const off = (Math.random() - 0.5) * disp;
  const mx = (x0 + x1) / 2 + nx * off;
  const my = (y0 + y1) / 2 + ny * off;
  strike(x0, y0, mx, my, disp * 0.52, w, out);
  strike(mx, my, x1, y1, disp * 0.52, w, out);
  if (w >= 0.85 && Math.random() < 0.3) {
    const a = Math.atan2(dy, dx) + (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.5);
    const fl = len * (0.7 + Math.random() * 0.9);
    strike(mx, my, mx + Math.cos(a) * fl, my + Math.sin(a) * fl, disp * 0.45, w * 0.5, out);
  }
}

export type Control = {
  tx: number;
  ty: number;
  top: number; // top speed, px per frame
  gain: number; // how eagerly it follows the target
  shock: boolean; // touching a wall shocks it
  avoidText: number; // 0 ignores text boxes, 1 steers around them fully
};

export type LifeIn = {
  time: number;
  ax: number;
  ay: number;
  avx: number;
  avy: number;
  size: number;
  body: number; // radius of the visible body
  vw: number;
  vh: number;
  cx: number; // cursor, client px
  cy: number;
  cursorOn: boolean; // the cursor moved recently
  cursorSpeed: number; // px per second, smoothed
  led: boolean; // the cursor currently holds it
  light: boolean;
  tint: number; // 0..1 over a water section
  boxes: Box[];
};

export type LifeOut = {
  control: Control | null;
  teleport: { x: number; y: number } | null;
  sx: number; // squash and stretch of the whole body
  sy: number;
  dim: number; // 0..1 dozing
  rage: number; // 0..1 angry
  flash: number; // 0..1 bright blink
  speedMul: number;
};

const FED_KEY = "companion-fed";
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

function readFed(): number {
  try {
    return Number(localStorage.getItem(FED_KEY)) || 0;
  } catch {
    return 0;
  }
}

type Food = { x: number; y: number; age: number };
type Kid = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ph: number;
  age: number;
  alt: Alt; // its own little liquid, drawn the same way as the creature
  cv: HTMLCanvasElement;
  cx: CanvasRenderingContext2D;
  s: number;
};
type Spark = { x: number; y: number; vx: number; vy: number; age: number };
type Ring = { x: number; y: number; age: number; hue: number };
type Toast = { text: string; x: number; y: number; age: number };
type Arc = { segs: Seg[]; age: number };

export function createLife() {
  let enabled = false;
  let time = 0;
  let now = 0; // the same clock the creature uses, for the little ones
  // where the creature is, for click handling
  let px = 0;
  let py = 0;
  let pbody = 60;

  const foods: Food[] = [];
  const kids: Kid[] = [];
  const sparks: Spark[] = [];
  const rings: Ring[] = [];
  const toasts: Toast[] = [];
  const arcs: Arc[] = [];

  let fed = readFed();
  let flash = 0;
  let grow = 0; // after a meal
  let emotion: "pulse" | "curious" | "doze" | null = null;
  let emotionAt = 0;
  let dimNow = 0;

  // anger and sleep
  let ledT = 0;
  let sleepPhase: "none" | "go" | "rest" = "none";
  let sleepT = 0;
  let sleepX = 0;
  let sleepY = 0;

  // scare
  let fleeT = 0;
  let fleeCool = 0;
  let fleeFrom = { x: 0, y: 0 };

  // sniffing a button
  let sniffPhase: "none" | "go" | "dwell" = "none";
  let sniffT = 0;
  let sniffCool = 600;
  let sniffX = 0;
  let sniffY = 0;

  // portal and the visit to the Skills Universe
  let portalPhase: "none" | "out" | "in" = "none";
  let hideAfterOut = false; // the next portal does not bring it back at once: it waits for a new section
  let tourPhase: "none" | "welcome" | "visit" | "hidden" = "none";
  let tourCool = 0;
  let tourT = 0;
  let tourSeen = false; // already visited this time it was in the section
  let outFrames = 0; // frames spent away from the Universe section
  let tourQueue: HTMLElement[] = [];
  let tourEl: HTMLElement | null = null;
  let tourDwell = 0;
  let tourVisited = 0;
  let hiddenFrames = 0;
  let hiddenNow = false;
  let sectionId = "";
  let uniCount = 0; // how many galaxies, planets and the core are on screen
  let portalA = 0; // frames into the phase
  let portalTo: { x: number; y: number } | null = null;
  let teleportOut: { x: number; y: number } | null = null;

  // rampage
  let rampageT = 0;
  let rampWall = 0;
  let rampBag: number[] = [];
  let rampTarget = { x: 0, y: 0 };

  let idleFrames = 0;
  let lastCursorOn = false;

  const addRing = (x: number, y: number, hue = 300) => rings.push({ x, y, age: 0, hue });
  const addToast = (text: string, x: number, y: number) => toasts.push({ text, x, y, age: 0 });
  const water = (x: number, y: number, amp: number, r = 5) =>
    window.dispatchEvent(new CustomEvent("waterdrop", { detail: { x, y, amp, r } }));

  // ---- clicks: feeding and splitting ----
  const onDown = (e: PointerEvent) => {
    if (!enabled || hiddenNow) return;
    const t = e.target as Element | null;
    if (t?.closest("a, button, input, textarea, select, summary, label, [role='button'], header, nav, [data-lenis-prevent]")) return;
    const d = Math.hypot(e.clientX - px, e.clientY - py);
    if (d < pbody * 0.9) {
      // a click on the creature itself: it splits into little ones, or takes them back
      if (kids.length >= 3) {
        kids.forEach((k) => (k.age = 9999));
      } else {
        // each little one is a small copy of the creature: the same liquid, so the same colour and shape
        const cv = document.createElement("canvas");
        const s = Math.round((pbody / 0.38) * (0.46 - kids.length * 0.04));
        cv.width = s;
        cv.height = s;
        const cx = cv.getContext("2d");
        if (cx) kids.push({ x: px, y: py, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, ph: Math.random() * 6.28, age: 0, alt: createMini(), cv, cx, s });
        flash = 0.6;
      }
    } else if (foods.length < 3) {
      foods.push({ x: e.clientX, y: e.clientY, age: 0 });
    }
  };
  const onRampage = () => {
    rampageT = 540;
    rampBag = [];
    sleepPhase = "none";
    portalPhase = "none";
    tourPhase = "none";
    hideAfterOut = false;
    hiddenNow = false;
  };
  const onPortal = () => {
    // a quick hop to another spot (used for testing)
    if (portalPhase === "none" && tourPhase !== "hidden") {
      portalTo = null;
      portalPhase = "out";
      portalA = 0;
    }
  };
  window.addEventListener("pointerdown", onDown, { passive: true });
  window.addEventListener("creature-rampage", onRampage);
  const onTour = () => {
    // start the Skills Universe tour by hand (the creature must be over that section)
    tourSeen = false;
    tourCool = 0;
  };
  window.addEventListener("creature-portal", onPortal);
  window.addEventListener("creature-tour", onTour);

  const wallTarget = (vw: number, vh: number, wall: number) => ({
    x: wall === 0 ? -160 : wall === 1 ? vw + 160 : 80 + Math.random() * (vw - 160),
    y: wall === 2 ? -160 : wall === 3 ? vh + 160 : 80 + Math.random() * (vh - 160),
  });

  const pickSpot = (i: LifeIn): { x: number; y: number } => {
    let best = Infinity;
    let spot = { x: i.vw / 2, y: i.vh / 2 };
    for (let k = 0; k < 14; k++) {
      const x = i.body + 20 + Math.random() * (i.vw - 2 * i.body - 40);
      const y = i.body + 20 + Math.random() * (i.vh - 2 * i.body - 40);
      if (Math.hypot(x - i.ax, y - i.ay) < 350) continue;
      let cost = Math.random() * 0.2;
      for (const r of i.boxes) {
        const ox = Math.max(0, Math.min(x + i.body, r.r) - Math.max(x - i.body, r.l));
        const oy = Math.max(0, Math.min(y + i.body, r.b) - Math.max(y - i.body, r.t));
        cost += ox * oy;
      }
      if (cost < best) {
        best = cost;
        spot = { x, y };
      }
    }
    return spot;
  };

  // the places to visit in the Skills Universe: the core, the galaxies and the planets that are on screen
  const visibleUni = (i: LifeIn): HTMLElement[] =>
    Array.from(document.querySelectorAll<HTMLElement>("[data-uni]")).filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 4 && r.right > 0 && r.left < i.vw && r.bottom > 0 && r.top < i.vh && Number(getComputedStyle(el).opacity) > 0.05;
    });
  const buildQueue = (i: LifeIn): HTMLElement[] => visibleUni(i).sort(() => Math.random() - 0.5).slice(0, 8);

  const step = (i: LifeIn): LifeOut => {
    time = i.time;
    now = i.time;
    px = i.ax;
    py = i.ay;
    pbody = i.body;
    let control: Control | null = null;
    let sx = 1;
    let sy = 1;
    let speedMul = 1;
    teleportOut = null;

    // ---- which kind of place is it in? ----
    if (time - emotionAt > 12) {
      emotionAt = time;
      const sec = document.elementFromPoint(clamp(i.ax, 0, i.vw - 1), clamp(i.ay, 0, i.vh - 1))?.closest("section[id]")?.id;
      sectionId = sec ?? "";
      // the tour only starts when the galaxies are really on screen, not when the section's edge reaches it
      uniCount = sec === "universe" ? visibleUni(i).length : 0;
      emotion = sec === "skills" ? "pulse" : sec === "projects" ? "curious" : sec === "contact" ? "doze" : null;
    }
    let dimTarget = 0;
    if (emotion === "pulse") {
      // keeps a beat with the skills
      const b = Math.sin(time * 0.13);
      sx *= 1 + 0.09 * b;
      sy *= 1 + 0.09 * b;
    } else if (emotion === "curious") {
      // slows down and tilts its body like a head, looking at the work
      speedMul = 0.6;
      const w = Math.sin(time * 0.045);
      sx *= 1 + 0.06 * w;
      sy *= 1 - 0.06 * w;
    } else if (emotion === "doze") {
      speedMul = 0.45;
      dimTarget = 0.5;
      sx *= 1 + 0.03 * Math.sin(time * 0.03);
      sy *= 1 + 0.03 * Math.sin(time * 0.03);
    }

    // idle time: no cursor
    if (!i.cursorOn) idleFrames += 1;
    else idleFrames = 0;
    if (i.cursorOn !== lastCursorOn) lastCursorOn = i.cursorOn;

    // ---- anger ----
    if (i.led && sleepPhase === "none" && rampageT <= 0) ledT += 1;
    else ledT = Math.max(0, ledT - 2);
    let rage = rampageT > 0 ? 1 : clamp((ledT - 120) / 360, 0, 1);
    if (rage > 0.25 && time % Math.round(12 - rage * 8) === 0) {
      const a = Math.random() * Math.PI * 2;
      sparks.push({ x: i.ax + Math.cos(a) * i.body * 0.85, y: i.ay + Math.sin(a) * i.body * 0.85, vx: Math.cos(a) * (1.4 + Math.random() * 2.2), vy: Math.sin(a) * (1.4 + Math.random() * 2.2), age: 0 });
    }
    if (rage > 0.45 && time % 26 === 0) {
      const a = Math.random() * Math.PI * 2;
      const l = 55 + Math.random() * 70;
      const segs: Seg[] = [];
      strike(i.ax + Math.cos(a) * i.body * 0.8, i.ay + Math.sin(a) * i.body * 0.8, i.ax + Math.cos(a) * (i.body + l), i.ay + Math.sin(a) * (i.body + l), l * 0.5, 1.1, segs);
      arcs.push({ segs, age: 0 });
    }
    if (ledT > 600 && sleepPhase === "none" && rampageT <= 0) {
      // worn out: it goes to the nearest wall to sleep
      const dl = i.ax;
      const dr = i.vw - i.ax;
      const dt = i.ay;
      const db = i.vh - i.ay;
      const m = Math.min(dl, dr, dt, db);
      const pad = i.body * 0.9 + 6;
      sleepX = m === dl ? pad : m === dr ? i.vw - pad : clamp(i.ax, pad, i.vw - pad);
      sleepY = m === dt ? pad : m === db ? i.vh - pad : clamp(i.ay, pad, i.vh - pad);
      sleepPhase = "go";
      ledT = 0;
      rage = 0;
    }

    // ---- the Skills Universe: it dives in, tours the galaxies, vanishes, and comes back in a new section ----
    if (sectionId === "universe") outFrames = 0;
    else outFrames += 1;
    if (outFrames > 45) tourSeen = false; // it has left the section, so the next visit is a new one
    if (tourCool > 0) tourCool -= 1;
    if (
      sectionId === "universe" &&
      uniCount >= 3 &&
      !tourSeen &&
      tourCool <= 0 &&
      tourPhase === "none" &&
      portalPhase === "none" &&
      rampageT <= 0 &&
      sleepPhase === "none" &&
      !i.led &&
      fleeT <= 0
    ) {
      tourPhase = "welcome";
      tourT = 0;
      tourSeen = true;
    }
    hiddenNow = tourPhase === "hidden";

    // ---- priorities ----
    if (portalPhase !== "none") {
      // vanish, then reappear elsewhere
      portalA += 1;
      if (portalPhase === "out") {
        const k = clamp(portalA / 22, 0, 1);
        sx *= 1 - k;
        sy *= 1 - k;
        if (portalA === 1) {
          addRing(i.ax, i.ay, 280);
          if (i.tint > 0.5) water(i.ax, i.ay, 380, 5);
        }
        control = { tx: i.ax, ty: i.ay, top: 0.5, gain: 0.05, shock: false, avoidText: 0 };
        if (portalA >= 22) {
          if (hideAfterOut) {
            // it stays gone until the visitor has scrolled on to a new section
            hideAfterOut = false;
            portalPhase = "none";
            tourPhase = "hidden";
            hiddenFrames = 0;
          } else {
            const to = portalTo ?? pickSpot(i);
            portalTo = null;
            teleportOut = to;
            addRing(to.x, to.y, 320);
            if (i.tint > 0.5) water(to.x, to.y, 380, 5);
            portalPhase = "in";
            portalA = 0;
          }
        }
      } else {
        const k = clamp(portalA / 22, 0, 1);
        sx *= k;
        sy *= k;
        control = { tx: i.ax, ty: i.ay, top: 0.5, gain: 0.05, shock: false, avoidText: 0 };
        flash = Math.max(flash, 1 - k);
        if (portalA >= 22) portalPhase = "none";
      }
    } else if (tourPhase === "hidden") {
      // gone: invisible and untouchable until the visitor reaches a new section
      sx = 0;
      sy = 0;
      control = { tx: i.ax, ty: i.ay, top: 0, gain: 0.01, shock: false, avoidText: 0 };
      hiddenFrames += 1;
      // it comes back in the next section: as soon as the visitor has left the Universe (or after 12 s)
      if ((sectionId !== "universe" && outFrames > 45) || hiddenFrames > 720) {
        const to = pickSpot(i);
        teleportOut = to;
        addRing(to.x, to.y, 300);
        portalPhase = "in";
        portalA = 0;
        tourPhase = "none";
        tourCool = 480;
        hiddenNow = false;
        flash = 1;
        if (i.tint > 0.5) water(to.x, to.y, 380, 5);
      }
    } else if (rampageT > 0) {
      rampageT -= 1;
      if (Math.hypot(rampTarget.x - i.ax, rampTarget.y - i.ay) < i.body * 1.1 || rampTarget.x === 0 && rampTarget.y === 0) {
        if (!rampBag.length) rampBag = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
        rampWall = rampBag.pop() ?? 0;
        rampTarget = wallTarget(i.vw, i.vh, rampWall);
      }
      control = { tx: rampTarget.x, ty: rampTarget.y, top: 9, gain: 0.18, shock: true, avoidText: 0 };
    } else if (sleepPhase !== "none") {
      if (sleepPhase === "go") {
        control = { tx: sleepX, ty: sleepY, top: 2.2, gain: 0.06, shock: false, avoidText: 0.3 };
        if (Math.hypot(sleepX - i.ax, sleepY - i.ay) < 14) {
          sleepPhase = "rest";
          sleepT = 480;
        }
      } else {
        control = { tx: sleepX, ty: sleepY, top: 0.4, gain: 0.05, shock: false, avoidText: 0 };
        dimTarget = 1;
        const breath = Math.sin(time * 0.035);
        sx *= 1 + 0.04 * breath;
        sy *= 1 + 0.04 * breath;
        if (time % 70 === 0) addToast("z", i.ax + i.body * 0.75, i.ay + i.body * 0.1);
        sleepT -= 1;
        // a loud cursor right on top of it wakes it earlier
        if (i.cursorSpeed > 2600 && Math.hypot(i.cx - i.ax, i.cy - i.ay) < i.body * 1.5) sleepT = 0;
        if (sleepT <= 0) {
          sleepPhase = "none";
          flash = 1;
        }
      }
    } else if (tourPhase === "welcome" || tourPhase === "visit") {
      tourT += 1;
      // pure joy: it wobbles and bounces while it explores
      const wob = Math.sin(time * 0.42);
      sx *= 1 + 0.13 * wob;
      sy *= 1 - 0.13 * wob;
      const endTour = () => {
        hideAfterOut = true;
        portalPhase = "out";
        portalA = 0;
        tourPhase = "none";
        tourEl = null;
      };
      if (tourPhase === "welcome") {
        control = { tx: i.ax, ty: i.ay, top: 0.6, gain: 0.05, shock: false, avoidText: 0 };
        if (tourT === 1) {
          addRing(i.ax, i.ay, 200);
          flash = 1;
          for (let k = 0; k < 10; k++) {
            const a = (k / 10) * 6.28;
            sparks.push({ x: i.ax, y: i.ay, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, age: 0 });
          }
        }
        if (tourT > 28) {
          // the places to visit: the core, the galaxies and the planets that are on screen
          tourPhase = "visit";
          tourT = 0;
          tourEl = null;
          tourVisited = 0;
          tourQueue = buildQueue(i);
        }
      } else {
        if (!tourEl) {
          tourEl = tourQueue.shift() ?? null;
          tourDwell = 0;
          if (!tourEl) {
            // nothing to visit yet: the labels of the Universe fade in, so look again for a moment
            if (tourVisited === 0 && tourT < 240) {
              if (tourT % 12 === 0) tourQueue = buildQueue(i);
            } else endTour();
          }
        }
        if (tourEl) {
          const r = tourEl.getBoundingClientRect();
          if (r.width < 4 || r.right < 0 || r.left > i.vw || r.bottom < 0 || r.top > i.vh) {
            tourEl = null; // it moved off screen, skip it
          } else {
            const tx = clamp((r.left + r.right) / 2, i.body, i.vw - i.body);
            const ty = clamp((r.top + r.bottom) / 2, i.body, i.vh - i.body);
            control = { tx, ty, top: 6.8, gain: 0.14, shock: false, avoidText: 0 };
            if (Math.hypot(tx - i.ax, ty - i.ay) < 30) {
              tourDwell += 1;
              if (tourDwell === 1) {
                tourVisited += 1;
                // arrived: a burst of delight
                flash = 1;
                grow = 0.6;
                addRing(i.ax, i.ay, 180 + Math.random() * 150);
                for (let k = 0; k < 8; k++) {
                  const a = Math.random() * 6.28;
                  sparks.push({ x: i.ax, y: i.ay, vx: Math.cos(a) * 3.2, vy: Math.sin(a) * 3.2, age: 0 });
                }
              }
              if (tourDwell > 16) tourEl = null;
            }
          }
        }
        if (tourT > 1100) endTour();
      }
    } else if (fleeT > 0) {
      fleeT -= 1;
      const dx = i.ax - fleeFrom.x;
      const dy = i.ay - fleeFrom.y;
      const d = Math.hypot(dx, dy) || 1;
      control = {
        tx: clamp(i.ax + (dx / d) * 420, i.body, i.vw - i.body),
        ty: clamp(i.ay + (dy / d) * 420, i.body, i.vh - i.body),
        top: 8,
        gain: 0.2,
        shock: false,
        avoidText: 0,
      };
      // it shrinks away like a startled animal and springs back
      const k = clamp(fleeT / 14, 0, 1);
      sy *= 1 - 0.3 * k;
      sx *= 1 + 0.18 * k;
    } else if (foods.length) {
      // the nearest piece of food
      let best = foods[0];
      for (const f of foods) if (Math.hypot(f.x - i.ax, f.y - i.ay) < Math.hypot(best.x - i.ax, best.y - i.ay)) best = f;
      control = { tx: best.x, ty: best.y, top: 4.4, gain: 0.09, shock: false, avoidText: 0.15 };
      if (Math.hypot(best.x - i.ax, best.y - i.ay) < i.body * 0.55) {
        foods.splice(foods.indexOf(best), 1);
        fed += 1;
        try {
          localStorage.setItem(FED_KEY, String(fed));
        } catch {
          /* storage can be blocked */
        }
        addToast(`+1  ·  ${fed}`, i.ax, i.ay - i.body);
        flash = 1;
        grow = 1;
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * 6.28;
          sparks.push({ x: i.ax, y: i.ay, vx: Math.cos(a) * 2.4, vy: Math.sin(a) * 2.4, age: 0 });
        }
      }
    } else if (sniffPhase !== "none") {
      sniffT += 1;
      const wob = Math.sin(time * 0.2) * 3;
      control = { tx: sniffX + wob, ty: sniffY + wob * 0.4, top: 3.2, gain: 0.08, shock: false, avoidText: 0 };
      if (sniffPhase === "go") {
        if (Math.hypot(sniffX - i.ax, sniffY - i.ay) < 16 || sniffT > 420) {
          sniffPhase = "dwell";
          sniffT = 0;
        }
      } else {
        // sniffing: it blinks a few times
        if (sniffT % 36 === 8) flash = 0.9;
        if (sniffT > 150 || i.cursorOn) {
          sniffPhase = "none";
          sniffCool = 1500;
        }
      }
    } else if (
      i.cursorOn &&
      !i.led &&
      i.cursorSpeed > 2600 &&
      fleeCool <= 0 &&
      Math.hypot(i.cx - i.ax, i.cy - i.ay) < i.size * 1.6
    ) {
      // a fast cursor flying at it frightens it
      fleeT = 50;
      fleeCool = 140;
      fleeFrom = { x: i.cx, y: i.cy };
    } else if (!i.led && i.cursorOn && i.cursorSpeed < 500) {
      // a calm cursor nearby calls it over, but only up to arm's length
      const d = Math.hypot(i.cx - i.ax, i.cy - i.ay);
      if (d > i.body + 62 && d < i.size * 1.9) {
        const dx = i.ax - i.cx;
        const dy = i.ay - i.cy;
        const l = Math.hypot(dx, dy) || 1;
        control = {
          tx: i.cx + (dx / l) * (i.body + 70),
          ty: i.cy + (dy / l) * (i.body + 70),
          top: 1.7,
          gain: 0.05,
          shock: false,
          avoidText: 0.6,
        };
      }
    }

    // start a visit to a button when nobody is around
    if (
      !control &&
      !i.led &&
      sniffPhase === "none" &&
      sniffCool <= 0 &&
      idleFrames > 360 &&
      rampageT <= 0
    ) {
      const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-creature-cta]")).filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 20 && r.bottom > 60 && r.top < i.vh - 20 && r.right > 0 && r.left < i.vw;
      });
      if (targets.length) {
        const el = targets[Math.floor(Math.random() * targets.length)];
        const r = el.getBoundingClientRect();
        const cx = (r.left + r.right) / 2;
        const cy = (r.top + r.bottom) / 2;
        const dx = i.ax - cx;
        const dy = i.ay - cy;
        const l = Math.hypot(dx, dy) || 1;
        const reach = Math.max(r.width, r.height) / 2 + i.body * 0.7;
        sniffX = clamp(cx + (dx / l) * reach, i.body, i.vw - i.body);
        sniffY = clamp(cy + (dy / l) * reach, i.body, i.vh - i.body);
        sniffPhase = "go";
        sniffT = 0;
      } else sniffCool = 300;
    }
    if (sniffCool > 0) sniffCool -= 1;
    if (fleeCool > 0) fleeCool -= 1;

    // growth after a meal, easing back
    if (grow > 0) {
      const g = 1 + 0.2 * Math.sin(grow * Math.PI);
      sx *= g;
      sy *= g;
      grow = Math.max(0, grow - 0.018);
    }
    flash = Math.max(0, flash - 0.035);
    dimNow += (dimTarget - dimNow) * 0.04;

    // little copies follow it around and come back after a while
    for (let n = kids.length - 1; n >= 0; n--) {
      const k = kids[n];
      k.age += 1;
      const ang = time * 0.035 + k.ph;
      const orbit = i.body * (1.25 + n * 0.25);
      let tx = i.ax + Math.cos(ang) * orbit;
      let ty = i.ay + Math.sin(ang) * orbit * 0.8;
      const merging = k.age > 540;
      if (merging) {
        tx = i.ax;
        ty = i.ay;
      }
      k.vx += (tx - k.x) * 0.03 - k.vx * 0.15;
      k.vy += (ty - k.y) * 0.03 - k.vy * 0.15;
      k.x += k.vx;
      k.y += k.vy;
      if (merging && Math.hypot(k.x - i.ax, k.y - i.ay) < i.body * 0.6) {
        kids.splice(n, 1);
        flash = Math.max(flash, 0.7);
        grow = Math.max(grow, 0.7);
      }
    }

    // ageing of the things it leaves around
    for (let n = foods.length - 1; n >= 0; n--) if (++foods[n].age > 600) foods.splice(n, 1);
    for (let n = sparks.length - 1; n >= 0; n--) {
      const s = sparks[n];
      s.age += 1;
      s.x += s.vx;
      s.y += s.vy;
      s.vx *= 0.94;
      s.vy *= 0.94;
      if (s.age > 20) sparks.splice(n, 1);
    }
    for (let n = rings.length - 1; n >= 0; n--) if (++rings[n].age > 36) rings.splice(n, 1);
    for (let n = toasts.length - 1; n >= 0; n--) {
      toasts[n].age += 1;
      toasts[n].y -= 0.45;
      if (toasts[n].age > 80) toasts.splice(n, 1);
    }
    for (let n = arcs.length - 1; n >= 0; n--) if (++arcs[n].age > 9) arcs.splice(n, 1);

    return { control, teleport: teleportOut, sx, sy, dim: dimNow, rage, flash, speedMul };
  };

  // the creature's wall hit while rampaging chooses the next wall at once
  const onWallHit = () => {
    if (rampageT > 0) rampTarget = { x: 0, y: 0 };
  };

  // ---- drawing ----
  const textColor = (light: boolean, tint: number) => (tint > 0.5 ? "#ff4fe0" : light ? "#111" : "#e9eef5");

  const draw = (g: CanvasRenderingContext2D, light: boolean, tint: number) => {
    const textCol = textColor(light, tint);
    // food: a glowing seed that pulses until it is eaten
    for (const f of foods) {
      const life = 1 - f.age / 600;
      const pulse = 1 + 0.25 * Math.sin(f.age * 0.18);
      const hue = tint > 0.5 ? 320 : light ? 260 : 190;
      const gr = g.createRadialGradient(f.x, f.y, 0, f.x, f.y, 26 * pulse);
      gr.addColorStop(0, `hsla(${hue}, 100%, ${light ? 45 : 75}%, ${0.9 * life})`);
      gr.addColorStop(1, `hsla(${hue}, 100%, ${light ? 45 : 60}%, 0)`);
      g.fillStyle = gr;
      g.beginPath();
      g.arc(f.x, f.y, 26 * pulse, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = light ? "#222" : "#fff";
      g.beginPath();
      g.arc(f.x, f.y, 3.2, 0, Math.PI * 2);
      g.fill();
    }
    // little copies
    for (const k of kids) {
      k.alt({
        ctx: k.cx,
        size: k.s,
        time: now,
        ry: 0,
        tilt: 0,
        prog: 0,
        speed: 0,
        burst: 0,
        ptr: null,
        light,
        shock: 0,
        vx: k.vx,
        vy: k.vy,
        tint,
        dim: 0,
        flash: 0,
        rage: 0,
      });
      g.drawImage(k.cv, k.x - k.s / 2, k.y - k.s / 2);
    }
    // sparks and small arcs while it is angry
    g.globalCompositeOperation = light ? "source-over" : "lighter";
    g.lineCap = "round";
    for (const s of sparks) {
      const life = 1 - s.age / 20;
      g.strokeStyle = light ? `rgba(20,30,255,${life})` : `rgba(120,200,255,${life})`;
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(s.x, s.y);
      g.lineTo(s.x - s.vx * 3, s.y - s.vy * 3);
      g.stroke();
    }
    for (const a of arcs) {
      const life = 1 - a.age / 9;
      for (const [mul, col] of [
        [3, light ? `rgba(30,0,255,${0.2 * life})` : `rgba(40,60,255,${0.25 * life})`],
        [0.9, `rgba(0,140,255,${life})`],
        [0.35, `rgba(210,245,255,${life})`],
      ] as const) {
        g.strokeStyle = col;
        for (const [x0, y0, x1, y1, w] of a.segs) {
          g.lineWidth = Math.max(0.4, w * mul);
          g.beginPath();
          g.moveTo(x0, y0);
          g.lineTo(x1, y1);
          g.stroke();
        }
      }
    }
    // portal rings
    for (const r of rings) {
      const k = r.age / 36;
      g.strokeStyle = `hsla(${r.hue}, 100%, ${light ? 45 : 70}%, ${1 - k})`;
      g.lineWidth = 2.2 * (1 - k) + 0.6;
      g.beginPath();
      g.arc(r.x, r.y, 8 + k * 120, 0, Math.PI * 2);
      g.stroke();
    }
    g.globalCompositeOperation = "source-over";
    // floating labels
    g.textAlign = "center";
    for (const t of toasts) {
      const k = t.age / 80;
      g.globalAlpha = Math.min(1, (1 - k) * 1.6);
      g.fillStyle = textCol;
      g.font = t.text === "z" ? `italic 700 ${14 + t.age * 0.2}px system-ui, sans-serif` : "700 15px system-ui, sans-serif";
      g.fillText(t.text, t.x, t.y);
    }
    g.globalAlpha = 1;
  };

  const dispose = () => {
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("creature-rampage", onRampage);
    window.removeEventListener("creature-portal", onPortal);
    window.removeEventListener("creature-tour", onTour);
  };

  return {
    step,
    draw,
    dispose,
    onWallHit,
    setEnabled: (v: boolean) => {
      enabled = v;
    },
    rampaging: () => rampageT > 0,
    fedCount: () => fed,
  };
}

export type Life = ReturnType<typeof createLife>;
