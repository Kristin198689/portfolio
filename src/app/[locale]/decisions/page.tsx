import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pageMeta } from "@/lib/page-meta";
import styles from "../hire/hire.module.css";

export async function generateMetadata({ params }: PageProps<"/[locale]/decisions">): Promise<Metadata> {
  const { locale } = await params;
  const md = await getTranslations({ locale, namespace: "metaDesc" });
  const t = await getTranslations({ locale, namespace: "about.decisions" });
  return pageMeta(locale, "/decisions", t("title"), md("decisions"));
}

export default async function DecisionsPage({ params }: PageProps<"/[locale]/decisions">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "about.decisions" });
  const hub = await getTranslations({ locale, namespace: "about.hub" });
  const items = t.raw("items") as Array<{ t: string; why: string; price: string }>;
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

      <ol className={styles.why} style={{ marginTop: "var(--space-12)" }}>
        {items.map((it, i) => (
          <li key={it.t}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <strong>{it.t}</strong>
            <div>
              <p>
                <b>{t("reason")}:</b> {it.why}
              </p>
              <p>
                <b>{t("price")}:</b> {it.price}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
