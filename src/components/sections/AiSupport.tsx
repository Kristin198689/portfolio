import { useTranslations } from "next-intl";
import styles from "./AiSupport.module.css";

// Honest framing for skills not yet used in production: they are delivered with AI support.
export function AiSupport() {
  const t = useTranslations("skills.aiSupport");
  const chips = t.raw("chips") as string[];
  return (
    <section className={styles.box} aria-labelledby="ai-support">
      <h3 id="ai-support" className={styles.title}>
        {t("title")}
      </h3>
      <p className={styles.text}>{t("text")}</p>
      <ul className={styles.chips}>
        {chips.map((c) => (
          <li key={c}>
            {c} <span>{t("tag")}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
