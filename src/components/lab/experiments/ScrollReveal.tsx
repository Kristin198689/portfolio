"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { createLoop } from "../kit";
import { num, type ExperimentProps } from "../types";
import styles from "./scroll.module.css";

const ITEMS = [
  { src: "/images/projects/beauty.jpg", name: "Beauty Studio" },
  { src: "/images/projects/noform.jpg", name: "NØFORM" },
  { src: "/images/projects/pizza.jpg", name: "Pizza Döner" },
  { src: "/images/projects/detailing.jpg", name: "Detailing" },
];

// Scroll experiments in one frame: mask reveals (clip-path driven by each figure's progress), image
// parallax and a skew that follows scroll velocity and relaxes back. Scroll inside the frame.
export default function ScrollReveal({ paramsRef, reduced }: ExperimentProps) {
  const t = useTranslations("lab");
  const box = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    const tr = track.current;
    if (!el || !tr) return;
    const figs = Array.from(tr.querySelectorAll<HTMLElement>("[data-fig]"));
    let lastTop = el.scrollTop;
    let vel = 0;
    let skew = 0;
    const apply = () => {
      const vh = el.clientHeight;
      const par = num(paramsRef.current, "parallax", 50);
      figs.forEach((f) => {
        const r = f.getBoundingClientRect();
        const er = el.getBoundingClientRect();
        const top = r.top - er.top;
        const p = reduced ? 1 : Math.max(0, Math.min(1, (vh - top) / (vh * 0.75)));
        const mask = f.querySelector<HTMLElement>("[data-lmask]");
        const img = f.querySelector<HTMLElement>("[data-img]");
        if (mask) mask.style.clipPath = `inset(${(1 - p) * 100}% 0 0 0)`;
        if (img) img.style.transform = `translateY(${(p - 0.5) * par * -0.9}px) scale(${1.18 - p * 0.12})`;
      });
    };
    const onScroll = () => {
      vel = el.scrollTop - lastTop;
      lastTop = el.scrollTop;
      apply();
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    apply();
    const loop = createLoop(
      el,
      () => {
        const k = num(paramsRef.current, "intensity", 50) / 100;
        const target = Math.max(-14, Math.min(14, vel * 0.35 * k));
        skew += (target - skew) * 0.2;
        vel *= 0.85;
        tr.style.transform = reduced ? "" : `skewY(${skew.toFixed(2)}deg)`;
      },
      reduced,
    );
    return () => {
      loop.stop();
      el.removeEventListener("scroll", onScroll);
    };
  }, [paramsRef, reduced]);

  return (
    <div ref={box} className={styles.box} data-lenis-prevent tabIndex={0} role="region" aria-label={t("exp.scroll.aria")}>
      <div ref={track} className={styles.track}>
        {ITEMS.map((it, i) => (
          <figure key={it.name} data-fig className={styles.fig}>
            <div data-lmask className={styles.mask}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img data-img src={it.src} alt={it.name} className={styles.img} loading="lazy" />
            </div>
            <figcaption className={styles.cap}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              {it.name}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
