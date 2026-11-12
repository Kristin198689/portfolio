"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { siteConfig } from "@/config/site";
import styles from "./Commits.module.css";

type Commit = { sha: string; message: string; date: string; url: string };

const REPO = siteConfig.github.replace("https://github.com/", "") + "/portfolio";

const ago = (iso: string, locale: string) => {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [u, s] of units) if (Math.abs(diff) >= s) return rtf.format(Math.round(diff / s), u);
  return rtf.format(0, "second");
};

// Latest commits of this site's public repository, read from the GitHub API in the browser.
export function Commits({ locale }: { locale: string }) {
  const t = useTranslations("ai.commits");
  const [state, setState] = useState<"idle" | "loading" | "error" | Commit[]>("idle");

  // Privacy: nothing is requested from GitHub until the visitor clicks the button.
  const load = () => {
    setState("loading");
    const key = "commits-cache";
    try {
      const cached = sessionStorage.getItem(key);
      if (cached) {
        setState(JSON.parse(cached));
        return;
      }
    } catch {
      /* storage can be blocked */
    }
    fetch(`https://api.github.com/repos/${REPO}/commits?per_page=5`, {
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((rows: Array<{ sha: string; html_url: string; commit: { message: string; author: { date: string } } }>) => {
        const list = rows.map((r) => ({
          sha: r.sha.slice(0, 7),
          message: r.commit.message.split("\n")[0],
          date: r.commit.author.date,
          url: r.html_url,
        }));
        try {
          sessionStorage.setItem(key, JSON.stringify(list));
        } catch {
          /* ignore */
        }
        setState(list);
      })
      .catch(() => setState("error"));
  };

  return (
    <div className={styles.box}>
      <h3 className={styles.h}>
        <span className={styles.dot} aria-hidden="true" /> {t("title")}
      </h3>
      {state === "idle" ? (
        <button type="button" className={styles.load} onClick={load}>
          {t("load")}
        </button>
      ) : null}
      {state === "loading" ? <p className={styles.note}>{t("loading")}</p> : null}
      {state === "error" ? <p className={styles.note}>{t("error")}</p> : null}
      {Array.isArray(state) ? (
        <ul className={styles.list}>
          {state.map((c) => (
            <li key={c.sha}>
              <a href={c.url} target="_blank" rel="noopener noreferrer">
                <code>{c.sha}</code>
                <span>{c.message}</span>
                <time dateTime={c.date}>{ago(c.date, locale)}</time>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      <p className={styles.note}>
        {t("privacy")} {t("note")}{" "}
        <a href={`${siteConfig.github}/portfolio/commits`} target="_blank" rel="noopener noreferrer">
          {t("open")} ↗
        </a>
      </p>
    </div>
  );
}
