import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pageMeta } from "@/lib/page-meta";
import styles from "../hire/hire.module.css";

export async function generateMetadata({ params }: PageProps<"/[locale]/uses">): Promise<Metadata> {
  const { locale } = await params;
  const md = await getTranslations({ locale, namespace: "metaDesc" });
  const t = await getTranslations({ locale, namespace: "about.uses" });
  return pageMeta(locale, "/uses", t("title"), md("uses"));
}

export default async function UsesPage({ params }: PageProps<"/[locale]/uses">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "about.uses" });
  const hub = await getTranslations({ locale, namespace: "about.hub" });
  const groups = t.raw("groups") as Array<{ name: string; items: string[] }>;
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

      {groups.map((g) => (
        <section key={g.name} className={styles.block} aria-labelledby={`g-${g.name}`}>
          <h2 id={`g-${g.name}`} className={styles.h}>
            {g.name}
          </h2>
          <ul className={styles.checks}>
            {g.items.map((x) => (
              <li key={x}>
                <i aria-hidden="true">→</i>
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
