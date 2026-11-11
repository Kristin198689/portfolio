"use client";

import { useLayoutEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { splitChars } from "@/lib/split";
import styles from "./Hero.module.css";

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const t = useTranslations("hero");
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray<HTMLElement>("[data-split]", el);
      const chars = lines.flatMap((l) => splitChars(l));

      // Entrance: characters rise out of their masks, then supporting text fades in
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.from(chars, {
        yPercent: 115,
        rotate: 6,
        duration: 1.2,
        stagger: { each: 0.025, from: "start" },
      })
        .from("[data-fade]", { y: 24, opacity: 0, duration: 0.9, stagger: 0.1 }, "-=0.7");

      // Title drifts up and fades while the hero scrolls away
      gsap.to("[data-drift]", {
        yPercent: -18,
        opacity: 0.15,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: true },
      });

      // Accent glow follows the pointer (fine pointers only)
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        const glow = el.querySelector<HTMLElement>("[data-glow]");
        if (glow) {
          const x = gsap.quickTo(glow, "x", { duration: 0.8, ease: "power3" });
          const y = gsap.quickTo(glow, "y", { duration: 0.8, ease: "power3" });
          const move = (e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            x(e.clientX - r.left);
            y(e.clientY - r.top);
          };
          el.addEventListener("pointermove", move, { passive: true });
          return () => el.removeEventListener("pointermove", move);
        }
      }
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section id="hero" ref={root} className={styles.hero}>
      <div className={styles.glow} data-glow aria-hidden="true" />

      <p className={styles.kicker} data-fade>
        {t("kicker")}
      </p>

      <div className={styles.titleWrap} data-drift>
        <h1 className={styles.title}>
          <span className={styles.line} data-split>
            {t("first")}
          </span>
          <span className={styles.line} data-split>
            {t("last")}
          </span>
        </h1>
      </div>

      <div className={styles.foot}>
        <p className={styles.role} data-fade>
          {t("role")} <em>{t("roleAccent")}</em>
        </p>
        <p className={styles.stack} data-fade>
          {t("stack")}
        </p>
        <span className={styles.scroll} data-fade>
          {t("scroll")} ↓
        </span>
      </div>
    </section>
  );
}
