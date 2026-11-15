"use client";

import { useEffect, useRef } from "react";
import { QUAD, QUAD_VS } from "../gl";
import { mountGL } from "../glscene";
import { num, type ExperimentProps } from "../types";
import styles from "./exp.module.css";

const FS = `precision mediump float;uniform vec2 res;uniform float t;uniform vec2 m;uniform float k;uniform float sc;varying vec2 uv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=0.5,s=0.0;for(int i=0;i<4;i++){s+=a*noise(p);p*=2.02;a*=0.5;}return s;}
void main(){
  vec2 p=(uv-0.5)*vec2(res.x/res.y,1.0)*sc;
  vec2 mm=(m-0.5)*vec2(res.x/res.y,1.0)*sc;
  float d=length(p-mm);
  vec2 q=vec2(fbm(p+t*0.08),fbm(p+vec2(5.2,1.3)-t*0.06));
  vec2 r=vec2(fbm(p+k*3.0*q+vec2(1.7,9.2)+t*0.1),fbm(p+k*3.0*q+vec2(8.3,2.8)-t*0.08));
  float f=fbm(p+k*3.5*r+exp(-d*d*1.2)*0.6*(mm-p));
  vec3 deep=vec3(0.04,0.04,0.08);vec3 ind=vec3(0.15,0.12,0.40);vec3 per=vec3(0.74,0.72,0.99);vec3 hot=vec3(0.98,0.62,0.86);
  vec3 col=mix(deep,ind,smoothstep(0.15,0.6,f));
  col=mix(col,per,smoothstep(0.45,0.85,f*(0.7+r.x*0.6)));
  col=mix(col,hot,smoothstep(0.7,1.0,r.y*f*1.7)*0.55);
  col+=exp(-d*d*2.5)*0.08;
  gl_FragColor=vec4(col,1.0);
}`;

// Interactive shader gradient: domain-warped fractal noise (fbm of fbm) mapped to the lab palette,
// with a soft attractor that follows the pointer. Scale, warp and speed are live uniforms.
export default function Gradient({ paramsRef, reduced, fail }: ExperimentProps) {
  const cv = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = cv.current;
    if (!canvas) return;
    return mountGL(
      canvas,
      reduced,
      (g, ptr) => {
        const { gl } = g;
        const prog = g.program(QUAD_VS, FS);
        if (!prog) return null;
        gl.useProgram(prog);
        const buf = g.buffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, "p");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        const U = (n: string) => gl.getUniformLocation(prog, n);
        const m = { x: 0.5, y: 0.5 };
        let time = 0;
        return (_t, dt, s) => {
          time += dt * num(paramsRef.current, "speed", 1);
          const tx = ptr.inside ? ptr.x / s.w : 0.5 + Math.sin(time * 0.4) * 0.3;
          const ty = ptr.inside ? 1 - ptr.y / s.h : 0.5 + Math.cos(time * 0.5) * 0.25;
          m.x += (tx - m.x) * 0.08;
          m.y += (ty - m.y) * 0.08;
          gl.useProgram(prog);
          gl.uniform2f(U("res"), s.w, s.h);
          gl.uniform1f(U("t"), reduced ? 2 : time);
          gl.uniform2f(U("m"), m.x, m.y);
          gl.uniform1f(U("k"), num(paramsRef.current, "distortion", 0.8));
          gl.uniform1f(U("sc"), num(paramsRef.current, "scale", 2.2));
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };
      },
      fail,
    );
  }, [paramsRef, reduced, fail]);

  return <canvas ref={cv} className={styles.canvas} aria-hidden="true" />;
}
