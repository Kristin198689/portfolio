"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "@/i18n/navigation";
import styles from "./ScrollProgress.module.css";

// Thin line at the very top: how far down the page you are (helps on phones, where the rail is hidden).
export function ScrollProgress() {
  const pathname = usePathname();
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (pathname !== "/") return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      if (bar.current) bar.current.style.transform = `scaleX(${Math.min(1, window.scrollY / max)})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname]);

  if (pathname !== "/") return null;
  return (
    <div className={styles.track} aria-hidden="true">
      <span ref={bar} className={styles.bar} />
    </div>
  );
}
