// Alternative looks for the companion. A look paints one frame into the square 2D canvas.

export type Frame = {
  ctx: CanvasRenderingContext2D;
  size: number;
  time: number;
  ry: number; // spin
  tilt: number;
  prog: number; // page scroll progress, 0 to 1
  speed: number; // how fast the page is scrolling, 0 to 1
  burst: number; // 1 right after a click, fades to 0
  ptr: { x: number; y: number } | null; // pointer in canvas px, or null
  light: boolean; // the page behind it is light
};
export type Alt = (f: Frame) => void;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

// 1. Liquid metal. Blobs of liquid give a smooth "field"; where it is above a threshold there is
//    liquid. The surface is a smooth puddle, the normal comes from the field, and every pixel reflects
//    a studio-like environment that slowly turns. Blobs merge and split like real liquid.
//    On dark sections it is silver mirror, on light sections it is pure glossy black.
//    The pointer pulls a long, stretchy tendril out of it, a click throws it into waves.
function liquid(): Alt {
  const G = 160; // the field is computed on a coarse grid and scaled up smoothly
  const field = new Float32Array(G * G);
  const raw = new Float32Array(G * G);
  const height = new Float32Array(G * G);
  const off = document.createElement("canvas");
  off.width = G;
  off.height = G;
  const octx = off.getContext("2d")!;
  const img = octx.createImageData(G, G);
  const px = img.data;

  type Blob = { x: number; y: number; r: number; vx: number; vy: number; ox: number; oy: number };
  const blobs: Blob[] = Array.from({ length: 8 }, () => ({ x: 0, y: 0, r: 0, vx: 0, vy: 0, ox: 0, oy: 0 }));
  // a chain of beads from the body toward the pointer: together they form one stretched tendril
  const chain = Array.from({ length: 6 }, () => ({ x: 0, y: 0 }));
  let pull = 0; // how far the tendril is out, eased
  let mix = 0; // 0 = dark page, 1 = light page, eased so the change of material is smooth

  return (f) => {
    const { ctx, size, time } = f;
    const c = size / 2;
    const cell = size / G;
    const t = time * 0.004;
    mix += ((f.light ? 1 : 0) - mix) * 0.08;

    // where the liquid is: a heavy core and seven drops that orbit, merge with it and break away
    const agit = 1 + f.speed * 0.9;
    const wave = 1 + f.burst * 0.35 * Math.sin(time * 0.5);
    blobs.forEach((b, i) => {
      const core = i === 0;
      const a = t * (2.2 + i * 0.55) * (i % 2 ? 1 : -1) * 0.9 + i * 0.9;
      const reachOut = core ? 0.03 : 0.1 + 0.1 * (0.5 + 0.5 * Math.sin(t * (1.1 + i * 0.37) + i * 2));
      const bx = c + Math.cos(a) * size * reachOut * agit;
      const by = c + Math.sin(a * 1.17) * size * reachOut * agit;
      const rt = size * (core ? 0.19 : 0.07 + 0.02 * Math.sin(t * 3 + i)) * wave;
      if (f.ptr) {
        const dx = f.ptr.x - (bx + b.ox);
        const dy = f.ptr.y - (by + b.oy);
        const d = Math.hypot(dx, dy) || 1;
        const reach = size * 0.7;
        if (d < reach) {
          const k = (1 - d / reach) ** 1.5 * (core ? 0.35 : 1.6);
          b.vx += (dx / d) * k;
          b.vy += (dy / d) * k;
        }
      }
      if (f.burst > 0.9) {
        b.vx += Math.cos(a) * (core ? 0 : 7);
        b.vy += Math.sin(a) * (core ? 0 : 7);
      }
      b.vx += -b.ox * 0.04;
      b.vy += -b.oy * 0.04;
      b.vx *= 0.9;
      b.vy *= 0.9;
      b.ox += b.vx;
      b.oy += b.vy;
      let x = bx + b.ox;
      let y = by + b.oy;
      // keep every drop inside the canvas, so nothing is ever cut off
      const lim = size * 0.5 - rt * 1.7 - 2;
      const d2 = Math.hypot(x - c, y - c);
      if (d2 > lim) {
        x = c + ((x - c) / d2) * lim;
        y = c + ((y - c) / d2) * lim;
      }
      b.x = x;
      b.y = y;
      b.r = rt;
    });

    // the tendril: beads spread from the body toward the pointer, each one lagging a little behind
    // the one before, so the liquid stretches out like syrup and snaps back when you leave
    const near = f.ptr && Math.hypot(f.ptr.x - c, f.ptr.y - c) < size * 0.95;
    pull += ((near ? 1 : 0) - pull) * 0.1;
    const reachMax = size * 0.5 - size * 0.04;
    chain.forEach((bd, k) => {
      const share = (k + 1) / chain.length;
      let tx = c;
      let ty = c;
      if (f.ptr && near) {
        const dx = f.ptr.x - c;
        const dy = f.ptr.y - c;
        const dist = Math.hypot(dx, dy) || 1;
        const len = Math.min(dist, reachMax) * share;
        tx = c + (dx / dist) * len;
        ty = c + (dy / dist) * len;
      }
      const ease = 0.2 - k * 0.026;
      bd.x += (tx - bd.x) * ease;
      bd.y += (ty - bd.y) * ease;
    });
    const beadR = (k: number) => size * (0.125 - k * 0.019) * pull;

    // the field
    for (let gy = 0; gy < G; gy++) {
      const py = (gy + 0.5) * cell;
      for (let gx = 0; gx < G; gx++) {
        const pxx = (gx + 0.5) * cell;
        let v = 0;
        for (let i = 0; i < blobs.length; i++) {
          const b = blobs[i];
          const dx = pxx - b.x;
          const dy = py - b.y;
          v += (b.r * b.r) / (dx * dx + dy * dy + b.r * b.r * 1.1); // wide soft core: no peaks, no dimples
        }
        if (pull > 0.02) {
          for (let k = 0; k < chain.length; k++) {
            const rr = beadR(k);
            const dx = pxx - chain[k].x;
            const dy = py - chain[k].y;
            v += (rr * rr) / (dx * dx + dy * dy + rr * rr * 1.1);
          }
        }
        const idx = gy * G + gx;
        field[idx] = v;
        // a flat-topped puddle with rounded edges: smooth inside, so nothing speckles
        raw[idx] = v > 0.82 ? 1 - Math.exp(-3.4 * (v - 0.82)) : 0;
      }
    }
    // soften the height once more, so the normals are silky
    for (let gy = 1; gy < G - 1; gy++) {
      for (let gx = 1; gx < G - 1; gx++) {
        const i = gy * G + gx;
        height[i] =
          (raw[i] * 4 + raw[i - 1] * 2 + raw[i + 1] * 2 + raw[i - G] * 2 + raw[i + G] * 2 + raw[i - G - 1] + raw[i - G + 1] + raw[i + G - 1] + raw[i + G + 1]) / 16;
      }
    }

    // shading
    const hs = (size * 0.26) / (2 * cell); // height in canvas px over two grid cells
    const lightA = t * 4;
    const L1: [number, number, number] = [Math.cos(lightA) * 0.6, Math.sin(lightA * 0.8) * 0.6 - 0.25, 0.75];
    const n1 = Math.hypot(...L1);
    L1[0] /= n1; L1[1] /= n1; L1[2] /= n1;

    for (let gy = 0; gy < G; gy++) {
      for (let gx = 0; gx < G; gx++) {
        const idx = gy * G + gx;
        const o = idx * 4;
        const a = clamp01((field[idx] - 0.985) / 0.035);
        if (a <= 0 || gx < 1 || gy < 1 || gx > G - 2 || gy > G - 2) {
          px[o + 3] = 0;
          continue;
        }
        let hx = (height[idx + 1] - height[idx - 1]) * hs;
        let hy = (height[idx + G] - height[idx - G]) * hs;
        // a slow, broad swell on the surface, so reflections flow across it even where it is flat
        const X = gx / G;
        const Y = gy / G;
        hx += 0.055 * Math.sin(Y * 6 + t * 3) + 0.03 * Math.sin(X * 9 - t * 2.2);
        hy += 0.055 * Math.sin(X * 6 - t * 2.6) + 0.03 * Math.sin(Y * 8 + t * 3.4);
        const nl = Math.hypot(hx, hy, 1);
        const nx = -hx / nl;
        const ny = -hy / nl;
        const nz = 1 / nl;
        // reflection of the viewer's ray
        const rx = 2 * nz * nx;
        const ry = 2 * nz * ny;
        const rz = 2 * nz * nz - 1;
        const fres = Math.pow(1 - nz, 2.4);
        const s1 = Math.pow(Math.max(0, rx * L1[0] + ry * L1[1] + rz * L1[2]), 34);
        let v = 0;
        if (mix < 0.995) {
          // chrome: a bright sky over a hard horizon, a dark ground with a pale band, and narrow light
          // stripes that slide across the surface as it moves
          const v0 = 0.5 - 0.5 * ry; // 0 looks up, 1 looks down
          const aboveHorizon = clamp01((0.5 - v0) / 0.12); // crisp but not razor horizon
          const sky = 0.55 + 0.4 * clamp01((0.5 - v0) / 0.5);
          const ground = 0.05 + 0.3 * Math.pow(0.5 + 0.5 * Math.sin((v0 - 0.5) * 8 + t * 3), 2);
          const stripe = Math.pow(0.5 + 0.5 * Math.sin(ry * 9 + rx * 3 + t * 5), 9) * 0.7;
          const lum = Math.pow(Math.min(1.3, ground + (sky - ground) * aboveHorizon + stripe + s1 * 0.8 + fres * 0.25), 1.35);
          v = lum * (1 - mix);
        }
        let black = 0;
        if (mix > 0.005) {
          // pure black glossy: only a broad soft window reflection, one crisp highlight and a thin rim
          const win = Math.pow(0.5 + 0.5 * Math.sin(ry * 5 + rx * 2 + t * 5), 12) * clamp01(0.5 - 0.5 * ry) * 0.3;
          black = (win + s1 * 0.85 + fres * 0.2) * mix;
        }
        const k = v + black;
        const cool = 1 - mix; // silver has the faintest cool tint, black has none
        px[o] = Math.min(255, k * 255 * (1 - 0.03 * cool));
        px[o + 1] = Math.min(255, k * 255 * (1 - 0.005 * cool));
        px[o + 2] = Math.min(255, k * 255 * (1 + 0.02 * cool));
        px[o + 3] = a * 255;
      }
    }
    octx.putImageData(img, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.globalCompositeOperation = "source-over";
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(off, 0, 0, size, size);
  };
}

export function createAlt(mode: number): Alt | null {
  if (mode === 1) return liquid();
  return null;
}
