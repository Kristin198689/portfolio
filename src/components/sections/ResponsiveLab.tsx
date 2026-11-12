"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import styles from "./ResponsiveLab.module.css";

const MIN = 280;

// A live demo of fluid layout: drag the handle (or use the slider) to resize a mini browser. The
// content inside reflows with container queries and fluid type, the way I build real pages.
export function ResponsiveLab() {
  const t = useTranslations("skills.lab");
  const frame = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);

  const maxW = () => Math.max(MIN, Math.floor(wrap.current?.clientWidth ?? 900));

  const onDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const r = frame.current!.getBoundingClientRect();
      setWidth(Math.round(Math.min(maxW(), Math.max(MIN, ev.clientX - r.left))));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const label = width < 420 ? t("phone") : width < 700 ? t("tablet") : t("desktop");

  return (
    <section className={styles.lab} aria-labelledby="lab-title">
      <div className={styles.head}>
        <h3 id="lab-title" className={styles.title}>
          {t("title")}
        </h3>
        <p className={styles.hint}>{t("hint")}</p>
      </div>

      <div ref={wrap} className={styles.stage}>
        <div ref={frame} className={styles.frame} style={{ width }}>
          <div className={styles.bar}>
            <span />
            <span />
            <span />
            <em>{width}px · {label}</em>
          </div>
          <div className={styles.page}>
            <nav className={styles.nav}>
              <strong>Logo</strong>
              <span className={styles.links}>
                <i>{t("navA")}</i>
                <i>{t("navB")}</i>
                <i>{t("navC")}</i>
              </span>
              <span className={styles.burger}>☰</span>
            </nav>
            <h4 className={styles.h}>{t("heading")}</h4>
            <p className={styles.p}>{t("text")}</p>
            <div className={styles.cards}>
              {[1, 2, 3].map((n) => (
                <div key={n} className={styles.card}>
                  <b>0{n}</b>
                  <span>{t("card")}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            className={styles.handle}
            onPointerDown={onDrag}
            aria-label={t("handle")}
            tabIndex={-1}
          />
        </div>
      </div>

      <label className={styles.range}>
        <span>{t("slider")}</span>
        <input
          type="range"
          min={MIN}
          max={900}
          step={10}
          value={width}
          onChange={(e) => setWidth(Math.min(maxW(), Number(e.target.value)))}
        />
      </label>
    </section>
  );
}
