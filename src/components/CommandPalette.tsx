"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { sections } from "@/config/sections";
import { siteConfig } from "@/config/site";
import { applyTheme, currentTheme } from "./ThemeToggle";
import { DEV_EVENT } from "./DevView";
import styles from "./CommandPalette.module.css";

type Cmd = { id: string; group: string; label: string; hint?: string; run: () => void };

const OPEN_EVENT = "palette:open";

// element that had focus before the palette opened (module scope keeps render pure)
const focus: { el: HTMLElement | null } = { el: null };

// Small button in the header
export function PaletteButton() {
  const t = useTranslations("nav");
  return (
    <button
      type="button"
      className={styles.trigger}
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      aria-label={t("palette")}
      data-cursor={t("palette")}
    >
      <kbd>⌘K</kbd>
    </button>
  );
}

// ⌘K / Ctrl+K: jump to any section, switch language or theme, open links, download the PDF.
export function CommandPalette() {
  const t = useTranslations("palette");
  const nav = useTranslations("nav.sections");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setIndex(0);
    focus.el?.focus?.();
  }, []);

  const goTo = useCallback(
    (id: string) => {
      close();
      const run = () => {
        const el = document.getElementById(id);
        if (!el) return;
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: "smooth" });
      };
      if (pathname !== "/") {
        router.push("/");
        setTimeout(run, 600);
      } else {
        setTimeout(run, 50);
      }
    },
    [close, pathname, router],
  );

  const commands = useMemo<Cmd[]>(() => {
    const go = t("groups.go");
    const lang = t("groups.language");
    const list: Cmd[] = sections.map((s) => ({
      id: `go-${s.id}`,
      group: go,
      label: nav(s.key),
      run: () => goTo(s.id),
    }));
    routing.locales.forEach((l) =>
      list.push({
        id: `lang-${l}`,
        group: lang,
        label: t(`langNames.${l}`),
        hint: l === locale ? "✓" : l.toUpperCase(),
        run: () => {
          close();
          router.replace(pathname, { locale: l });
        },
      }),
    );
    list.push({
      id: "theme",
      group: t("groups.theme"),
      label: t("items.toggleTheme"),
      run: () => {
        applyTheme(currentTheme() === "dark" ? "light" : "dark");
        close();
      },
    });
    list.push({
      id: "dev",
      group: t("groups.theme"),
      label: t("items.dev"),
      hint: "⌥⇧D",
      run: () => {
        close();
        window.dispatchEvent(new Event(DEV_EVENT));
      },
    });
    list.push(
      {
        id: "cv",
        group: t("groups.links"),
        label: t("items.cv"),
        hint: "PDF",
        run: () => {
          close();
          window.open(`/cv/profile-${locale}.pdf`, "_blank", "noopener");
        },
      },
      {
        id: "github",
        group: t("groups.links"),
        label: t("items.github"),
        hint: "↗",
        run: () => {
          close();
          window.open(siteConfig.github, "_blank", "noopener,noreferrer");
        },
      },
      {
        id: "email",
        group: t("groups.links"),
        label: t("items.email"),
        run: () => {
          close();
          window.open(`mailto:${siteConfig.email}`, "_self");
        },
      },
      {
        id: "work",
        group: t("groups.go"),
        label: t("items.work"),
        run: () => {
          close();
          router.push("/work");
        },
      },
      {
        id: "hire",
        group: t("groups.go"),
        label: t("items.hire"),
        run: () => {
          close();
          router.push("/hire");
        },
      },
      {
        id: "imprint",
        group: t("groups.legal"),
        label: t("items.imprint"),
        run: () => {
          close();
          router.push("/impressum");
        },
      },
      {
        id: "privacy",
        group: t("groups.legal"),
        label: t("items.privacy"),
        run: () => {
          close();
          router.push("/datenschutz");
        },
      },
    );
    return list;
  }, [t, nav, locale, goTo, close, router, pathname]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? commands.filter((c) => `${c.group} ${c.label}`.toLowerCase().includes(q)) : commands;
  }, [commands, query]);

  // open with the shortcut or the header button
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        focus.el = document.activeElement as HTMLElement | null;
        setOpen((v) => !v);
      }
    };
    const onOpen = () => {
      focus.el = document.activeElement as HTMLElement | null;
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onEsc);
    const frame = requestAnimationFrame(() => input.current?.focus());
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onEsc);
      cancelAnimationFrame(frame);
      document.documentElement.style.overflow = "";
    };
  }, [open, close]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      results[index]?.run();
    }
  };

  if (!open) return null;

  return (
    <div className={styles.overlay} onMouseDown={close} role="presentation" data-lenis-prevent>
      <div
        className={styles.box}
        role="dialog"
        aria-modal="true"
        aria-label={t("placeholder")}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <input
          ref={input}
          className={styles.input}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          autoComplete="off"
          spellCheck={false}
        />
        <ul className={styles.list} role="listbox">
          {results.length === 0 ? <li className={styles.empty}>{t("empty")}</li> : null}
          {results.map((c, i) => {
            const header = i === 0 || results[i - 1].group !== c.group ? c.group : null;
            return (
              <li key={c.id} role="presentation">
                {header ? <p className={styles.group}>{header}</p> : null}
                <button
                  type="button"
                  role="option"
                  aria-selected={i === index}
                  className={styles.item}
                  onMouseEnter={() => setIndex(i)}
                  onClick={c.run}
                >
                  <span>{c.label}</span>
                  {c.hint ? <kbd>{c.hint}</kbd> : null}
                </button>
              </li>
            );
          })}
        </ul>
        <p className={styles.foot}>
          <kbd>↑</kbd> <kbd>↓</kbd> · <kbd>↵</kbd> · {t("close")}
        </p>
      </div>
    </div>
  );
}
