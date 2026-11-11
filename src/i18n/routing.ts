import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["de", "en", "uk"],
  defaultLocale: "de",
});

export type Locale = (typeof routing.locales)[number];
