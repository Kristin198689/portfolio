"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ORB_COUNT, onOrb, readOrb, setOrb } from "@/lib/orb";
import styles from "./OrbSwitch.module.css";

// Picks the look of the floating companion. "row" lists every look (mobile menu);
// the default is a single round button that cycles through them (header).
export function OrbSwitch({ row = false }: { row?: boolean }) {
  const t = useTranslations("nav");
  const [orb, setCurrent] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setCurrent(readOrb()));
    const off = onOrb(setCurrent);
    return () => {
      cancelAnimationFrame(frame);
      off();
    };
  }, []);

  if (row) {
    return (
      <div className={styles.row} role="group" aria-label={t("orb")}>
        <span className={styles.label}>{t("orb")}</span>
        {Array.from({ length: ORB_COUNT }, (_, i) => (
          <button key={i} type="button" className={styles.pill} aria-pressed={orb === i} onClick={() => setOrb(i)}>
            {i + 1}
          </button>
        ))}
      </div>
    );
  }
  return (
    <button
      type="button"
      className={styles.btn}
      onClick={() => setOrb((orb + 1) % ORB_COUNT)}
      aria-label={`${t("orb")} ${orb + 1}/${ORB_COUNT}`}
      data-cursor={t("orb")}
    >
      <span className={styles.icon} aria-hidden="true" />
      <span className={styles.num} aria-hidden="true">
        {orb + 1}
      </span>
    </button>
  );
}
