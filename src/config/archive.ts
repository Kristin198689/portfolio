// Every project I can show, for the "All projects" page. Texts live in messages (work.items.<key>).
// Live links come from the public Vercel deployments of my GitHub repositories. Most repositories are
// private, so `repo` is only set for public ones. `hidden: true` keeps an entry out of the list.
export type Kind = "client" | "concept" | "template" | "app" | "studio" | "game";
export type Status = "live" | "building" | "private";

export type Entry = {
  key: string;
  name: string;
  kind: Kind;
  status: Status;
  live?: string;
  repo?: string;
  stack: string[];
  hidden?: boolean;
};

const GH = "https://github.com/Kristin198689";

export const archive: Entry[] = [
  { key: "beauty", name: "Beauty Studio", kind: "template", status: "private", stack: ["Next.js 16", "GSAP", "next-intl", "WebGL"] },
  { key: "noform", name: "NØFORM", kind: "concept", status: "live", live: "https://noform-drab.vercel.app", stack: ["Next.js", "GSAP", "ScrollTrigger", "Canvas"] },
  { key: "pizza", name: "Pizza & Döner", kind: "template", status: "live", live: "https://pizza-doner-lieferservice.vercel.app", stack: ["Next.js", "GSAP", "Three.js"] },
  { key: "apartament", name: "Apartament Demo", kind: "concept", status: "live", live: "https://apartament-demo.vercel.app", stack: ["Next.js 16", "next-intl"] },
  { key: "billiard", name: "Billyard", kind: "concept", status: "live", live: "https://billyard-nu.vercel.app", stack: ["Next.js", "GSAP", "Three.js", "Matter.js"] },
  { key: "detailing", name: "Detailing", kind: "concept", status: "live", live: "https://auto-detailing-website-tau.vercel.app", stack: ["Next.js 16", "GSAP", "Lenis"] },
  { key: "consulting", name: "Premium Consulting", kind: "template", status: "live", live: "https://premium-consulting-template.vercel.app", stack: ["Next.js", "next-intl"] },
  { key: "studio", name: "Volodina Web Studio", kind: "studio", status: "live", live: "https://volodina-web-studio-amber.vercel.app", stack: ["Next.js", "i18n", "SEO"] },
  { key: "hausarzt", name: "Hausarzt Concept", kind: "concept", status: "live", live: "https://hausarzt-concept.vercel.app", stack: ["Next.js"] },
  { key: "serviceos", name: "ServiceOS", kind: "app", status: "building", stack: ["Next.js", "TypeScript"] },
  { key: "splitcent", name: "SplitCent", kind: "app", status: "private", stack: ["Expo", "React Native", "TypeScript"] },
  { key: "casino", name: "Ibrahim Casino", kind: "game", status: "live", live: "https://ibrahim-casino.vercel.app", stack: ["Next.js", "de / ar"] },
  { key: "massage", name: "Massage Studio", kind: "template", status: "live", live: "https://massage-landing-six.vercel.app", stack: ["Next.js"] },
  { key: "salon", name: "Beauty Salon Landing", kind: "template", status: "live", live: "https://beauty-salon-landing-gray.vercel.app", stack: ["Next.js", "GSAP"] },
  { key: "abbruch", name: "Wanddurchbruch Landing", kind: "client", status: "live", live: "https://as-abbruch-bw.vercel.app", stack: ["Next.js"] },
  { key: "immotonn", name: "Immo Tonn", kind: "client", status: "live", live: "https://immo-tonn.de", stack: ["Multi-page", "SEO"] },
  { key: "labrity", name: "Labrity", kind: "client", status: "live", live: "https://labrity.com", stack: ["Next.js", "Multilingual"] },
  { key: "tlsg", name: "TLSG Studio", kind: "client", status: "live", live: "https://tlsglabel.com", stack: ["React", "Multi-page"] },
  { key: "portfolio", name: "This portfolio", kind: "studio", status: "live", repo: `${GH}/portfolio`, stack: ["Next.js 16", "GSAP", "WebGL", "next-intl"] },
];

// Smaller or older repositories, listed by name only (no description to show).
export const earlier: Array<{ name: string; lang: string; repo?: string }> = [
  { name: "landing", lang: "TypeScript", repo: `${GH}/landing` },
  { name: "studio-demo", lang: "TypeScript", repo: `${GH}/studio-demo` },
  { name: "labrity-website", lang: "JavaScript", repo: `${GH}/labrity-website` },
  { name: "immo", lang: "CSS", repo: `${GH}/immo` },
  { name: "ichG", lang: "TypeScript", repo: `${GH}/ichG` },
  { name: "pet", lang: "JavaScript" },
];
