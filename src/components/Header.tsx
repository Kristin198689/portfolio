"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/config/site";
import { ContactLink } from "./ui/ContactLink";
import { LangSwitcher } from "./LangSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { OrbSwitch } from "./OrbSwitch";
import { PaletteButton } from "./CommandPalette";
import styles from "./Header.module.css";

type Ink = "paper" | "field" | "night";

const links = [
  { href: "/#skills", key: "skills" },
  { href: "/#projects", key: "projects" },
  { href: "/services", key: "services" },
  { href: "/hire", key: "hire" },
  { href: "/#contact", key: "contact" },
] as const;

// secondary pages shown small under the big links in the mobile menu
const pages = [
  { href: "/work", key: "work" },
  { href: "/about", key: "about" },
  { href: "/lab", key: "lab" },
  { href: "/cv", key: "cv_text" },
] as const;

// Same behaviour as Beauty Studio: the header takes the ink of the chapter under it,
// hides when scrolling down, returns when scrolling up.
export function Header() {
  const t = useTranslations("nav");
  const f = useTranslations("footer");
  const [ink, setInk] = useState<Ink>("field");
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = 36;
      let next: Ink = "field";
      document.querySelectorAll<HTMLElement>("[data-chapter]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top <= y && r.bottom > y) next = el.dataset.chapter === "field" ? "field" : el.dataset.chapter === "night" ? "night" : "paper";
      });
      setInk(next);
    };
    let lastY = window.scrollY;
    const onDir = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      if (Math.abs(y - lastY) > 6) {
        // on phones the burger always stays reachable; the header only hides on larger screens
        setHidden(y > lastY && y > 160 && !window.matchMedia("(max-width: 55.99rem)").matches);
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
        data-scrolled={scrolled && !open}
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
          <OrbSwitch />
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
        <nav aria-label={t("more")} className={styles.menuFoot}>
          {pages.map((p) => (
            <Link key={p.key} href={p.href} tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>
              {f(p.key)}
            </Link>
          ))}
          <a href={siteConfig.github} target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1}>
            GitHub
          </a>
          <a href={`mailto:${siteConfig.email}`} tabIndex={open ? 0 : -1}>
            {siteConfig.email}
          </a>
        </nav>
        <OrbSwitch row />
      </div>
    </>
  );
}
