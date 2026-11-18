import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { lighthouse } from "@/config/lighthouse";
import { siteConfig } from "@/config/site";
import { projects } from "@/config/projects";
import { pageMeta } from "@/lib/page-meta";
import { ServiceTiles } from "@/components/services/ServiceTiles";
import { ProcessLine } from "@/components/services/ProcessLine";
import { WaterTitle } from "@/components/motion/WaterTitle";
import hire from "../hire/hire.module.css";
import styles from "./services.module.css";

type Offer = { t: string; d: string; p: string };
type Factor = { k: string; v: string };
type Step = { t: string; d: string };
type Why = { t: string; d: string };
type Faq = { q: string; a: string };

export async function generateMetadata({ params }: PageProps<"/[locale]/services">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "services" });
  const md = await getTranslations({ locale, namespace: "metaDesc" });
  return pageMeta(locale, "/services", t("metaTitle"), md("services"), { rawTitle: true });
}

export default async function ServicesPage({ params }: PageProps<"/[locale]/services">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "services" });
  const h = await getTranslations({ locale, namespace: "hire" });
  const pj = await getTranslations({ locale, namespace: "projects.items" });
  const pf = await getTranslations({ locale, namespace: "pforzheim" });
  const proof = projects.filter((p) => p.case);
  const offers = t.raw("offers") as Offer[];
  const included = t.raw("included") as string[];
  const factors = t.raw("factors") as Factor[];
  const steps = t.raw("steps") as Step[];
  const why = t.raw("why") as Why[];
  const faq = t.raw("faq") as Faq[];
  const s = lighthouse.scores;
  const fill = (d: string) =>
    d.replace("{perf}", String(s.performance)).replace("{a11y}", String(s.accessibility)).replace("{seo}", String(s.seo));
  const wa = siteConfig.whatsapp.length > 6 ? `https://wa.me/${siteConfig.whatsapp}` : null;
  const base = siteConfig.url;

  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": `${base}/#service`,
        name: `${siteConfig.name}, web development`,
        url: `${base}/${locale}/services`,
        provider: { "@id": `${base}/#person` },
        areaServed: ["DE", "EU", "Worldwide"],
        address: { "@type": "PostalAddress", addressLocality: "Pforzheim", addressCountry: "DE" },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: t("title"),
          itemListElement: offers.map((o, i) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: o.t, description: o.d },
            ...(i === 0
              ? { priceSpecification: { "@type": "PriceSpecification", minPrice: 999, priceCurrency: "EUR" } }
              : {}),
          })),
        },
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
          { "@type": "ListItem", position: 2, name: t("kicker"), item: `${base}/${locale}/services` },
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
      <Link href="/" className={hire.back} data-scramble>
        ← {h("back")}
      </Link>
      <p className={hire.kicker}>{t("kicker")}</p>
      <h1 className={hire.title} data-split>
        {t("title")}
      </h1>
      <p className={hire.intro}>{t("intro")}</p>

      <div className={styles.from}>
        <span className={styles.fromLabel}>{t("from_")}</span>
        <span className={styles.fromValue}>{t("fromValue")}</span>
        <p className={styles.fromNote}>{t("fromNote")}</p>
        <div className={styles.actions}>
          <a href={`mailto:${siteConfig.email}`} className={hire.btn} data-scramble>
            {t("cta.write")}
          </a>
          {wa ? (
            <a href={wa} target="_blank" rel="noopener noreferrer" className={hire.btn} data-scramble>
              WhatsApp
            </a>
          ) : null}
          <Link href="/work" className={hire.btn} data-scramble>
            {t("cta.work")}
          </Link>
        </div>
      </div>

      <dl className={styles.stats}>
        <div>
          <dd>{offers.length}+</dd>
          <dt>{t("stats.services")}</dt>
        </div>
        <div>
          <dd>4+</dd>
          <dt>{t("stats.languages")}</dt>
        </div>
        <div>
          <dd>{s.accessibility}</dd>
          <dt>{t("stats.a11y")}</dt>
        </div>
        <div>
          <dd>{s.seo}</dd>
          <dt>{t("stats.seo")}</dt>
        </div>
      </dl>
      <p className={styles.note}>{t("statsNote")}, {lighthouse.date}</p>

      <section className={hire.block} aria-labelledby="offers">
        <h2 id="offers" className={hire.h}>
          {t("offersTitle")}
        </h2>
        <ServiceTiles
          offers={offers}
          label={t("offersTitle")}
          extra={{ title: t("moreTitle"), text: t("moreText"), cta: t("moreCta"), href: `mailto:${siteConfig.email}` }}
        />
      </section>

      <section className={hire.block} aria-labelledby="price">
        <h2 id="price" className={hire.h}>
          {t("priceTitle")}
        </h2>
        <p className={hire.teamIntro}>{t("priceIntro")}</p>
        <dl className={styles.factors}>
          {factors.map((f, i) => (
            <div key={f.k}>
              <span className={styles.fnum}>{String(i + 1).padStart(2, "0")}</span>
              <dt>{f.k}</dt>
              <dd>{f.v}</dd>
            </div>
          ))}
        </dl>
        <p className={styles.note}>{t("priceNote")}</p>
      </section>

      <section className={hire.block} aria-labelledby="included">
        <h2 id="included" className={hire.h}>
          {t("includedTitle")}
        </h2>
        <ul className={styles.pills}>
          {included.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </section>

      <section className={hire.block} aria-labelledby="process">
        <h2 id="process" className={hire.h}>
          {t("processTitle")}
        </h2>
        <ProcessLine steps={steps} label={t("processTitle")} />
      </section>

      <section className={hire.block} aria-labelledby="proof">
        <h2 id="proof" className={hire.h}>
          {t("proofTitle")}
        </h2>
        <ul className={styles.proof}>
          {proof.map((p) => (
            <li key={p.key}>
              <Link href={`/projects/${p.key}`} data-scramble>
                <span className={styles.shot}>
                  <Image src={p.image} alt="" fill sizes="(min-width: 56rem) 33vw, 100vw" />
                </span>
                <strong>{pj(`${p.key}.title`)}</strong>
                <span>{pj(`${p.key}.category`)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={hire.block} aria-labelledby="why">
        <h2 id="why" className={hire.h}>
          {t("whyTitle")}
        </h2>
        <ol className={styles.whyGrid}>
          {why.map((w, i) => (
            <li key={w.t}>
              <span className={styles.fnum}>{String(i + 1).padStart(2, "0")}</span>
              <strong>{w.t}</strong>
              <p>{fill(w.d)}</p>
            </li>
          ))}
        </ol>
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
        <p className={styles.note}>
          {t("areaTitle")}: {t("area")}{" "}
          <Link href="/webdesign-pforzheim">{pf("kicker")}</Link>
        </p>
      </section>

      <section className={hire.talk} aria-labelledby="cta">
        <WaterTitle id="cta" multiline text={t("ctaTitle")} />
        <p>{t("ctaText")}</p>
        <div className={hire.buttons}>
          <a href={`mailto:${siteConfig.email}`} className={hire.btn} data-scramble>
            {t("cta.email")}
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
