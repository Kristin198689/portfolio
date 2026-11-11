import { useTranslations } from "next-intl";
import { sections } from "@/config/sections";
import styles from "./Skeleton.module.css";

// Placeholder blocks. Each will be replaced by a real animated section.
export function Skeleton() {
  const t = useTranslations("sections");
  return (
    <>
      {sections.map((id, i) => (
        <section
          key={id}
          id={id}
          className={`${styles.block} ${i === 0 ? styles.dark : ""}`}
        >
          <p className={styles.index}>{String(i + 1).padStart(2, "0")}</p>
          {i === 0 ? (
            <h1 className={styles.title}>{t(`${id}.title`)}</h1>
          ) : (
            <h2 className={styles.title}>{t(`${id}.title`)}</h2>
          )}
          <p className={styles.note}>{t(`${id}.note`)}</p>
        </section>
      ))}
    </>
  );
}
