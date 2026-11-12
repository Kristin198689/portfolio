import { useTranslations } from "next-intl";
import { tests } from "@/config/tests";
import { BrandIcon } from "../ui/BrandIcon";
import styles from "./QualityGate.module.css";

// What stands between a change and the main branch: real test numbers from the last run.
export function QualityGate() {
  const t = useTranslations("ai.quality");
  const rows: Array<[string, string]> = [
    ["ESLint", t("lint")],
    ["TypeScript strict", t("types")],
    ["Next.js build", t("build")],
    ["Playwright e2e", t("e2e", { passed: tests.passed, total: tests.total })],
    ["GitHub Actions", t("ci")],
  ];
  return (
    <div className={styles.box}>
      <h3 className={styles.h}>
        <BrandIcon name="github" size={16} /> {t("title")}
      </h3>
      <ul className={styles.list}>
        {rows.map(([k, v]) => (
          <li key={k}>
            <i aria-hidden="true">✓</i>
            <strong>{k}</strong>
            <span>{v}</span>
          </li>
        ))}
      </ul>
      <p className={styles.note}>{t("note", { date: tests.date, seconds: tests.seconds })}</p>
    </div>
  );
}
