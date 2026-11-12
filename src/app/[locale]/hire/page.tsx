import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { lighthouse } from "@/config/lighthouse";
import { siteConfig } from "@/config/site";
import styles from "./hire.module.css";

export async function generateMetadata({ params }: PageProps<"/[locale]/hire">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "hire" });
  return {
    title: `${t("kicker")} · ${siteConfig.name}`,
    description: t("intro"),
    alternates: {
      canonical: `/${locale}/hire`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/hire`])),
    },
  };
}

export default async function HirePage({ params }: PageProps<"/[locale]/hire">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "hire" });
  const rows = t.raw("rows") as Array<{ k: string; v: string }>;
  const items = t.raw("items") as string[];
  const proof = t.raw("proof") as Array<{ t: string; d: string; to: string }>;
  const tour = t.raw("tour") as Array<{ t: string; to: string }>;
  const why = t.raw("why") as Array<{ t: string; d: string }>;
  const team = t.raw("team") as Array<{ t: string; d: string }>;
  const s = lighthouse.scores;
  const fill = (d: string) =>
    d
      .replace("{perf}", String(s.performance))
      .replace("{a11y}", String(s.accessibility))
      .replace("{bp}", String(s.bestPractices))
      .replace("{seo}", String(s.seo));
  const wa = siteConfig.whatsapp.length > 6 ? `https://wa.me/${siteConfig.whatsapp}` : null;

  return (
    <main className={styles.page} data-chapter="field">
      <Link href="/" className={styles.back} data-scramble>
        ← {t("back")}
      </Link>
      <p className={styles.kicker}>{t("kicker")}</p>
      <h1 className={styles.title} data-split>
        {t("title")}
      </h1>
      <p className={styles.intro}>{t("intro")}</p>

      <section className={styles.pitch} aria-labelledby="pitch">
        <h2 id="pitch" className={styles.h}>
          {t("pitchTitle")}
        </h2>
        <p className={styles.pitchText}>{t("pitch")}</p>
      </section>

      <section className={styles.block} aria-labelledby="why">
        <h2 id="why" className={styles.h}>
          {t("whyTitle")}
        </h2>
        <ol className={styles.why}>
          {why.map((w, i) => (
            <li key={w.t}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <strong>{w.t}</strong>
                <p>{w.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.block} aria-labelledby="glance">
        <h2 id="glance" className={styles.h}>
          {t("glanceTitle")}
        </h2>
        <dl className={styles.rows}>
          {rows.map((r) => (
            <div key={r.k}>
              <dt>{r.k}</dt>
              <dd>{r.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.block} aria-labelledby="do">
        <h2 id="do" className={styles.h}>
          {t("doTitle")}
        </h2>
        <ul className={styles.checks}>
          {items.map((it) => (
            <li key={it}>
              <i aria-hidden="true">✓</i>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.block} aria-labelledby="team">
        <h2 id="team" className={styles.h}>
          {t("teamTitle")}
        </h2>
        <p className={styles.teamIntro}>{t("teamIntro")}</p>
        <ol className={styles.why}>
          {team.map((w, i) => (
            <li key={w.t}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <strong>{w.t}</strong>
                <p>{w.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.block} aria-labelledby="proof">
        <h2 id="proof" className={styles.h}>
          {t("proofTitle")}
        </h2>
        <ul className={styles.proof}>
          {proof.map((p) => (
            <li key={p.t}>
              {p.to === "gh" ? (
                <a href={`${siteConfig.github}/portfolio/commits`} target="_blank" rel="noopener noreferrer" data-scramble>
                  <strong>{p.t} ↗</strong>
                  <span>{fill(p.d)}</span>
                </a>
              ) : (
                <Link href={`/${p.to}`} data-scramble>
                  <strong>{p.t}</strong>
                  <span>{fill(p.d)}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.block} aria-labelledby="tour">
        <h2 id="tour" className={styles.h}>
          {t("tourTitle")}
        </h2>
        <ul className={styles.tour}>
          {tour.map((x) => (
            <li key={x.t}>
              <Link href={`/${x.to}`} data-scramble>
                {x.t}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.talk} aria-labelledby="talk">
        <h2 id="talk" className={styles.talkTitle}>
          {t("talkTitle")}
        </h2>
        <p>{t("talk")}</p>
        <div className={styles.buttons}>
          <a href={`mailto:${siteConfig.email}`} className={styles.btn} data-scramble>
            {t("mail")}
          </a>
          {wa ? (
            <a href={wa} target="_blank" rel="noopener noreferrer" className={styles.btn} data-scramble>
              {t("wa")}
            </a>
          ) : null}
          <a href={`/cv/profile-${locale}.pdf`} download className={styles.btn} data-scramble>
            {t("cv")} ↓
          </a>
          <a href={siteConfig.github} target="_blank" rel="noopener noreferrer" className={styles.btn} data-scramble>
            {t("gh")} ↗
          </a>
        </div>
      </section>
    </main>
  );
}
