import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { projects } from "@/config/projects";
import { notes } from "@/content/notes";
import { siteConfig } from "@/config/site";

// The date of this build: one honest value for every page, instead of a new date on each request.
const BUILT = new Date();

// Home, case studies and legal pages, each with its language alternates (and x-default).
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    { path: "", priority: 1 },
    ...projects.filter((p) => p.case).map((p) => ({ path: `/projects/${p.key}`, priority: 0.8 })),
    { path: "/hire", priority: 0.7 },
    { path: "/services", priority: 0.9 },
    { path: "/webdesign-pforzheim", priority: 0.8 },
    { path: "/work", priority: 0.8 },
    { path: "/about", priority: 0.7 },
    ...["/plan", "/decisions", "/faq", "/accessibility", "/roadmap", "/uses", "/changelog"].map((path) => ({ path, priority: 0.5 })),
    { path: "/notes", priority: 0.7 },
    ...notes.map((n) => ({ path: `/notes/${n.slug}`, priority: 0.6 })),
    { path: "/design", priority: 0.5 },
    { path: "/lab", priority: 0.5 },
    { path: "/cv", priority: 0.6 },
    { path: "/impressum", priority: 0.3 },
    { path: "/datenschutz", priority: 0.3 },
  ];
  return paths.flatMap(({ path, priority }) => {
    const languages: Record<string, string> = Object.fromEntries(routing.locales.map((l) => [l, `${siteConfig.url}/${l}${path}`]));
    languages["x-default"] = `${siteConfig.url}/${siteConfig.xDefaultLocale}${path}`;
    return routing.locales.map((l) => ({
      url: `${siteConfig.url}/${l}${path}`,
      lastModified: BUILT,
      changeFrequency: "monthly" as const,
      priority: l === routing.defaultLocale ? priority : priority * 0.9,
      alternates: { languages },
    }));
  });
}
