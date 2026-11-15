import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LabShell } from "@/components/lab/LabShell";
import { pageMeta } from "@/lib/page-meta";
import styles from "../hire/hire.module.css";

export async function generateMetadata({ params }: PageProps<"/[locale]/lab">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "lab" });
  const md = await getTranslations({ locale, namespace: "metaDesc" });
  return pageMeta(locale, "/lab", t("title"), md("lab"));
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
      <Suspense fallback={null}>
        <LabShell />
      </Suspense>
    </main>
  );
}
