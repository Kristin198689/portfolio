import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { notes } from "@/content/notes";
import styles from "../hire/hire.module.css";

export async function generateMetadata({ params }: PageProps<"/[locale]/notes">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "notes" });
  return {
    title: `${t("title")} · Christina Volodina`,
    description: t("intro"),
    alternates: {
      canonical: `/${locale}/notes`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/notes`])),
    },
  };
}

export default async function NotesPage({ params }: PageProps<"/[locale]/notes">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "notes" });
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
        {notes.map((n) => (
          <li key={n.slug}>
            <Link href={`/notes/${n.slug}`} data-scramble>
              <strong>{t(`items.${n.slug}.title`)}</strong>
              <span>{t(`items.${n.slug}.summary`)}</span>
              <span>
                {t("date")} {n.date} · {t("read")} →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
