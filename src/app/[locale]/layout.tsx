import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { fontAccent, fontArabic, fontMain } from "@/config/fonts";
import { routing } from "@/i18n/routing";
import Script from "next/script";
import { Footer } from "@/components/Footer";
import { Konami } from "@/components/Konami";
import { DevView } from "@/components/DevView";
import { CommandPalette } from "@/components/CommandPalette";
import { Header } from "@/components/Header";
import { Companion } from "@/components/motion/Companion";
import { Motion } from "@/components/Motion";
import { ScrollProgress } from "@/components/ScrollProgress";
import { SideNav } from "@/components/SideNav";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#f4f4f0" },
  ],
  colorScheme: "light dark",
};

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(siteConfig.url),
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "48x48" },
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
      other: [{ rel: "mask-icon", url: "/icons/mask-icon.svg", color: "#bdb8fc" }],
    },
    appleWebApp: { title: "C. Volodina", capable: true },
    ...buildMetadata({ locale, title: t("title"), description: t("description") }),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const meta = await getTranslations({ locale, namespace: "meta" });

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${fontMain.variable} ${fontAccent.variable} ${fontArabic.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {"try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.dataset.theme='dark'}catch(e){}"}
        </Script>
        <Script id="js-flag" strategy="beforeInteractive">
          {"document.documentElement.classList.add('js');try{if(sessionStorage.getItem('preloaded')==='1'||!/^\/[a-z]{2}\/?$/.test(location.pathname))document.documentElement.classList.add('pre-seen')}catch(e){}setTimeout(function(){if(!window.__motionReady)document.documentElement.classList.add('motion-failsafe')},4000)"}
        </Script>
        <JsonLd locale={locale} description={meta("description")} jobTitle={meta("jobTitle")} />
        <NextIntlClientProvider>
          <Motion name={siteConfig.shortName} />
          <Companion />
          <Header />
          <CommandPalette />
          <DevView />
          <Konami />
          <ScrollProgress />
          <SideNav />
          {children}
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
