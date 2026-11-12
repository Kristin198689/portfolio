"use client";

import { useLayoutEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { splitChars } from "@/lib/split";
import { ContactLink } from "../ui/ContactLink";
import { Link } from "@/i18n/navigation";
import { PersonalNote } from "../PersonalNote";
import styles from "./Hero.module.css";

gsap.registerPlugin(ScrollTrigger);

// Three scenes on a horizontal track. On desktop the section pins and the scroll drives the track
// sideways. Scene titles rise out of their masks as each scene arrives (containerAnimation).
// On phones and with reduced motion the scenes simply stack.
// Sizes a big scene title so its longest line always fits inside the scene, in every language.
const fit = (lines: string[]) =>
  `${Math.min(17, 80 / (Math.max(...lines.map((l) => Array.from(l).length)) * 0.64)).toFixed(2)}vw`;

export function Hero() {
  const t = useTranslations("hero");
  const n = useTranslations("nav");
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const count = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = root.current;
    const tr = track.current;
    if (!el || !tr) return;
    const mm = gsap.matchMedia();

    mm.add("(min-width: 56rem) and (prefers-reduced-motion: no-preference)", () => {
      const scenes = gsap.utils.toArray<HTMLElement>("[data-scene]", tr);
      const last = scenes.length - 1;
      const drift = tr.querySelector<HTMLElement>("[data-drift]");
      const setDrift = drift ? gsap.quickSetter(drift, "x", "px") : null;

      // the name leans toward the pointer in 3D, the second line floats in front of the first
      let tiltCleanup: (() => void) | undefined;
      if (drift && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        gsap.set(drift, { transformPerspective: 1400, transformStyle: "preserve-3d" });
        const lines = drift.querySelectorAll<HTMLElement>("[class*='line']");
        gsap.set(lines[1] ?? [], { z: 36 });
        const ry = gsap.quickTo(drift, "rotationY", { duration: 0.9, ease: "power3" });
        const rx = gsap.quickTo(drift, "rotationX", { duration: 0.9, ease: "power3" });
        const onMove = (e: PointerEvent) => {
          ry((e.clientX / window.innerWidth - 0.5) * 10);
          rx(-(e.clientY / window.innerHeight - 0.5) * 8);
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        tiltCleanup = () => window.removeEventListener("pointermove", onMove);
      }

      // One paused timeline per later scene: characters rise, the rest fades up.
      // The pinned scrub below plays or reverses it when that scene is about to arrive.
      const reveals = scenes.slice(1).map((scene) => {
        const tl = gsap.timeline({ paused: true });
        scene.querySelectorAll<HTMLElement>("[data-hsplit]").forEach((line, li) => {
          const chars = splitChars(line);
          gsap.set(chars, { yPercent: 118 });
          tl.to(chars, { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.03 }, li * 0.12);
        });
        const fades = scene.querySelectorAll("[data-hfade]");
        gsap.set(fades, { y: 30, opacity: 0 });
        tl.to(fades, { y: 0, opacity: 1, duration: 0.9, ease: "expo.out", stagger: 0.1 }, 0.25);
        return { tl, on: false };
      });

      gsap.to(tr, {
        x: () => -(tr.scrollWidth - window.innerWidth),
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: () => `+=${tr.scrollWidth - window.innerWidth}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            if (bar.current) bar.current.style.transform = `scaleX(${p})`;
            if (count.current) count.current.textContent = `0${Math.round(p * last) + 1}`;
            setDrift?.(-80 * Math.min(1, p * last));
            reveals.forEach((r, i) => {
              const should = p * last >= i + 1 - 0.45; // scene i+1 is 45% of a screen away
              if (should !== r.on) {
                r.on = should;
                if (should) r.tl.play();
                else r.tl.reverse();
              }
            });
          },
        },
      });
      return () => tiltCleanup?.();
    });

    // Stacked layout: plain reveals for scene 2 and 3
    mm.add("(max-width: 55.99rem), (prefers-reduced-motion: reduce)", () => {
      gsap.utils.toArray<HTMLElement>("[data-hsplit]", tr).forEach((line) => {
        const chars = splitChars(line);
        gsap.set(chars, { yPercent: 118 });
        gsap.to(chars, {
          yPercent: 0,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.03,
          scrollTrigger: { trigger: line, start: "top 88%", once: true },
        });
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section id="top" ref={root} className={styles.hero} data-chapter="field">
      <div ref={track} className={styles.track}>
        {/* Scene 1: name */}
        <div className={styles.scene} data-scene>
          <p className={styles.vertical} aria-hidden="true">
            {t("a")} · {t("b")} · {t("c")}
          </p>
          <h1 className={styles.title} data-split data-delay="0.1" data-drift>
            <span className={styles.line}>{t("line1")}</span>
            <span className={styles.line}>{t("line2")}</span>
          </h1>
          <div className={styles.foot}>
            <div className={styles.leadWrap}>
              <PersonalNote />
              <p className={styles.status}>
                <span className={styles.pulse} aria-hidden="true" /> {t("status")}
              </p>
              <p className={styles.lead}>{t("lead")}</p>
            </div>
            <div className={styles.ctas}>
              <ContactLink label={n("contactLabel")}>{n("contact")}</ContactLink>
              <Link href="/hire" className={styles.recruit} data-scramble>
                {t("recruiters")}
              </Link>
            </div>
          </div>
        </div>

        {/* Scene 2: role */}
        <div className={`${styles.scene} ${styles.sceneB}`} data-scene>
          <p className={styles.kicker} data-hfade>
            02 — {t("s2.kicker")}
          </p>
          <h2 className={`${styles.big} ${styles.outline}`} style={{ fontSize: fit([t("s2.line1"), t("s2.line2")]) }}>
            <span className={styles.line} data-hsplit>{t("s2.line1")}</span>
            <span className={styles.line} data-hsplit>{t("s2.line2")}</span>
          </h2>
          <p className={styles.lead} data-hfade>{t("s2.lead")}</p>
        </div>

        {/* Scene 3: languages */}
        <div className={styles.scene} data-scene>
          <p className={styles.kicker} data-hfade>
            03 — {t("s3.kicker")}
          </p>
          <h2 className={styles.big} style={{ fontSize: fit([t("s3.line1"), t("s3.line2")]) }}>
            <span className={styles.line} dir="ltr" data-hsplit>{t("s3.line1")}</span>
            <span className={styles.line} dir="ltr" data-hsplit>{t("s3.line2")}</span>
          </h2>
          <p className={styles.lead} data-hfade>{t("s3.lead")}</p>
        </div>
      </div>

      <div className={styles.progress} aria-hidden="true">
        <span ref={count}>01</span>
        <span className={styles.track2}>
          <span ref={bar} className={styles.fill} />
        </span>
        <span>03</span>
      </div>
    </section>
  );
}
