"use client";

import { useTranslations } from "next-intl";
import styles from "./SkillDemo.module.css";

export type SkillKind =
  | "responsive"
  | "frontend"
  | "motion"
  | "seo"
  | "i18n"
  | "a11y"
  | "security"
  | "ai";

// Small live demos shown when a skill tile opens. Pure CSS animation, so they cost nothing
// while closed (animations only run under [data-open="true"]).
export function SkillDemo({ kind }: { kind: SkillKind }) {
  const t = useTranslations("skills.demo");

  switch (kind) {
    case "frontend":
      return (
        <div className={styles.code}>
          <span style={{ "--i": 0 } as React.CSSProperties}>{"<Hero"}</span>
          <span style={{ "--i": 1 } as React.CSSProperties}>{'  title="Hello"'}</span>
          <span style={{ "--i": 2 } as React.CSSProperties}>{'  motion="reveal"'}</span>
          <span style={{ "--i": 3 } as React.CSSProperties}>{"/>"}</span>
        </div>
      );
    case "responsive":
      return (
        <div className={styles.fluid}>
          <div className={styles.fluidBox}>
            <strong>Aa</strong>
            <span>{t("fluid")}</span>
          </div>
          <code className={styles.dim}>clamp(1rem, 0.5rem + 2vw, 2rem)</code>
        </div>
      );
    case "a11y":
      return (
        <div className={styles.a11y}>
          <span className={styles.key}>{t("tab")}</span>
          <ul>
            <li style={{ "--i": 0 } as React.CSSProperties}>{t("focus")}</li>
            <li style={{ "--i": 1 } as React.CSSProperties}>{t("reduced")}</li>
            <li style={{ "--i": 2 } as React.CSSProperties}>aria-label</li>
          </ul>
        </div>
      );
    case "ai":
      return (
        <div className={styles.code}>
          <span style={{ "--i": 0 } as React.CSSProperties}>{"> read CLAUDE.md"}</span>
          <span style={{ "--i": 1 } as React.CSSProperties}>{"> graphify query …"}</span>
          <span style={{ "--i": 2 } as React.CSSProperties}>{"> build ✓ lint ✓"}</span>
          <span style={{ "--i": 3 } as React.CSSProperties}>{"> commit? OK needed"}</span>
        </div>
      );
    case "motion":
      return (
        <div className={styles.motion}>
          <span className={styles.dot} />
          <span className={styles.dot2} />
          <span className={styles.square} />
        </div>
      );
    case "seo":
      return (
        <div className={styles.serp}>
          <span className={styles.serpUrl}>{t("serpUrl")}</span>
          <strong>{t("serpTitle")}</strong>
          <span>{t("serpDesc")}</span>
        </div>
      );
    case "i18n":
      return (
        <div className={styles.langs}>
          <span style={{ "--i": 0 } as React.CSSProperties}>Hallo</span>
          <span style={{ "--i": 1 } as React.CSSProperties}>Hello</span>
          <span style={{ "--i": 2 } as React.CSSProperties}>Привіт</span>
        </div>
      );
    case "security":
      return (
        <ul className={styles.sec}>
          {(["sec1", "sec2", "sec3"] as const).map((k, i) => (
            <li key={k} style={{ "--i": i } as React.CSSProperties}>
              <i>✓</i> {t(k)}
            </li>
          ))}
        </ul>
      );
  }
}
