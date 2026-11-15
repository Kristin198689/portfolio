"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { num, str, type ExperimentProps } from "../types";
import styles from "./exp.module.css";

const EASES: Record<string, string> = {
  sine: "sine.inOut",
  power: "power3.inOut",
  elastic: "elastic.inOut(1,0.5)",
  expo: "expo.inOut",
  back: "back.inOut(2)",
};

// Kinetic typography: every letter rides its own staggered, yoyo-ing timeline. Speed, amplitude and
// easing rebuild the GSAP timeline live (it is cheap), and the DOM stays real, selectable text.
export default function Kinetic({ params, reduced }: ExperimentProps) {
  const t = useTranslations("lab");
  const root = useRef<HTMLHeadingElement>(null);
  const words = t("exp.kinetic.text").split(" ");
  const speed = num(params, "speed", 1);
  const amp = num(params, "intensity", 45);
  const ease = str(params, "easing", "sine");

  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    const ctx = gsap.context(() => {
      const chars = gsap.utils.toArray<HTMLElement>("[data-ch]", el);
      gsap.to(chars, {
        yPercent: -amp,
        rotation: (i: number) => (i % 2 ? 1 : -1) * amp * 0.12,
        scaleY: 1 + amp / 160,
        duration: 1.1 / speed,
        ease: EASES[ease] ?? "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: { each: 0.07 / speed, repeat: -1, yoyo: true },
      });
    }, el);
    return () => ctx.revert();
  }, [speed, amp, ease, reduced, words.length]);

  return (
    <div className={`${styles.fill} ${styles.center}`}>
      <h3 ref={root} className={styles.big} aria-label={words.join(" ")}>
        {words.map((w, wi) => (
          <span key={wi} className={`${styles.line}`} aria-hidden="true">
            {Array.from(w).map((c, i) => (
              <span key={i} data-ch className={styles.ch}>
                {c}
              </span>
            ))}
          </span>
        ))}
      </h3>
    </div>
  );
}
