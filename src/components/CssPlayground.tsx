"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import styles from "./CssPlayground.module.css";

const PRESETS: Record<string, string> = {
  fluid: `.card {
  --pad: clamp(1rem, 4cqi, 2rem);
  padding: var(--pad);
  max-width: 34rem;
  background: #0a0a0a;
  color: #fafaf7;
}
h3 {
  font-size: clamp(1.5rem, 8cqi, 3.5rem);
  line-height: 0.95;
  margin: 0 0 0.5rem;
}
p { font-size: clamp(0.9rem, 3cqi, 1.15rem); }
button { margin-top: 1rem; padding: 0.7rem 1.2rem; }`,
  grid: `.card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: 1rem;
  padding: 1.25rem;
  border: 2px solid #0a0a0a;
}
h3 { grid-column: 1 / -1; margin: 0; font-size: 2rem; }
p, button { margin: 0; padding: 1rem; border: 1px solid currentColor; }`,
  glass: `:host { background: linear-gradient(135deg, #27d3ff, #8a4bff 55%, #ff3ea5); display: block; padding: 2rem; }
.card {
  padding: 1.5rem;
  color: #fff;
  background: rgb(255 255 255 / 0.18);
  border: 1px solid rgb(255 255 255 / 0.5);
  backdrop-filter: blur(14px);
  border-radius: 1.25rem;
}
h3 { margin: 0 0 0.5rem; font-size: 2rem; }
button { margin-top: 1rem; padding: 0.7rem 1.2rem; border: 0; border-radius: 99px; }`,
};

// External requests are never allowed: @import and every url() are removed before the CSS is applied.
const clean = (css: string) => css.replace(/@import[^;]*;?/gi, "").replace(/url\s*\([^)]*\)/gi, "none");

// A small playground: edit CSS, the card inside an isolated shadow root changes live.
export function CssPlayground() {
  const t = useTranslations("lab");
  const host = useRef<HTMLDivElement>(null);
  const styleEl = useRef<HTMLStyleElement | null>(null);
  const [preset, setPreset] = useState<keyof typeof PRESETS>("fluid");
  const [css, setCss] = useState(PRESETS.fluid);
  const blocked = /@import|url\s*\(/i.test(css);

  useEffect(() => {
    const el = host.current;
    if (!el || el.shadowRoot) return;
    const root = el.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    styleEl.current = style;
    const wrap = document.createElement("div");
    wrap.style.containerType = "inline-size";
    wrap.innerHTML = `<div class="card"><h3></h3><p></p><button type="button"></button></div>`;
    wrap.querySelector("h3")!.textContent = t("card.title");
    wrap.querySelector("p")!.textContent = t("card.text");
    wrap.querySelector("button")!.textContent = t("card.button");
    root.append(style, wrap);
  }, [t]);

  useEffect(() => {
    if (styleEl.current) styleEl.current.textContent = `:host{display:block;font-family:system-ui,sans-serif}${clean(css)}`;
  }, [css]);

  return (
    <div className={styles.grid}>
      <div className={styles.editor}>
        <div className={styles.presets}>
          {Object.keys(PRESETS).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={preset === k}
              onClick={() => {
                setPreset(k);
                setCss(PRESETS[k]);
              }}
            >
              {t(`presets.${k}`)}
            </button>
          ))}
          <button type="button" className={styles.reset} onClick={() => setCss(PRESETS[preset])}>
            {t("reset")}
          </button>
        </div>
        <label>
          <span>{t("css")}</span>
          <textarea value={css} onChange={(e) => setCss(e.target.value)} spellCheck={false} rows={14} />
        </label>
        {blocked ? <p className={styles.blocked}>{t("blocked")}</p> : null}
      </div>
      <div className={styles.preview}>
        <span>{t("preview")}</span>
        <div ref={host} className={styles.host} />
      </div>
    </div>
  );
}
