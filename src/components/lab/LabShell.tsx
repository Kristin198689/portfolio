"use client";

import { Component, Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { defaultsOf, experiments, lazyExperiments } from "./registry";
import { ALL_TAGS, type ExperimentEntry, type ParamValues, type Tag } from "./types";
import { jumpTo } from "@/lib/scroll";
import styles from "./lab.module.css";

const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useReduced = () =>
  useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

class Boundary extends Component<{ children: ReactNode; message: string }, { bad: boolean }> {
  state = { bad: false };
  static getDerivedStateFromError() {
    return { bad: true };
  }
  render() {
    return this.state.bad ? <p className={styles.notice}>{this.props.message}</p> : this.props.children;
  }
}

function setQuery(next: Record<string, string | null>) {
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(next)) {
    if (v) url.searchParams.set(k, v);
    else url.searchParams.delete(k);
  }
  window.history.pushState(null, "", url.pathname + url.search);
}

function Stage({ entry, onBack }: { entry: ExperimentEntry; onBack: () => void }) {
  const t = useTranslations("lab");
  const reduced = useReduced();
  const [runKey, setRunKey] = useState(0);
  const [values, setValues] = useState<ParamValues>(() => defaultsOf(entry));
  const paramsRef = useRef<ParamValues>(values);
  const [failed, setFailed] = useState(false);
  const [restarts, setRestarts] = useState(0);
  const fail = useCallback(() => setFailed(true), []);
  const Comp = lazyExperiments[entry.id];
  const section = useRef<HTMLElement>(null);

  // The catalog is taller than the stage, so after swapping them the page can end up at the footer:
  // bring the stage heading to just under the fixed header once the new content is laid out.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const el = section.current;
      if (el) jumpTo(el.getBoundingClientRect().top + window.scrollY - 96);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    paramsRef.current = values;
  }, [values]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onBack();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  const restart = () => {
    setFailed(false);
    setRunKey((k) => k + 1);
    setRestarts((n) => n + 1);
  };

  return (
    <section ref={section} className={styles.stage} aria-labelledby="exp-title">
      <button type="button" className={styles.back} onClick={onBack}>
        ← {t("stage.back")}
      </button>
      <h2 id="exp-title" className={styles.stageTitle}>
        {t(`exp.${entry.id}.name`)}
      </h2>
      <p className={styles.stageDesc}>{t(`exp.${entry.id}.desc`)}</p>

      <div className={styles.grid}>
        <div className={styles.frame} data-tall={entry.tall ? "true" : undefined}>
          {failed ? (
            <p className={styles.notice}>{t("stage.unsupported")}</p>
          ) : (
            <Boundary key={runKey} message={t("stage.error")}>
              <Suspense fallback={<p className={styles.notice}>{t("stage.loading")}</p>}>
                <Comp params={values} paramsRef={paramsRef} reduced={reduced} fail={fail} />
              </Suspense>
            </Boundary>
          )}
          <span className={styles.hint}>{t(`hints.${entry.hint}`)}</span>
        </div>

        <aside className={styles.panel} aria-label={t("stage.params")}>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={restart}>
              ↻ {t("stage.restart")}
            </button>
            {entry.params.length > 0 ? (
              <button type="button" className={styles.ghost} onClick={() => setValues(defaultsOf(entry))}>
                {t("stage.resetParams")}
              </button>
            ) : null}
          </div>

          <h3 className={styles.micro}>{t("stage.params")}</h3>
          {entry.params.length === 0 ? (
            <p className={styles.muted}>{t("stage.noParams")}</p>
          ) : (
            <div className={styles.params}>
              {entry.params.map((p) =>
                p.kind === "range" ? (
                  <label key={p.id} className={styles.param}>
                    <span>
                      {t(`params.${p.id}`)}
                      <output>{Number(values[p.id] ?? p.value)}</output>
                    </span>
                    <input
                      type="range"
                      min={p.min}
                      max={p.max}
                      step={p.step}
                      value={Number(values[p.id] ?? p.value)}
                      onChange={(e) => setValues((v) => ({ ...v, [p.id]: Number(e.target.value) }))}
                    />
                  </label>
                ) : (
                  <label key={p.id} className={styles.param}>
                    <span>{t(`params.${p.id}`)}</span>
                    <select
                      value={String(values[p.id] ?? p.value)}
                      onChange={(e) => setValues((v) => ({ ...v, [p.id]: e.target.value }))}
                    >
                      {p.options.map((o) => (
                        <option key={o} value={o}>
                          {p.id === "image" ? o : t(`options.${p.id}.${o}`)}
                        </option>
                      ))}
                    </select>
                  </label>
                ),
              )}
            </div>
          )}

          <h3 className={styles.micro}>{t("stage.tech")}</h3>
          <ul className={styles.tech}>
            {entry.tech.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          {reduced ? <p className={styles.muted}>{t("stage.reducedNote")}</p> : null}
          <p className={styles.sr} role="status">
            {restarts > 0 ? t("stage.restarted") : t("stage.running")}
          </p>
        </aside>
      </div>
    </section>
  );
}

export function LabShell() {
  const t = useTranslations("lab");
  const sp = useSearchParams();
  const rawTag = sp.get("tag");
  const tag = (ALL_TAGS as readonly string[]).includes(rawTag ?? "") ? (rawTag as Tag) : null;
  const open = experiments.find((e) => e.id === sp.get("exp")) ?? null;
  const list = tag ? experiments.filter((e) => e.tags.includes(tag)) : experiments;
  const heading = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  const back = useCallback(() => setQuery({ exp: null }), []);

  // Returning to the catalog: scroll to the top of the index, not wherever the stage left the page.
  useEffect(() => {
    if (wasOpen.current && !open) {
      const id = requestAnimationFrame(() => {
        const el = heading.current;
        if (el) jumpTo(el.getBoundingClientRect().top + window.scrollY - 96);
      });
      wasOpen.current = false;
      return () => cancelAnimationFrame(id);
    }
    wasOpen.current = !!open;
  }, [open]);

  if (open) return <Stage key={open.id} entry={open} onBack={back} />;

  return (
    <div ref={heading}>
      <div className={styles.filters} role="group" aria-label={t("catalog.filter")}>
        <button type="button" aria-pressed={!tag} onClick={() => setQuery({ tag: null })}>
          {t("catalog.all")}
        </button>
        {ALL_TAGS.map((x) => (
          <button key={x} type="button" aria-pressed={tag === x} onClick={() => setQuery({ tag: x })}>
            {t(`tags.${x}`)}
          </button>
        ))}
      </div>
      <p className={styles.count} role="status">
        {t("catalog.count", { n: list.length })}
      </p>

      <ol className={styles.index}>
        {list.map((e, i) => (
          <li key={e.id}>
            <button type="button" className={styles.row} onClick={() => setQuery({ exp: e.id })}>
              <span className={styles.num}>{String(experiments.indexOf(e) + 1).padStart(2, "0")}</span>
              <span className={styles.rowMain}>
                <strong>{t(`exp.${e.id}.name`)}</strong>
                <span>{t(`exp.${e.id}.desc`)}</span>
              </span>
              <span className={styles.rowTags}>
                {e.tags.map((x) => (
                  <i key={x}>{t(`tags.${x}`)}</i>
                ))}
              </span>
              <span className={styles.open} aria-hidden="true">
                {i >= 0 ? "→" : ""}
              </span>
              <span className={styles.sr}>{t("catalog.open")}</span>
            </button>
          </li>
        ))}
      </ol>
      {list.length === 0 ? <p className={styles.muted}>{t("catalog.empty")}</p> : null}
    </div>
  );
}
