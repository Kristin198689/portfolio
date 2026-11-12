import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { notes } from "@/content/notes";
import { siteConfig } from "@/config/site";
import styles from "./note.module.css";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => notes.map((n) => ({ locale, slug: n.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/notes/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!notes.some((n) => n.slug === slug)) return {};
  const t = await getTranslations({ locale, namespace: "notes.items" });
  return {
    title: `${t(`${slug}.title`)} · Christina Volodina`,
    description: t(`${slug}.summary`),
    alternates: {
      canonical: `/${locale}/notes/${slug}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/notes/${slug}`])),
    },
    openGraph: { type: "article", title: t(`${slug}.title`), description: t(`${slug}.summary`) },
  };
}

export default async function NotePage({ params }: PageProps<"/[locale]/notes/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const note = notes.find((n) => n.slug === slug);
  if (!note) notFound();
  const t = await getTranslations({ locale, namespace: "notes" });
  const body = t.raw(`items.${slug}.body`) as string[];

  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: t(`items.${slug}.title`),
    description: t(`items.${slug}.summary`),
    datePublished: note.date,
    inLanguage: locale,
    author: { "@type": "Person", name: siteConfig.name, url: siteConfig.url },
  };

  return (
    <main className={styles.page} data-chapter="field">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <Link href="/notes" className={styles.back} data-scramble>
        ← {t("back")}
      </Link>
      <p className={styles.date}>
        {t("date")} {note.date}
      </p>
      <h1 className={styles.title} data-split>
        {t(`items.${slug}.title`)}
      </h1>
      <p className={styles.lead}>{t(`items.${slug}.summary`)}</p>
      <ol className={styles.body}>
        {body.map((p, i) => (
          <li key={i}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <p>{p}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
