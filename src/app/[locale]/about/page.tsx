import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pageMeta } from "@/lib/page-meta";
import styles from "../hire/hire.module.css";

const cards = ["plan", "decisions", "faq", "a11y", "changelog", "roadmap", "uses", "notes"] as const;
const hrefs = {
  plan: "/plan",
  decisions: "/decisions",
  faq: "/faq",
  a11y: "/accessibility",
  changelog: "/changelog",
  roadmap: "/roadmap",
  uses: "/uses",
  notes: "/notes",
} as const;

export async function generateMetadata({ params }: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  const md = await getTranslations({ locale, namespace: "metaDesc" });
  const t = await getTranslations({ locale, namespace: "about.hub" });
  return pageMeta(locale, "/about", t("title"), md("about"));
}

export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "about.hub" });
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
      <ul className={styles.proof} style={{ marginTop: "var(--space-12)" }}>
        {cards.map((k) => (
          <li key={k}>
            <Link href={hrefs[k]} data-scramble>
              <strong>{t(`cards.${k}`)}</strong>
              <span>{t(`desc.${k}`)}</span>
              <span>{t("open")} →</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
