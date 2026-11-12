import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { projects } from "@/config/projects";
import { notes } from "@/content/notes";
import { siteConfig } from "@/config/site";

// Home, case studies and legal pages, each with its language alternates.
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    { path: "", priority: 1 },
    ...projects.filter((p) => p.case).map((p) => ({ path: `/projects/${p.key}`, priority: 0.8 })),
    { path: "/hire", priority: 0.7 },
    { path: "/work", priority: 0.8 },
    { path: "/notes", priority: 0.7 },
    ...notes.map((n) => ({ path: `/notes/${n.slug}`, priority: 0.6 })),
    { path: "/design", priority: 0.5 },
    { path: "/lab", priority: 0.5 },
    { path: "/cv", priority: 0.6 },
    { path: "/impressum", priority: 0.3 },
    { path: "/datenschutz", priority: 0.3 },
  ];
  return paths.flatMap(({ path, priority }) => {
    const languages = Object.fromEntries(routing.locales.map((l) => [l, `${siteConfig.url}/${l}${path}`]));
    return routing.locales.map((l) => ({
      url: `${siteConfig.url}/${l}${path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: l === routing.defaultLocale ? priority : priority * 0.9,
      alternates: { languages },
    }));
  });
}
