"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { siteConfig } from "@/config/site";
import button from "../ui/ContactLink.module.css";
import styles from "./Contact.module.css";

const KINDS = ["job", "freelance", "collab", "hello"] as const;

// The form builds a message and hands it to WhatsApp (wa.me). Nothing is sent to a server or stored.
// While no WhatsApp number is configured it falls back to the email app with the same text.
export function Contact() {
  const t = useTranslations("contact");
  const locale = useLocale();
  const [error, setError] = useState<"name" | "message" | null>(null);
  const hasWhatsApp = siteConfig.whatsapp.length > 6;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim().slice(0, 80);
    const kind = String(data.get("kind") ?? KINDS[0]);
    const message = String(data.get("message") ?? "").trim().slice(0, 800);
    if (!name) return setError("name");
    if (!message) return setError("message");
    setError(null);

    const kindLabel = t(`kinds.${KINDS.includes(kind as (typeof KINDS)[number]) ? kind : KINDS[0]}`);
    const text = `${t("greeting")}!\n${t("iAm")} ${name}.\n${t("topic")}: ${kindLabel}.\n\n${message}`;
    if (hasWhatsApp) {
      window.open(
        `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(text)}`,
        "_blank",
        "noopener,noreferrer",
      );
    } else {
      window.location.href = `mailto:${siteConfig.email}?subject=${encodeURIComponent(
        `${name}: ${kindLabel}`,
      )}&body=${encodeURIComponent(text)}`;
    }
  };

  return (
    <section id="contact" className={styles.section} data-chapter="paper">
      <div className={styles.left}>
        <p className={styles.kicker}>{t("kicker")}</p>
        <h2 className={styles.title} data-split>
          {t("title")}
        </h2>
        <p className={styles.lead}>{t("lead")}</p>
        <ul className={styles.facts}>
          <li>
            <span>{t("email")}</span>
            <a href={`mailto:${siteConfig.email}`} data-scramble>
              {siteConfig.email}
            </a>
          </li>
          <li>
            <span>{t("location")}</span>
            <span>{siteConfig.location}</span>
          </li>
          <li>
            <span>{t("languages")}</span>
            <span>{t("languagesValue")}</span>
          </li>
          <li>
            <span>PDF</span>
            <a href={`/cv/profile-${locale}.pdf`} download data-scramble>
              {t("cv")} ↓
            </a>
          </li>
        </ul>
      </div>

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <label className={styles.field}>
          <span>{t("name")}</span>
          <input
            name="name"
            type="text"
            autoComplete="name"
            placeholder={t("namePh")}
            maxLength={80}
            aria-invalid={error === "name"}
          />
          {error === "name" ? <em className={styles.err}>{t("errName")}</em> : null}
        </label>

        <fieldset className={styles.kinds}>
          <legend>{t("kind")}</legend>
          {KINDS.map((k, i) => (
            <label key={k} className={styles.kind}>
              <input type="radio" name="kind" value={k} defaultChecked={i === 0} />
              <span>{t(`kinds.${k}`)}</span>
            </label>
          ))}
        </fieldset>

        <label className={styles.field}>
          <span>{t("message")}</span>
          <textarea
            name="message"
            rows={4}
            placeholder={t("messagePh")}
            maxLength={800}
            aria-invalid={error === "message"}
          />
          {error === "message" ? <em className={styles.err}>{t("errMsg")}</em> : null}
        </label>

        <button
          type="submit"
          className={`${button.button} ${styles.send}`}
          data-magnetic
          data-scramble
          data-cursor="WhatsApp"
        >
          {t("send")}
        </button>
        <p className={styles.hint}>{hasWhatsApp ? t("hint") : t("fallbackNote")}</p>
      </form>
    </section>
  );
}
