import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { CssPlayground } from "@/components/CssPlayground";
import styles from "../hire/hire.module.css";

export async function generateMetadata({ params }: PageProps<"/[locale]/lab">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "lab" });
  return {
    title: `${t("title")} · Christina Volodina`,
    description: t("intro"),
    alternates: {
      canonical: `/${locale}/lab`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/lab`])),
    },
  };
}

export default async function LabPage({ params }: PageProps<"/[locale]/lab">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "lab" });
  const h = await getTranslations({ locale, namespace: "hire" });
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
      <CssPlayground />
    </main>
  );
}
