import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/config/site";
import { pageMeta } from "@/lib/page-meta";
import hire from "../hire/hire.module.css";
import { WaterTitle } from "@/components/motion/WaterTitle";
import styles from "../services/services.module.css";

type Need = { t: string; d: string };
type Faq = { q: string; a: string };

export async function generateMetadata({ params }: PageProps<"/[locale]/webdesign-pforzheim">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pforzheim" });
  const md = await getTranslations({ locale, namespace: "metaDesc" });
  return pageMeta(locale, "/webdesign-pforzheim", t("metaTitle"), md("pforzheim"), { rawTitle: true });
}

// Local landing page for Pforzheim. It is not in the header or footer on purpose: it is reached from
// the services page, from search, and from the sitemap.
export default async function PforzheimPage({ params }: PageProps<"/[locale]/webdesign-pforzheim">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pforzheim" });
  const needs = t.raw("needs") as Need[];
  const meet = t.raw("meet") as Need[];
  const local = t.raw("local") as string[];
  const faq = t.raw("faq") as Faq[];
  const wa = siteConfig.whatsapp.length > 6 ? `https://wa.me/${siteConfig.whatsapp}` : null;
  const base = siteConfig.url;

  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": `${base}/#service`,
        name: `${siteConfig.name}, web design and development`,
        url: `${base}/${locale}/webdesign-pforzheim`,
        provider: { "@id": `${base}/#person` },
        address: { "@type": "PostalAddress", addressLocality: "Pforzheim", postalCode: "75175", addressCountry: "DE" },
        areaServed: [{ "@type": "City", name: "Pforzheim" }, "DE", "EU"],
        serviceType: ["Web design", "Website development", "Local SEO", "Web application development"],
        priceRange: "from 999 EUR",
      },
      {
        "@type": "FAQPage",
        inLanguage: locale,
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: siteConfig.name, item: `${base}/${locale}` },
          { "@type": "ListItem", position: 2, name: t("kicker"), item: `${base}/${locale}/webdesign-pforzheim` },
        ],
      },
    ],
  };

  return (
    <main className={hire.page} data-chapter="field">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }}
      />
      <Link href="/services" className={hire.back} data-scramble>
        ← {t("all")}
      </Link>
      <p className={hire.kicker}>{t("kicker")}</p>
      <h1 className={hire.title} data-split>
        {t("title")}
      </h1>
      <p className={hire.intro}>{t("intro")}</p>

      <div className={styles.actions}>
        <a href={`mailto:${siteConfig.email}`} className={hire.btn} data-scramble>
          {t("email")}
        </a>
        {wa ? (
          <a href={wa} target="_blank" rel="noopener noreferrer" className={hire.btn} data-scramble>
            WhatsApp
          </a>
        ) : null}
      </div>

      <section className={hire.block} aria-labelledby="needs">
        <h2 id="needs" className={hire.h}>
          {t("needsTitle")}
        </h2>
        <ol className={styles.factors}>
          {needs.map((n, i) => (
            <li key={n.t}>
              <span className={styles.fnum}>{String(i + 1).padStart(2, "0")}</span>
              <strong>{n.t}</strong>
              <p>{n.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={hire.block} aria-labelledby="meet">
        <h2 id="meet" className={hire.h}>
          {t("meetTitle")}
        </h2>
        <ol className={styles.whyGrid}>
          {meet.map((m, i) => (
            <li key={m.t}>
              <span className={styles.fnum}>{String(i + 1).padStart(2, "0")}</span>
              <strong>{m.t}</strong>
              <p>{m.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={hire.block} aria-labelledby="local">
        <h2 id="local" className={hire.h}>
          {t("localTitle")}
        </h2>
        <ul className={styles.pills}>
          {local.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </section>

      <section className={styles.from} aria-label={t("priceCta")}>
        <p className={styles.fromNote}>{t("priceText")}</p>
        <div className={styles.actions}>
          <Link href="/services" className={hire.btn} data-scramble>
            {t("priceCta")}
          </Link>
        </div>
      </section>

      <section className={hire.block} aria-labelledby="faq">
        <h2 id="faq" className={hire.h}>
          {t("faqTitle")}
        </h2>
        <div className={styles.faqList}>
          {faq.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={hire.talk} aria-labelledby="cta">
        <WaterTitle id="cta" multiline text={t("ctaTitle")} />
        <p>{t("ctaText")}</p>
        <div className={hire.buttons}>
          <a href={`mailto:${siteConfig.email}`} className={hire.btn} data-scramble>
            {t("email")}
          </a>
          {wa ? (
            <a href={wa} target="_blank" rel="noopener noreferrer" className={hire.btn} data-scramble>
              WhatsApp
            </a>
          ) : null}
        </div>
      </section>
    </main>
  );
}
