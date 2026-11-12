"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import styles from "./LinkMaker.module.css";

// For me, not for visitors: builds a personal link such as https://domain/en?for=Acme
export function LinkMaker({ defaultBase }: { defaultBase: string }) {
  const t = useTranslations("link");
  const locale = useLocale();
  const [name, setName] = useState("");
  const [base, setBase] = useState(defaultBase);
  const [copied, setCopied] = useState(false);

  const clean = name.replace(/[^\p{L}\p{N} .&'’-]/gu, "").trim().slice(0, 40);
  const url = `${base.replace(/\/$/, "")}/${locale}${clean ? `?for=${encodeURIComponent(clean)}` : ""}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard can be blocked, the link stays selectable */
    }
  };

  return (
    <div className={styles.box}>
      <label>
        <span>{t("label")}</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("ph")} maxLength={40} />
      </label>
      <label>
        <span>{t("base")}</span>
        <input value={base} onChange={(e) => setBase(e.target.value)} inputMode="url" />
      </label>
      <p className={styles.outLabel}>{t("out")}</p>
      <code className={styles.out}>{url}</code>
      <button type="button" onClick={copy}>
        {copied ? t("copied") : t("copy")}
      </button>
    </div>
  );
}
