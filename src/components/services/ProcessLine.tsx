"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./ProcessLine.module.css";

gsap.registerPlugin(ScrollTrigger);

type Step = { t: string; d: string };

// A line draws itself while the section scrolls by and lights each step when it is reached.
// Without motion, or without JS, every step is simply shown.
export function ProcessLine({ steps, label }: { steps: Step[]; label: string }) {
  const root = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>("[data-step]"));
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      el.dataset.live = "true";
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top 75%",
        end: "bottom 55%",
        scrub: 0.4,
        onUpdate: (self) => {
          el.style.setProperty("--p", String(self.progress));
          items.forEach((it, i) => {
            it.dataset.on = self.progress >= (i + 0.3) / items.length ? "true" : "false";
          });
        },
      });
      return () => {
        st.kill();
        delete el.dataset.live;
      };
    });
    return () => mm.revert();
  }, []);

  return (
    <ol ref={root} className={styles.line} aria-label={label}>
      {steps.map((s, i) => (
        <li key={s.t} data-step data-on="false" className={styles.step}>
          <span className={styles.dot} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
          <strong>{s.t}</strong>
          <p>{s.d}</p>
        </li>
      ))}
    </ol>
  );
}
