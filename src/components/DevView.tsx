"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import styles from "./DevView.module.css";

export const DEV_EVENT = "dev:toggle";

const bp = (w: number) => (w < 576 ? "xs" : w < 768 ? "sm" : w < 1024 ? "md" : w < 1440 ? "lg" : "xl");

// "Developer view": a 12-column grid overlay and a live HUD (viewport, breakpoint, pixel ratio, fps,
// theme, language, direction). Toggle from the command palette or with Alt+Shift+D.
export function DevView() {
  const t = useTranslations("dev");
  const locale = useLocale();
  const [on, setOn] = useState(false);
  const [info, setInfo] = useState({ w: 0, h: 0, fps: 0, theme: "light", dir: "ltr", motion: "full", dpr: 1 });

  useEffect(() => {
    const toggle = () => setOn((v) => !v);
    const key = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.code === "KeyD") toggle();
    };
    window.addEventListener(DEV_EVENT, toggle);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener(DEV_EVENT, toggle);
      window.removeEventListener("keydown", key);
    };
  }, []);

  useEffect(() => {
    if (!on) return;
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      frames++;
      if (now - last >= 500) {
        const fps = Math.round((frames * 1000) / (now - last));
        frames = 0;
        last = now;
        const de = document.documentElement;
        setInfo({
          w: window.innerWidth,
          h: window.innerHeight,
          fps,
          theme: de.dataset.theme === "dark" ? "dark" : "light",
          dir: de.dir || "ltr",
          motion: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduced" : "full",
          dpr: Math.round(window.devicePixelRatio * 100) / 100,
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [on]);

  if (!on) return null;
  return (
    <>
      <div className={styles.grid} aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} />
        ))}
      </div>
      <aside className={styles.hud} aria-label={t("title")}>
        <strong>{t("title")}</strong>
        <dl>
          <dt>{t("viewport")}</dt>
          <dd>
            {info.w} × {info.h}
          </dd>
          <dt>{t("breakpoint")}</dt>
          <dd>{bp(info.w)}</dd>
          <dt>{t("ratio")}</dt>
          <dd>{info.dpr}×</dd>
          <dt>FPS</dt>
          <dd>{info.fps}</dd>
          <dt>{t("lang")}</dt>
          <dd>
            {locale} · {info.dir}
          </dd>
          <dt>{t("theme")}</dt>
          <dd>{info.theme}</dd>
          <dt>{t("motion")}</dt>
          <dd>{info.motion}</dd>
        </dl>
        <button type="button" onClick={() => setOn(false)}>
          {t("close")}
        </button>
      </aside>
    </>
  );
}
