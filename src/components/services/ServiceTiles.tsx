"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { watchScroll } from "@/lib/scroll-guard";
import styles from "./ServiceTiles.module.css";

type Offer = { t: string; d: string; p: string };

// Small looping pictures, one per service. They are CSS only and decorative (aria-hidden).
function Art({ i }: { i: number }) {
  switch (i) {
    case 0: // website: a browser window that builds itself
      return (
        <div className={styles.browser}>
          <span className={styles.dots}><i /><i /><i /></span>
          <b className={styles.bar1} /><b className={styles.bar2} /><b className={styles.bar3} />
          <span className={styles.cursor} />
        </div>
      );
    case 1: // redesign: old panel wipes into the new one
      return (
        <div className={styles.redesign}>
          <div className={styles.oldPanel}><b /><b /><b /></div>
          <div className={styles.newPanel}><b /><b /><b /></div>
        </div>
      );
    case 2: // seo: a result that climbs
      return (
        <div className={styles.seo}>
          <div className={styles.chart}><i /><i /><i /><i /><i /></div>
          <div className={styles.snippet}><b /><b /></div>
        </div>
      );
    case 3: // design: type and colour
      return (
        <div className={styles.design}>
          <span className={styles.aa}>Aa</span>
          <span className={styles.swatches}><i /><i /><i /><i /></span>
        </div>
      );
    case 4: // apps: a dashboard with a line that draws
      return (
        <div className={styles.app}>
          <span className={styles.side} />
          <span className={styles.cards}><i /><i /><i /></span>
          <svg viewBox="0 0 120 40" className={styles.line} aria-hidden="true">
            <polyline points="0,32 20,24 40,28 62,12 84,18 120,4" />
          </svg>
        </div>
      );
    default: // languages: chips lighting one after another
      return (
        <div className={styles.langs}>
          <span>DE</span><span>EN</span><span>UK</span><span dir="rtl">ع</span>
        </div>
      );
  }
}

// Same behaviour as the Skills tiles: the tile leans toward the pointer and a dark layer with a live
// picture opens from the exact point where the pointer entered. On touch, a tap toggles it.
type Extra = { title: string; text: string; cta: string; href: string };

export function ServiceTiles({ offers, label, extra }: { offers: Offer[]; label: string; extra?: Extra }) {
  const list = useRef<HTMLOListElement>(null);
  const guard = useRef<ReturnType<typeof watchScroll> | null>(null);

  // a scroll closes every open tile and keeps the pointer from opening the tiles that pass under it
  useEffect(() => {
    guard.current = watchScroll(() => {
      list.current?.querySelectorAll<HTMLElement>('[data-open="true"]').forEach((el) => {
        el.dataset.open = "false";
        gsap.to(el, { x: 0, y: 0, duration: 0.4, ease: "power3.out" });
      });
    });
    return () => guard.current?.stop();
  }, []);

  const setPoint = (el: HTMLElement, e: React.PointerEvent) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - r.left}px`);
    el.style.setProperty("--y", `${e.clientY - r.top}px`);
  };
  const onEnter = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch" || guard.current?.isScrolling()) return;
    setPoint(e.currentTarget, e);
    e.currentTarget.dataset.open = "true";
  };
  const onLeave = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch") return;
    setPoint(e.currentTarget, e);
    e.currentTarget.dataset.open = "false";
    gsap.to(e.currentTarget, { x: 0, y: 0, duration: 0.7, ease: "power3.out" });
  };
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch" || guard.current?.isScrolling()) return;
    const el = e.currentTarget;
    if (el.dataset.open !== "true") {
      setPoint(el, e);
      el.dataset.open = "true";
    }
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - (r.left + r.width / 2)) / r.width;
    const ny = (e.clientY - (r.top + r.height / 2)) / r.height;
    gsap.to(el, { x: nx * 10, y: ny * 10, duration: 0.5, ease: "power3.out" });
  };
  const onClick = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    if ((e.nativeEvent as PointerEvent).pointerType !== "touch") return;
    el.dataset.open = el.dataset.open === "true" ? "false" : "true";
  };

  return (
    <ol ref={list} className={styles.grid} aria-label={label}>
      {offers.map((o, i) => (
        <li key={o.t}>
          <article
            className={styles.tile}
            data-open="false"
            data-magnetic-tile
            onPointerEnter={onEnter}
            onPointerLeave={onLeave}
            onPointerMove={onMove}
            onClick={onClick}
          >
            <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
            <h3 className={styles.title}>{o.t}</h3>
            <p className={styles.text}>{o.d}</p>
            <p className={styles.price}>{o.p}</p>
            <div className={styles.layer} aria-hidden="true">
              <Art i={i} />
              <span className={styles.layerPrice}>{o.p}</span>
            </div>
          </article>
        </li>
      ))}
      {extra ? (
        <li className={styles.extraItem}>
          <div className={styles.extra}>
            <span className={styles.plus} aria-hidden="true">+</span>
            <h3 className={styles.title}>{extra.title}</h3>
            <p className={styles.text}>{extra.text}</p>
            <a href={extra.href} className={styles.extraCta} data-scramble>
              {extra.cta}
            </a>
          </div>
        </li>
      ) : null}
    </ol>
  );
}
