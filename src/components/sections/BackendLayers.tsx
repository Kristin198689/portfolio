"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import styles from "./BackendLayers.module.css";

// The backend architecture of ServiceOS as stacked layers. A request travels down through them once
// the block scrolls into view. Real facts from the project's architecture rules.
export function BackendLayers() {
  const t = useTranslations("skills.backend");
  const layers = t.raw("layers") as Array<{ t: string; d: string }>;
  const notes = t.raw("notes") as string[];
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
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className={styles.wrap} aria-labelledby="backend-title">
      <p className={styles.tag}>{t("tag")}</p>
      <h3 id="backend-title" className={styles.title}>
        {t("title")}
      </h3>
      <p className={styles.intro}>{t("intro")}</p>

      <div ref={box} className={styles.stack} data-run={run}>
        <span className={styles.packet} aria-hidden="true" />
        <ol className={styles.layers}>
          {layers.map((l, i) => (
            <li key={l.t} style={{ "--i": i } as React.CSSProperties}>
              <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <strong>{l.t}</strong>
                <p>{l.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <ul className={styles.notes}>
        {notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </section>
  );
}
