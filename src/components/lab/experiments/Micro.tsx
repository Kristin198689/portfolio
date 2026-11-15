"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { num, type ExperimentProps } from "../types";
import styles from "./micro.module.css";

// Four microinteractions in one board: a spring toggle (GSAP squash and stretch), a button that goes from
// idle to loading to done, form feedback (shake on error, check on success) and three CSS loaders.
export default function Micro({ params, reduced }: ExperimentProps) {
  const t = useTranslations("lab");
  const speed = num(params, "speed", 1);
  const [on, setOn] = useState(false);
  const knob = useRef<HTMLSpanElement>(null);
  const [btn, setBtn] = useState<"idle" | "load" | "done">("idle");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "bad" | "ok">("idle");
  const field = useRef<HTMLInputElement>(null);

  const flip = () => {
    const next = !on;
    setOn(next);
    const k = knob.current;
    if (!k || reduced) return;
    gsap.fromTo(k, { scaleX: 1.6 }, { scaleX: 1, duration: 0.5 / speed, ease: "elastic.out(1,0.4)" });
  };
  const press = () => {
    if (btn !== "idle") return;
    setBtn("load");
    window.setTimeout(() => setBtn("done"), 1100 / speed);
    window.setTimeout(() => setBtn("idle"), 2600 / speed);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    setState(valid ? "ok" : "bad");
    if (!valid && field.current && !reduced)
      gsap.fromTo(field.current, { x: -8 }, { x: 0, duration: 0.6 / speed, ease: "elastic.out(1.2,0.25)" });
  };

  return (
    <div className={styles.board} style={{ ["--spd" as string]: `${1 / speed}s` }}>
      <section className={styles.cell}>
        <h4>{t("exp.micro.toggle")}</h4>
        <button type="button" role="switch" aria-checked={on} className={styles.toggle} onClick={flip}>
          <span ref={knob} className={styles.knob} data-on={on} />
          <span className={styles.toggleText}>{on ? t("exp.micro.on") : t("exp.micro.off")}</span>
        </button>
      </section>

      <section className={styles.cell}>
        <h4>{t("exp.micro.button")}</h4>
        <button type="button" className={styles.action} data-state={btn} onClick={press}>
          <span className={styles.actionLabel}>
            {btn === "idle" ? t("exp.micro.send") : btn === "load" ? t("exp.micro.sending") : t("exp.micro.sent")}
          </span>
          <svg viewBox="0 0 24 24" className={styles.check} aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </button>
        <p className={styles.sr} aria-live="polite">
          {btn === "done" ? t("exp.micro.sent") : ""}
        </p>
      </section>

      <section className={styles.cell}>
        <h4>{t("exp.micro.form")}</h4>
        <form onSubmit={submit} noValidate className={styles.form}>
          <label>
            <span>{t("exp.micro.email")}</span>
            <input
              ref={field}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setState("idle");
              }}
              data-state={state}
              aria-invalid={state === "bad"}
              autoComplete="off"
            />
          </label>
          <button type="submit">{t("exp.micro.check")}</button>
          <p aria-live="polite" data-state={state}>
            {state === "bad" ? t("exp.micro.bad") : state === "ok" ? t("exp.micro.ok") : " "}
          </p>
        </form>
      </section>

      <section className={styles.cell}>
        <h4>{t("exp.micro.loaders")}</h4>
        <div className={styles.loaders} aria-hidden="true">
          <span className={styles.dots}>
            <i />
            <i />
            <i />
          </span>
          <span className={styles.ring} />
          <span className={styles.bars}>
            <i />
            <i />
            <i />
            <i />
          </span>
        </div>
      </section>
    </div>
  );
}
