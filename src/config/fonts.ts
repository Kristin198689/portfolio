import { Cormorant_Garamond, Inter_Tight } from "next/font/google";

// Same pair as Beauty Studio: strict grotesque + luxury italic accent.
// Both support Cyrillic (uk).
export const fontMain = Inter_Tight({
  weight: ["400", "500", "800"],
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-main-family",
  display: "swap",
});

export const fontAccent = Cormorant_Garamond({
  weight: ["300", "400"],
  style: ["italic"],
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-accent-family",
  display: "swap",
});
