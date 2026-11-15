import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/config/site";

// Title, description, canonical and hreflang for the simple text pages.
export function pageMeta(locale: string, path: string, title: string, description: string): Metadata {
  return {
    title: `${title} · ${siteConfig.name}`,
    description,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}${path}`])),
    },
    openGraph: { title, description, url: `/${locale}${path}` },
    twitter: { card: "summary_large_image", title, description },
  };
}
