"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { num, type ExperimentProps } from "../types";
import styles from "./exp.module.css";

// Magnetic letters: each glyph is pulled toward the pointer inside a radius and springs back out of it.
export default function Magnetic({ paramsRef, reduced }: ExperimentProps) {
  const t = useTranslations("lab");
  const root = useRef<HTMLDivElement>(null);
  const text = t("exp.magnetic.text");

  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    const chars = Array.from(el.querySelectorAll<HTMLElement>("[data-ch]"));
    const to = chars.map((c) => ({
      x: gsap.quickTo(c, "x", { duration: 0.6, ease: "elastic.out(1,0.45)" }),
      y: gsap.quickTo(c, "y", { duration: 0.6, ease: "elastic.out(1,0.45)" }),
      r: gsap.quickTo(c, "rotation", { duration: 0.6, ease: "power3.out" }),
    }));
    const move = (e: PointerEvent) => {
      const radius = num(paramsRef.current, "radius", 170);
      const k = num(paramsRef.current, "strength", 55) / 100;
      chars.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy);
        if (d < radius) {
          const f = (1 - d / radius) * k * 1.4;
          to[i].x(dx * f);
          to[i].y(dy * f);
          to[i].r((dx / radius) * 25 * k);
        } else {
          to[i].x(0);
          to[i].y(0);
          to[i].r(0);
        }
      });
    };
    const leave = () => to.forEach((q) => (q.x(0), q.y(0), q.r(0)));
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      gsap.killTweensOf(chars);
    };
  }, [reduced, paramsRef, text]);

  return (
    <div ref={root} className={`${styles.fill} ${styles.center}`} style={{ touchAction: "none" }}>
      <p className={styles.big} aria-label={text}>
        {text.split(" ").map((w, wi) => (
          <span key={wi} className={styles.word} aria-hidden="true">
            {(/[؀-ۿ]/.test(w) ? [w] : Array.from(w)).map((c, i) => (
              <span key={i} data-ch className={styles.ch}>
                {c}
              </span>
            ))}
            {" "}
          </span>
        ))}
      </p>
    </div>
  );
}
