import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pageMeta } from "@/lib/page-meta";
import styles from "../hire/hire.module.css";

export async function generateMetadata({ params }: PageProps<"/[locale]/faq">): Promise<Metadata> {
  const { locale } = await params;
  const md = await getTranslations({ locale, namespace: "metaDesc" });
  const t = await getTranslations({ locale, namespace: "about.faq" });
  return pageMeta(locale, "/faq", t("title"), md("faq"));
}

export default async function FaqPage({ params }: PageProps<"/[locale]/faq">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "about.faq" });
  const hub = await getTranslations({ locale, namespace: "about.hub" });
  const items = t.raw("items") as Array<{ q: string; a: string }>;
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale,
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
  return (
    <main className={styles.page} data-chapter="field">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }}
      />
      <Link href="/about" className={styles.back} data-scramble>
        ← {hub("kicker")}
      </Link>
      <p className={styles.kicker}>{t("kicker")}</p>
      <h1 className={styles.title} data-split>
        {t("title")}
      </h1>
      <p className={styles.intro}>{t("intro")}</p>

      <dl className={styles.rows} style={{ marginTop: "var(--space-12)" }}>
        {items.map((it) => (
          <div key={it.q}>
            <dt>{it.q}</dt>
            <dd>{it.a}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
