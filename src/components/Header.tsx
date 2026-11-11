import { useTranslations } from "next-intl";
import { LangSwitcher } from "./LangSwitcher";
import styles from "./Header.module.css";

export function Header() {
  const t = useTranslations("header");
  return (
    <header className={styles.header}>
      <a href="#hero" className={styles.brand}>
        {t("brand")}
      </a>
      <LangSwitcher />
    </header>
  );
}
