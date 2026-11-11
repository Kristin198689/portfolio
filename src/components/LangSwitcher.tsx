"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import styles from "./LangSwitcher.module.css";

export function LangSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <ul className={styles.list}>
      {routing.locales.map((l) => (
        <li key={l}>
          <Link
            href={pathname}
            locale={l}
            hrefLang={l}
            lang={l}
            aria-current={l === locale ? "true" : undefined}
            className={styles.link}
          >
            {l.toUpperCase()}
          </Link>
        </li>
      ))}
    </ul>
  );
}
