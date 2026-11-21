import { Cormorant_Garamond, Inter_Tight, Noto_Sans_Arabic } from "next/font/google";

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
  preload: false, // only the accent words use it, so it is fetched when they appear, not on every first load
});

// Arabic needs its own face: Inter Tight has no Arabic glyphs.
export const fontArabic = Noto_Sans_Arabic({
  weight: ["400", "500", "800"],
  subsets: ["arabic"],
  variable: "--font-arabic-family",
  display: "swap",
  preload: false, // only the Arabic version needs it (and then only when Arabic text is on screen)
});
