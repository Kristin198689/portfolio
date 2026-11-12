import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

const OG_LOCALE: Record<string, string> = { de: "de_DE", en: "en_US", uk: "uk_UA", ar: "ar_AR" };

// Per-language metadata: canonical, hreflang (with x-default), Open Graph, Twitter.
export function buildMetadata({
  locale,
  title,
  description,
}: {
  locale: string;
  title: string;
  description: string;
}): Metadata {
  const languages: Record<string, string> = Object.fromEntries(
    routing.locales.map((l) => [l, `/${l}`]),
  );
  languages["x-default"] = `/${routing.defaultLocale}`;
  return {
    title,
    description,
    alternates: { canonical: `/${locale}`, languages },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/${locale}`,
      siteName: "Christina Volodina",
      locale: OG_LOCALE[locale] ?? "en_US",
      alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
}
