import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { earlier } from "@/config/archive";
import { WorkList } from "@/components/work/WorkList";
import styles from "./work.module.css";

export async function generateMetadata({ params }: PageProps<"/[locale]/work">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "work" });
  return {
    title: `${t("title")} · Christina Volodina`,
    description: t("intro"),
    alternates: {
      canonical: `/${locale}/work`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/work`])),
    },
  };
}

export default async function WorkPage({ params }: PageProps<"/[locale]/work">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "work" });
  return (
    <main className={styles.page} data-chapter="field">
      <Link href="/" className={styles.back} data-scramble>
        ← {t("back")}
      </Link>
      <p className={styles.kicker}>{t("kicker")}</p>
      <h1 className={styles.title} data-split>
        {t("title")}
      </h1>
      <p className={styles.intro}>{t("intro")}</p>
      <p className={styles.note}>{t("privateNote")}</p>

      <WorkList />

      <section className={styles.earlier} aria-labelledby="earlier">
        <h2 id="earlier" className={styles.h}>
          {t("earlierTitle")}
        </h2>
        <p className={styles.earlierNote}>{t("earlierNote")}</p>
        <ul className={styles.repos}>
          {earlier.map((r) => (
            <li key={r.name}>
              {r.repo ? (
                <a href={r.repo} target="_blank" rel="noopener noreferrer" data-scramble>
                  {r.name} <span>{r.lang} ↗</span>
                </a>
              ) : (
                <span className={styles.priv}>
                  {r.name} <span>{r.lang} · {t("privateRepo")}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
