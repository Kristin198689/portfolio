// My own projects, in display order (my own studio last). Texts live in messages
// (projects.items.<key>). `case` marks projects that have a case study page; `href` is added once
// a project has a public URL.
export const projects: ReadonlyArray<{ key: string; image: string; href?: string; repo?: string; case?: boolean }> = [
  { key: "beauty", image: "/images/projects/beauty.jpg", href: "https://beauty-studio-demo-nine.vercel.app", repo: "https://github.com/Kristin198689/beauty-studio-demo", case: true },
  { key: "noform", image: "/images/projects/noform.jpg", href: "https://noform-drab.vercel.app", repo: "https://github.com/Kristin198689/noform", case: true },
  { key: "pizza", image: "/images/projects/pizza.jpg", href: "https://pizza-doner-lieferservice.vercel.app", repo: "https://github.com/Kristin198689/pizza-doner-lieferservice", case: true },
  { key: "apartament", image: "/images/projects/apartament.jpg", href: "https://apartament-demo.vercel.app", repo: "https://github.com/Kristin198689/apartament-demo" },
  { key: "billiard", image: "/images/projects/billiard.jpg", href: "https://billyard-nu.vercel.app" },
  { key: "detailing", image: "/images/projects/detailing.jpg", href: "https://auto-detailing-website-tau.vercel.app" },
  { key: "consulting", image: "/images/projects/consulting.jpg", href: "https://premium-consulting-template.vercel.app" },
  { key: "studio", image: "/images/projects/studio.jpg", href: "https://volodina-web-studio-amber.vercel.app" },
];
