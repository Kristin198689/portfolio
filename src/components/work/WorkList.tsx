"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { archive, type Status } from "@/config/archive";
import styles from "./WorkList.module.css";

type Filter = "all" | Status;
const FILTERS: Filter[] = ["all", "live", "building", "private"];

// All projects as a searchable list with status filters. Plain links, no animation needed.
export function WorkList() {
  const t = useTranslations("work");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return archive
      .filter((e) => !e.hidden)
      .filter((e) => filter === "all" || e.status === filter)
      .filter((e) => !q || `${e.name} ${e.stack.join(" ")} ${t(`items.${e.key}`)}`.toLowerCase().includes(q));
  }, [filter, query, t]);
  const total = archive.filter((e) => !e.hidden).length;

  return (
    <div>
      <div className={styles.bar}>
        <div className={styles.filters} role="tablist">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              className={styles.chip}
              onClick={() => setFilter(f)}
            >
              {t(`filters.${f}`)}
            </button>
          ))}
        </div>
        <input
          className={styles.search}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search")}
          aria-label={t("search")}
        />
      </div>
      <p className={styles.count} aria-live="polite">
        {t("counts", { n: list.length, total })}
      </p>

      {list.length === 0 ? <p className={styles.none}>{t("none")}</p> : null}
      <ul className={styles.list}>
        {list.map((e, i) => (
          <li key={e.key} className={styles.row}>
            <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
            <div className={styles.main}>
              <h3 className={styles.name}>{e.name}</h3>
              <p className={styles.desc}>{t(`items.${e.key}`)}</p>
              <p className={styles.tags}>
                {e.stack.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </p>
            </div>
            <div className={styles.meta}>
              <span className={styles.kind}>{t(`kinds.${e.kind}`)}</span>
              <span className={styles.status} data-status={e.status}>
                {t(`status.${e.status}`)}
              </span>
            </div>
            <div className={styles.links}>
              {e.live ? (
                <a href={e.live} target="_blank" rel="noopener noreferrer" data-scramble>
                  {t("open")} ↗
                </a>
              ) : null}
              {e.repo ? (
                <a href={e.repo} target="_blank" rel="noopener noreferrer" data-scramble>
                  {t("repo")} ↗
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
