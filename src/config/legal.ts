// Data for Impressum and Datenschutz. Fields that are still unknown stay null: the pages then show a
// visible notice instead of an invented value. Fill them in before the site goes public.
export const legal = {
  name: "Christina Volodina",
  email: "kristin198689@gmail.com",
  city: "Pforzheim",
  country: { de: "Deutschland", en: "Germany", uk: "Німеччина" },
  /** Street and house number, e.g. "Musterstraße 1". Required for a valid Impressum. */
  street: null as string | null,
  /** Postal code */
  zip: null as string | null,
  /** Optional phone number */
  phone: null as string | null,
  /** VAT ID (§ 27a UStG), only if you have one */
  vatId: null as string | null,
  /** Hosting provider of the live site, e.g. "Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA" */
  hosting: null as string | null,
  updated: { de: "November 2026", en: "November 2026", uk: "листопад 2026" },
} as const;
