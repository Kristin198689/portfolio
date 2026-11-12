import type { LegalDoc } from "@/content/legal";
import { Link } from "@/i18n/navigation";
import styles from "./LegalPage.module.css";

export function LegalPage({ doc, back }: { doc: LegalDoc; back: string }) {
  return (
    <main className={styles.page} data-chapter="paper">
      <Link href="/" className={styles.back} data-scramble>
        ← {back}
      </Link>
      <h1 className={styles.title}>{doc.title}</h1>
      <p className={styles.lead}>{doc.lead}</p>
      {doc.missing ? (
        <p role="note" className={styles.missing}>
          {doc.missing}
        </p>
      ) : null}
      <div className={styles.body}>
        {doc.sections.map((s) => (
          <section key={s.h} className={styles.section}>
            <h2>{s.h}</h2>
            {s.p.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
