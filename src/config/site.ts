export const siteConfig = {
  // Set NEXT_PUBLIC_SITE_URL in the hosting environment. The localhost fallback keeps canonical
  // URLs honest while the real domain is unknown.
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  name: "Christina Volodina",
  shortName: "C. Volodina",
  github: "https://github.com/Kristin198689",
  // Same public contact data as on Volodina Web Studio
  email: "kristin198689@gmail.com",
  location: "Pforzheim · Germany",
  // WhatsApp number in international format, digits only (e.g. 49151...). Set NEXT_PUBLIC_WHATSAPP
  // in .env.local. The number on the studio site is still a placeholder, so it is not guessed here.
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP ?? "").replace(/\D/g, ""),
};
