import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Contact } from "@/components/sections/Contact";
import { Ai } from "@/components/sections/Ai";
import { Depth } from "@/components/sections/Depth";
import { Hero } from "@/components/sections/Hero";
import { Process } from "@/components/sections/Process";
import { Projects } from "@/components/sections/Projects";
import { ScrollMarquee } from "@/components/sections/ScrollMarquee";
import { Seo } from "@/components/sections/Seo";
import { Skills } from "@/components/sections/Skills";
import { Statement } from "@/components/sections/Statement";
import { WaterShowcase } from "@/components/sections/WaterShowcase";

export default function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  return (
    <main>
      <Hero />
      <Depth />
      <Skills />
      <ScrollMarquee />
      <Projects />
      <Seo />
      <Ai />
      <Statement />
      <WaterShowcase />
      <Process />
      <Contact />
    </main>
  );
}
