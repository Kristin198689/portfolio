export const siteConfig = {
  // The one public address of the site. Canonical URLs, hreflang, sitemap, robots, Open Graph and JSON-LD
  // all read it. A production build uses the real domain; the dev server uses localhost. Set
  // NEXT_PUBLIC_SITE_URL to override both (for example for a staging copy).
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.NODE_ENV === "production" ? "https://volodina.de" : "http://localhost:3000")).replace(/\/$/, ""),
  name: "Christina Volodina",
  shortName: "C. Volodina",
  github: "https://github.com/Kristin198689",
  // Same contact data as on Volodina Web Studio (public Impressum and contact page)
  email: "volodina.webstudio@gmail.com",
  phone: "+49 152 36385095",
  location: "Pforzheim · Germany",
  // WhatsApp number in international format, digits only. NEXT_PUBLIC_WHATSAPP overrides the default.
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP ?? "4915236385095").replace(/\D/g, ""),
};
