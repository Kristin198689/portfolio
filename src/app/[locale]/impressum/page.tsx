import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/LegalPage";
import { impressum, arabicNotice } from "@/content/legal";

type L = "de" | "en" | "uk";

const docFor = (locale: string, build: (l: L) => ReturnType<typeof impressum>, title?: string) => {
  if (locale !== "ar") return build(locale as L);
  const d = build("en");
  return { ...d, title: title ?? d.title, lead: `${arabicNotice} ${d.lead}` };
};

export async function generateMetadata({ params }: PageProps<"/[locale]/impressum">): Promise<Metadata> {
  const { locale } = await params;
  const doc = docFor(locale, impressum);
  return {
    title: doc.title,
    alternates: { canonical: `/${locale}/impressum` },
    robots: { index: true, follow: true },
  };
}

export default async function ImpressumPage({ params }: PageProps<"/[locale]/impressum">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "footer" });
  return <LegalPage doc={docFor(locale, impressum, t("imprint"))} back={t("back")} />;
}
