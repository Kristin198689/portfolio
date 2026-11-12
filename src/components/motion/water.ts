// Shared water engine. A 2D wave simulation on a coarse grid becomes a normal map; a WebGL shader
// refracts a texture (title, photo) with it. Each channel is sampled at a slightly different offset,
// so edges get a faint electric fringe. Nothing is drawn over the page, the texture itself moves.

const VERT = `attribute vec2 p;varying vec2 uv;void main(){uv=p*0.5+0.5;gl_Position=vec4(p,0.0,1.0);}`;
const FRAG = `precision mediump float;
uniform sampler2D t;uniform sampler2D n;uniform float k;varying vec2 uv;
void main(){
  vec2 d=(texture2D(n,uv).rg-0.5)*k;
  float r=texture2D(t,uv+d*0.9).r;
  float g=texture2D(t,uv+d*1.15).g;
  float b=texture2D(t,uv+d*1.4).b;
  gl_FragColor=vec4(r,g,b,1.0);
}`;

const DAMPING = 0.985;
const CELL = 6;

/** Returns the texture canvas for the box's current size, or null if it is not measurable yet. */
export type Paint = (box: HTMLElement) => HTMLCanvasElement | null;

export function startWater(
  box: HTMLElement,
  cv: HTMLCanvasElement,
  paint: Paint,
  opts: { strength?: number; ambient?: boolean } = {},
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
    const rect = box.getBoundingClientRect();
    const key = `${Math.round(rect.width)}`;
    if (rect.width < 10 || key === builtKey) return;
    const tex = paint(box);
    if (!tex) return;
    builtKey = key;
    cv.width = tex.width;
    cv.height = tex.height;
    gl.viewport(0, 0, cv.width, cv.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex);
    const css = box.getBoundingClientRect();
    w = Math.max(8, Math.ceil(css.width / CELL));
    h = Math.max(8, Math.ceil(css.height / CELL));
    cur = new Float32Array(w * h);
    prev = new Float32Array(w * h);
    // 128 = flat water. Border cells are never simulated and must stay neutral.
    norm = new Uint8Array(w * h * 4).fill(128);
    box.dataset.ready = "true";
  };

  const drop = (x: number, y: number, amp: number, radius: number) => {
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
      nextAmbient = now + 1400 + Math.random() * 1600;
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
    const r = box.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const pad = 40;
    return x > -pad && y > -pad && x < r.width + pad && y < r.height + pad ? { x, y } : null;
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
  const io = new IntersectionObserver(
    ([en]) => {
      visible = en.isIntersecting;
      if (visible && !started) {
        started = true;
        const family = getComputedStyle(box).fontFamily;
        document.fonts.load(`800 100px ${family}`, (box.textContent || "A").slice(0, 12)).then(start, start);
      }
      run();
    },
    { rootMargin: "600px 0px" },
  );
  io.observe(box);
  const ro = new ResizeObserver(() => build());
  const start = () => {
    if (!alive) return;
    build();
    ro.observe(box.parentElement ?? box);
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });
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
    ro.disconnect();
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onDown);
  };
}
