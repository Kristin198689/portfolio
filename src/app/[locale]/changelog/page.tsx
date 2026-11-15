import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { changelog } from "@/config/changelog";
import { siteConfig } from "@/config/site";
import { pageMeta } from "@/lib/page-meta";
import styles from "../hire/hire.module.css";

export async function generateMetadata({ params }: PageProps<"/[locale]/changelog">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about.changelog" });
  return pageMeta(locale, "/changelog", t("title"), t("intro"));
}

export default async function ChangelogPage({ params }: PageProps<"/[locale]/changelog">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "about.changelog" });
  const hub = await getTranslations({ locale, namespace: "about.hub" });
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

      <dl className={styles.rows} style={{ marginTop: "var(--space-12)" }}>
        {changelog.map((c) => (
          <div key={c.hash}>
            <dt>
              {c.date} · {c.hash}
            </dt>
            <dd>
              {c.subject}{" "}
              <a href={`${siteConfig.github}/portfolio/commit/${c.hash}`} target="_blank" rel="noopener noreferrer">
                {t("open")} ↗
              </a>
            </dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
