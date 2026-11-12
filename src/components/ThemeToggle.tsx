"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import styles from "./ThemeToggle.module.css";

export function applyTheme(next: "light" | "dark") {
  document.documentElement.dataset.theme = next === "dark" ? "dark" : "";
  if (next === "light") delete document.documentElement.dataset.theme;
  try {
    localStorage.setItem("theme", next);
  } catch {
    /* storage can be blocked */
  }
}

export function currentTheme(): "light" | "dark" {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

// Light / dark switch. Dark swaps paper and ink, so every section inverts and the rhythm stays.
export function ThemeToggle() {
  const t = useTranslations("nav");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const frame = requestAnimationFrame(() => setTheme(currentTheme()));
    const obs = new MutationObserver(() => setTheme(currentTheme()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      cancelAnimationFrame(frame);
      obs.disconnect();
    };
  }, []);

  return (
    <button
      type="button"
      className={styles.btn}
      onClick={() => applyTheme(theme === "dark" ? "light" : "dark")}
      aria-label={theme === "dark" ? t("themeToLight") : t("themeToDark")}
      aria-pressed={theme === "dark"}
      data-cursor={t("theme")}
    >
      <span className={styles.icon} aria-hidden="true" />
    </button>
  );
}
