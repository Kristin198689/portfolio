import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pageMeta } from "@/lib/page-meta";
import styles from "../hire/hire.module.css";

export async function generateMetadata({ params }: PageProps<"/[locale]/plan">): Promise<Metadata> {
  const { locale } = await params;
  const md = await getTranslations({ locale, namespace: "metaDesc" });
  const t = await getTranslations({ locale, namespace: "about.plan" });
  return pageMeta(locale, "/plan", t("title"), md("plan"));
}

export default async function PlanPage({ params }: PageProps<"/[locale]/plan">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "about.plan" });
  const hub = await getTranslations({ locale, namespace: "about.hub" });
  const phases = t.raw("phases") as Array<{ range: string; name: string; points: string[] }>;
  const habits = t.raw("habits") as string[];
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

      {phases.map((ph) => (
        <section key={ph.range} className={styles.block} aria-labelledby={`p-${ph.range}`}>
          <h2 id={`p-${ph.range}`} className={styles.h}>
            {ph.range} · {ph.name}
          </h2>
          <ul className={styles.checks}>
            {ph.points.map((pt) => (
              <li key={pt}>
                <i aria-hidden="true">→</i>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className={styles.block} aria-labelledby="habits">
        <h2 id="habits" className={styles.h}>
          {t("habitsTitle")}
        </h2>
        <ul className={styles.checks}>
          {habits.map((x) => (
            <li key={x}>
              <i aria-hidden="true">✓</i>
              <span>{x}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
