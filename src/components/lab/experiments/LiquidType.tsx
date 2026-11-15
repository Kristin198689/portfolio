"use client";

import { useEffect, useId, useRef } from "react";
import { useTranslations } from "next-intl";
import { createLoop } from "../kit";
import { num, type ExperimentProps } from "../types";
import styles from "./exp.module.css";

// Liquid typography: a real SVG feTurbulence + feDisplacementMap filter on live text. The turbulence
// drifts over time and the displacement swells while the pointer is over the word.
export default function LiquidType({ paramsRef, reduced }: ExperimentProps) {
  const t = useTranslations("lab");
  const id = useId().replace(/:/g, "");
  const host = useRef<HTMLDivElement>(null);
  const turb = useRef<SVGFETurbulenceElement>(null);
  const disp = useRef<SVGFEDisplacementMapElement>(null);
  const text = t("exp.liquid.text");

  useEffect(() => {
    const el = host.current;
    const tu = turb.current;
    const di = disp.current;
    if (!el || !tu || !di) return;
    let hover = 0;
    let target = 0;
    const enter = () => (target = 1);
    const leave = () => (target = 0);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("pointerdown", enter);
    const loop = createLoop(
      el,
      (time) => {
        const p = paramsRef.current;
        const speed = num(p, "speed", 1);
        const k = num(p, "intensity", 40);
        const f = num(p, "density", 12) / 1000;
        hover += (target - hover) * 0.08;
        const drift = reduced ? 0 : time * 0.35 * speed;
        tu.setAttribute("baseFrequency", `${(f + Math.sin(drift) * f * 0.25).toFixed(5)} ${(f * 1.6 + Math.cos(drift * 0.8) * f * 0.3).toFixed(5)}`);
        di.setAttribute("scale", String(k * (0.35 + hover * 0.9)));
      },
      reduced,
    );
    return () => {
      loop.stop();
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("pointerdown", enter);
    };
  }, [paramsRef, reduced]);

  return (
    <div ref={host} className={`${styles.fill} ${styles.center}`}>
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <filter id={id} x="-10%" y="-20%" width="120%" height="140%">
          <feTurbulence ref={turb} type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap ref={disp} in="SourceGraphic" in2="n" scale="20" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <p className={styles.big} style={{ filter: `url(#${id})` }}>
        {text}
      </p>
    </div>
  );
}
