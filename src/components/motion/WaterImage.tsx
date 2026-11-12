"use client";

import { useEffect, useRef } from "react";
import { startWater } from "./water";
import styles from "./WaterImage.module.css";

// A photo on water. The <img> stays in the DOM (alt text, no-JS, reduced motion); once WebGL is
// ready the canvas takes over and the photo ripples under the cursor.
export function WaterImage({ src, alt, cursor }: { src: string; alt: string; cursor?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const img = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const box = wrap.current;
    const cv = canvas.current;
    const im = img.current;
    if (!box || !cv || !im) return;
    let stop = () => {};
    let cancelled = false;
    const go = () => {
      if (cancelled) return;
      stop = startWater(
        box,
        cv,
        (el) => {
          if (!im.naturalWidth) return null;
          const r = el.getBoundingClientRect();
          const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
          const W = Math.round(r.width * dpr);
          const H = Math.round(r.height * dpr);
          const tc = document.createElement("canvas");
          tc.width = W;
          tc.height = H;
          const c = tc.getContext("2d")!;
          // object-fit: cover
          const s = Math.max(W / im.naturalWidth, H / im.naturalHeight);
          const dw = im.naturalWidth * s;
          const dh = im.naturalHeight * s;
          c.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh);
          return tc;
        },
        { strength: 0.03 },
      );
    };
    if (im.complete) go();
    else im.addEventListener("load", go, { once: true });
    return () => {
      cancelled = true;
      stop();
    };
  }, [src]);

  return (
    <div ref={wrap} className={styles.wrap} data-cursor={cursor}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={img} src={src} alt={alt} className={styles.img} />
      <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
    </div>
  );
}
