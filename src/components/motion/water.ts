// Shared water engine. A 2D wave simulation on a coarse grid becomes a normal map; a WebGL shader
// refracts a texture (title, photo) with it. Each channel is sampled at a slightly different offset,
// so edges get a faint electric fringe. Nothing is drawn over the page, the texture itself moves.

const VERT = `attribute vec2 p;varying vec2 uv;void main(){uv=p*0.5+0.5;gl_Position=vec4(p,0.0,1.0);}`;
const FRAG = `precision mediump float;
uniform sampler2D t;uniform sampler2D n;uniform float k;uniform float sh;uniform float lt;varying vec2 uv;
void main(){
  vec2 nn=texture2D(n,uv).rg-0.5;
  vec2 d=nn*k;
  float r=texture2D(t,uv+d*0.9).r;
  float g=texture2D(t,uv+d*1.15).g;
  float b=texture2D(t,uv+d*1.4).b;
  vec3 col=vec3(r,g,b);
  if(sh>0.0){
    // light on the surface itself: slopes facing the light shine, the others fall into shadow, so waves
    // are visible even over a flat background. On a dark page they glow, on a light page they shade.
    float s=nn.x*0.75-nn.y*0.65;
    float m=length(nn);
    vec3 glow=col+vec3(0.5,0.72,1.0)*(max(s,0.0)*2.3+m*0.6)*sh;
    vec3 ink=col*(1.0-clamp((abs(s)*1.9+m*0.6)*sh,0.0,0.26))+vec3(0.0,0.05,0.22)*m*sh*0.8;
    col=mix(glow,ink,lt);
  }
  gl_FragColor=vec4(col,1.0);
}`;

const DAMPING = 0.985;
const CELL = 6;

/** Returns the texture canvas for the box's current size, or null if it is not measurable yet. */
export type Paint = (box: HTMLElement) => HTMLCanvasElement | null;

export function startWater(
  box: HTMLElement,
  cv: HTMLCanvasElement,
  paint: Paint,
  opts: { strength?: number; ambient?: boolean; watchHeight?: boolean; eager?: boolean; power?: number; ambientMs?: number; shade?: number } = {},
): () => void {
  const noop = () => {};
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return noop;
  const gl = cv.getContext("webgl", { antialias: false, alpha: false });
  if (!gl) return noop;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return noop;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.uniform1i(gl.getUniformLocation(prog, "t"), 0);
  gl.uniform1i(gl.getUniformLocation(prog, "n"), 1);
  const shLoc = gl.getUniformLocation(prog, "sh");
  const ltLoc = gl.getUniformLocation(prog, "lt");
  gl.uniform1f(shLoc, opts.shade ?? 0);
  const kLoc = gl.getUniformLocation(prog, "k");
  gl.uniform1f(kLoc, opts.strength ?? 0.035);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  const mkTex = (unit: number) => {
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  };
  mkTex(0);
  mkTex(1);

  let w = 0;
  let h = 0;
  let cur = new Float32Array(0);
  let prev = new Float32Array(0);
  let norm = new Uint8Array(0);
  let frame = 0;
  let visible = false;
  let nextAmbient = 0;
  let alive = true;
  let builtKey = "";

  const build = () => {
    // layout size, never the on-screen size: an animation can be scaling this box right now (a title that
    // shrinks while you scroll), and measuring that would bake a squashed texture
    const bw = box.offsetWidth;
    const bh = box.offsetHeight;
    const key = opts.watchHeight ? `${bw}x${bh}` : `${bw}`;
    if (bw < 10 || key === builtKey) return;
    const tex = paint(box);
    if (!tex) return;
    builtKey = key;
    cv.width = tex.width;
    cv.height = tex.height;
    gl.viewport(0, 0, cv.width, cv.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex);
    w = Math.max(8, Math.ceil(box.offsetWidth / CELL));
    h = Math.max(8, Math.ceil(box.offsetHeight / CELL));
    cur = new Float32Array(w * h);
    prev = new Float32Array(w * h);
    // 128 = flat water. Border cells are never simulated and must stay neutral.
    norm = new Uint8Array(w * h * 4).fill(128);
    // draw one flat frame right away, so the canvas is never blank when it replaces the real text
    gl.activeTexture(gl.TEXTURE1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, norm);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (opts.shade) {
      // dark or light page: walk up to the first opaque background
      let lum = 0;
      for (let el: HTMLElement | null = box; el; el = el.parentElement) {
        const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
        if (m && (m.length < 4 || Number(m[3]) > 0.5)) {
          lum = (0.299 * Number(m[0]) + 0.587 * Number(m[1]) + 0.114 * Number(m[2])) / 255;
          break;
        }
      }
      gl.uniform1f(ltLoc, lum > 0.55 ? 1 : 0);
    }
    box.dataset.ready = "true";
  };

  const power = opts.power ?? 1;
  const drop = (x: number, y: number, amp: number, radius: number) => {
    amp *= power;
    const gx = Math.floor(x / CELL);
    const gy = Math.floor(y / CELL);
    for (let j = -radius; j <= radius; j++) {
      for (let i = -radius; i <= radius; i++) {
        const px = gx + i;
        const py = gy + j;
        if (px < 1 || py < 1 || px >= w - 1 || py >= h - 1) continue;
        const d = Math.hypot(i, j);
        if (d > radius) continue;
        cur[py * w + px] += amp * (1 - d / radius);
      }
    }
  };

  const tick = (now: number) => {
    frame = 0;
    if (!alive || !visible || !w) return;
    if (opts.ambient !== false && now > nextAmbient) {
      drop(Math.random() * w * CELL, Math.random() * h * CELL, 60 + Math.random() * 60, 3);
      nextAmbient = now + (opts.ambientMs ?? 1400) + Math.random() * (opts.ambientMs ?? 1400) * 1.1;
    }
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        prev[i] = ((cur[i - 1] + cur[i + 1] + cur[i - w] + cur[i + w]) / 2 - prev[i]) * DAMPING;
      }
    }
    [cur, prev] = [prev, cur];
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const o = i * 4;
        const dx = (cur[i + 1] - cur[i - 1]) * 0.9;
        const dy = (cur[i + w] - cur[i - w]) * 0.9;
        norm[o] = Math.max(0, Math.min(255, 128 + dx));
        norm[o + 1] = Math.max(0, Math.min(255, 128 + dy));
        norm[o + 3] = 255;
      }
    }
    gl.activeTexture(gl.TEXTURE1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, norm);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    frame = requestAnimationFrame(tick);
  };
  const run = () => {
    if (!frame && visible) frame = requestAnimationFrame(tick);
  };

  const local = (e: PointerEvent) => {
    // pointer position in the box's own (unscaled) pixels, even while an animation scales the box
    const r = box.getBoundingClientRect();
    const sx = r.width / (box.offsetWidth || 1) || 1;
    const sy = r.height / (box.offsetHeight || 1) || 1;
    const x = (e.clientX - r.left) / sx;
    const y = (e.clientY - r.top) / sy;
    const pad = 40;
    return x > -pad && y > -pad && x < box.offsetWidth + pad && y < box.offsetHeight + pad ? { x, y } : null;
  };
  let lx = -1;
  let ly = -1;
  const onMove = (e: PointerEvent) => {
    const p = local(e);
    if (!p) {
      lx = -1;
      return;
    }
    if (lx >= 0) {
      const speed = Math.hypot(p.x - lx, p.y - ly);
      if (speed > 1) drop(p.x, p.y, Math.min(speed, 40) * 2.4, 2);
    }
    lx = p.x;
    ly = p.y;
  };
  const onDown = (e: PointerEvent) => {
    const p = local(e);
    if (p) drop(p.x, p.y, 420, 4);
  };

  // Lazy: the GL context, texture painting and simulation only start when the element is near the
  // viewport, so they cost nothing during the first load.
  let started = false;
  const begin = () => {
    if (started) return;
    started = true;
    const family = getComputedStyle(box).fontFamily;
    // wait for every font, so the texture is painted with the final letters
    document.fonts.ready
      .then(() => document.fonts.load(`800 100px ${family}`, (box.textContent || "A").slice(0, 12)))
      .then(start, start);
  };
  const io = new IntersectionObserver(
    ([en]) => {
      visible = en.isIntersecting;
      if (visible) begin();
      run();
    },
    { rootMargin: "600px 0px" },
  );
  io.observe(box);
  // Scenes beside the screen (a horizontal track) are clipped by their parent, so the observer
  // never sees them. `eager` prepares them as soon as the page is idle instead.
  let eagerTimer = 0;
  if (opts.eager) eagerTimer = window.setTimeout(begin, 60);
  const ro = new ResizeObserver(() => build());
  const start = () => {
    if (!alive) return;
    build();
    ro.observe(box.parentElement ?? box);
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });
  // other things can make waves too: anything swimming in the water sends a "waterdrop" event
  const onDrop = (e: Event) => {
    const d = (e as CustomEvent<{ x: number; y: number; amp: number; r?: number }>).detail;
    const r = box.getBoundingClientRect();
    const x = (d.x - r.left) / (r.width / (box.offsetWidth || 1) || 1);
    const y = (d.y - r.top) / (r.height / (box.offsetHeight || 1) || 1);
    if (x < 0 || y < 0 || x > box.offsetWidth || y > box.offsetHeight) return;
    drop(x, y, d.amp, d.r ?? 3);
  };
  window.addEventListener("waterdrop", onDrop);
  // repaint the texture when the theme flips (colours are baked into it)
  const themeObs = new MutationObserver(() => {
    builtKey = "";
    build();
  });
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  return () => {
    themeObs.disconnect();
    alive = false;
    if (frame) cancelAnimationFrame(frame);
    io.disconnect();
    clearTimeout(eagerTimer);
    ro.disconnect();
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("waterdrop", onDrop);
  };
}
