"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import styles from "./ScrollMarquee.module.css";

const WORDS = ["Next.js", "React", "TypeScript", "GSAP", "WebGL", "SEO", "A11y", "i18n", "RTL", "Claude Code"];

// Two rows of huge words drift in opposite directions. Scroll speed pushes them faster and skews
// them, then they settle back. Decorative, hidden from assistive technology.
export function ScrollMarquee() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const rows = gsap.utils.toArray<HTMLElement>("[data-row]", el);
      const state = rows.map((row, i) => ({ row, dir: i % 2 ? 1 : -1, x: 0, half: 0 }));
      const measure = () => state.forEach((s) => (s.half = s.row.scrollWidth / 2));
      measure();
      let last = window.scrollY;
      let vel = 0;
      const tick = () => {
        const y = window.scrollY;
        vel += (y - last - vel) * 0.12;
        last = y;
        const boost = Math.min(Math.abs(vel), 60);
        state.forEach((s) => {
          s.x += s.dir * (0.6 + boost * 0.35) * (vel < 0 ? -1 : 1);
          if (s.half) s.x = ((s.x % s.half) - s.half) % s.half;
          gsap.set(s.row, { x: s.x, skewX: gsap.utils.clamp(-14, 14, vel * -0.25) });
        });
      };
      gsap.ticker.add(tick);
      window.addEventListener("resize", measure);
      return () => {
        gsap.ticker.remove(tick);
        window.removeEventListener("resize", measure);
      };
    });
    return () => mm.revert();
  }, []);

  const row = (key: string) => (
    <div className={styles.row} data-row key={key}>
      {[0, 1, 2, 3].map((n) => (
        <span key={n} className={styles.group}>
          {WORDS.map((w, i) => (
            <b key={w} className={i % 2 ? styles.solid : styles.line}>
              {w}
              <i aria-hidden="true">✦</i>
            </b>
          ))}
        </span>
      ))}
    </div>
  );

  return (
    <div ref={root} className={styles.band} aria-hidden="true" data-chapter="field">
      {row("a")}
      {row("b")}
    </div>
  );
}
