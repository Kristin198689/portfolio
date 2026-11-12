"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import styles from "./DesignTokens.module.css";

const COLORS = ["--color-bg", "--color-surface", "--color-text", "--color-text-muted", "--color-field", "--color-on-field", "--color-danger"];
const PAIRS: Array<[string, string]> = [
  ["--color-text", "--color-bg"],
  ["--color-text-muted", "--color-bg"],
  ["--color-on-field", "--color-field"],
];
const SPACES = ["--space-1", "--space-2", "--space-3", "--space-4", "--space-6", "--space-8", "--space-12", "--space-16"];
const TYPES = ["--fs-small", "--fs-body", "--fs-lead", "--fs-head"];

const probe = (name: string, prop: "color" | "width" | "fontSize") => {
  const el = document.createElement("div");
  el.style.position = "absolute";
  el.style.visibility = "hidden";
  if (prop === "color") el.style.color = `var(${name})`;
  else if (prop === "width") el.style.width = `var(${name})`;
  else el.style.fontSize = `var(${name})`;
  document.body.appendChild(el);
  const cs = getComputedStyle(el);
  const v = prop === "color" ? cs.color : prop === "width" ? cs.width : cs.fontSize;
  el.remove();
  return v;
};

const toRgb = (c: string) => (c.match(/[\d.]+/g) ?? ["0", "0", "0"]).slice(0, 3).map(Number);
const hex = (c: string) => "#" + toRgb(c).map((n) => Math.round(n).toString(16).padStart(2, "0")).join("");
const lum = ([r, g, b]: number[]) => {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a: string, b: string) => {
  const l1 = lum(toRgb(a));
  const l2 = lum(toRgb(b));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

type Data = {
  colors: Array<{ name: string; value: string }>;
  pairs: Array<{ a: string; b: string; r: number }>;
  spaces: Array<{ name: string; px: string }>;
  types: Array<{ name: string; px: string }>;
};

// Reads the tokens from the page's own CSS, so the numbers always match what is on screen.
export function DesignTokens() {
  const t = useTranslations("design");
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    const read = () => {
      setData({
        colors: COLORS.map((name) => ({ name, value: hex(probe(name, "color")) })),
        pairs: PAIRS.map(([a, b]) => ({ a, b, r: ratio(probe(a, "color"), probe(b, "color")) })),
        spaces: SPACES.map((name) => ({ name, px: probe(name, "width") })),
        types: TYPES.map((name) => ({ name, px: probe(name, "fontSize") })),
      });
    };
    const frame = requestAnimationFrame(read);
    const obs = new MutationObserver(() => requestAnimationFrame(read));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      cancelAnimationFrame(frame);
      obs.disconnect();
    };
  }, []);

  if (!data) return null;
  return (
    <>
      <section className={styles.block} aria-labelledby="d-colors">
        <h2 id="d-colors" className={styles.h}>
          {t("colors")}
        </h2>
        <ul className={styles.swatches}>
          {data.colors.map((c) => (
            <li key={c.name}>
              <span className={styles.chip} style={{ background: `var(${c.name})` }} />
              <code>{c.name}</code>
              <b>{c.value}</b>
            </li>
          ))}
        </ul>
        <ul className={styles.pairs}>
          {data.pairs.map((p) => (
            <li key={p.a + p.b} data-ok={p.r >= 4.5}>
              <span style={{ color: `var(${p.a})`, background: `var(${p.b})` }}>Aa</span>
              <code>
                {p.a.replace("--color-", "")} / {p.b.replace("--color-", "")}
              </code>
              <b>
                {t("contrast")} {p.r.toFixed(1)}:1 {p.r >= 7 ? "AAA" : p.r >= 4.5 ? "AA" : "!"}
              </b>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.block} aria-labelledby="d-type">
        <h2 id="d-type" className={styles.h}>
          {t("type")}
        </h2>
        <ul className={styles.type}>
          {data.types.map((ty) => (
            <li key={ty.name}>
              <span style={{ fontSize: `var(${ty.name})` }}>{t("sample")}</span>
              <code>
                {ty.name} · {Math.round(parseFloat(ty.px))}px
              </code>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.block} aria-labelledby="d-space">
        <h2 id="d-space" className={styles.h}>
          {t("space")}
        </h2>
        <ul className={styles.space}>
          {data.spaces.map((s) => (
            <li key={s.name}>
              <code>{s.name}</code>
              <span style={{ width: `var(${s.name})` }} />
              <b>{Math.round(parseFloat(s.px))}px</b>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.block} aria-labelledby="d-motion">
        <h2 id="d-motion" className={styles.h}>
          {t("motion")}
        </h2>
        <ul className={styles.motion}>
          {[
            ["--ease-out", "--dur-base"],
            ["--ease-in-out", "--dur-slow"],
          ].map(([e, d]) => (
            <li key={e}>
              <div className={styles.track} tabIndex={0}>
                <span style={{ transitionTimingFunction: `var(${e})`, transitionDuration: `var(${d})` }} />
                <em>{t("hoverMe")}</em>
              </div>
              <code>
                {e} · {d}
              </code>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
