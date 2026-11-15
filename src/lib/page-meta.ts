import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/config/site";

const OG_LOCALE: Record<string, string> = { de: "de_DE", en: "en_US", uk: "uk_UA", ar: "ar_AR" };

// Title, description, canonical, hreflang (with x-default), Open Graph and Twitter for inner pages.
export function pageMeta(
  locale: string,
  path: string,
  title: string,
  description: string,
  opts: { type?: "website" | "article"; noindex?: boolean } = {},
): Metadata {
  const full = `${title} · ${siteConfig.name}`;
  const finalTitle = full.length > 62 ? `${title} · ${siteConfig.shortName}` : full;
  const languages: Record<string, string> = Object.fromEntries(routing.locales.map((l) => [l, `/${l}${path}`]));
  languages["x-default"] = `/${routing.defaultLocale}${path}`;
  const image = `/${locale}/opengraph-image`;
  return {
    title: finalTitle,
    description,
    alternates: { canonical: `/${locale}${path}`, languages },
    openGraph: {
      type: opts.type ?? "website",
      title: finalTitle,
      description,
      url: `/${locale}${path}`,
      siteName: siteConfig.name,
      locale: OG_LOCALE[locale] ?? "en_US",
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title: finalTitle, description, images: [image] },
    ...(opts.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
