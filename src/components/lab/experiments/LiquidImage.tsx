"use client";

import { useEffect, useRef } from "react";
import { QUAD, QUAD_VS } from "../gl";
import { mountGL } from "../glscene";
import { num, str, type ExperimentProps } from "../types";
import styles from "./exp.module.css";

const FS = `precision mediump float;
uniform sampler2D tex;uniform vec2 res;uniform float img;uniform float t;uniform vec2 m;uniform vec2 vel;uniform float k;
varying vec2 uv;
vec2 cover(vec2 u){float r=res.x/res.y;vec2 s=r>img?vec2(1.0,img/r):vec2(r/img,1.0);return (u-0.5)*s+0.5;}
void main(){
  vec2 d=uv-m;
  float aspect=res.x/res.y;
  float dist=length(d*vec2(aspect,1.0));
  float bulge=exp(-dist*dist*14.0);
  vec2 flow=vec2(sin(uv.y*9.0+t*1.3),cos(uv.x*8.0+t))*0.006*k;
  vec2 push=(dist>0.0?normalize(d):vec2(0.0))*bulge*0.07*k+vel*bulge*0.55*k;
  vec2 o=flow+push;
  float split=0.012*k*(0.4+bulge*2.5);
  vec2 a=cover(uv-o*(1.0-split*8.0));
  float r=texture2D(tex,cover(uv-o)+vec2(split,0.0)*(0.3+bulge)).r;
  float g=texture2D(tex,a).g;
  float b=texture2D(tex,cover(uv-o)-vec2(split,0.0)*(0.3+bulge)).b;
  gl_FragColor=vec4(r,g,b,1.0);
}`;

const SRC: Record<string, string> = {
  noform: "/images/projects/noform.jpg",
  beauty: "/images/projects/beauty.jpg",
  pizza: "/images/projects/pizza.jpg",
  detailing: "/images/projects/detailing.jpg",
};

// Liquid image: a fragment shader displaces the photo around the pointer, with a slow ambient flow and a
// per-channel RGB split. Distortion and speed are uniforms; the image can be swapped without rebuilding.
export default function LiquidImage({ paramsRef, reduced, fail }: ExperimentProps) {
  const cv = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = cv.current;
    if (!canvas) return;
    return mountGL(
      canvas,
      reduced,
      (g, ptr, redraw) => {
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
        const tex = g.texture();
        let ratio = 1.6;
        let current = "";
        let alive = true;
        const load = (key: string) => {
          current = key;
          const im = new Image();
          im.onload = () => {
            if (!alive || current !== key) return;
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            ratio = im.width / im.height;
            redraw();
          };
          im.src = SRC[key] ?? SRC.noform;
        };
        load("noform");
        const m = { x: 0.5, y: 0.5, vx: 0, vy: 0 };
        let time = 0;
        const render = (_t: number, dt: number, s: { w: number; h: number }) => {
          const key = str(paramsRef.current, "image", "noform");
          if (key !== current) load(key);
          const speed = num(paramsRef.current, "speed", 1);
          time += dt * speed;
          const tx = ptr.inside ? ptr.x / s.w : 0.5 + Math.sin(time * 0.7) * 0.25;
          const ty = ptr.inside ? 1 - ptr.y / s.h : 0.5 + Math.cos(time * 0.9) * 0.2;
          const nvx = (tx - m.x) * 0.25;
          const nvy = (ty - m.y) * 0.25;
          m.vx += (nvx - m.vx) * 0.2;
          m.vy += (nvy - m.vy) * 0.2;
          m.x += nvx;
          m.y += nvy;
          gl.useProgram(prog);
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.uniform2f(U("res"), s.w, s.h);
          gl.uniform1f(U("img"), ratio);
          gl.uniform1f(U("t"), time);
          gl.uniform2f(U("m"), m.x, m.y);
          gl.uniform2f(U("vel"), m.vx, m.vy);
          gl.uniform1f(U("k"), num(paramsRef.current, "distortion", 1));
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        };
        const stop = () => (alive = false);
        canvas.addEventListener("webglcontextlost", stop, { once: true });
        return render;
      },
      fail,
    );
  }, [paramsRef, reduced, fail]);

  return <canvas ref={cv} className={styles.canvas} aria-hidden="true" />;
}
