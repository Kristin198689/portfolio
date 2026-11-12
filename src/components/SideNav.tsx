"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { sections } from "@/config/sections";
import styles from "./SideNav.module.css";

// Desktop section index: one tick per section on the left edge. The current one is long and named,
// hovering the rail names them all. Clicking scrolls there smoothly.
export function SideNav() {
  const t = useTranslations("nav.sections");
  const pathname = usePathname();
  const [active, setActive] = useState("top");
  const [show, setShow] = useState(false);
  const [ink, setInk] = useState<"paper" | "field">("field");
  const railRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (pathname !== "/") return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      let current: string = sections[0].id;
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= vh * 0.45) current = s.id;
      }
      setActive(current);
      setShow(window.scrollY > vh * 0.6);
      // ink follows the chapter under the middle of the screen
      let chapter: "paper" | "field" = "paper";
      document.querySelectorAll<HTMLElement>("[data-chapter]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top <= vh / 2 && r.bottom > vh / 2) chapter = el.dataset.chapter === "paper" ? "paper" : "field";
      });
      setInk(chapter);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname]);

  if (pathname !== "/") return null;

  return (
    <nav
      ref={railRef}
      className={styles.rail}
      data-show={show}
      data-ink={ink}
      aria-label={t("title")}
    >
      <ul className={styles.list}>
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className={styles.item}
              aria-current={active === s.id ? "true" : undefined}
              tabIndex={show ? 0 : -1}
            >
              <span className={styles.tick} aria-hidden="true" />
              <span className={styles.label}>{t(s.key)}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
