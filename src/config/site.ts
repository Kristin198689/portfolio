export const siteConfig = {
  // Set NEXT_PUBLIC_SITE_URL in the hosting environment. The localhost fallback keeps canonical
  // URLs honest while the real domain is unknown.
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
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
