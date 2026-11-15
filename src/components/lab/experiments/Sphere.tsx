"use client";

import { useEffect, useRef } from "react";
import { mountGL } from "../glscene";
import { toRgb } from "../kit";
import { num, type ExperimentProps } from "../types";
import styles from "./exp.module.css";

const VS = `attribute vec3 a;uniform float t;uniform float k;uniform vec2 rot;uniform float asp;uniform float size;uniform float dpr;uniform vec2 m;
varying float v;varying float depth;
void main(){
  float n=sin(a.x*4.0+t)*sin(a.y*5.0-t*0.8)*sin(a.z*3.0+t*0.6);
  vec3 p=a*(1.0+n*k*0.55);
  float cy=cos(rot.x),sy=sin(rot.x),cx=cos(rot.y),sx=sin(rot.y);
  p=vec3(cy*p.x+sy*p.z,p.y,-sy*p.x+cy*p.z);
  p=vec3(p.x,cx*p.y-sx*p.z,sx*p.y+cx*p.z);
  vec2 d=p.xy-m;float near=exp(-dot(d,d)*3.0);
  p.xy+=normalize(d+0.0001)*near*0.12*k;
  float z=p.z+3.2;
  gl_Position=vec4(p.x/asp,p.y,0.0,z*0.9);
  gl_PointSize=size*dpr/z*(1.0+near*1.5);
  v=n*0.5+0.5;depth=clamp(1.0-(z-2.2)/2.0,0.0,1.0);
}`;
const FS = `precision mediump float;uniform vec3 c1;uniform vec3 c2;varying float v;varying float depth;
void main(){vec2 q=gl_PointCoord-0.5;float d=length(q);if(d>0.5)discard;float a=smoothstep(0.5,0.0,d);
  gl_FragColor=vec4(mix(c1,c2,v)*a*(0.25+depth*0.9),a);}`;

// Particle sphere: a Fibonacci sphere of GL points whose radius is displaced by 3D-ish noise in the
// vertex shader. Drag to spin with inertia, the pointer pushes nearby points away. One draw call.
export default function Sphere({ paramsRef, reduced, fail }: ExperimentProps) {
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
        const buf = g.buffer();
        const loc = gl.getAttribLocation(prog, "a");
        const U = (n: string) => gl.getUniformLocation(prog, n);
        let built = 0;
        const build = (n: number) => {
          const arr = new Float32Array(n * 3);
          const ga = Math.PI * (3 - Math.sqrt(5));
          for (let i = 0; i < n; i++) {
            const y = 1 - (i / (n - 1)) * 2;
            const r = Math.sqrt(1 - y * y);
            arr[i * 3] = Math.cos(ga * i) * r;
            arr[i * 3 + 1] = y;
            arr[i * 3 + 2] = Math.sin(ga * i) * r;
          }
          gl.bindBuffer(gl.ARRAY_BUFFER, buf);
          gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
          built = n;
        };
        const c1 = toRgb("#bdb8fc");
        const c2 = toRgb("#ffffff");
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        let ry = 0.4;
        let rx = 0.3;
        let vy = 0;
        let vx = 0;
        let lx = 0;
        let ly = 0;
        return (t, dt, s) => {
          const n = Math.round(num(paramsRef.current, "count", 12000));
          if (n !== built) build(n);
          const spin = num(paramsRef.current, "rotation", 1);
          if (ptr.down) {
            vy = (ptr.x - lx) * 0.012;
            vx = (ptr.y - ly) * 0.012;
          } else {
            vy += (spin * 0.25 * dt - vy) * 0.05;
            vx *= 0.94;
          }
          lx = ptr.x;
          ly = ptr.y;
          ry += vy;
          rx = Math.max(-1.2, Math.min(1.2, rx + vx));
          gl.useProgram(prog);
          gl.clearColor(0.04, 0.04, 0.06, 1);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.bindBuffer(gl.ARRAY_BUFFER, buf);
          gl.enableVertexAttribArray(loc);
          gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
          gl.uniform1f(U("t"), reduced ? 0 : t * num(paramsRef.current, "speed", 1));
          gl.uniform1f(U("k"), num(paramsRef.current, "intensity", 0.6));
          gl.uniform2f(U("rot"), ry, rx);
          gl.uniform1f(U("asp"), s.w / s.h);
          gl.uniform1f(U("size"), Math.max(3, Math.min(8, 52000 / n)));
          gl.uniform1f(U("dpr"), g.dpr);
          gl.uniform2f(U("m"), ptr.inside ? (ptr.nx * s.w) / s.h : 9, ptr.inside ? -ptr.ny : 9);
          gl.uniform3f(U("c1"), c1[0], c1[1], c1[2]);
          gl.uniform3f(U("c2"), c2[0], c2[1], c2[2]);
          gl.drawArrays(gl.POINTS, 0, n);
        };
      },
      fail,
    );
  }, [paramsRef, reduced, fail]);

  return <canvas ref={cv} className={styles.canvasDrag} aria-hidden="true" />;
}
