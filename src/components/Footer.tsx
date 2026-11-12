import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/config/site";
import { WaterTitle } from "./motion/WaterTitle";
import { ContactLink } from "./ui/ContactLink";
import styles from "./Footer.module.css";

export function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale();
  const nav = useTranslations("nav");

  return (
    <footer id="footer" className={styles.footer} data-chapter="field">
      <div className={styles.top}>
        <h2 className={styles.invite} data-split>
          <span>{t("invite1")}</span>
          <span>{t.rich("invite2", { em: (c) => <em>{c}</em> })}</span>
        </h2>
        <ContactLink className={styles.cta} label={nav("contactLabel")}>
          {t("cta")}
        </ContactLink>
      </div>

      <div className={styles.cols}>
        <nav aria-label={t("navTitle")}>
          <h3 className={styles.h}>{t("navTitle")}</h3>
          <ul className={styles.list}>
            <li><Link href="/#skills" data-scramble>{nav("skills")}</Link></li>
            <li><Link href="/#projects" data-scramble>{nav("projects")}</Link></li>
            <li><Link href="/#seo" data-scramble>{nav("seo")}</Link></li>
            <li><Link href="/#ai" data-scramble>{nav("ai")}</Link></li>
            <li><Link href="/#process" data-scramble>{nav("process")}</Link></li>
            <li><Link href="/#contact" data-scramble>{nav("contact")}</Link></li>
          </ul>
        </nav>
        <div>
          <h3 className={styles.h}>{t("linksTitle")}</h3>
          <ul className={styles.list}>
            <li>
              <a href={siteConfig.github} target="_blank" rel="noopener noreferrer" data-scramble>
                GitHub
              </a>
            </li>
            <li>
              <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
            </li>
            <li>
              <a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}>{siteConfig.phone}</a>
            </li>
            <li>{siteConfig.location}</li>
            <li>
              <a href={`/cv/profile-${locale}.pdf`} download data-scramble>
                {t("cv")} ↓
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className={styles.h}>{t("stackTitle")}</h3>
          <ul className={styles.list}>
            <li>Next.js · React</li>
            <li>TypeScript · GSAP</li>
            <li>WebGL · CSS</li>
          </ul>
        </div>
        <div className={styles.legal}>
          <ul className={styles.list}>
            <li><Link href="/work" data-scramble>{t("work")}</Link></li>
            <li><Link href="/hire" data-scramble>{t("hire")}</Link></li>
            <li><Link href="/impressum" data-scramble>{t("imprint")}</Link></li>
            <li><Link href="/datenschutz" data-scramble>{t("privacy")}</Link></li>
          </ul>
          <a href="#top" className={styles.topLink} data-scramble>
            {t("top")} ↑
          </a>
        </div>
      </div>

      <div className={styles.bottom}>
        <p className={styles.credits}>
          <span>
            © {new Date().getFullYear()} {siteConfig.name}
          </span>
          <span>{t("rights")}</span>
        </p>
        <div className={styles.water}>
          <WaterTitle text={siteConfig.name.split(" ")[1]} />
        </div>
      </div>
    </footer>
  );
}
