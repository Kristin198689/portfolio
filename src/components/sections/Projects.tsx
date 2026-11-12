"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "@/i18n/navigation";
import { projects } from "@/config/projects";
import { WaterTitle } from "../motion/WaterTitle";
import styles from "./Projects.module.css";

gsap.registerPlugin(ScrollTrigger);

const N = projects.length;

// Desktop: a pinned stage. First the water title and intro stay put, long enough to read. Then the
// title shrinks away while a 3D carousel flies in from deep in the screen, and scrolling turns it
// card by card. Phones get a plain swipe row with the same cards.
export function Projects() {
  const t = useTranslations("projects");
  const stage = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  useLayoutEffect(() => {
    const st = stage.current;
    const rg = ring.current;
    if (!st || !rg) return;
    const mm = gsap.matchMedia();

    mm.add("(min-width: 56rem) and (prefers-reduced-motion: no-preference)", () => {
      const title = st.querySelector<HTMLElement>("[data-ptitle]");
      const intro = st.querySelectorAll<HTMLElement>("[data-pintro]");
      const scene = st.querySelector<HTMLElement>("[data-pscene]");
      const panel = st.querySelector<HTMLElement>("[data-ppanel]");
      const cards = gsap.utils.toArray<HTMLElement>("[data-pcard]", rg);
      if (!title || !intro.length || !scene || !panel) return;

      const step = 360 / N;
      gsap.set(scene, { autoAlpha: 0, z: -1600, rotationX: -25, transformPerspective: 1800 });
      gsap.set(panel, { autoAlpha: 0, y: 40 });

      const update = () => {
        const rot = Number(gsap.getProperty(rg, "rotationY"));
        const idx = ((Math.round(-rot / step) % N) + N) % N;
        setActive((a) => (a === idx ? a : idx));
        // cards far from the front fade into the dark
        cards.forEach((c, i) => {
          const d = Math.abs((((i * step + rot) % 360) + 540) % 360 - 180);
          gsap.set(c, { opacity: gsap.utils.clamp(0.12, 1, 1 - d / 120) });
        });
      };

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: st,
          start: "top top",
          end: () => `+=${window.innerHeight * (3.2 + N * 0.85)}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
        onUpdate: update,
      });
      // 1. time to read the title and the intro
      tl.to({}, { duration: 1.4 });
      // 2. title steps back, the carousel flies in
      tl.to(title, { scale: 0.26, transformOrigin: "left top", duration: 1.2 }, ">");
      tl.to(intro, { autoAlpha: 0, y: -30, duration: 0.6 }, "<");
      tl.to(scene, { autoAlpha: 1, z: 0, rotationX: 0, duration: 1.2, ease: "power2.out" }, "<0.1");
      tl.to(panel, { autoAlpha: 1, y: 0, duration: 0.6 }, "<0.6");
      // 3. the ring turns, one card per step
      tl.to(rg, { rotationY: -step * (N - 1), duration: N - 1, ease: "none" }, ">");
      tl.to({}, { duration: 0.6 });

      // pointer leans the whole ring a little
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        const rx = gsap.quickTo(scene, "rotationX", { duration: 0.8, ease: "power3" });
        const move = (e: PointerEvent) => rx(((e.clientY / window.innerHeight) - 0.5) * -8);
        window.addEventListener("pointermove", move, { passive: true });
        return () => window.removeEventListener("pointermove", move);
      }
    });

    return () => mm.revert();
  }, []);

  const current = projects[active];
  const link = (p: (typeof projects)[number]) =>
    p.case ? { type: "case" as const, href: `/projects/${p.key}` } : p.href ? { type: "ext" as const, href: p.href } : null;

  return (
    <section id="projects" className={styles.section} data-chapter="field">
      <div ref={stage} className={styles.stage} style={{ "--n": N } as React.CSSProperties}>
        <header className={styles.head}>
          <p className={styles.kicker}>
            {t("kicker")} · {N} {t("count")}
          </p>
          <div data-ptitle className={styles.title}>
            <WaterTitle text={t("title")} />
          </div>
          <p data-pintro className={styles.intro}>
            {t("intro")}
          </p>
          <p data-pintro className={styles.hint}>
            {t("scrollHint")} ↓
          </p>
          <Link href="/work" className={styles.all} data-pintro data-scramble>
            {t("allLink")} →
          </Link>
        </header>

        <div data-pscene className={styles.scene}>
          <ul ref={ring} className={styles.ring}>
            {projects.map((p, i) => {
              const l = link(p);
              const body = (
                <>
                  <span className={styles.frame}>
                    <Image
                      src={p.image}
                      alt={t(`items.${p.key}.title`)}
                      fill
                      sizes="(min-width: 56rem) 46vw, 85vw"
                      className={styles.img}
                    />
                  </span>
                  <span className={styles.info}>
                    <span className={styles.meta}>
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      <span>{t(`items.${p.key}.category`)}</span>
                    </span>
                    <span className={styles.name}>{t(`items.${p.key}.title`)}</span>
                    <span className={styles.desc}>{t(`items.${p.key}.description`)}</span>
                    <span className={styles.tags}>
                      {(t.raw(`items.${p.key}.tags`) as string[]).map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </span>
                  </span>
                </>
              );
              return (
                <li
                  key={p.key}
                  data-pcard
                  className={styles.card}
                  style={{ "--i": i } as React.CSSProperties}
                >
                  {l?.type === "case" ? (
                    <Link href={l.href} className={styles.link} data-cursor={t("case")}>
                      {body}
                    </Link>
                  ) : l?.type === "ext" ? (
                    <a href={l.href} target="_blank" rel="noopener noreferrer" className={styles.link} data-cursor={t("visit")}>
                      {body}
                    </a>
                  ) : (
                    <div className={styles.link}>{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Desktop detail panel for the card in front */}
        <div data-ppanel className={styles.panel} aria-live="polite">
          <div key={current.key} className={styles.panelIn}>
            <p className={styles.pmeta}>
              {String(active + 1).padStart(2, "0")} / {String(N).padStart(2, "0")} ·{" "}
              {t(`items.${current.key}.category`)}
            </p>
            <h3 className={styles.pname}>{t(`items.${current.key}.title`)}</h3>
            <p className={styles.pdesc}>{t(`items.${current.key}.description`)}</p>
            <p className={styles.tags}>
              {(t.raw(`items.${current.key}.tags`) as string[]).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </p>
            {(() => {
              const l = link(current);
              if (!l) return null;
              return l.type === "case" ? (
                <Link href={l.href} className={styles.cta} data-scramble>
                  {t("case")} →
                </Link>
              ) : (
                <a href={l.href} target="_blank" rel="noopener noreferrer" className={styles.cta} data-scramble>
                  {t("visit")} ↗
                </a>
              );
            })()}
          </div>
        </div>
      </div>
    </section>
  );
}
