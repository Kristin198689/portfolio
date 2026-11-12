"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import styles from "./Konami.module.css";

const CODE = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
const COLORS = ["#27d3ff", "#3b5bff", "#8a4bff", "#ff3ea5", "#ffe600", "#fafaf7"];

// The classic Konami code (↑ ↑ ↓ ↓ ← → ← → B A) sets off confetti in the site's electric colours,
// shifts the whole page through the colour wheel for a moment and shows a small message.
export function Konami() {
  const t = useTranslations("konami");
  const cv = useRef<HTMLCanvasElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let i = 0;
    let stopFrame = 0;
    const burst = () => {
      const c = cv.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      c.width = window.innerWidth;
      c.height = window.innerHeight;
      const parts = Array.from({ length: 160 }, () => ({
        x: c.width / 2,
        y: c.height * 0.6,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 18 - 4,
        s: Math.random() * 8 + 4,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        c: COLORS[Math.floor(Math.random() * COLORS.length)],
      }));
      let life = 0;
      const step = () => {
        life++;
        ctx.clearRect(0, 0, c.width, c.height);
        for (const p of parts) {
          p.vy += 0.45;
          p.x += p.vx;
          p.y += p.vy;
          p.r += p.vr;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.r);
          ctx.fillStyle = p.c;
          ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
          ctx.restore();
        }
        if (life < 140) stopFrame = requestAnimationFrame(step);
        else ctx.clearRect(0, 0, c.width, c.height);
      };
      cancelAnimationFrame(stopFrame);
      stopFrame = requestAnimationFrame(step);
    };

    const onKey = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      i = k === CODE[i] ? i + 1 : k === CODE[0] ? 1 : 0;
      if (i === CODE.length) {
        i = 0;
        setShown(true);
        const de = document.documentElement;
        de.classList.add("party");
        window.setTimeout(() => de.classList.remove("party"), 2600);
        window.setTimeout(() => setShown(false), 4200);
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) burst();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      cancelAnimationFrame(stopFrame);
    };
  }, []);

  return (
    <>
      <canvas ref={cv} className={styles.canvas} aria-hidden="true" />
      {shown ? (
        <div className={styles.toast} role="status">
          <strong>{t("title")}</strong>
          <span>{t("text")}</span>
        </div>
      ) : null}
    </>
  );
}
