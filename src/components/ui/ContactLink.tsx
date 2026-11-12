import { Link } from "@/i18n/navigation";
import styles from "./ContactLink.module.css";

// Same button as Beauty Studio's BookLink: magnetic, scramble on hover, cursor label.
export function ContactLink({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <Link
      href="/#contact"
      className={`${styles.button} ${className ?? ""}`}
      data-magnetic
      data-scramble
      data-cursor={label}
    >
      {children}
    </Link>
  );
}
