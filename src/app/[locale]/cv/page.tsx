import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { projects } from "@/config/projects";
import { siteConfig } from "@/config/site";
import { PrintButtons } from "@/components/PrintButton";
import styles from "./cv.module.css";

export async function generateMetadata({ params }: PageProps<"/[locale]/cv">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "cv" });
  return {
    title: `${t("kicker")} · ${siteConfig.name}`,
    description: t("intro"),
    alternates: {
      canonical: `/${locale}/cv`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/cv`])),
    },
  };
}

// Plain, linear HTML: no animation, no tricks, so applicant tracking systems and printers read it well.
export default async function CvPage({ params }: PageProps<"/[locale]/cv">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "cv" });
  const meta = await getTranslations({ locale, namespace: "meta" });
  const hire = await getTranslations({ locale, namespace: "hire" });
  const sk = await getTranslations({ locale, namespace: "skills" });
  const pr = await getTranslations({ locale, namespace: "projects" });
  const contact = await getTranslations({ locale, namespace: "contact" });
  const tiles = ["responsive", "frontend", "motion", "seo", "i18n", "a11y", "security", "ai"] as const;

  return (
    <main className={styles.page}>
      <PrintButtons />
      <Link href="/hire" className={styles.back}>
        ← {t("pdf")}
      </Link>
      <h1>{t("title")}</h1>
      <p className={styles.role}>{meta("jobTitle")}</p>
      <p>
        {siteConfig.email} · {siteConfig.phone} · {siteConfig.location} ·{" "}
        <a href={siteConfig.github}>github.com/Kristin198689</a>
      </p>
      <p className={styles.buttons}>
        <a href={`/cv/profile-${locale}.pdf`} download>
          {t("pdf")} ↓
        </a>
        <button type="button" data-print>
          {t("print")}
        </button>
      </p>

      <h2>{t("summary")}</h2>
      <p>{hire("pitch")}</p>

      <h2>{t("languages")}</h2>
      <p>{contact("languagesValue")}</p>

      <h2>{t("skills")}</h2>
      <ul>
        {tiles.map((k) => (
          <li key={k}>
            <strong>{sk(`tiles.${k}.t`)}.</strong> {sk(`tiles.${k}.d`)}
          </li>
        ))}
      </ul>

      <h2>{t("projects")}</h2>
      <ul>
        {projects.map((p) => (
          <li key={p.key}>
            <strong>{pr(`items.${p.key}.title`)}</strong> ({pr(`items.${p.key}.category`)}). {pr(`items.${p.key}.description`)}{" "}
            {p.href ? <a href={p.href}>{p.href.replace("https://", "")}</a> : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
