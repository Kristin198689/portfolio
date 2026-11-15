import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/config/site";
import { pageMeta } from "@/lib/page-meta";
import styles from "../hire/hire.module.css";

export async function generateMetadata({ params }: PageProps<"/[locale]/accessibility">): Promise<Metadata> {
  const { locale } = await params;
  const md = await getTranslations({ locale, namespace: "metaDesc" });
  const t = await getTranslations({ locale, namespace: "about.a11y" });
  return pageMeta(locale, "/accessibility", t("title"), md("accessibility"));
}

export default async function AccessibilityPage({ params }: PageProps<"/[locale]/accessibility">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "about.a11y" });
  const hub = await getTranslations({ locale, namespace: "about.hub" });
  const done = t.raw("done") as string[];
  const limits = t.raw("limits") as string[];
  return (
    <main className={styles.page} data-chapter="field">
      <Link href="/about" className={styles.back} data-scramble>
        ← {hub("kicker")}
      </Link>
      <p className={styles.kicker}>{t("kicker")}</p>
      <h1 className={styles.title} data-split>
        {t("title")}
      </h1>
      <p className={styles.intro}>{t("intro")}</p>
      <p className={styles.teamIntro} style={{ marginTop: "var(--space-4)", opacity: 0.6 }}>
        {t("date")}: 2026-11-12
      </p>

      <section className={styles.block} aria-labelledby="done">
        <h2 id="done" className={styles.h}>
          {t("doneTitle")}
        </h2>
        <ul className={styles.checks}>
          {done.map((x) => (
            <li key={x}>
              <i aria-hidden="true">✓</i>
              <span>{x}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.block} aria-labelledby="limits">
        <h2 id="limits" className={styles.h}>
          {t("limitsTitle")}
        </h2>
        <ul className={styles.checks}>
          {limits.map((x) => (
            <li key={x}>
              <i aria-hidden="true">!</i>
              <span>{x}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.block} aria-labelledby="contact">
        <h2 id="contact" className={styles.h}>
          {t("contactTitle")}
        </h2>
        <p className={styles.teamIntro}>{t("contact")}</p>
        <p className={styles.teamIntro}>
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> ·{" "}
          <a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}>{siteConfig.phone}</a>
        </p>
      </section>
    </main>
  );
}
