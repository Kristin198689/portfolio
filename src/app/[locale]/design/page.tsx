import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { DesignTokens } from "@/components/DesignTokens";
import styles from "../hire/hire.module.css";

export async function generateMetadata({ params }: PageProps<"/[locale]/design">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "design" });
  return {
    title: `${t("kicker")} · Christina Volodina`,
    description: t("intro"),
    alternates: {
      canonical: `/${locale}/design`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/design`])),
    },
  };
}

export default async function DesignPage({ params }: PageProps<"/[locale]/design">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "design" });
  const h = await getTranslations({ locale, namespace: "hire" });
  const rules = t.raw("rules") as string[];
  return (
    <main className={styles.page} data-chapter="field">
      <Link href="/" className={styles.back} data-scramble>
        ← {h("back")}
      </Link>
      <p className={styles.kicker}>{t("kicker")}</p>
      <h1 className={styles.title} data-split>
        {t("title")}
      </h1>
      <p className={styles.intro}>{t("intro")}</p>

      <DesignTokens />

      <section className={styles.block} aria-labelledby="d-a11y">
        <h2 id="d-a11y" className={styles.h}>
          {t("a11y")}
        </h2>
        <ul className={styles.checks}>
          {rules.map((r) => (
            <li key={r}>
              <i aria-hidden="true">✓</i>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
