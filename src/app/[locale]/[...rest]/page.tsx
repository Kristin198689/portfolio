import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

// Any unknown URL under a language lands here and renders the custom 404 inside the normal layout.
export default async function CatchAll({ params }: PageProps<"/[locale]/[...rest]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  notFound();
}
