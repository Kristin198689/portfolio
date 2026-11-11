import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Skeleton } from "@/components/sections/Skeleton";

export default function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  return (
    <main>
      <Skeleton />
    </main>
  );
}
