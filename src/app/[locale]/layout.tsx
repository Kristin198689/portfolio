import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { fontAccent, fontArabic, fontMain } from "@/config/fonts";
import { routing } from "@/i18n/routing";
import Script from "next/script";
import { Footer } from "@/components/Footer";
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
  themeColor: "#0a0a0a",
  colorScheme: "light dark",
};

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(siteConfig.url),
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
          {"document.documentElement.classList.add('js');setTimeout(function(){if(!window.__motionReady)document.documentElement.classList.add('motion-failsafe')},4000)"}
        </Script>
        <JsonLd locale={locale} description={meta("description")} jobTitle={meta("jobTitle")} />
        <NextIntlClientProvider>
          <Motion name={siteConfig.shortName} />
          <Companion />
          <Header />
          <CommandPalette />
          <DevView />
          <ScrollProgress />
          <SideNav />
          {children}
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
