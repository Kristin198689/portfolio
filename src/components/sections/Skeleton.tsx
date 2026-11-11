import { useTranslations } from "next-intl";
import { sections } from "@/config/sections";
import styles from "./Skeleton.module.css";

// Placeholder blocks. Each will be replaced by a real animated section.
export function Skeleton() {
  const t = useTranslations("sections");
  return (
    <>
      {sections.map((id, i) => id === "hero" ? null : (
        <section
          key={id}
          id={id}
          className={`${styles.block} `}
        >
          <p className={styles.index}>{String(i + 1).padStart(2, "0")}</p>
          <h2 className={styles.title}>{t(`${id}.title`)}</h2>
          <p className={styles.note}>{t(`${id}.note`)}</p>
        </section>
      ))}
    </>
  );
}
