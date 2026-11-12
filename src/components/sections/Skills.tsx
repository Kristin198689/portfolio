"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { siteConfig } from "@/config/site";
import type { IconKey } from "@/config/icons";
import { BrandIcon } from "../ui/BrandIcon";
import { SkillDemo } from "./SkillDemo";
import { ResponsiveLab } from "./ResponsiveLab";
import { TeamFlow } from "./TeamFlow";
import { BackendLayers } from "./BackendLayers";
import styles from "./Skills.module.css";

const TILES = ["responsive", "frontend", "motion", "seo", "i18n", "a11y", "security", "ai"] as const;

const TOOLS: Array<{ name: string; icon?: IconKey; href?: string }> = [
  { name: "GitHub", icon: "github", href: siteConfig.github },
  { name: "Vercel", icon: "vercel", href: "https://vercel.com" },
  { name: "Next.js", icon: "nextdotjs" },
  { name: "React", icon: "react" },
  { name: "TypeScript", icon: "typescript" },
  { name: "HTML5", icon: "html5" },
  { name: "CSS", icon: "css" },
  { name: "GSAP", icon: "greensock" },
  { name: "Three.js", icon: "threedotjs" },
  { name: "Node.js", icon: "nodedotjs" },
  { name: "Git", icon: "git" },
  { name: "ESLint", icon: "eslint" },
  { name: "Search Console", icon: "googlesearchconsole" },
  { name: "Lighthouse", icon: "lighthouse" },
  { name: "Claude Code", icon: "claudecode" },
  { name: "Claude", icon: "claude" },
  { name: "ChatGPT" },
  { name: "Lenis" },
  { name: "next-intl" },
];

// Eight tiles. The tile leans toward the pointer (magnet); on hover a dark layer with a live mini
// demo opens from the exact point where the pointer entered. On touch, tap toggles it.
export function Skills() {
  const t = useTranslations("skills");
  const grid = useRef<HTMLDivElement>(null);

  const setPoint = (el: HTMLElement, e: React.PointerEvent) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - r.left}px`);
    el.style.setProperty("--y", `${e.clientY - r.top}px`);
  };

  const onEnter = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch") return;
    setPoint(e.currentTarget, e);
    e.currentTarget.dataset.open = "true";
  };
  const onLeave = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch") return;
    setPoint(e.currentTarget, e);
    e.currentTarget.dataset.open = "false";
    gsap.to(e.currentTarget, { x: 0, y: 0, rotationX: 0, rotationY: 0, duration: 0.7, ease: "power3.out" });
  };
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch") return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - (r.left + r.width / 2)) / r.width;
    const ny = (e.clientY - (r.top + r.height / 2)) / r.height;
    gsap.to(el, {
      x: nx * 14,
      y: ny * 14,
      rotationY: nx * 12,
      rotationX: -ny * 12,
      transformPerspective: 900,
      duration: 0.5,
      ease: "power3.out",
      overwrite: "auto",
    });
  };
  const onTap = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    if (window.matchMedia("(hover: hover)").matches) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - r.left}px`);
    el.style.setProperty("--y", `${e.clientY - r.top}px`);
    el.dataset.open = el.dataset.open === "true" ? "false" : "true";
  };

  return (
    <section id="skills" className={styles.section} data-chapter="paper">
      <header className={styles.head}>
        <p className={styles.kicker}>{t("kicker")}</p>
        <h2 className={styles.title} data-split>
          {t("title")}
        </h2>
        <p className={styles.intro}>
          {t("intro")} <span className={styles.touch}>{t("tapHint")}.</span>
        </p>
      </header>

      <div ref={grid} className={styles.grid}>
        {TILES.map((k, i) => (
          <article
            key={k}
            className={styles.tile}
            data-open="false"
            onPointerEnter={onEnter}
            onPointerLeave={onLeave}
            onPointerMove={onMove}
            onClick={onTap}
          >
            <div className={styles.face}>
              <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
              <h3 className={styles.tileTitle}>{t(`tiles.${k}.t`)}</h3>
              <p className={styles.desc}>{t(`tiles.${k}.d`)}</p>
            </div>
            <div className={styles.demo} aria-hidden="true">
              <SkillDemo kind={k} />
            </div>
          </article>
        ))}
      </div>

      <ResponsiveLab />

      <TeamFlow />

      <BackendLayers />

      <div className={styles.tools}>
        <h3 className={styles.toolsTitle}>{t("toolsTitle")}</h3>
        <ul className={styles.pills}>
          {TOOLS.map((tool) => {
            const inner = (
              <>
                {tool.icon ? <BrandIcon name={tool.icon} /> : null}
                {tool.name}
              </>
            );
            return (
              <li key={tool.name}>
                {tool.href ? (
                  <a
                    href={tool.href}
                    className={styles.pill}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-scramble
                  >
                    {inner}
                  </a>
                ) : (
                  <span className={styles.pill}>{inner}</span>
                )}
              </li>
            );
          })}
        </ul>
        <p className={styles.note}>{t("logoNote")}</p>
      </div>
    </section>
  );
}
