// Procedural layout of the Skills Universe: where each cluster sits and how its points are shaped.
export type Vec3 = [number, number, number];

export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cluster centres spread over a slightly flattened sphere (Fibonacci distribution). */
export function clusterCenters(n: number, radius: number): Vec3[] {
  const out: Vec3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - ((i + 0.5) / n) * 2;
    const r = Math.sqrt(1 - y * y);
    const a = i * golden + 0.6;
    out.push([Math.cos(a) * r * radius, y * radius * 0.62, Math.sin(a) * r * radius]);
  }
  return out;
}

const tiltX = (p: Vec3, a: number): Vec3 => [p[0], p[1] * Math.cos(a) - p[2] * Math.sin(a), p[1] * Math.sin(a) + p[2] * Math.cos(a)];

/** Position of skill node `i` of `count` inside its cluster; every cluster has its own shape. */
export function nodeLocal(cluster: number, i: number, count: number): Vec3 {
  const r = rng(900 + cluster * 31 + i * 7);
  const golden = Math.PI * (3 - Math.sqrt(5));
  switch (cluster) {
    case 0: { // frontend: a lattice
      const rows = Math.ceil(count / 4);
      return [((i % 4) - 1.5) * 0.66, (Math.floor(i / 4) - (rows - 1) / 2) * -0.62, (((i * 5) % 3) - 1) * 0.3];
    }
    case 1: { // backend: three stacked rings of linked services
      const layer = i % 3;
      const per = Math.ceil(count / 3);
      const a = Math.floor(i / 3) * ((Math.PI * 2) / per) + layer * 0.7;
      return [Math.cos(a) * 1.0, (layer - 1) * 0.78, Math.sin(a) * 1.0];
    }
    case 2: { // creative: a travelling wave
      const x = (i / Math.max(1, count - 1) - 0.5) * 3.1;
      return [x, Math.sin(i * 0.95) * 0.62, Math.cos(i * 0.95) * 0.5];
    }
    case 3: { // seo: concentric scanning rings
      const ring = 0.4 + (i % 4) * 0.33;
      return tiltX([Math.cos(i * 2.4) * ring, 0, Math.sin(i * 2.4) * ring], 0.9);
    }
    case 4: { // workflow: linked modules on a loop
      const a = (i / count) * Math.PI * 2;
      return [Math.cos(a) * 1.1, Math.sin(i * 1.7) * 0.26, Math.sin(a) * 1.1];
    }
    case 5: { // ai: an irregular neural cloud
      const u = 1 - (2 * (i + 0.5)) / count;
      const s = Math.sqrt(1 - u * u);
      const rad = 0.75 + r() * 0.35;
      return [s * Math.cos(i * golden) * rad * 1.15, u * rad, s * Math.sin(i * golden) * rad * 1.15];
    }
    default: { // ui/ux: a smooth saddle surface
      const rows = Math.ceil(count / 4);
      const x = ((i % 4) - 1.5) * 0.66;
      const z = (Math.floor(i / 4) - (rows - 1) / 2) * 0.75;
      return [x, (x * x - z * z) * 0.4, z];
    }
  }
}

/** Decorative points that give each cluster its body. */
export function dustLocal(cluster: number, n: number, seed: number): Vec3[] {
  const r = rng(seed + cluster * 977);
  const out: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    switch (cluster) {
      case 0:
        out.push([Math.round(r() * 8 - 4) * 0.3, Math.round(r() * 6 - 3) * 0.3, (r() - 0.5) * 0.8]);
        break;
      case 1: {
        const a = r() * Math.PI * 2;
        const rad = Math.sqrt(r()) * 1.05;
        out.push([Math.cos(a) * rad, r() < 0.5 ? -0.48 : 0.48, Math.sin(a) * rad]);
        break;
      }
      case 2:
        out.push([(r() - 0.5) * 3.2, 0, (r() - 0.5) * 1.5]);
        break;
      case 3: {
        const ring = [0.36, 0.72, 1.08, 1.44][Math.floor(r() * 4)];
        const a = r() * Math.PI * 2;
        out.push(tiltX([Math.cos(a) * ring, (r() - 0.5) * 0.04, Math.sin(a) * ring], 0.9));
        break;
      }
      case 4: {
        const k = Math.floor(r() * 7);
        const a = (k / 7) * Math.PI * 2;
        out.push([Math.cos(a) * 0.95 + (r() - 0.5) * 0.36, (r() - 0.5) * 0.36, Math.sin(a) * 0.95 + (r() - 0.5) * 0.36]);
        break;
      }
      case 5: {
        const u = r() * 2 - 1;
        const t = r() * Math.PI * 2;
        const s = Math.sqrt(1 - u * u);
        const rad = 0.6 + r() * 0.55;
        out.push([s * Math.cos(t) * rad * 1.15, u * rad, s * Math.sin(t) * rad * 1.15]);
        break;
      }
      default: {
        const x = (r() - 0.5) * 2.3;
        const z = (r() - 0.5) * 2.1;
        out.push([x, (x * x - z * z) * 0.38, z]);
      }
    }
  }
  return out;
}

/** The central core: a noisy shell plus a smaller inner shell. */
export function coreLocal(n: number): Vec3[] {
  const r = rng(4242);
  const out: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const inner = i > n * 0.72;
    const u = r() * 2 - 1;
    const t = r() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const d: Vec3 = [s * Math.cos(t), u, s * Math.sin(t)];
    const bump = 0.18 * Math.sin(d[0] * 3.1 + 1.3) * Math.sin(d[1] * 2.7) + 0.1 * Math.sin(d[2] * 4.3 + d[0] * 2);
    const rad = (inner ? 0.42 : 0.92) * (1 + bump);
    out.push([d[0] * rad, d[1] * rad, d[2] * rad]);
  }
  return out;
}

export function background(n: number): Vec3[] {
  const r = rng(77);
  const out: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const u = r() * 2 - 1;
    const t = r() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const rad = 8 + r() * 9;
    out.push([s * Math.cos(t) * rad, u * rad * 0.7, s * Math.sin(t) * rad]);
  }
  return out;
}
