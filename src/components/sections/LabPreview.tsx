"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { experiments } from "../lab/registry";
import styles from "./LabPreview.module.css";

const PreviewCanvas = dynamic(() => import("../lab/PreviewCanvas"), { ssr: false });

const subscribe = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

// Compact home-page entry to the Motion Lab: one live canvas teaser and links into the full lab.
export function LabPreview() {
  const t = useTranslations("lab");
  const reduced = useSyncExternalStore(subscribe, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);
  return (
    <section id="lab" className={styles.section} data-chapter="field" aria-labelledby="lab-preview-title">
      <div className={styles.text}>
        <p className={styles.kicker}>{t("teaser.kicker")}</p>
        <h2 id="lab-preview-title" className={styles.title} data-split>
          {t("title")}
        </h2>
        <p className={styles.lead}>{t("teaser.text", { n: experiments.length })}</p>
        <div className={styles.links}>
          <Link href="/lab" className={styles.cta} data-scramble>
            {t("teaser.cta")} →
          </Link>
          {(["gsap", "webgl", "physics", "typography"] as const).map((tag) => (
            <Link key={tag} href={`/lab?tag=${tag}`} className={styles.chip}>
              {t(`tags.${tag}`)}
            </Link>
          ))}
        </div>
      </div>
      <div className={styles.canvas} data-cursor={t("teaser.cursor")}>
        <PreviewCanvas reduced={reduced} />
        <span className={styles.hint}>{t("hints.move")}</span>
      </div>
    </section>
  );
}
