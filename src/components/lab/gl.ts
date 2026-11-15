import { dprCap } from "./kit";

// One WebGL context at a time. `createGL` evicts the previous owner (its destroy() runs, which deletes
// every buffer, texture and program it made and releases the context), so the lab never holds two scenes.
export type GLCtx = {
  gl: WebGLRenderingContext;
  dpr: number;
  program: (vs: string, fs: string) => WebGLProgram | null;
  buffer: () => WebGLBuffer;
  texture: () => WebGLTexture;
  resize: (cssW: number, cssH: number) => void;
  destroy: () => void;
};

let active: GLCtx | null = null;

export function createGL(canvas: HTMLCanvasElement, opts: { alpha?: boolean } = {}): GLCtx | null {
  active?.destroy();
  const gl = (canvas.getContext("webgl", { antialias: true, alpha: opts.alpha ?? false, premultipliedAlpha: true }) ||
    canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
  if (!gl) return null;
  const programs: WebGLProgram[] = [];
  const buffers: WebGLBuffer[] = [];
  const textures: WebGLTexture[] = [];
  const dpr = dprCap();
  let dead = false;

  const compile = (type: number, src: string): WebGLShader | null => {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn("lab shader:", gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  };

  const ctx: GLCtx = {
    gl,
    dpr,
    program: (vs, fs) => {
      const v = compile(gl.VERTEX_SHADER, vs);
      const f = compile(gl.FRAGMENT_SHADER, fs);
      const p = gl.createProgram();
      if (!v || !f || !p) return null;
      gl.attachShader(p, v);
      gl.attachShader(p, f);
      gl.linkProgram(p);
      gl.deleteShader(v);
      gl.deleteShader(f);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
      programs.push(p);
      return p;
    },
    buffer: () => {
      const b = gl.createBuffer() as WebGLBuffer;
      buffers.push(b);
      return b;
    },
    texture: () => {
      const t = gl.createTexture() as WebGLTexture;
      textures.push(t);
      return t;
    },
    resize: (w, h) => {
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    },
    destroy: () => {
      if (dead) return;
      dead = true;
      programs.forEach((p) => gl.deleteProgram(p));
      buffers.forEach((b) => gl.deleteBuffer(b));
      textures.forEach((t) => gl.deleteTexture(t));
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      if (active === ctx) active = null;
    },
  };
  active = ctx;
  return ctx;
}

export const QUAD_VS = `attribute vec2 p;varying vec2 uv;void main(){uv=p*0.5+0.5;gl_Position=vec4(p,0.0,1.0);}`;
export const QUAD = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
