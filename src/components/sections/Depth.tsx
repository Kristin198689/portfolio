"use client";

import { useLayoutEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./Depth.module.css";

gsap.registerPlugin(ScrollTrigger);

const LAYERS = ["responsive", "performance", "motion", "a11y", "seo", "i18n", "security"] as const;
// where each word flies past the camera (% of the stage)
const SPOTS: Array<[number, number]> = [
  [50, 46],
  [40, 38],
  [60, 58],
  [42, 62],
  [58, 36],
  [50, 52],
  [44, 46],
  [56, 54],
];

// Scroll flies the camera through a tunnel: words and rings travel along the z axis in real CSS 3D.
export function Depth() {
  const t = useTranslations("depth");
  const outer = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = outer.current;
    const st = stage.current;
    if (!el || !st) return;
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const words = gsap.utils.toArray<HTMLElement>("[data-layer]", st);
      const rings = gsap.utils.toArray<HTMLElement>("[data-ring]", st);
      const Z0 = -3200;
      const Z1 = 700;
      const span = 2.6;
      const step = 1.5;

      gsap.set([...words, ...rings], { xPercent: -50, yPercent: -50, z: Z0, autoAlpha: 0 });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 0.5 },
      });
      words.forEach((w, i) => {
        const at = i * step;
        tl.fromTo(w, { z: Z0 }, { z: Z1, duration: span }, at);
        tl.fromTo(w, { autoAlpha: 0 }, { autoAlpha: 1, duration: span * 0.25 }, at);
        tl.to(w, { autoAlpha: 0, duration: span * 0.18 }, at + span * 0.82);
      });
      const total = (words.length - 1) * step + span;
      rings.forEach((r, i) => {
        const at = (i / rings.length) * (total - span);
        tl.fromTo(r, { z: Z0 }, { z: Z1, duration: span * 1.3 }, at);
        tl.fromTo(r, { autoAlpha: 0 }, { autoAlpha: 0.5, duration: span * 0.3 }, at);
        tl.to(r, { autoAlpha: 0, duration: span * 0.25 }, at + span * 1.05);
      });

      // the whole stage leans toward the pointer
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        const rx = gsap.quickTo(st, "rotationX", { duration: 0.8, ease: "power3" });
        const ry = gsap.quickTo(st, "rotationY", { duration: 0.8, ease: "power3" });
        const move = (e: PointerEvent) => {
          ry((e.clientX / window.innerWidth - 0.5) * 8);
          rx(-(e.clientY / window.innerHeight - 0.5) * 6);
        };
        window.addEventListener("pointermove", move, { passive: true });
        return () => window.removeEventListener("pointermove", move);
      }
    });

    return () => mm.revert();
  }, []);

  return (
    <section id="depth" ref={outer} className={styles.outer} data-chapter="field">
      <div className={styles.sticky}>
        <p className={styles.kicker}>{t("kicker")}</p>
        <div ref={stage} className={styles.stage}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} data-ring className={styles.ring} aria-hidden="true" />
          ))}
          {LAYERS.map((k, i) => {
            const word = t(`layers.${k}.w`);
            // size every word so it always fits 80% of the screen width, whatever the language
            const vw = Math.min(13, 78 / (Array.from(word).length * 0.64));
            return (
              <div
                key={k}
                data-layer
                className={styles.layer}
                style={{ left: `${SPOTS[i][0]}%`, top: `${SPOTS[i][1]}%` }}
              >
                <h2 className={styles.word} style={{ fontSize: `${vw}vw` }}>
                  {word}
                </h2>
                <p className={styles.note}>{t(`layers.${k}.n`)}</p>
              </div>
            );
          })}
        </div>
        <p className={styles.hint}>{t("hint")} ↓</p>
      </div>
    </section>
  );
}
