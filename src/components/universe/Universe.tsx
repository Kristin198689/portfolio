"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "@/i18n/navigation";
import { projects } from "@/config/projects";
import { bridges, clusters, links, skillById, type PageKey, type SkillDef } from "@/config/universe";
import type { FrameInfo, UniverseScene } from "./scene";
import styles from "./Universe.module.css";

gsap.registerPlugin(ScrollTrigger);

const PAGE_HREF: Record<PageKey, string> = {
  notesSeo: "/notes/seo",
  notesAi: "/notes/ai",
  notesLh: "/notes/lh",
  design: "/design",
  accessibility: "/accessibility",
  decisions: "/decisions",
  teamflow: "/#skills",
  backend: "/#skills",
  responsive: "/#skills",
};

type Sel = { cluster: number; skill: string | null };

// The Skills Universe: a WebGL map of my skills. The canvas is decorative and aria-hidden; the
// legend, the panel and the skill buttons are real HTML, so keyboard and screen-reader users get
// the same content through a plain list.
export function Universe() {
  const t = useTranslations("universe");
  const pj = useTranslations("projects.items");
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<UniverseScene | null>(null);
  const clusterEls = useRef<Array<HTMLSpanElement | null>>([]);
  const nodeEls = useRef<Record<string, HTMLButtonElement | null>>({});
  const coreEl = useRef<HTMLDivElement>(null);
  const bridgeEls = useRef<Record<string, HTMLSpanElement | null>>({});
  const [sel, setSel] = useState<Sel>({ cluster: -1, skill: null });
  const [hover, setHover] = useState(-1);
  const [gl, setGl] = useState(true);
  const selRef = useRef(sel);

  const choose = useCallback((cluster: number, skill: string | null) => {
    const next = { cluster, skill };
    selRef.current = next;
    setSel(next);
    scene.current?.select(cluster, skill);
  }, []);

  useEffect(() => {
    const cv = canvas.current;
    const root = section.current;
    if (!cv || !root) return;
    let destroyed = false;
    let tween: gsap.core.Tween | null = null;
    let trigger: ScrollTrigger | null = null;
    let io: IntersectionObserver | null = null;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 56rem)").matches || navigator.maxTouchPoints > 0;

    // The engine is a separate chunk: it loads only when the section is near the viewport.
    const boot = async () => {
      const { createScene } = await import("./scene");
      if (destroyed) return;
      const s = createScene(cv, {
        reduced,
        mobile,
        onHover: (c) => setHover(c),
        onPick: (c, sk) => {
          choose(c, sk);
        },
        onFrame: (f: FrameInfo) => {
          const open = selRef.current.cluster >= 0;
          f.clusters.forEach((c, i) => {
            const el = clusterEls.current[i];
            if (!el) return;
            el.style.transform = `translate(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px) translate(-50%, -50%)`;
            el.style.opacity = open ? "0" : String(c.v);
          });
          for (const [id, n] of Object.entries(f.nodes)) {
            const el = nodeEls.current[id];
            if (!el) continue;
            el.style.transform = `translate(${n.x.toFixed(1)}px, ${n.y.toFixed(1)}px) translate(-50%, -50%)`;
            el.style.opacity = String(n.v);
            el.style.pointerEvents = n.v > 0.6 ? "auto" : "none";
          }
          f.bridges.forEach((br) => {
            const el = bridgeEls.current[br.key];
            if (!el) return;
            el.style.transform = `translate(${br.x.toFixed(1)}px, ${br.y.toFixed(1)}px) translate(-50%, -50%)`;
            el.style.opacity = String(br.v);
          });
          if (coreEl.current) coreEl.current.style.opacity = open ? "0" : String(Math.max(0, Math.min(1, (f.clusters[0].v))));
        },
      });
      if (!s) {
        setGl(false);
        return;
      }
      scene.current = s;
      s.select(selRef.current.cluster, selRef.current.skill);
      // assembling is time based, so a fast swipe cannot skip it
      if (reduced) s.setAssemble(1);
      else {
        const state = { v: 0 };
        s.setAssemble(0);
        trigger = ScrollTrigger.create({
          trigger: root,
          start: "top 70%",
          once: true,
          onEnter: () => {
            tween = gsap.to(state, { v: 1, duration: 2.6, ease: "power2.inOut", onUpdate: () => s.setAssemble(state.v) });
          },
        });
      }
      io = new IntersectionObserver(([e]) => s.setActive(e.isIntersecting), { threshold: 0.02 });
      io.observe(root);
    };

    const near = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          near.disconnect();
          void boot();
        }
      },
      { rootMargin: "500px 0px" },
    );
    near.observe(root);

    return () => {
      destroyed = true;
      near.disconnect();
      io?.disconnect();
      tween?.kill();
      trigger?.kill();
      scene.current?.destroy();
      scene.current = null;
    };
  }, [choose]);

  // Esc goes back one step
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || selRef.current.cluster < 0) return;
      if (selRef.current.skill) choose(selRef.current.cluster, null);
      else choose(-1, null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choose]);

  const skillName = useCallback((s: SkillDef) => s.name ?? t(`skills.${s.id}`), [t]);
  const cluster = sel.cluster >= 0 ? clusters[sel.cluster] : null;
  const skill = sel.skill ? skillById.get(sel.skill)?.skill ?? null : null;
  const connected = useMemo(() => {
    if (!skill) return [];
    const ids = new Set<string>();
    links.forEach(([a, b]) => {
      if (a === skill.id) ids.add(b);
      if (b === skill.id) ids.add(a);
    });
    return [...ids].map((id) => skillById.get(id)).filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, [skill]);

  const projectLink = (key: string) => {
    const p = projects.find((x) => x.key === key);
    if (!p) return null;
    return p.case ? (
      <Link href={`/projects/${key}`} data-scramble>
        {pj(`${key}.title`)} · {t("case")}
      </Link>
    ) : p.href ? (
      <a href={p.href} target="_blank" rel="noopener noreferrer" data-scramble>
        {pj(`${key}.title`)} ↗
      </a>
    ) : null;
  };

  const hovered = hover >= 0 ? clusters[hover] : null;

  return (
    <section id="universe" ref={section} className={styles.section} data-chapter="night" aria-labelledby="universe-title">
      <div className={styles.head}>
        <p className={styles.kicker}>{t("kicker")}</p>
        <h2 id="universe-title" className={styles.title} data-split>
          {t("title")}
        </h2>
        <p className={styles.intro}>{t("intro")}</p>
      </div>

      <div className={styles.stage} data-gl={gl ? "on" : "off"}>
        <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
        <div className={styles.overlay} aria-hidden="true">
          <div ref={coreEl} className={styles.core} data-uni="core">
            <span className={styles.coreName}>{t("core.name")}</span>
            <span className={styles.coreRole}>{t("core.role")}</span>
          </div>
          {clusters.map((c, i) => (
            <span
              key={c.id}
              ref={(el) => {
                clusterEls.current[i] = el;
              }}
              className={styles.cl}
              data-uni="cluster"
              data-hover={hover === i}
            >
              <b>{String(i + 1).padStart(2, "0")}</b>
              {t(`clusters.${c.id}.name`)}
            </span>
          ))}
          {bridges.map((br) => (
            <span
              key={br.key}
              ref={(el) => {
                bridgeEls.current[br.key] = el;
              }}
              className={styles.bridge}
            >
              {t(`bridges.${br.key}`)}
            </span>
          ))}
          {cluster?.skills.map((s) => (
            <button
              key={s.id}
              type="button"
              tabIndex={-1}
              ref={(el) => {
                nodeEls.current[s.id] = el;
              }}
              className={styles.node}
              data-uni="node"
              data-on={sel.skill === s.id}
              onClick={() => choose(sel.cluster, s.id)}
            >
              {skillName(s)}
            </button>
          ))}
        </div>

        <p className={styles.hint} aria-hidden="true">
          {cluster ? t("hint.skill") : hovered ? `${t(`clusters.${hovered.id}.name`)} · ${t("hint.select")}` : `${t("hint.drag")} · ${t("hint.select")}`}
        </p>
        {!gl ? <p className={styles.nogl}>{t("noGL")}</p> : null}

        <aside className={styles.panel} data-idle={!cluster} aria-live="polite" aria-label={t("panelLabel")}>
          {!cluster ? (
            <div className={styles.pbody}>
              <p className={styles.plabel}>{t("panelIdle")}</p>
              <p className={styles.pdesc}>{t("panelIdleText")}</p>
            </div>
          ) : (
            <div className={styles.pbody}>
              <button type="button" className={styles.back} onClick={() => (skill ? choose(sel.cluster, null) : choose(-1, null))}>
                ← {skill ? t(`clusters.${cluster.id}.name`) : t("back")}
              </button>
              <p className={styles.plabel}>
                {String(sel.cluster + 1).padStart(2, "0")} / {t(`clusters.${cluster.id}.name`)}
              </p>
              {!skill ? (
                <>
                  <h3 className={styles.ptitle}>{t(`clusters.${cluster.id}.name`)}</h3>
                  <p className={styles.pdesc}>{t(`clusters.${cluster.id}.desc`)}</p>
                  <ul className={styles.chips}>
                    {cluster.skills.map((s) => (
                      <li key={s.id}>
                        <button type="button" onClick={() => choose(sel.cluster, s.id)}>
                          {skillName(s)}
                          {s.ai ? <i title={t("ai")}> ◦</i> : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                  {cluster.id === "creative" ? (
                    <Link href="/lab" className={styles.cta} data-scramble>
                      {t("lab.all")} →
                    </Link>
                  ) : null}
                </>
              ) : (
                <>
                  <h3 className={styles.ptitle}>{skillName(skill)}</h3>
                  {skill.ai ? <p className={styles.ai}>{t("ai")}</p> : null}
                  <h4 className={styles.sub}>{t("projects")}</h4>
                  <ul className={styles.list}>
                    {(skill.projects ?? []).map((k) => {
                      const el = projectLink(k);
                      return el ? <li key={k}>{el}</li> : null;
                    })}
                    {skill.privateProject ? <li className={styles.muted}>{t("private")}</li> : null}
                    {(skill.pages ?? []).map((pg) => (
                      <li key={pg}>
                        <Link href={PAGE_HREF[pg]} data-scramble>
                          {t(`pages.${pg}`)}
                        </Link>
                      </li>
                    ))}
                    {!skill.projects?.length && !skill.privateProject && !skill.pages?.length ? <li className={styles.muted}>{t("noProjects")}</li> : null}
                  </ul>
                  {connected.length ? (
                    <>
                      <h4 className={styles.sub}>{t("worksWith")}</h4>
                      <ul className={styles.chips}>
                        {connected.map(({ skill: s, cluster: cid }) => (
                          <li key={s.id}>
                            <button type="button" onClick={() => choose(clusters.findIndex((c) => c.id === cid), s.id)}>
                              {skillName(s)}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  {skill.lab ? (
                    <Link href={`/lab?tag=${skill.lab}`} className={styles.cta} data-scramble>
                      {t("lab.cta", { tag: t(`tags.${skill.lab}`) })} →
                    </Link>
                  ) : null}
                </>
              )}
            </div>
          )}
        </aside>
      </div>

      <nav className={styles.legend} aria-label={t("legend")}>
        <ul>
          {clusters.map((c, i) => (
            <li key={c.id}>
              <button type="button" data-on={sel.cluster === i} aria-pressed={sel.cluster === i} onClick={() => choose(sel.cluster === i && !sel.skill ? -1 : i, null)}>
                <b>{String(i + 1).padStart(2, "0")}</b> {t(`clusters.${c.id}.name`)}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
