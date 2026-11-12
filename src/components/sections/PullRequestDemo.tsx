"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import styles from "./PullRequestDemo.module.css";

type Line = { n: number; kind: "ctx" | "del" | "add"; code: string };

const DIFF: Line[] = [
  { n: 82, kind: "ctx", code: ".title {" },
  { n: 83, kind: "del", code: "  font-size: 18vw;" },
  { n: 84, kind: "add", code: "  font-size: clamp(2.5rem, 15.5vw, 18rem);" },
  { n: 85, kind: "ctx", code: "}" },
  { n: 86, kind: "ctx", code: "" },
  { n: 87, kind: "ctx", code: ".scene:first-child {" },
  { n: 88, kind: "add", code: "  padding-inline-end: calc(var(--gutter) + 2.5rem);" },
  { n: 89, kind: "ctx", code: "}" },
];

type State = "open" | "changes" | "merged";

// A tiny pull request you can review: click a line to comment, then approve or request changes.
// Everything stays in the browser, nothing is sent anywhere.
export function PullRequestDemo() {
  const t = useTranslations("skills.pr");
  const [comments, setComments] = useState<Record<number, string[]>>({});
  const [open, setOpen] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [state, setState] = useState<State>("open");

  const add = () => {
    const text = draft.trim().slice(0, 160);
    if (!text || open === null) return;
    setComments((c) => ({ ...c, [open]: [...(c[open] ?? []), text] }));
    setDraft("");
    setOpen(null);
  };

  return (
    <div className={styles.pr} data-state={state}>
      <header className={styles.head}>
        <span className={styles.badge}>{t(`state.${state}`)}</span>
        <h4>{t("title")}</h4>
        <p>{t("body")}</p>
      </header>

      <div className={styles.diff} role="group" aria-label={t("diffLabel")}>
        {DIFF.map((l) => (
          <div key={l.n} className={styles.row} data-kind={l.kind}>
            <button
              type="button"
              className={styles.plus}
              onClick={() => setOpen(open === l.n ? null : l.n)}
              aria-label={`${t("comment")} ${l.n}`}
              disabled={state === "merged"}
            >
              +
            </button>
            <span className={styles.num}>{l.n}</span>
            <code className={styles.code}>
              {l.kind === "add" ? "+ " : l.kind === "del" ? "- " : "  "}
              {l.code}
            </code>
            {(comments[l.n] ?? []).map((c, i) => (
              <p key={i} className={styles.bubble}>
                {c}
              </p>
            ))}
            {open === l.n ? (
              <form
                className={styles.form}
                onSubmit={(e) => {
                  e.preventDefault();
                  add();
                }}
              >
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t("placeholder")}
                  maxLength={160}
                  aria-label={t("placeholder")}
                />
                <button type="submit">{t("comment")}</button>
              </form>
            ) : null}
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={() => setState("changes")} disabled={state === "merged"}>
          {t("changes")}
        </button>
        <button type="button" className={styles.approve} onClick={() => setState("merged")} disabled={state === "merged"}>
          {t("approve")}
        </button>
        <button type="button" className={styles.reset} onClick={() => { setState("open"); setComments({}); setOpen(null); }}>
          {t("reset")}
        </button>
      </div>
      <p className={styles.note}>{t("note")}</p>
    </div>
  );
}
