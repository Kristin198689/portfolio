import { siteConfig } from "@/config/site";

// Schema.org graph: WebSite, Person and ProfilePage, linked by @id.
export function JsonLd({
  locale,
  description,
  jobTitle,
}: {
  locale: string;
  description: string;
  jobTitle: string;
}) {
  const base = siteConfig.url;
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: `${base}/${locale}`,
        name: siteConfig.name,
        inLanguage: locale,
        publisher: { "@id": `${base}/#person` },
      },
      {
        "@type": "Person",
        "@id": `${base}/#person`,
        name: siteConfig.name,
        jobTitle,
        description,
        url: `${base}/${locale}`,
        sameAs: [siteConfig.github, "https://volodina-webstudio.de"],
        address: { "@type": "PostalAddress", addressLocality: "Pforzheim", addressCountry: "DE" },
        knowsLanguage: ["de", "uk", "ru"],
        knowsAbout: [
          "Next.js",
          "React",
          "TypeScript",
          "Responsive web design",
          "Search engine optimization",
          "Web accessibility",
          "Multilingual websites",
          "GSAP animation",
        ],
      },
      {
        "@type": "ProfessionalService",
        "@id": `${base}/#service`,
        name: `${siteConfig.name}, web development`,
        url: `${base}/${locale}`,
        provider: { "@id": `${base}/#person` },
        areaServed: ["DE", "EU", "Worldwide"],
        availableLanguage: ["de", "en", "uk", "ru"],
        serviceType: [
          "Website development",
          "Web application development",
          "Next.js and React development",
          "Multilingual websites",
          "Technical SEO",
          "Web animation and WebGL",
        ],
        address: { "@type": "PostalAddress", addressLocality: "Pforzheim", addressCountry: "DE" },
      },
      {
        "@type": "ProfilePage",
        "@id": `${base}/${locale}#profile`,
        url: `${base}/${locale}`,
        description,
        mainEntity: { "@id": `${base}/#person` },
        inLanguage: locale,
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      // "<" is escaped so the JSON can never close the script tag
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }}
    />
  );
}
