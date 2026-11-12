"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { lighthouse } from "@/config/lighthouse";
import { BrandIcon } from "../ui/BrandIcon";
import styles from "./Seo.module.css";

const CAPS = ["technical", "onpage", "schema", "intl", "vitals", "geo"] as const;
const CHECKS = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
type Tab = "meta" | "hreflang" | "schema" | "files";

type Head = {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  langs: Array<{ lang: string; href: string }>;
  schema: string;
};

type Vitals = { lcp: number | null; cls: number; fcp: number | null; ttfb: number | null };

const ms = (v: number | null) => (v == null ? null : `${Math.round(v)} ms`);

// Proof, not claims: everything in the panel is read from this very page in the visitor's browser.
export function Seo() {
  const t = useTranslations("seo");
  const locale = useLocale();
  const [tab, setTab] = useState<Tab>("meta");
  const [head, setHead] = useState<Head | null>(null);
  const [vitals, setVitals] = useState<Vitals>({ lcp: null, cls: 0, fcp: null, ttfb: null });

  // Read the real <head>
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
    const meta = (n: string) => document.querySelector<HTMLMetaElement>(`meta[name="${n}"]`)?.content ?? "";
    let schema = "";
    try {
      const raw = document.querySelector('script[type="application/ld+json"]')?.textContent ?? "";
      schema = raw ? JSON.stringify(JSON.parse(raw), null, 2) : "";
    } catch {
      schema = "";
    }
    setHead({
      title: document.title,
      description: meta("description"),
      canonical: document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? "",
      robots: meta("robots"),
      langs: Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]')).map((l) => ({
        lang: l.hreflang,
        href: l.href,
      })),
      schema,
    });
    });
    return () => cancelAnimationFrame(frame);
  }, [locale]);

  // Live Web Vitals from the Performance APIs (no library)
  useEffect(() => {
    if (typeof PerformanceObserver === "undefined") return;
    const frame = requestAnimationFrame(() => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (nav) setVitals((v) => ({ ...v, ttfb: nav.responseStart }));
    });
    const observers: PerformanceObserver[] = [];
    const watch = (type: string, cb: (e: PerformanceEntryList) => void) => {
      try {
        const o = new PerformanceObserver((l) => cb(l.getEntries()));
        o.observe({ type, buffered: true });
        observers.push(o);
      } catch {
        /* entry type not supported in this browser */
      }
    };
    watch("largest-contentful-paint", (es) => {
      const last = es[es.length - 1] as PerformanceEntry | undefined;
      if (last) setVitals((v) => ({ ...v, lcp: last.startTime }));
    });
    watch("paint", (es) => {
      const fcp = es.find((e) => e.name === "first-contentful-paint");
      if (fcp) setVitals((v) => ({ ...v, fcp: fcp.startTime }));
    });
    watch("layout-shift", (es) => {
      let add = 0;
      for (const e of es as unknown as Array<{ value: number; hadRecentInput: boolean }>) {
        if (!e.hadRecentInput) add += e.value;
      }
      if (add) setVitals((v) => ({ ...v, cls: v.cls + add }));
    });
    return () => {
      cancelAnimationFrame(frame);
      observers.forEach((o) => o.disconnect());
    };
  }, []);

  const tabs: Tab[] = ["meta", "hreflang", "schema", "files"];
  const measuring = t("measuring");

  return (
    <section id="seo" className={styles.section} data-chapter="paper">
      <header className={styles.head}>
        <p className={styles.kicker}>{t("kicker")}</p>
        <h2 className={styles.title} data-split>
          {t("title")}
        </h2>
        <p className={styles.intro}>{t("intro")}</p>
      </header>

      <h3 className={styles.h}>{t("skillsTitle")}</h3>
      <ul className={styles.caps}>
        {CAPS.map((k, i) => (
          <li key={k} className={styles.cap}>
            <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
            <strong>{t(`skills.${k}.t`)}</strong>
            <span>{t(`skills.${k}.d`)}</span>
          </li>
        ))}
      </ul>

      <h3 className={styles.h}>
        <BrandIcon name="lighthouse" size={16} /> {t("lhTitle")}
      </h3>
      <ul className={styles.rings}>
        {(
          [
            ["performance", "perf"],
            ["accessibility", "a11y"],
            ["bestPractices", "bp"],
            ["seo", "seo"],
          ] as const
        ).map(([k, label]) => {
          const v = lighthouse.scores[k];
          return (
            <li key={k} className={styles.ring} style={{ "--v": v } as React.CSSProperties}>
              <svg viewBox="0 0 36 36" aria-hidden="true">
                <circle cx="18" cy="18" r="15.5" className={styles.track} />
                <circle cx="18" cy="18" r="15.5" className={styles.arc} pathLength="100" />
              </svg>
              <strong>{v}</strong>
              <span>{t(label)}</span>
            </li>
          );
        })}
      </ul>
      <p className={styles.lhNote}>
        {t("lhNote", { date: lighthouse.date })} {t("lcpLabel")} {lighthouse.lcp} · {t("clsLabel")} {lighthouse.cls}
      </p>

      <h3 className={`${styles.h} ${styles.liveH}`}>
        <span className={styles.dot} aria-hidden="true" /> {t("liveTitle")}
      </h3>
      <div className={styles.lab}>
        <div className={styles.panel}>
          <div className={styles.tabs} role="tablist">
            {tabs.map((k) => (
              <button
                key={k}
                role="tab"
                type="button"
                aria-selected={tab === k}
                className={styles.tab}
                onClick={() => setTab(k)}
              >
                {t(`tabs.${k}`)}
              </button>
            ))}
          </div>

          <div className={styles.view} data-lenis-prevent>
            {tab === "meta" && head ? (
              <dl className={styles.meta}>
                <dt>{t("metaTitle")}</dt>
                <dd>{head.title}</dd>
                <dt>{t("metaDesc")}</dt>
                <dd>{head.description}</dd>
                <dt>{t("metaCanonical")}</dt>
                <dd>{head.canonical}</dd>
                <dt>{t("metaRobots")}</dt>
                <dd>{head.robots}</dd>
              </dl>
            ) : null}
            {tab === "hreflang" && head ? (
              <ul className={styles.langs}>
                {head.langs.map((l) => (
                  <li key={l.lang}>
                    <code>{l.lang}</code>
                    <span>{l.href}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {tab === "schema" && head ? <pre className={styles.code}>{head.schema}</pre> : null}
            {tab === "files" ? (
              <div className={styles.files}>
                <p>{t("filesText")}</p>
                <ul>
                  {["/sitemap.xml", "/robots.txt", "/llms.txt", `/${locale}/opengraph-image`].map((f) => (
                    <li key={f}>
                      <a href={f} target="_blank" rel="noopener noreferrer" data-scramble>
                        {f}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        <div className={styles.side}>
          <div className={styles.vitals}>
            <h4>{t("vitalsTitle")}</h4>
            <dl>
              <div>
                <dt>{t("lcp")}</dt>
                <dd>{ms(vitals.lcp) ?? measuring}</dd>
              </div>
              <div>
                <dt>{t("cls")}</dt>
                <dd>{vitals.cls.toFixed(3)}</dd>
              </div>
              <div>
                <dt>{t("fcp")}</dt>
                <dd>{ms(vitals.fcp) ?? measuring}</dd>
              </div>
              <div>
                <dt>{t("ttfb")}</dt>
                <dd>{ms(vitals.ttfb) ?? measuring}</dd>
              </div>
            </dl>
          </div>

          <div className={styles.checks}>
            <h4>{t("checkTitle")}</h4>
            <ul>
              {CHECKS.map((c) => (
                <li key={c}>
                  <i aria-hidden="true">✓</i> {t(`checks.${c}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
