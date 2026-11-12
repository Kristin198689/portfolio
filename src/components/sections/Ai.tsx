"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { BrandIcon } from "../ui/BrandIcon";
import { Commits } from "./Commits";
import { QualityGate } from "./QualityGate";
import styles from "./Ai.module.css";

const STEPS = ["s1", "s2", "s3", "s4"] as const;
const LINES = ["l1", "l2", "l3", "l4", "l5"] as const;

// How I work with Claude Code: rules, maps, skills, verification. The terminal types itself once
// when it scrolls into view.
export function Ai() {
  const t = useTranslations("ai");
  const locale = useLocale();
  const term = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);

  useEffect(() => {
    const el = term.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setRun(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="ai" className={styles.section} data-chapter="field">
      <div className={styles.left}>
        <p className={styles.kicker}>{t("kicker")}</p>
        <h2 className={styles.title} data-split>
          {t("title")}
        </h2>
        <p className={styles.intro}>{t("intro")}</p>

        <ol className={styles.steps}>
          {STEPS.map((s, i) => (
            <li key={s}>
              <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <strong>{t(`steps.${s}.t`)}</strong>
                <p>{t(`steps.${s}.d`)}</p>
              </div>
            </li>
          ))}
        </ol>

        <QualityGate />
      </div>

      <div className={styles.right}>
        <div ref={term} className={styles.term} data-run={run} aria-hidden="true">
          <div className={styles.bar}>
            <span />
            <span />
            <span />
            <em>{t("termTitle")}</em>
          </div>
          <div className={styles.body}>
            {LINES.map((l, i) => (
              <p key={l} style={{ "--i": i } as React.CSSProperties}>
                <b>{i === 4 ? "?" : "$"}</b>
                <span>{t(`lines.${l}`)}</span>
              </p>
            ))}
            <i className={styles.caret} />
          </div>
        </div>

        <div className={styles.lang}>
          <h3>{t("langTitle")}</h3>
          <p>{t("langText")}</p>
          <ul className={styles.logos}>
            <li>
              <BrandIcon name="claudecode" size={20} /> Claude Code
            </li>
            <li>
              <BrandIcon name="claude" size={20} /> Claude
            </li>
            <li>ChatGPT</li>
            <li>
              <BrandIcon name="github" size={20} /> GitHub
            </li>
          </ul>
        </div>

        <Commits locale={locale} />
      </div>
    </section>
  );
}
