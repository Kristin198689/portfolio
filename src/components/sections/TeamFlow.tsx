"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { contributions } from "@/config/contributions";
import { PullRequestDemo } from "./PullRequestDemo";
import styles from "./TeamFlow.module.css";

// Team workflow on GitHub: an animated git graph, my real contribution calendar (a static file made
// with the GitHub CLI, so no request is sent from your browser) and a pull request you can review.
export function TeamFlow() {
  const t = useTranslations("skills.team");
  const box = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setRun(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className={styles.wrap} aria-labelledby="team-title">
      <div className={styles.head}>
        <h3 id="team-title" className={styles.title}>
          {t("title")}
        </h3>
        <p className={styles.intro}>{t("intro")}</p>
      </div>

      <div ref={box} className={styles.body} data-run={run}>
        <div className={styles.left}>
          <svg className={styles.graph} viewBox="0 0 520 190" aria-hidden="true">
            <path className={styles.line} pathLength="100" d="M10 150 H510" />
            <path className={styles.line} pathLength="100" style={{ "--d": "0.5s" } as React.CSSProperties} d="M70 150 C100 150 100 50 140 50 H350 C390 50 390 150 430 150" />
            {[10, 70, 270, 430, 510].map((x, i) => (
              <circle key={`m${x}`} className={styles.dot} style={{ "--d": `${0.2 + i * 0.35}s` } as React.CSSProperties} cx={x} cy={150} r="6" />
            ))}
            {[140, 205, 270, 350].map((x, i) => (
              <circle key={`f${x}`} className={styles.dot} style={{ "--d": `${0.9 + i * 0.3}s` } as React.CSSProperties} cx={x} cy={50} r="6" />
            ))}
            <g className={styles.pr} style={{ "--d": "2.3s" } as React.CSSProperties}>
              <rect x="196" y="76" width="76" height="26" />
              <text x="234" y="94" textAnchor="middle">PR #1</text>
            </g>
            <g className={styles.ok} style={{ "--d": "2.8s" } as React.CSSProperties}>
              <circle cx="350" cy="50" r="13" />
              <text x="350" y="55" textAnchor="middle">✓</text>
            </g>
          </svg>

          <div className={styles.heat} aria-hidden="true">
            {contributions.weeks.map((w, wi) => (
              <div key={wi} className={styles.week}>
                {w.map((lv, di) => (
                  <span key={di} data-l={lv} style={{ "--k": wi } as React.CSSProperties} />
                ))}
              </div>
            ))}
          </div>
          <p className={styles.caption}>{t("contrib", { n: contributions.total, date: contributions.date })}</p>
        </div>

        <PullRequestDemo />
      </div>
    </section>
  );
}
