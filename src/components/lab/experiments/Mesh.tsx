"use client";

import { useEffect, useRef } from "react";
import { mountGL } from "../glscene";
import { toRgb } from "../kit";
import { num, type ExperimentProps } from "../types";
import styles from "./exp.module.css";

const VS = `attribute vec2 g;uniform mat4 mvp;uniform float t;uniform float k;uniform vec2 m;
varying float h;varying float fade;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
void main(){
  vec2 q=g*3.0;
  float n=noise(q+vec2(t*0.4,t*0.25))*0.65+noise(q*2.1-vec2(t*0.3,0.0))*0.35;
  float d=length(g-m);
  float ripple=sin(d*14.0-t*4.0)*exp(-d*2.2)*0.35;
  h=(n-0.5)*k+ripple*k;
  vec4 p=mvp*vec4(g.x*2.4,h,g.y*2.4,1.0);
  gl_Position=p;
  fade=clamp(1.0-(p.w-2.0)/5.5,0.0,1.0);
}`;
const FS = `precision mediump float;uniform vec3 c1;uniform vec3 c2;varying float h;varying float fade;
void main(){float a=smoothstep(-0.4,0.6,h);gl_FragColor=vec4(mix(c1,c2,a)*fade,1.0);}`;

type M4 = number[];
const mul = (a: M4, b: M4): M4 => {
  const o = new Array<number>(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return o;
};
const persp = (fov: number, asp: number, n: number, f: number): M4 => {
  const t = 1 / Math.tan(fov / 2);
  return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, (2 * f * n) / (n - f), 0];
};
const rotX = (a: number): M4 => [1, 0, 0, 0, 0, Math.cos(a), Math.sin(a), 0, 0, -Math.sin(a), Math.cos(a), 0, 0, 0, 0, 1];
const rotY = (a: number): M4 => [Math.cos(a), 0, -Math.sin(a), 0, 0, 1, 0, 0, Math.sin(a), 0, Math.cos(a), 0, 0, 0, 0, 1];
const trans = (x: number, y: number, z: number): M4 => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];

// Noise displacement mesh: a wireframe grid whose heights come from value noise evaluated in the vertex
// shader. The pointer drops a travelling ripple and tilts the camera. Density rebuilds the index buffer.
export default function Mesh({ paramsRef, reduced, fail }: ExperimentProps) {
  const cv = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = cv.current;
    if (!canvas) return;
    return mountGL(
      canvas,
      reduced,
      (g, ptr) => {
        const { gl } = g;
        const prog = g.program(VS, FS);
        if (!prog) return null;
        gl.useProgram(prog);
        const vb = g.buffer();
        const ib = g.buffer();
        const loc = gl.getAttribLocation(prog, "g");
        const U = (n: string) => gl.getUniformLocation(prog, n);
        let built = 0;
        let count = 0;
        const build = (n: number) => {
          const v = new Float32Array((n + 1) * (n + 1) * 2);
          for (let y = 0; y <= n; y++)
            for (let x = 0; x <= n; x++) {
              v[(y * (n + 1) + x) * 2] = (x / n) * 2 - 1;
              v[(y * (n + 1) + x) * 2 + 1] = (y / n) * 2 - 1;
            }
          const idx: number[] = [];
          for (let y = 0; y <= n; y++)
            for (let x = 0; x < n; x++) idx.push(y * (n + 1) + x, y * (n + 1) + x + 1);
          for (let x = 0; x <= n; x++)
            for (let y = 0; y < n; y++) idx.push(y * (n + 1) + x, (y + 1) * (n + 1) + x);
          gl.bindBuffer(gl.ARRAY_BUFFER, vb);
          gl.bufferData(gl.ARRAY_BUFFER, v, gl.STATIC_DRAW);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
          gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
          built = n;
          count = idx.length;
        };
        const c1 = toRgb("#3a3480");
        const c2 = toRgb("#d9d6ff");
        let tx = 0;
        let ty = 0;
        let time = 0;
        return (_t, dt, s) => {
          const n = Math.round(num(paramsRef.current, "density", 56));
          if (n !== built) build(n);
          time += dt * num(paramsRef.current, "speed", 1);
          tx += ((ptr.inside ? ptr.nx : 0) - tx) * 0.05;
          ty += ((ptr.inside ? ptr.ny : 0) - ty) * 0.05;
          const mvp = mul(persp(0.95, s.w / s.h, 0.1, 20), mul(trans(0, -0.35, -3.1), mul(rotX(-0.62 + ty * 0.18), rotY(tx * 0.45 + Math.sin(time * 0.15) * 0.15))));
          gl.useProgram(prog);
          gl.clearColor(0.04, 0.04, 0.06, 1);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.bindBuffer(gl.ARRAY_BUFFER, vb);
          gl.enableVertexAttribArray(loc);
          gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
          gl.uniformMatrix4fv(U("mvp"), false, new Float32Array(mvp));
          gl.uniform1f(U("t"), reduced ? 1.5 : time);
          gl.uniform1f(U("k"), num(paramsRef.current, "intensity", 0.9));
          gl.uniform2f(U("m"), ptr.inside ? ptr.nx : 0, ptr.inside ? ptr.ny : 0);
          gl.uniform3f(U("c1"), c1[0], c1[1], c1[2]);
          gl.uniform3f(U("c2"), c2[0], c2[1], c2[2]);
          gl.drawElements(gl.LINES, count, gl.UNSIGNED_SHORT, 0);
        };
      },
      fail,
    );
  }, [paramsRef, reduced, fail]);

  return <canvas ref={cv} className={styles.canvas} aria-hidden="true" />;
}
