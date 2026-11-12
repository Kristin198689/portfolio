"use client";

import { useEffect, useRef } from "react";
import styles from "./Orb3D.module.css";

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}`;

// A real 3D scene in one fragment shader: ray-marched metaballs fused with a torus, chrome
// reflections and an iridescent fresnel rim (cyan, blue, violet, pink). The camera orbits with the
// pointer and the shape breathes with scroll. Transparent background, so it sits on any section.
const FRAG = `precision highp float;
uniform vec2 res;uniform float t;uniform vec2 m;uniform float s;uniform vec3 place;
float smin(float a,float b,float k){float h=clamp(0.5+0.5*(b-a)/k,0.0,1.0);return mix(b,a,h)-k*h*(1.0-h);}
mat2 rot(float a){float c=cos(a),n=sin(a);return mat2(c,-n,n,c);}
float map(vec3 p){
  float k=0.55;
  vec3 a=vec3(sin(t*0.9)*0.8,cos(t*0.7)*0.5,sin(t*0.6)*0.6);
  vec3 b=vec3(cos(t*0.8+2.0)*0.7,sin(t*1.1)*0.6,cos(t*0.5)*0.7);
  vec3 c=vec3(sin(t*0.6+4.0)*0.6,cos(t*0.9+1.0)*0.7,sin(t*0.8+2.0)*0.5);
  float d=length(p-a)-0.55;
  d=smin(d,length(p-b)-0.5,k);
  d=smin(d,length(p-c)-0.45,k);
  d=smin(d,length(p)-0.62-0.12*s,k);
  vec3 q=p;q.xz*=rot(t*0.4);q.xy*=rot(0.9+s*1.5);
  float tor=length(vec2(length(q.xz)-1.15-0.1*s,q.y))-0.11;
  return smin(d,tor,0.25);
}
vec3 nrm(vec3 p){vec2 e=vec2(0.002,0.0);return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));}
vec3 env(vec3 d){
  float y=d.y*0.5+0.5;
  vec3 col=mix(vec3(0.05,0.06,0.09),vec3(0.95,0.96,1.0),smoothstep(0.1,0.9,y));
  col+=vec3(0.9)*smoothstep(0.82,0.98,dot(d,normalize(vec3(-0.4,0.8,0.5))));
  return col;
}
vec3 pal(float x){
  x=abs(fract(x*0.5)*2.0-1.0);
  vec3 a=vec3(0.10,0.75,1.00);vec3 b=vec3(0.22,0.35,1.00);vec3 c=vec3(0.58,0.25,1.00);vec3 d=vec3(1.00,0.30,0.78);
  if(x<0.33)return mix(a,b,x/0.33);
  if(x<0.66)return mix(b,c,(x-0.33)/0.33);
  return mix(c,d,(x-0.66)/0.34);
}
void main(){
  vec2 uv=(gl_FragCoord.xy-0.5*res)/res.y-place.xy;
  vec3 ro=vec3(0.0,0.0,4.2*place.z);
  vec3 rd=normalize(vec3(uv,-1.8));
  mat2 ry=rot(m.x*1.4+t*0.15);mat2 rx=rot(-m.y*0.9);
  ro.xz*=ry;rd.xz*=ry;ro.yz*=rx;rd.yz*=rx;
  float dist=0.0;bool hit=false;vec3 p=ro;
  for(int i=0;i<64;i++){p=ro+rd*dist;float d=map(p);if(d<0.002){hit=true;break;}dist+=d;if(dist>8.0)break;}
  if(!hit){gl_FragColor=vec4(0.0);return;}
  vec3 n=nrm(p);
  vec3 r=reflect(rd,n);
  float fr=pow(1.0-max(dot(-rd,n),0.0),2.5);
  vec3 col=env(r)*0.85;
  col=mix(col,pal(fr*0.9+t*0.05+p.y*0.2),0.55*fr+0.12);
  col+=pal(dot(n,vec3(0.3,0.6,0.2))+t*0.1)*0.18;
  gl_FragColor=vec4(col,1.0);
}`;

function setup(cv: HTMLCanvasElement, placeMode: "fill" | "side"): () => void {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = cv.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return () => {};
    const mk = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, mk(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      cv.style.display = "none";
      return () => {};
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "res");
    const uT = gl.getUniformLocation(prog, "t");
    const uM = gl.getUniformLocation(prog, "m");
    const uS = gl.getUniformLocation(prog, "s");
    const uPlace = gl.getUniformLocation(prog, "place");

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const scale = coarse ? 0.5 : 0.75;
    const resize = () => {
      const r = cv.getBoundingClientRect();
      cv.width = Math.max(2, Math.round(r.width * scale));
      cv.height = Math.max(2, Math.round(r.height * scale));
      gl.viewport(0, 0, cv.width, cv.height);
    };
    resize();

    let frame = 0;
    let visible = false;
    let mx = 0;
    let my = 0;
    let tx = 0;
    let ty = 0;
    let time = 0;
    let last = performance.now();

    const draw = (now: number) => {
      frame = 0;
      if (!visible) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reduce) time += dt;
      mx += (tx - mx) * 0.06;
      my += (ty - my) * 0.06;
      const r = cv.getBoundingClientRect();
      const prog01 = Math.min(1, Math.max(0, 1 - (r.top + r.height / 2) / window.innerHeight));
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes, cv.width, cv.height);
      gl.uniform1f(uT, time + 3);
      gl.uniform2f(uM, mx, my);
      gl.uniform1f(uS, prog01);
      // where the sphere sits inside the canvas: right side on wide screens, low and centred on phones
      const aspect = cv.width / cv.height;
      if (placeMode === "fill") gl.uniform3f(uPlace, 0, 0, 1);
      else if (aspect > 1.1) gl.uniform3f(uPlace, aspect * 0.2, 0, 1);
      else gl.uniform3f(uPlace, 0, -0.26, 1.8);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!reduce) frame = requestAnimationFrame(draw);
    };
    const run = () => {
      if (!frame && visible) {
        last = performance.now();
        frame = requestAnimationFrame(draw);
      }
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      run();
    });
    io.observe(cv);
    const onMove = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
    };
}

export function Orb3D({ place = "fill" }: { place?: "fill" | "side" }) {
  const ref = useRef<HTMLCanvasElement>(null);

  // Lazy: the WebGL context and shader compile only happen when the section is near the viewport.
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    let stop = () => {};
    const gate = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          gate.disconnect();
          stop = setup(cv, place);
        }
      },
      { rootMargin: "500px 0px" },
    );
    gate.observe(cv);
    return () => {
      gate.disconnect();
      stop();
    };
  }, [place]);

  return <canvas ref={ref} className={styles.canvas} aria-hidden="true" />;
}
