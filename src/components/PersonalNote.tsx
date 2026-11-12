"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import styles from "./PersonalNote.module.css";

// A link like /en?for=Acme greets that company. The name is cleaned and shown as plain text only.
export function PersonalNote() {
  const t = useTranslations("personal");
  const [name, setName] = useState("");

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("for") ?? "";
    const clean = raw.replace(/[^\p{L}\p{N} .&'’-]/gu, "").trim().slice(0, 40);
    const frame = requestAnimationFrame(() => setName(clean));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!name) return null;
  return (
    <div className={styles.note} role="status">
      <strong>{t("hello", { name })}</strong>
      <span>{t("sub")}</span>
      <Link href="/hire" data-scramble>
        {t("more")} →
      </Link>
    </div>
  );
}
