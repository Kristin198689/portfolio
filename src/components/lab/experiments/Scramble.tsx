"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { createLoop } from "../kit";
import { num, str, type ExperimentProps } from "../types";
import styles from "./exp.module.css";

const SETS: Record<string, string> = {
  letters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  binary: "01",
  symbols: "#%&@$*+=<>/\\|{}[]",
};

// Text scramble: characters shuffle through a chosen alphabet and settle one by one, then the next word
// scrambles in. Click or tap to jump to the next word.
export default function Scramble({ paramsRef, reduced }: ExperimentProps) {
  const t = useTranslations("lab");
  const box = useRef<HTMLParagraphElement>(null);
  const words = t.raw("exp.scramble.words") as string[];

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let idx = 0;
    let from = "";
    let to = words[0];
    let start = 0;
    let hold = 0;
    let skip = false;
    const setWord = (i: number, now: number) => {
      from = el.textContent ?? "";
      idx = i % words.length;
      to = words[idx];
      start = now;
      hold = 0;
    };
    if (reduced) {
      el.textContent = words[0];
      const click = () => {
        idx = (idx + 1) % words.length;
        el.textContent = words[idx];
      };
      el.parentElement?.addEventListener("click", click);
      return () => el.parentElement?.removeEventListener("click", click);
    }
    const loop = createLoop(
      el,
      (time) => {
        const speed = num(paramsRef.current, "speed", 1);
        const pool = SETS[str(paramsRef.current, "charset", "letters")] ?? SETS.letters;
        if (skip) {
          skip = false;
          setWord(idx + 1, time);
        }
        const dur = 1.3 / speed;
        const p = Math.min(1, (time - start) / dur);
        if (p >= 1) {
          if (el.textContent !== to) el.textContent = to;
          hold += 1;
          if (hold > 70) setWord(idx + 1, time);
          return;
        }
        const settled = Math.floor(p * to.length);
        const arabic = /[؀-ۿ]/.test(to);
        let out = "";
        const n = Math.max(from.length, to.length);
        for (let i = 0; i < n; i++) {
          const ch = to[i] ?? "";
          if (i < settled || ch === " " || arabic) out += i < settled || arabic ? ch : " ";
          else out += pool[Math.floor(Math.random() * pool.length)];
        }
        el.textContent = out.trimEnd();
      },
      false,
    );
    const click = () => {
      skip = true;
    };
    const host = el.parentElement;
    host?.addEventListener("click", click);
    return () => {
      loop.stop();
      host?.removeEventListener("click", click);
    };
  }, [words, reduced, paramsRef]);

  return (
    <div className={`${styles.fill} ${styles.center}`} style={{ cursor: "pointer" }}>
      <p ref={box} className={`${styles.big} ${styles.mono}`} aria-live="off">
        {words[0]}
      </p>
    </div>
  );
}
