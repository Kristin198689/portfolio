import { useTranslations } from "next-intl";
import { WaterImage } from "../motion/WaterImage";
import styles from "./WaterShowcase.module.css";

// A full-bleed photo that is a water surface. The image is a placeholder from the studio
// portfolio and is meant to be swapped for a real photograph.
export function WaterShowcase() {
  const t = useTranslations("water");
  const n = useTranslations("nav");
  return (
    <section id="water" className={styles.section} data-chapter="field">
      <div className={styles.media}>
        <WaterImage src="/images/projects/noform.jpg" alt={t("alt")} cursor={n("drag")} />
      </div>
      <div className={styles.overlay}>
        <p className={styles.kicker}>{t("kicker")}</p>
        <p className={styles.caption}>{t("caption")}</p>
      </div>
    </section>
  );
}
