"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import styles from "./NotFoundDepth.module.css";

const LAYERS = 26;

// "404" extruded in real CSS 3D: a stack of copies pushed back along z, so the number has a body.
// The whole stack leans toward the pointer. Without a pointer (phones) it sways on its own.
export function NotFoundDepth({ code }: { code: string }) {
  const stack = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stack.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    gsap.set(el, { transformPerspective: 1100 });

    if (fine) {
      const ry = gsap.quickTo(el, "rotationY", { duration: 0.9, ease: "power3" });
      const rx = gsap.quickTo(el, "rotationX", { duration: 0.9, ease: "power3" });
      const move = (e: PointerEvent) => {
        ry((e.clientX / window.innerWidth - 0.5) * 70);
        rx(-(e.clientY / window.innerHeight - 0.5) * 40);
      };
      window.addEventListener("pointermove", move, { passive: true });
      return () => window.removeEventListener("pointermove", move);
    }
    const sway = gsap.to(el, { rotationY: 28, rotationX: -8, duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: -1 });
    return () => {
      sway.kill();
    };
  }, []);

  return (
    <div className={styles.scene} aria-hidden="true">
      <div ref={stack} className={styles.stack}>
        {Array.from({ length: LAYERS }, (_, i) => (
          <span
            key={i}
            className={i === 0 ? `${styles.layer} ${styles.front}` : styles.layer}
            style={{ "--i": i, "--n": LAYERS } as React.CSSProperties}
          >
            {code}
          </span>
        ))}
      </div>
    </div>
  );
}
