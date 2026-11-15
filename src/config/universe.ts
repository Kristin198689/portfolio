// Data for the Skills Universe: clusters, skills, how they connect and where the evidence is.
// Only skills that appear in my projects (ServiceOS, Volodina Web Studio, the case studies, this
// portfolio) or in my own workflow are listed. Skills I am still building with AI support carry
// `ai: true`.

export type LabTag = "gsap" | "webgl" | "css" | "react" | "typescript" | "typography" | "cursor" | "scroll" | "physics" | "image" | "micro";
export type PageKey = "notesSeo" | "notesAi" | "notesLh" | "design" | "accessibility" | "decisions" | "teamflow" | "backend" | "responsive";

export type SkillDef = {
  id: string;
  /** proper names are shown as they are; otherwise the label comes from messages (universe.skills.<id>) */
  name?: string;
  ai?: boolean;
  /** keys of src/config/projects.ts */
  projects?: string[];
  /** a private project that cannot be linked */
  privateProject?: "serviceos";
  pages?: PageKey[];
  lab?: LabTag;
};

export type ClusterDef = {
  id: string;
  /** electric colour of the cluster, rgb 0..1 */
  hue: [number, number, number];
  skills: SkillDef[];
};

const CASES = ["beauty", "noform", "pizza"];
const SOS = { privateProject: "serviceos" } as const;

export const clusters: ClusterDef[] = [
  {
    id: "frontend",
    hue: [0.12, 0.42, 1.0], // electric blue
    skills: [
      { id: "react", name: "React", projects: CASES, lab: "react" },
      { id: "nextjs", name: "Next.js", projects: [...CASES, "studio"], pages: ["decisions"] },
      { id: "typescript", name: "TypeScript", projects: ["beauty", "noform"], lab: "typescript" },
      { id: "javascript", name: "JavaScript", projects: CASES },
      { id: "htmlcss", name: "HTML / CSS", projects: CASES, lab: "css" },
      { id: "cssmodules", name: "CSS Modules", projects: ["beauty"], pages: ["design"], lab: "css" },
      { id: "tailwind", name: "Tailwind CSS", projects: ["studio"] },
      { id: "responsive", projects: CASES, pages: ["responsive"] },
      { id: "a11y", pages: ["accessibility"] },
      { id: "i18n", projects: ["beauty", "pizza", "apartament", "studio"] },
      { id: "rtl", projects: ["studio"], pages: ["design"] },
    ],
  },
  {
    id: "backend",
    hue: [0.62, 0.2, 1.0], // electric violet
    skills: [
      { id: "nodejs", name: "Node.js", ...SOS, pages: ["backend"] },
      { id: "rest", name: "REST API", projects: ["studio"], ...SOS },
      { id: "contactapi", projects: ["studio"] },
      { id: "servercomponents", name: "Server Components", projects: ["beauty", "noform"], pages: ["decisions"] },
      { id: "serveractions", name: "Server Actions", ...SOS },
      { id: "postgres", name: "PostgreSQL", ...SOS },
      { id: "supabase", name: "Supabase", ...SOS },
      { id: "rls", ...SOS },
      { id: "repository", ...SOS, pages: ["backend"] },
      { id: "zod", name: "zod", ...SOS, pages: ["backend"] },
      { id: "auth", ...SOS, pages: ["backend"] },
      { id: "audit", ...SOS },
      { id: "securityheaders", ...SOS, pages: ["backend"] },
      { id: "gdprdata", ...SOS },
      { id: "calendarapi", ...SOS },
      { id: "express", name: "Express", ai: true },
    ],
  },
  {
    id: "creative",
    hue: [1.0, 0.1, 0.72], // electric fuchsia
    skills: [
      { id: "gsap", name: "GSAP", projects: CASES, lab: "gsap" },
      { id: "scrolltrigger", name: "ScrollTrigger", projects: ["noform", "pizza"], lab: "scroll" },
      { id: "lenis", name: "Lenis", projects: ["beauty"], lab: "scroll" },
      { id: "threejs", name: "Three.js", projects: ["pizza"], lab: "webgl" },
      { id: "webgl", name: "WebGL", projects: ["beauty", "noform"], lab: "webgl" },
      { id: "glsl", name: "GLSL shaders", projects: ["beauty", "noform"], lab: "webgl" },
      { id: "canvas2d", name: "Canvas 2D", projects: ["noform", "studio"], lab: "physics" },
      { id: "particles", projects: ["studio"], lab: "physics" },
      { id: "css3d", name: "CSS 3D", lab: "css" },
      { id: "scrolldriven", projects: ["noform", "pizza"], lab: "scroll" },
      { id: "interactiveui", projects: CASES, lab: "micro" },
    ],
  },
  {
    id: "seo",
    hue: [0.62, 1.0, 0.1], // electric lime
    skills: [
      { id: "techseo", projects: ["studio", "apartament"], pages: ["notesSeo"] },
      { id: "schema", name: "Schema.org", projects: ["studio"], pages: ["notesSeo"] },
      { id: "cwv", name: "Core Web Vitals", pages: ["notesLh"] },
      { id: "lighthouse", name: "Lighthouse", pages: ["notesLh"] },
      { id: "intlseo", projects: ["beauty", "apartament", "studio"], pages: ["notesSeo"] },
      { id: "hreflang", name: "hreflang", projects: ["studio", "apartament"], pages: ["notesSeo"] },
      { id: "metadata", projects: ["studio", "apartament"], pages: ["notesSeo"] },
      { id: "sitemap", projects: ["studio"], pages: ["notesSeo"] },
      { id: "ogimages", pages: ["notesSeo"] },
      { id: "searchconsole", name: "Search Console", pages: ["notesSeo"] },
      { id: "geo", pages: ["notesAi", "notesSeo"] },
      { id: "perf", pages: ["notesLh"] },
    ],
  },
  {
    id: "workflow",
    hue: [0.0, 0.92, 1.0], // electric cyan
    skills: [
      { id: "git", name: "Git", pages: ["teamflow"] },
      { id: "github", name: "GitHub", pages: ["teamflow"] },
      { id: "pr", pages: ["teamflow"] },
      { id: "review", pages: ["teamflow"] },
      { id: "testing", pages: ["decisions"] },
      { id: "vitest", name: "Vitest", ...SOS },
      { id: "playwright", name: "Playwright", pages: ["decisions"] },
      { id: "eslint", name: "ESLint", projects: ["studio"] },
      { id: "husky", name: "Husky", projects: ["studio"] },
      { id: "githubactions", name: "GitHub Actions", pages: ["decisions"] },
      { id: "vercel", name: "Vercel", projects: [...CASES, "apartament", "studio"] },
    ],
  },
  {
    id: "ai",
    hue: [1.0, 0.45, 0.05], // electric orange
    skills: [
      { id: "claudecode", name: "Claude Code", pages: ["notesAi"] },
      { id: "claude", name: "Claude", pages: ["notesAi"] },
      { id: "gpt", name: "GPT", pages: ["notesAi"] },
      { id: "aicoding", pages: ["notesAi"] },
      { id: "aiworkflow", pages: ["notesAi"] },
      { id: "skills", pages: ["notesAi"] },
      { id: "mcp", name: "MCP", pages: ["notesAi"] },
      { id: "assistant", projects: ["studio"] },
    ],
  },
  {
    id: "uiux",
    hue: [1.0, 0.9, 0.1], // electric yellow
    skills: [
      { id: "figma", name: "Figma", ai: true },
      { id: "designsystems", pages: ["design"] },
      { id: "typography", projects: CASES, pages: ["design"], lab: "typography" },
      { id: "responsivelayouts", projects: CASES, pages: ["responsive"] },
      { id: "microinteractions", projects: CASES, lab: "micro" },
      { id: "darklight", projects: ["detailing"], pages: ["design"] },
      { id: "ia", pages: ["decisions"] },
    ],
  },
];

// Technologies that work together: the pulses run along these lines.
export const links: Array<[string, string]> = [
  ["nextjs", "react"], ["react", "typescript"], ["nextjs", "servercomponents"], ["nextjs", "vercel"],
  ["nextjs", "metadata"], ["metadata", "techseo"], ["techseo", "schema"], ["techseo", "intlseo"],
  ["typescript", "techseo"], ["cwv", "lighthouse"], ["lighthouse", "perf"], ["perf", "nextjs"],
  ["react", "gsap"], ["gsap", "scrolltrigger"], ["gsap", "webgl"], ["webgl", "threejs"],
  ["scrolltrigger", "scrolldriven"], ["gsap", "interactiveui"], ["css3d", "cssmodules"],
  ["htmlcss", "cssmodules"], ["htmlcss", "responsive"], ["responsive", "a11y"], ["htmlcss", "css3d"],
  ["nodejs", "rest"], ["rest", "zod"], ["zod", "auth"], ["nodejs", "typescript"], ["servercomponents", "rest"],
  ["git", "github"], ["github", "pr"], ["pr", "review"], ["github", "githubactions"], ["githubactions", "testing"],
  ["githubactions", "vercel"], ["github", "vercel"], ["testing", "vitest"], ["testing", "playwright"],
  ["claudecode", "aicoding"], ["gpt", "aicoding"], ["aicoding", "aiworkflow"], ["aiworkflow", "skills"],
  ["skills", "mcp"], ["claudecode", "mcp"], ["aicoding", "testing"], ["aiworkflow", "review"], ["claude", "claudecode"],
  ["figma", "designsystems"], ["designsystems", "typography"], ["designsystems", "cssmodules"],
  ["typography", "responsivelayouts"], ["microinteractions", "interactiveui"], ["ia", "designsystems"],
  ["responsivelayouts", "responsive"], ["a11y", "ia"],
  ["tailwind", "htmlcss"], ["tailwind", "designsystems"], ["i18n", "nextjs"], ["i18n", "rtl"], ["i18n", "intlseo"],
  ["hreflang", "intlseo"], ["hreflang", "sitemap"], ["sitemap", "searchconsole"], ["ogimages", "metadata"], ["geo", "schema"],
  ["postgres", "supabase"], ["supabase", "rls"], ["rls", "auth"], ["repository", "supabase"], ["repository", "serveractions"],
  ["serveractions", "zod"], ["audit", "postgres"], ["securityheaders", "nextjs"], ["gdprdata", "audit"], ["calendarapi", "rest"],
  ["contactapi", "zod"], ["express", "rest"], ["vitest", "repository"], ["eslint", "husky"], ["husky", "git"], ["eslint", "typescript"],
  ["canvas2d", "particles"], ["canvas2d", "webgl"], ["glsl", "webgl"], ["lenis", "scrolltrigger"], ["particles", "interactiveui"],
  ["assistant", "aicoding"], ["assistant", "rest"], ["darklight", "cssmodules"], ["darklight", "a11y"], ["rtl", "cssmodules"],
  ["playwright", "a11y"], ["vitest", "typescript"],
];

/** Named connections shown on the map: the idea that links two skills. Key is the message id. */
export const bridges: Array<{ a: string; b: string; key: string }> = [
  { a: "nextjs", b: "vercel", key: "deploy" },
  { a: "nextjs", b: "metadata", key: "metadata" },
  { a: "perf", b: "nextjs", key: "vitals" },
  { a: "react", b: "gsap", key: "motion" },
  { a: "typescript", b: "techseo", key: "typedData" },
  { a: "webgl", b: "threejs", key: "shaders" },
  { a: "servercomponents", b: "rest", key: "dataFlow" },
  { a: "githubactions", b: "vercel", key: "release" },
  { a: "aicoding", b: "testing", key: "verify" },
  { a: "aiworkflow", b: "review", key: "loop" },
  { a: "figma", b: "designsystems", key: "tokens" },
  { a: "designsystems", b: "cssmodules", key: "styles" },
  { a: "a11y", b: "ia", key: "structure" },
  { a: "claudecode", b: "mcp", key: "tools" },
  { a: "i18n", b: "intlseo", key: "reach" },
  { a: "repository", b: "supabase", key: "adapter" },
  { a: "rls", b: "auth", key: "access" },
  { a: "playwright", b: "a11y", key: "realBrowser" },
  { a: "canvas2d", b: "particles", key: "alive" },
  { a: "zod", b: "serveractions", key: "trust" },
];

export const skillById = new Map(clusters.flatMap((c) => c.skills.map((s) => [s.id, { skill: s, cluster: c.id }] as const)));
