"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/config/site";
import { ContactLink } from "./ui/ContactLink";
import { LangSwitcher } from "./LangSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { PaletteButton } from "./CommandPalette";
import styles from "./Header.module.css";

type Ink = "paper" | "field";

const links = [
  { href: "/#skills", key: "skills" },
  { href: "/#projects", key: "projects" },
  { href: "/#seo", key: "seo" },
  { href: "/#ai", key: "ai" },
  { href: "/#contact", key: "contact" },
] as const;

// Same behaviour as Beauty Studio: the header takes the ink of the chapter under it,
// hides when scrolling down, returns when scrolling up.
export function Header() {
  const t = useTranslations("nav");
  const [ink, setInk] = useState<Ink>("field");
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = 36;
      let next: Ink = "field";
      document.querySelectorAll<HTMLElement>("[data-chapter]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top <= y && r.bottom > y) next = el.dataset.chapter === "field" ? "field" : "paper";
      });
      setInk(next);
    };
    let lastY = window.scrollY;
    const onDir = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) > 6) {
        setHidden(y > lastY && y > 160);
        lastY = y;
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", onDir, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onDir);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={styles.header}
        data-ink={open ? "plum" : ink}
        data-hidden={hidden && !open}
      >
        <Link href="/" className={styles.mark} onClick={() => setOpen(false)}>
          {siteConfig.shortName}
        </Link>
        <nav className={styles.nav} aria-label={t("main")}>
          {links.map((l) => (
            <Link key={l.key} href={l.href} data-scramble>
              {t(l.key)}
            </Link>
          ))}
        </nav>
        <div className={styles.end}>
          <LangSwitcher />
          <ThemeToggle />
          <PaletteButton />
          <ContactLink className={styles.book} label={t("contactLabel")}>
            {t("contactCta")}
          </ContactLink>
          <button
            type="button"
            className={styles.burger}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? t("close") : t("menu")}
          </button>
        </div>
      </header>

      <div
        id="mobile-menu"
        className={styles.menu}
        data-open={open}
        aria-hidden={!open}
        data-lenis-prevent
      >
        <nav aria-label={t("mobile")}>
          <ul className={styles.menuList}>
            {links.map((l) => (
              <li key={l.key}>
                <Link
                  href={l.href}
                  className={styles.menuLink}
                  data-scramble
                  tabIndex={open ? 0 : -1}
                  onClick={() => setOpen(false)}
                >
                  {t(l.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
