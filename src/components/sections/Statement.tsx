"use client";

import { useLayoutEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Orb3D } from "../motion/Orb3D";
import styles from "./Statement.module.css";

gsap.registerPlugin(ScrollTrigger);

// The statement lights up word by word as you scroll through it.
export function Statement() {
  const t = useTranslations("statement");
  const text = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const el = text.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const words = Array.from(el.querySelectorAll<HTMLElement>("[data-w]"));
      // Unlit words use the muted text colour (readable contrast), lit words the full text colour.
      const probe = document.createElement("span");
      probe.style.color = "var(--color-text-muted)";
      el.appendChild(probe);
      const off = getComputedStyle(probe).color;
      probe.remove();
      const on = getComputedStyle(el).color;
      gsap.set(words, { color: off });
      gsap.to(words, {
        color: on,
        ease: "none",
        stagger: 0.1,
        scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true },
      });
    });
    return () => mm.revert();
  }, []);

  const words = t("text").split(" ");
  return (
    <section id="statement" className={styles.section} data-chapter="paper">
      <div className={styles.orb}>
        <Orb3D place="side" />
      </div>
      <p className={styles.kicker}>{t("kicker")}</p>
      <p ref={text} className={styles.text}>
        {words.map((w, i) => (
          <span key={i} data-w>
            {w}{" "}
          </span>
        ))}
      </p>
    </section>
  );
}
