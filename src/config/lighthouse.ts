// Real Lighthouse run of this site, kept here so the SEO section can show it with its date.
// Re-run after bigger changes: next build && next start, then
// npx lighthouse http://localhost:3300/en --preset=desktop --output=json
export const lighthouse = {
  date: "2026-11-12",
  device: "desktop",
  scores: { performance: 94, accessibility: 100, bestPractices: 100, seo: 100 },
  lcp: "1.1 s",
  cls: "0.042",
} as const;
