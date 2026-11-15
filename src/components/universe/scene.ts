import { bridges, clusters, links } from "@/config/universe";
import { background, clusterCenters, coreLocal, dustLocal, nodeLocal, rng, type Vec3 } from "./geometry";

// Skills Universe engine: raw WebGL, no 3D library. One program draws every point (dust, skill
// nodes, the core, light pulses) and every line. Positions are composed in the vertex shader from
// a cluster centre, a magnetic offset and a spin angle, so the CPU only has to move a few numbers.

const N = clusters.length; // 7 clusters
const CORE = N; // cluster index of the core
const BG = N + 1; // background dust
const FREE = N + 2; // pulses already in world space (no transform)
const SLOTS = N + 3;
const LS = 1.55; // scale of every cluster shape
const STRIDE = 14; // local3 scatter3 col4 meta4 (cluster,size,kind,phase)

const VERT = `
precision highp float;
attribute vec3 aLocal;attribute vec3 aScatter;attribute vec4 aCol;attribute vec4 aMeta;
uniform mat4 uVP;uniform float uTime;uniform float uAssemble;uniform float uPx;
uniform vec3 uCenter[${SLOTS}];uniform vec3 uOff[${SLOTS}];uniform float uAng[${SLOTS}];
uniform float uSel;uniform float uHov;uniform float uFocus;uniform float uPulse;uniform vec3 uTint;uniform vec4 uShock;uniform float uShockAmp;
varying vec4 vCol;varying float vKind;
void main(){
  int c=int(aMeta.x+0.5);float kind=aMeta.z;float phase=aMeta.w;
  float ca=cos(uAng[c]),sa=sin(uAng[c]);
  vec3 l=aLocal;
  bool dustLike=(kind<0.5||kind>4.5);
  if(c==2&&dustLike){l.y=sin(l.x*2.4+uTime*1.7)*0.5*(0.6+0.4*sin(l.z*2.0+uTime));}
  vec3 w=uCenter[c]+uOff[c]+vec3(l.x*ca+l.z*sa,l.y,-l.x*sa+l.z*ca);
  if(c==${CORE}){
    float br=1.0+0.045*sin(uTime*1.3+phase*6.0)+0.06*uPulse;
    w=l*br;
    w+=0.03*vec3(sin(uTime*0.9+phase*20.0),cos(uTime*0.7+phase*13.0),sin(uTime*0.8+phase*9.0));
    w=vec3(w.x*ca+w.z*sa,w.y,-w.x*sa+w.z*ca);
  }else if(dustLike&&c!=${BG}){
    w+=0.025*vec3(sin(uTime*0.8+phase*30.0),cos(uTime*0.6+phase*17.0),sin(uTime*0.7+phase*11.0));
  }
  float e=1.0;
  if(c!=${FREE}){e=smoothstep(0.0,1.0,clamp(uAssemble*1.7-phase*0.7,0.0,1.0));w=mix(aScatter,w,e);}
  vec4 pos=uVP*vec4(w,1.0);
  gl_Position=pos;
  float f=1.0;
  float shock=0.0;
  if(uShockAmp>0.001){float dd=length(w-uShock.xyz);shock=exp(-pow((dd-uShock.w)*1.1,2.0))*uShockAmp;}
  if(kind<2.5||kind>4.5){
    if(uSel>-0.5){
      f=(float(c)==uSel)?1.0:mix(1.0,0.1,uFocus);
      if(c==${CORE})f=mix(1.0,0.55,uFocus);
      if(c==${BG})f=mix(1.0,0.5,uFocus);
    }else if(uHov>-0.5){
      f=(float(c)==uHov)?1.7:0.5;
      if(c==${CORE}||c==${BG})f=0.8;
    }
    if(c==3&&dustLike)f*=0.35+0.65*smoothstep(0.2,1.0,sin(uTime*2.2-length(l)*4.5));
    if(c==5&&dustLike)f*=0.5+0.5*sin(uTime*3.1+phase*40.0);
    if(dustLike&&kind<1.0)f*=0.78+0.22*sin(uTime*2.0+phase*50.0);
    f+=shock*2.6;
  }
  float a=aCol.a*f;
  if((kind>2.5&&kind<3.5)||(kind>4.5&&kind<5.5))a*=smoothstep(0.55,1.0,uAssemble);
  a*=e*0.9+0.1;
  vec3 col=aCol.rgb;
  if(c==${CORE})col=mix(col,uTint,uFocus*0.75);
  vCol=vec4(col,a);vKind=kind;
  float sz=aMeta.y*(1.0+((float(c)==uHov)?0.22:0.0)+shock*0.9);
  if(c==${CORE})sz*=1.0+0.18*uPulse;
  gl_PointSize=max(1.0,sz*uPx*55.0/max(pos.w,0.5));
}`;

const FRAG_POINT = `
precision mediump float;
varying vec4 vCol;varying float vKind;
void main(){
  vec2 q=gl_PointCoord-0.5;float d=length(q);
  if(d>0.5)discard;
  float a;
  if(vKind>5.5){
    a=exp(-d*7.5);
  }else if(vKind>0.5&&vKind<1.5){
    float halo=exp(-d*7.0)*0.55;
    float ring=smoothstep(0.30,0.27,d)*smoothstep(0.17,0.2,d)*0.85;
    float core=smoothstep(0.1,0.0,d);
    a=halo+ring+core;
  }else{
    a=pow(1.0-d*2.0,1.8);
  }
  gl_FragColor=vec4(vCol.rgb*a*vCol.a,a*vCol.a);
}`;

const FRAG_LINE = `
precision mediump float;
varying vec4 vCol;varying float vKind;
void main(){gl_FragColor=vec4(vCol.rgb*vCol.a,vCol.a);}`;

type Mat = Float32Array;
const perspective = (fov: number, aspect: number, near: number, far: number, shiftX: number): Mat => {
  const f = 1 / Math.tan(fov / 2);
  const m = new Float32Array(16);
  m[0] = f / aspect;
  m[5] = f;
  m[8] = shiftX;
  m[10] = (far + near) / (near - far);
  m[11] = -1;
  m[14] = (2 * far * near) / (near - far);
  return m;
};
const lookAt = (eye: Vec3, t: Vec3): Mat => {
  let zx = eye[0] - t[0], zy = eye[1] - t[1], zz = eye[2] - t[2];
  const zl = Math.hypot(zx, zy, zz) || 1;
  zx /= zl; zy /= zl; zz /= zl;
  let xx = zz, xy = 0, xz = -zx; // up = (0,1,0): x = up × z
  const xl = Math.hypot(xx, xy, xz) || 1;
  xx /= xl; xy /= xl; xz /= xl;
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
  const m = new Float32Array(16);
  m[0] = xx; m[1] = yx; m[2] = zx;
  m[4] = xy; m[5] = yy; m[6] = zy;
  m[8] = xz; m[9] = yz; m[10] = zz;
  m[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
  m[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
  m[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
  m[15] = 1;
  return m;
};
const mul = (a: Mat, b: Mat): Mat => {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = s;
    }
  return o;
};

export type FrameInfo = {
  bridges: Array<{ key: string; x: number; y: number; v: number }>;
  clusters: Array<{ x: number; y: number; r: number; v: number }>;
  nodes: Record<string, { x: number; y: number; v: number }>;
};

export type SceneOptions = {
  reduced: boolean;
  mobile: boolean;
  onHover: (cluster: number, skill: string | null) => void;
  onPick: (cluster: number, skill: string | null) => void;
  onFrame: (info: FrameInfo) => void;
};

export type UniverseScene = {
  select: (cluster: number, skill: string | null) => void;
  setActive: (on: boolean) => void;
  setAssemble: (v: number) => void;
  pulse: () => void;
  destroy: () => void;
};

type Node = { id: string; cluster: number; local: Vec3; scatter: Vec3; phase: number };
type Edge = { a: number; b: number; base: number; intensity: number; target: number; link: boolean; bridge?: string };

export function createScene(canvas: HTMLCanvasElement, opts: SceneOptions): UniverseScene | null {
  const gl = canvas.getContext("webgl", { antialias: true, alpha: false, powerPreference: "high-performance" });
  if (!gl) return null;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    return s;
  };
  const link = (frag: string) => {
    const p = gl.createProgram()!;
    const v = compile(gl.VERTEX_SHADER, VERT);
    const f = compile(gl.FRAGMENT_SHADER, frag);
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.linkProgram(p);
    gl.deleteShader(v);
    gl.deleteShader(f);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "link");
    return p;
  };
  let pointProg: WebGLProgram, lineProg: WebGLProgram;
  try {
    pointProg = link(FRAG_POINT);
    lineProg = link(FRAG_LINE);
  } catch {
    return null;
  }

  // ---------- data ----------
  const centers: Vec3[] = clusterCenters(N, opts.mobile ? 4.6 : 6.2);
  const dustPer = opts.mobile ? 190 : 420;
  const coreN = opts.mobile ? 700 : 1500;
  const bgN = opts.mobile ? 300 : 650;
  const scale = (p: Vec3, k = LS): Vec3 => [p[0] * k, p[1] * k, p[2] * k];

  const points: number[] = [];
  const pushPoint = (local: Vec3, scatter: Vec3, col: [number, number, number, number], cluster: number, size: number, kind: number, phase: number) =>
    points.push(...local, ...scatter, ...col, cluster, size, kind, phase);

  const sr = rng(5);
  const scatterFor = (): Vec3 => {
    const u = sr() * 2 - 1;
    const t = sr() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const rad = 12 + sr() * 12;
    return [s * Math.cos(t) * rad, u * rad, s * Math.sin(t) * rad];
  };
  type Rec = { local: Vec3; scatter: Vec3; phase: number };
  const mix3 = (a: number[], b: number[], t: number): [number, number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const BLUE = [0.12, 0.45, 1], VIOLET = [0.62, 0.2, 1], FUCHSIA = [1, 0.1, 0.72];

  // core: a noisy electric shell, blue at the bottom to fuchsia at the top
  const coreRec: Rec[] = [];
  coreLocal(coreN).forEach((p0, i) => {
    const inner = i > coreN * 0.72;
    const p = scale(p0, 1.7);
    const rec = { local: p, scatter: scatterFor(), phase: sr() };
    const t = Math.max(0, Math.min(1, (p0[1] / 0.95 + 1) / 2));
    const col = t < 0.5 ? mix3(BLUE, VIOLET, t * 2) : mix3(VIOLET, FUCHSIA, (t - 0.5) * 2);
    if (inner) pushPoint(p, rec.scatter, [0.9, 0.95, 1, 1], CORE, 1.7, 2, rec.phase);
    else {
      coreRec.push(rec);
      pushPoint(p, rec.scatter, [col[0], col[1], col[2], 0.8], CORE, 1.4, 2, rec.phase);
    }
  });
  pushPoint([0, 0, 0], [0, 0, 0], [0.55, 0.3, 1, 0.2], CORE, 80, 6, 0.1);
  pushPoint([0, 0, 0], [0, 0, 0], [0.2, 0.55, 1, 0.16], CORE, 120, 6, 0.4);
  // background stars
  background(bgN).forEach((p) => pushPoint(scale(p, 1.1), scale(p, 1.1), [0.65, 0.7, 1, 0.7], BG, 0.9, 0, sr()));

  const nodes: Node[] = [];
  const nodeIndex = new Map<string, number>();
  const dustRec: Rec[][] = [];
  clusters.forEach((cl, ci) => {
    const [r, g, b] = cl.hue;
    const rec: Rec[] = [];
    dustLocal(ci, dustPer, 31).forEach((p0) => {
      const p = scale(p0);
      const d = { local: p, scatter: scatterFor(), phase: sr() };
      rec.push(d);
      pushPoint(p, d.scatter, [r, g, b, 0.95], ci, 1.2 + sr() * 1.0, 0, d.phase);
    });
    dustRec.push(rec);
    // soft nebula glow behind each cluster
    for (let k = 0; k < 4; k++) {
      const o = scale([(sr() - 0.5) * 1.6, (sr() - 0.5) * 1.2, (sr() - 0.5) * 1.6]);
      pushPoint(o, scatterFor(), [r, g, b, 0.1], ci, 46, 6, sr());
    }
    cl.skills.forEach((s, i) => {
      const local = scale(nodeLocal(ci, i, cl.skills.length));
      const node: Node = { id: s.id, cluster: ci, local, scatter: scatterFor(), phase: sr() };
      nodeIndex.set(s.id, nodes.length);
      nodes.push(node);
      pushPoint(local, node.scatter, [r * 0.45 + 0.55, g * 0.45 + 0.55, b * 0.45 + 0.55, 1], ci, 4.4, 1, node.phase);
    });
  });
  const pointCount = points.length / STRIDE;

  // decorative web: short lines between neighbouring points, so every cluster reads as a living mesh
  const meshList: number[] = [];
  const addMesh = (rec: Rec[], col: [number, number, number], count: number, maxD: number, cluster: number, alpha: number) => {
    for (let k = 0; k < count; k++) {
      const i = Math.floor(sr() * rec.length);
      let best = -1, bd = maxD * maxD;
      for (let t = 0; t < 14; t++) {
        const j = Math.floor(sr() * rec.length);
        if (j === i) continue;
        const dx = rec[i].local[0] - rec[j].local[0], dy = rec[i].local[1] - rec[j].local[1], dz = rec[i].local[2] - rec[j].local[2];
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < bd) { bd = d2; best = j; }
      }
      if (best < 0) continue;
      for (const q of [rec[i], rec[best]]) meshList.push(...q.local, ...q.scatter, col[0], col[1], col[2], alpha, cluster, 1, 5, q.phase);
    }
  };
  clusters.forEach((cl, ci) => addMesh(dustRec[ci], cl.hue, Math.round(dustPer * 1.1), 0.95 * LS, ci, 0.3));
  addMesh(coreRec, [0.55, 0.45, 1], Math.round(coreN * 0.5), 1.15, CORE, 0.28);
  const meshCount = meshList.length / STRIDE;

  // lines: spokes from the core, the chain inside every cluster, and the real skill connections
  const edges: Edge[] = [];
  const spokes: Array<{ cluster: number; scatter: Vec3 }> = [];
  clusters.forEach((_, ci) => spokes.push({ cluster: ci, scatter: scatterFor() }));
  const addEdge = (a: number, b: number, base: number, isLink: boolean, bridge?: string) => {
    const e: Edge = { a, b, base, intensity: base, target: base, link: isLink, bridge };
    edges.push(e);
    return e;
  };
  const chain = new Set<string>();
  clusters.forEach((cl) => {
    for (let i = 0; i < cl.skills.length - 1; i++) {
      const a = nodeIndex.get(cl.skills[i].id)!;
      const b = nodeIndex.get(cl.skills[i + 1].id)!;
      chain.add(`${Math.min(a, b)}:${Math.max(a, b)}`);
      addEdge(a, b, 0.3, false);
    }
  });
  const linkSet = new Map<string, Edge>();
  links.forEach(([x, y]) => {
    const a = nodeIndex.get(x);
    const b = nodeIndex.get(y);
    const key = a === undefined || b === undefined ? "" : `${Math.min(a, b)}:${Math.max(a, b)}`;
    if (!key || chain.has(key) || linkSet.has(key)) return;
    linkSet.set(key, addEdge(a!, b!, 0.45, true));
  });
  const bridgeEdges: Array<{ key: string; e: Edge }> = [];
  bridges.forEach((br) => {
    const a = nodeIndex.get(br.a);
    const b = nodeIndex.get(br.b);
    if (a === undefined || b === undefined) return;
    const k = `${Math.min(a, b)}:${Math.max(a, b)}`;
    const e = linkSet.get(k) ?? addEdge(a, b, 0.45, true);
    e.bridge = br.key;
    bridgeEdges.push({ key: br.key, e });
  });
  const edgeCount = edges.length;
  const lineData = new Float32Array((edgeCount * 2 + spokes.length * 2) * STRIDE);
  const writeVert = (o: number, local: Vec3, scatter: Vec3, col: [number, number, number, number], cluster: number, phase: number) => {
    lineData.set([...local, ...scatter, ...col, cluster, 1, 3, phase], o);
  };
  const lineColor = (cluster: number): [number, number, number] => (cluster < N ? clusters[cluster].hue : [0.7, 0.8, 1]);

  // pulses (light travelling along connections, with a short trail)
  const MAX_PULSE = 70;
  const TRAIL = 5;
  const pulseData = new Float32Array(MAX_PULSE * TRAIL * STRIDE);

  // ---------- GL buffers ----------
  const pointBuf = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, pointBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
  const lineBuf = gl.createBuffer()!;
  const meshBuf = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, meshBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshList), gl.STATIC_DRAW);
  const pulseBuf = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, pulseBuf);
  gl.bufferData(gl.ARRAY_BUFFER, pulseData.byteLength, gl.DYNAMIC_DRAW);

  const bindAttribs = (prog: WebGLProgram, buf: WebGLBuffer) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    const spec: Array<[string, number, number]> = [["aLocal", 3, 0], ["aScatter", 3, 3], ["aCol", 4, 6], ["aMeta", 4, 10]];
    for (const [name, size, off] of spec) {
      const loc = gl.getAttribLocation(prog, name);
      if (loc < 0) continue;
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, STRIDE * 4, off * 4);
    }
  };
  const uni = (prog: WebGLProgram, n: string) => gl.getUniformLocation(prog, n);
  const U = (prog: WebGLProgram) => ({
    vp: uni(prog, "uVP"), time: uni(prog, "uTime"), assemble: uni(prog, "uAssemble"), px: uni(prog, "uPx"),
    center: uni(prog, "uCenter[0]"), off: uni(prog, "uOff[0]"), ang: uni(prog, "uAng[0]"),
    shock: uni(prog, "uShock"), shockAmp: uni(prog, "uShockAmp"),
    sel: uni(prog, "uSel"), hov: uni(prog, "uHov"), focus: uni(prog, "uFocus"), pulse: uni(prog, "uPulse"), tint: uni(prog, "uTint"),
  });
  const uP = U(pointProg);
  const uL = U(lineProg);

  // ---------- state ----------
  const centerArr = new Float32Array(SLOTS * 3);
  centers.forEach((c, i) => centerArr.set(c, i * 3));
  const offArr = new Float32Array(SLOTS * 3);
  const offTarget = new Float32Array(SLOTS * 3);
  const angArr = new Float32Array(SLOTS);
  const spin = [0.1, -0.14, 0.18, 0.12, -0.16, 0.2, -0.1];

  let selCluster = -1;
  let selSkill: string | null = null;
  let hovCluster = -1;
  let hovSkill: string | null = null;
  let focus = 0;
  let pulseKick = 0;
  const shock = { x: 0, y: 0, z: 0, r: 0, amp: 0 };
  let shocked = false;
  let assemble = opts.reduced ? 1 : 0;
  let active = true;
  let raf = 0;
  let last = performance.now();
  let time = 0;

  const cam = { yaw: 0.5, pitch: 0.28, dist: opts.mobile ? 15 : 11.4, tx: 0, ty: 0, tz: 0, shift: 0 };
  const camT = { ...cam };
  let yawVel = 0;
  let dragging = false;
  let moved = 0;
  let downX = 0, downY = 0, lastX = 0, lastY = 0;
  let pointer = { x: 0, y: 0, nx: 0, ny: 0, inside: false };
  let W = 1, H = 1, dpr = 1;
  let vp: Mat = new Float32Array(16);

  const nodeWorld = (n: Node): Vec3 => {
    const c = n.cluster;
    const a = angArr[c];
    const ca = Math.cos(a), sa = Math.sin(a);
    const l = n.local;
    return [
      centers[c][0] + offArr[c * 3] + l[0] * ca + l[2] * sa,
      centers[c][1] + offArr[c * 3 + 1] + l[1],
      centers[c][2] + offArr[c * 3 + 2] - l[0] * sa + l[2] * ca,
    ];
  };
  const clusterWorld = (c: number): Vec3 => [centers[c][0] + offArr[c * 3], centers[c][1] + offArr[c * 3 + 1], centers[c][2] + offArr[c * 3 + 2]];
  const project = (p: Vec3) => {
    const x = vp[0] * p[0] + vp[4] * p[1] + vp[8] * p[2] + vp[12];
    const y = vp[1] * p[0] + vp[5] * p[1] + vp[9] * p[2] + vp[13];
    const w = vp[3] * p[0] + vp[7] * p[1] + vp[11] * p[2] + vp[15];
    if (w <= 0.01) return { x: 0, y: 0, w, v: 0 };
    const nx = x / w, ny = y / w;
    return { x: (nx * 0.5 + 0.5) * W, y: (0.5 - ny * 0.5) * H, w, v: Math.abs(nx) < 1.15 && Math.abs(ny) < 1.15 ? 1 : 0 };
  };

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    dpr = Math.min(window.devicePixelRatio || 1, opts.mobile ? 1.5 : 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const faceCluster = (c: number) => {
    const p = centers[c];
    const len = Math.hypot(p[0], p[1], p[2]) || 1;
    let yaw = Math.atan2(p[0] / len, p[2] / len);
    // take the equivalent angle closest to the current one so the camera never spins the long way
    while (yaw - camT.yaw > Math.PI) yaw -= Math.PI * 2;
    while (yaw - camT.yaw < -Math.PI) yaw += Math.PI * 2;
    camT.yaw = yaw;
    camT.pitch = Math.asin(p[1] / len) * 0.8 + 0.1;
  };

  const setCamera = () => {
    if (selCluster < 0) {
      camT.tx = camT.ty = camT.tz = 0;
      camT.dist = opts.mobile ? 15 : 11.4;
      camT.shift = 0;
    } else {
      const c = centers[selCluster];
      camT.tx = c[0]; camT.ty = c[1]; camT.tz = c[2];
      camT.dist = opts.mobile ? 7.6 : 5.6;
      camT.shift = opts.mobile ? 0 : 0.2;
      faceCluster(selCluster);
    }
  };

  const updateEdgeTargets = () => {
    const sel = selSkill ? nodeIndex.get(selSkill) : undefined;
    const hovN = hovSkill ? nodeIndex.get(hovSkill) : undefined;
    edges.forEach((e) => {
      let t = e.base;
      const ca = nodes[e.a].cluster, cb = nodes[e.b].cluster;
      if (hovCluster >= 0 && (ca === hovCluster || cb === hovCluster)) t = Math.max(t, e.link ? 0.55 : 0.35);
      if (selCluster >= 0) t = ca === selCluster || cb === selCluster ? Math.max(e.base, e.link ? 0.45 : 0.3) : e.base * 0.3;
      const focusNode = sel ?? hovN;
      if (focusNode !== undefined && (e.a === focusNode || e.b === focusNode)) t = 1;
      e.target = t;
    });
  };

  // ---------- input ----------
  const pick = () => {
    if (!pointer.inside) return { c: -1, s: null as string | null };
    if (selCluster >= 0) {
      let best = -1, bd = (opts.mobile ? 34 : 26) ** 2;
      nodes.forEach((n, i) => {
        if (n.cluster !== selCluster) return;
        const s = project(nodeWorld(n));
        const d = (s.x - pointer.x) ** 2 + (s.y - pointer.y) ** 2;
        if (s.v && d < bd) { bd = d; best = i; }
      });
      return best >= 0 ? { c: selCluster, s: nodes[best].id } : { c: selCluster, s: null };
    }
    let best = -1, bd = Infinity;
    for (let c = 0; c < N; c++) {
      const s = project(clusterWorld(c));
      if (!s.v) continue;
      const rad = (1.25 * (H / 2)) / (Math.tan(0.4) * s.w);
      const d = Math.hypot(s.x - pointer.x, s.y - pointer.y);
      if (d < rad && d < bd) { bd = d; best = c; }
    }
    return { c: best, s: null as string | null };
  };

  const local = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    pointer = { x: e.clientX - r.left, y: e.clientY - r.top, nx: (e.clientX - r.left) / r.width - 0.5, ny: (e.clientY - r.top) / r.height - 0.5, inside: true };
  };
  const onDown = (e: PointerEvent) => {
    local(e);
    dragging = true;
    moved = 0;
    downX = lastX = e.clientX;
    downY = lastY = e.clientY;
    yawVel = 0;
    canvas.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    local(e);
    if (dragging) {
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      moved = Math.max(moved, Math.hypot(e.clientX - downX, e.clientY - downY));
      lastX = e.clientX; lastY = e.clientY;
      if (selCluster < 0) {
        camT.yaw -= dx * 0.006;
        yawVel = -dx * 0.006;
        camT.pitch = Math.max(-0.7, Math.min(0.9, camT.pitch + dy * 0.004));
      }
    }
    const h = pick();
    if (h.c !== hovCluster || h.s !== hovSkill) {
      hovCluster = h.c;
      hovSkill = h.s;
      updateEdgeTargets();
      opts.onHover(h.c, h.s);
    }
    canvas.style.cursor = h.c >= 0 || h.s ? "pointer" : dragging ? "grabbing" : "grab";
  };
  const onUp = (e: PointerEvent) => {
    local(e);
    const wasClick = dragging && moved < 6;
    dragging = false;
    if (wasClick) {
      const h = pick();
      if (selCluster >= 0) opts.onPick(h.s ? selCluster : -1, h.s);
      else if (h.c >= 0) opts.onPick(h.c, null);
    }
  };
  const onLeave = () => {
    pointer.inside = false;
    dragging = false;
    if (hovCluster !== -1 || hovSkill) {
      hovCluster = -1;
      hovSkill = null;
      updateEdgeTargets();
      opts.onHover(-1, null);
    }
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onLeave);
  canvas.addEventListener("pointerleave", onLeave);

  // ---------- frame ----------
  const info: FrameInfo = { bridges: [], clusters: Array.from({ length: N }, () => ({ x: 0, y: 0, r: 0, v: 0 })), nodes: {} };

  const frame = (now: number) => {
    raf = 0;
    if (!active || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;
    const k = 1 - Math.exp(-dt * 5);

    // camera: idle drift, inertia, smoothing and a small parallax toward the pointer
    if (!dragging && selCluster < 0 && !opts.reduced) {
      camT.yaw += yawVel + dt * 0.05 * (hovCluster >= 0 ? 0.15 : 1);
      yawVel *= Math.exp(-dt * 2.4);
    }
    cam.yaw += (camT.yaw - cam.yaw) * k;
    cam.pitch += (camT.pitch - cam.pitch) * k;
    cam.dist += (camT.dist - cam.dist) * k;
    cam.tx += (camT.tx - cam.tx) * k;
    cam.ty += (camT.ty - cam.ty) * k;
    cam.tz += (camT.tz - cam.tz) * k;
    cam.shift += (camT.shift - cam.shift) * k;
    const par = opts.reduced ? 0 : 1;
    const yaw = cam.yaw + (pointer.inside ? pointer.nx * 0.14 * par : 0);
    const pitch = cam.pitch + (pointer.inside ? pointer.ny * 0.1 * par : 0);
    const eye: Vec3 = [
      cam.tx + cam.dist * Math.cos(pitch) * Math.sin(yaw),
      cam.ty + cam.dist * Math.sin(pitch),
      cam.tz + cam.dist * Math.cos(pitch) * Math.cos(yaw),
    ];
    vp = mul(perspective(0.8, W / H, 0.1, 80, cam.shift), lookAt(eye, [cam.tx, cam.ty, cam.tz]));

    // cluster spin (others slow down while one is hovered), magnetic pull toward the camera
    focus += ((selCluster >= 0 ? 1 : 0) - focus) * k;
    pulseKick *= Math.exp(-dt * 3);
    if (shock.amp > 0) {
      shock.r += dt * 9;
      shock.amp = Math.max(0, 1 - shock.r / 20);
    }
    for (let c = 0; c < N; c++) {
      const f = selCluster >= 0 ? (c === selCluster ? 0.15 : 0.08) : hovCluster >= 0 ? (c === hovCluster ? 0.5 : 0.18) : 1;
      if (!opts.reduced) angArr[c] += dt * spin[c] * f;
      const want = hovCluster === c && selCluster < 0 ? 1 : 0;
      const dir = [eye[0] - centers[c][0], eye[1] - centers[c][1], eye[2] - centers[c][2]];
      const len = Math.hypot(dir[0], dir[1], dir[2]) || 1;
      for (let i = 0; i < 3; i++) offTarget[c * 3 + i] = (dir[i] / len) * 0.55 * want;
      for (let i = 0; i < 3; i++) offArr[c * 3 + i] += (offTarget[c * 3 + i] - offArr[c * 3 + i]) * k;
    }
    angArr[CORE] += dt * 0.12 * (opts.reduced ? 0 : 1);

    // edges: smooth toward their target intensity and write them out
    let o = 0;
    for (let i = 0; i < spokes.length; i++) {
      const col = lineColor(i);
      const a = selCluster >= 0 ? (selCluster === i ? 0.4 : 0.04) : hovCluster === i ? 0.6 : 0.22;
      lineData.set([0, 0, 0, ...spokes[i].scatter, ...col, a, CORE, 1, 3, 0.3], o);
      o += STRIDE;
      lineData.set([0, 0, 0, ...spokes[i].scatter, ...col, a, i, 1, 3, 0.3], o);
      // the far end sits at the cluster centre: local (0,0,0) with the cluster's own transform
      o += STRIDE;
    }
    for (let i = 0; i < edgeCount; i++) {
      const e = edges[i];
      e.intensity += (e.target - e.intensity) * k;
      const na = nodes[e.a], nb = nodes[e.b];
      const col = lineColor(na.cluster);
      const a = e.intensity * (e.link ? 1.1 : 0.9);
      writeVert(o, na.local, na.scatter, [col[0] * 0.7 + 0.3, col[1] * 0.7 + 0.3, col[2] * 0.7 + 0.3, a], na.cluster, na.phase);
      o += STRIDE;
      writeVert(o, nb.local, nb.scatter, [col[0] * 0.7 + 0.3, col[1] * 0.7 + 0.3, col[2] * 0.7 + 0.3, a], nb.cluster, nb.phase);
      o += STRIDE;
    }

    // pulses on the active connections
    let pc = 0;
    if (assemble > 0.9 && !opts.reduced) {
      // light streams from the core out to every cluster
      for (let c = 0; c < N && pc < MAX_PULSE; c++) {
        const cw = clusterWorld(c);
        const hue = clusters[c].hue;
        const vis = selCluster >= 0 ? (c === selCluster ? 1 : 0.12) : 1;
        for (let k = 0; k < 3 && pc < MAX_PULSE; k++) {
          for (let t = 0; t < TRAIL; t++) {
            const u = (((time * 0.24 + c * 0.29 + k / 3) % 1) + 1 - t * 0.028) % 1;
            pulseData.set([cw[0] * u, cw[1] * u, cw[2] * u, cw[0] * u, cw[1] * u, cw[2] * u, hue[0] * 0.4 + 0.6, hue[1] * 0.4 + 0.6, hue[2] * 0.4 + 0.6, (1 - t / TRAIL) * 0.85 * vis, FREE, 2.2 - t * 0.35, 4, 0], (pc * TRAIL + t) * STRIDE);
          }
          pc++;
        }
      }
      for (let i = 0; i < edgeCount && pc < MAX_PULSE; i++) {
        const e = edges[i];
        if (e.intensity < 0.45 || !e.link) continue;
        const a = nodeWorld(nodes[e.a]), b = nodeWorld(nodes[e.b]);
        const col = lineColor(nodes[e.a].cluster);
        for (let t = 0; t < TRAIL; t++) {
          const u = (((time * 0.45 + i * 0.37) % 1) + 1 - t * 0.03) % 1;
          const p: Vec3 = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
          const al = (1 - t / TRAIL) * 0.9 * Math.min(1, e.intensity);
          pulseData.set([...p, ...p, col[0] * 0.5 + 0.5, col[1] * 0.5 + 0.5, col[2] * 0.5 + 0.5, al, FREE, 2.0 - t * 0.3, 4, 0], (pc * TRAIL + t) * STRIDE);
        }
        pc++;
      }
    }
    const pulseVerts = pc * TRAIL;

    // ---- draw ----
    gl.clearColor(0.039, 0.039, 0.043, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    const tint = selCluster >= 0 ? clusters[selCluster].hue : [0.6, 0.75, 1];
    const setU = (prog: WebGLProgram, u: ReturnType<typeof U>) => {
      gl.useProgram(prog);
      gl.uniformMatrix4fv(u.vp, false, vp);
      gl.uniform1f(u.time, time);
      gl.uniform1f(u.assemble, assemble);
      gl.uniform1f(u.px, dpr);
      gl.uniform3fv(u.center, centerArr);
      gl.uniform3fv(u.off, offArr);
      gl.uniform1fv(u.ang, angArr);
      gl.uniform4f(u.shock, shock.x, shock.y, shock.z, shock.r);
      gl.uniform1f(u.shockAmp, shock.amp);
      gl.uniform1f(u.sel, selCluster);
      gl.uniform1f(u.hov, hovCluster);
      gl.uniform1f(u.focus, focus);
      gl.uniform1f(u.pulse, pulseKick);
      gl.uniform3f(u.tint, tint[0], tint[1], tint[2]);
    };

    setU(lineProg, uL);
    bindAttribs(lineProg, meshBuf);
    gl.drawArrays(gl.LINES, 0, meshCount);
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
    gl.bufferData(gl.ARRAY_BUFFER, lineData, gl.DYNAMIC_DRAW);
    bindAttribs(lineProg, lineBuf);
    gl.drawArrays(gl.LINES, 0, spokes.length * 2 + edgeCount * 2);

    setU(pointProg, uP);
    bindAttribs(pointProg, pointBuf);
    gl.drawArrays(gl.POINTS, 0, pointCount);
    if (pulseVerts > 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, pulseBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, pulseData.subarray(0, pulseVerts * STRIDE));
      bindAttribs(pointProg, pulseBuf);
      gl.drawArrays(gl.POINTS, 0, pulseVerts);
    }

    // ---- hand screen positions to the labels ----
    for (let c = 0; c < N; c++) {
      const s = project(clusterWorld(c));
      info.clusters[c] = { x: s.x, y: s.y, r: (1.1 * (H / 2)) / (Math.tan(0.4) * Math.max(s.w, 0.1)), v: s.v * Math.min(1, Math.max(0, (assemble - 0.7) / 0.3)) };
    }
    nodes.forEach((n) => {
      const s = project(nodeWorld(n));
      info.nodes[n.id] = { x: s.x, y: s.y, v: s.v && n.cluster === selCluster ? Math.min(1, Math.max(0, (assemble - 0.8) / 0.2)) : 0 };
    });
    info.bridges = bridgeEdges.map(({ key, e }) => {
      const pa = project(nodeWorld(nodes[e.a])), pb = project(nodeWorld(nodes[e.b]));
      const on = assemble > 0.9 ? Math.max(0, Math.min(1, (e.intensity - 0.55) * 3)) : 0;
      return { key, x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2, v: pa.v && pb.v ? on : 0 };
    });
    opts.onFrame(info);

    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (!raf && active && !document.hidden) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };
  const onVis = () => {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    } else start();
  };
  document.addEventListener("visibilitychange", onVis);
  start();

  const onLost = (e: Event) => e.preventDefault();
  canvas.addEventListener("webglcontextlost", onLost);

  return {
    select(cluster, skill) {
      selCluster = cluster;
      selSkill = skill;
      const sc = cluster >= 0 ? centers[cluster] : ([0, 0, 0] as Vec3);
      shock.x = sc[0]; shock.y = sc[1]; shock.z = sc[2]; shock.r = 0; shock.amp = 1;
      hovSkill = null;
      setCamera();
      updateEdgeTargets();
      pulseKick = 1;
      if (opts.reduced) {
        Object.assign(cam, camT);
        focus = cluster >= 0 ? 1 : 0;
      }
    },
    setActive(on) {
      active = on;
      if (on) start();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    setAssemble(v) {
      assemble = opts.reduced ? 1 : v;
      if (assemble > 0.97 && !shocked) {
        shocked = true;
        shock.x = shock.y = shock.z = 0;
        shock.r = 0;
        shock.amp = 1;
      }
    },
    pulse() {
      pulseKick = 1;
    },
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      active = false;
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onLeave);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.deleteBuffer(pointBuf);
      gl.deleteBuffer(lineBuf);
      gl.deleteBuffer(meshBuf);
      gl.deleteBuffer(pulseBuf);
      gl.deleteProgram(pointProg);
      gl.deleteProgram(lineProg);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
