import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { projects } from "@/config/projects";
import { siteConfig } from "@/config/site";
import styles from "./case.module.css";

const cases = projects.filter((p) => p.case);

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => cases.map((p) => ({ locale, slug: p.key })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/projects/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = cases.find((c) => c.key === slug);
  if (!p) return {};
  const t = await getTranslations({ locale, namespace: "projects.items" });
  const c = await getTranslations({ locale, namespace: "cases" });
  const title = `${t(`${slug}.title`)} · ${c("ui.type")}`;
  const description = c(`${slug}.summary`);
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/projects/${slug}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/projects/${slug}`])),
    },
    openGraph: { title, description, images: [p.image], url: `/${locale}/projects/${slug}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CasePage({ params }: PageProps<"/[locale]/projects/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const idx = cases.findIndex((c) => c.key === slug);
  if (idx < 0) notFound();
  const p = cases[idx];
  const next = cases[(idx + 1) % cases.length];
  const t = await getTranslations({ locale, namespace: "projects.items" });
  const c = await getTranslations({ locale, namespace: "cases" });
  const points = c.raw(`${slug}.points`) as string[];
  const stack = c.raw(`${slug}.stack`) as string[];

  const ld = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: t(`${slug}.title`),
    description: c(`${slug}.summary`),
    image: `${siteConfig.url}${p.image}`,
    author: { "@type": "Person", name: siteConfig.name, url: siteConfig.url },
    inLanguage: locale,
    keywords: stack.join(", "),
  };

  return (
    <main className={styles.page} data-chapter="field">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }}
      />
      <Link href="/#projects" className={styles.back} data-scramble>
        ← {c("ui.back")}
      </Link>
      <p className={styles.kicker}>
        {c("ui.kicker")} · {t(`${slug}.category`)}
      </p>
      <h1 className={styles.title} data-split>
        {t(`${slug}.title`)}
      </h1>

      <div className={styles.hero}>
        <Image
          src={p.image}
          alt={t(`${slug}.title`)}
          fill
          priority
          sizes="100vw"
          className={styles.img}
        />
      </div>

      <div className={styles.grid}>
        <p className={styles.summary}>{c(`${slug}.summary`)}</p>
        <dl className={styles.meta}>
          <div>
            <dt>{c("ui.role")}</dt>
            <dd>{c(`${slug}.role`)}</dd>
          </div>
          <div>
            <dt>{c("ui.stack")}</dt>
            <dd className={styles.tags}>
              {stack.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </dd>
          </div>
        </dl>
      </div>

      {p.href ? (
        <a href={p.href} target="_blank" rel="noopener noreferrer" className={styles.live} data-scramble>
          {c("ui.live")} ↗
        </a>
      ) : null}

      <h2 className={styles.h2}>{c("ui.highlights")}</h2>
      <ol className={styles.points}>
        {points.map((pt, i) => (
          <li key={i}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <p>{pt}</p>
          </li>
        ))}
      </ol>

      <Link href={`/projects/${next.key}`} className={styles.next} data-scramble>
        <span>{c("ui.next")}</span>
        <strong>{t(`${next.key}.title`)} →</strong>
      </Link>
    </main>
  );
}
