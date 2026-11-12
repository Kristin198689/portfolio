import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Orb3D } from "@/components/motion/Orb3D";
import { NotFoundDepth } from "@/components/NotFoundDepth";
import { SearchButton } from "@/components/SearchButton";
import styles from "./not-found.module.css";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <main className={styles.page} data-chapter="field">
      <div className={styles.orb} aria-hidden="true">
        <Orb3D />
      </div>
      <NotFoundDepth code={t("code")} />
      <h1 className={styles.title}>{t("title")}</h1>
      <p className={styles.text}>{t("text")}</p>
      <div className={styles.actions}>
        <Link href="/" className={styles.btn} data-scramble>
          ← {t("home")}
        </Link>
        <SearchButton className={styles.btn}>{t("search")} ⌘K</SearchButton>
      </div>
      <p className={styles.hint}>{t("hint")}</p>
    </main>
  );
}
