// Small helpers shared by the experiments: sizing, an animation loop that sleeps when it is off screen
// or the tab is hidden, pointer tracking and the colours of the current theme.

export function dprCap(): number {
  if (typeof window === "undefined") return 1;
  const weak = (navigator.hardwareConcurrency ?? 8) <= 4 || window.innerWidth < 600;
  return Math.min(window.devicePixelRatio || 1, weak ? 1.5 : 2);
}

export function observeSize(el: Element, cb: (w: number, h: number) => void): () => void {
  const ro = new ResizeObserver(() => {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) cb(r.width, r.height);
  });
  ro.observe(el);
  const r = el.getBoundingClientRect();
  if (r.width > 0 && r.height > 0) cb(r.width, r.height);
  return () => ro.disconnect();
}

export type Loop = { stop: () => void; invalidate: () => void };

// Runs `frame` with requestAnimationFrame only while `host` is visible and the tab is active.
// With `reduced` it draws single frames on demand (invalidate) instead of animating.
export function createLoop(
  host: Element,
  frame: (t: number, dt: number) => void,
  reduced: boolean,
): Loop {
  let raf = 0;
  let visible = true;
  let stopped = false;
  let last = performance.now();
  const t0 = last;
  const tick = (now: number) => {
    raf = 0;
    if (stopped || !visible || document.hidden) return;
    frame((now - t0) / 1000, Math.min((now - last) / 1000, 0.05));
    last = now;
    if (!reduced) raf = requestAnimationFrame(tick);
  };
  const kick = () => {
    if (raf || stopped || !visible || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) kick();
    else if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });
  io.observe(host);
  const onVis = () => (document.hidden ? undefined : kick());
  document.addEventListener("visibilitychange", onVis);
  kick();
  return {
    invalidate: kick,
    stop: () => {
      stopped = true;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    },
  };
}

export type Pointer = {
  x: number; // px inside the element
  y: number;
  nx: number; // -1..1 from the centre
  ny: number;
  vx: number; // smoothed velocity in px per frame
  vy: number;
  inside: boolean;
  down: boolean;
};

export function trackPointer(el: HTMLElement, onMove?: () => void): { p: Pointer; dispose: () => void } {
  const p: Pointer = { x: 0, y: 0, nx: 0, ny: 0, vx: 0, vy: 0, inside: false, down: false };
  const set = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    p.vx = p.vx * 0.6 + (x - p.x) * 0.4;
    p.vy = p.vy * 0.6 + (y - p.y) * 0.4;
    p.x = x;
    p.y = y;
    p.nx = (x / r.width) * 2 - 1;
    p.ny = (y / r.height) * 2 - 1;
    p.inside = true;
    onMove?.();
  };
  const enter = (e: PointerEvent) => {
    set(e);
    p.vx = 0;
    p.vy = 0;
  };
  const leave = () => {
    p.inside = false;
    p.down = false;
  };
  const down = (e: PointerEvent) => {
    p.down = true;
    set(e);
  };
  const up = () => (p.down = false);
  el.addEventListener("pointerenter", enter);
  el.addEventListener("pointermove", set);
  el.addEventListener("pointerleave", leave);
  el.addEventListener("pointerdown", down);
  window.addEventListener("pointerup", up);
  return {
    p,
    dispose: () => {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointermove", set);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    },
  };
}

export function colors(el: Element): { fg: string; bg: string; accent: string } {
  const cs = getComputedStyle(el);
  const pick = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  return {
    fg: pick("--color-on-field", "#fafaf7"),
    bg: pick("--color-field", "#0a0a0a"),
    accent: "#bdb8fc",
  };
}

// "#rrggbb" or "rgb(...)" to 0..1 floats, for shader uniforms.
export function toRgb(css: string): [number, number, number] {
  const c = document.createElement("canvas").getContext("2d");
  if (!c) return [1, 1, 1];
  c.fillStyle = "#000";
  c.fillStyle = css;
  const v = c.fillStyle;
  if (v.startsWith("#")) {
    const n = parseInt(v.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  const m = v.match(/\d+(\.\d+)?/g) ?? ["255", "255", "255"];
  return [Number(m[0]) / 255, Number(m[1]) / 255, Number(m[2]) / 255];
}
