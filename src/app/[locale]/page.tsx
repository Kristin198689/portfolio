import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Hero } from "@/components/sections/Hero";
import { Skeleton } from "@/components/sections/Skeleton";

export default function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  return (
    <main>
      <Hero />
      <Skeleton />
    </main>
  );
}
