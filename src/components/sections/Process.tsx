"use client";

import { useLayoutEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./Process.module.css";

gsap.registerPlugin(ScrollTrigger);

const STEPS = ["s1", "s2", "s3", "s4"] as const;

// Four cards stack like a deck: each one sticks, the previous shrinks and dims as the next arrives.
export function Process() {
  const t = useTranslations("process");
  const list = useRef<HTMLOListElement>(null);

  useLayoutEffect(() => {
    const ol = list.current;
    if (!ol) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 40rem) and (prefers-reduced-motion: no-preference)", () => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-card]", ol);
      cards.slice(0, -1).forEach((card, i) => {
        gsap.to(card, {
          scale: 0.92,
          filter: "brightness(0.55)",
          ease: "none",
          scrollTrigger: {
            trigger: cards[i + 1],
            start: "top 85%",
            end: "top 20%",
            scrub: true,
          },
        });
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section id="process" className={styles.section} data-chapter="paper">
      <header className={styles.head}>
        <p className={styles.kicker}>{t("kicker")}</p>
        <h2 className={styles.title} data-split>
          {t("title")}
        </h2>
      </header>
      <ol ref={list} className={styles.list}>
        {STEPS.map((s, i) => (
          <li
            key={s}
            data-card
            className={`${styles.card} ${i % 2 ? styles.dark : ""}`}
            style={{ "--i": i } as React.CSSProperties}
          >
            <span className={styles.label}>{t(`steps.${s}.label`)}</span>
            <h3 className={styles.stepTitle}>{t(`steps.${s}.title`)}</h3>
            <p className={styles.text}>{t(`steps.${s}.text`)}</p>
            <span className={styles.big} aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
