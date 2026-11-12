import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LinkMaker } from "@/components/LinkMaker";
import { siteConfig } from "@/config/site";
import styles from "../hire/hire.module.css";

// A tool for me, not part of the public site map: kept out of search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function LinkPage({ params }: PageProps<"/[locale]/link">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "link" });
  const h = await getTranslations({ locale, namespace: "hire" });
  return (
    <main className={styles.page} data-chapter="field">
      <Link href="/" className={styles.back} data-scramble>
        ← {h("back")}
      </Link>
      <h1 className={styles.title} data-split>
        {t("title")}
      </h1>
      <p className={styles.intro}>{t("intro")}</p>
      <LinkMaker defaultBase={siteConfig.url} />
    </main>
  );
}
