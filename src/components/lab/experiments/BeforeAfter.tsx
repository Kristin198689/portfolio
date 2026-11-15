"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { num, str, type ExperimentProps } from "../types";
import styles from "./compare.module.css";

const filterFor = (mode: string, amount: number): string => {
  const a = amount / 100;
  switch (mode) {
    case "sepia":
      return `sepia(${a}) contrast(${1 + a * 0.2})`;
    case "blur":
      return `blur(${(a * 8).toFixed(1)}px)`;
    case "invert":
      return `invert(${a})`;
    default:
      return `grayscale(${a}) contrast(${1 + a * 0.25})`;
  }
};

// Before / after: two stacked copies of the photo, the top one clipped by the handle position and
// filtered live. Pointer drag, touch and the keyboard (a real range input) all move the same handle.
export default function BeforeAfter({ params }: ExperimentProps) {
  const t = useTranslations("lab");
  const root = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const drag = useRef(false);
  const fromEvent = (e: React.PointerEvent) => {
    const r = root.current?.getBoundingClientRect();
    if (r) setPos(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)));
  };
  const filter = filterFor(str(params, "mode", "grayscale"), num(params, "intensity", 100));

  return (
    <div
      ref={root}
      className={styles.root}
      onPointerDown={(e) => {
        drag.current = true;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        fromEvent(e);
      }}
      onPointerMove={(e) => drag.current && fromEvent(e)}
      onPointerUp={() => (drag.current = false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/projects/detailing.jpg" alt="" className={styles.img} draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/projects/detailing.jpg"
        alt=""
        className={styles.img}
        draggable={false}
        style={{ filter, clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      />
      <span className={styles.line} style={{ insetInlineStart: `${pos}%` }} aria-hidden="true">
        <i>⇆</i>
      </span>
      <input
        className={styles.range}
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label={t("exp.compare.aria")}
      />
      <span className={styles.tagA}>{t("exp.compare.after")}</span>
      <span className={styles.tagB}>{t("exp.compare.before")}</span>
    </div>
  );
}
