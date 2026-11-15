import type { ComponentType, MutableRefObject } from "react";

export type Tag =
  | "gsap"
  | "webgl"
  | "css"
  | "react"
  | "typescript"
  | "typography"
  | "cursor"
  | "scroll"
  | "physics"
  | "image"
  | "micro";

export const ALL_TAGS: readonly Tag[] = [
  "gsap",
  "webgl",
  "css",
  "react",
  "typescript",
  "typography",
  "cursor",
  "scroll",
  "physics",
  "image",
  "micro",
];

export type RangeParam = { id: string; kind: "range"; min: number; max: number; step: number; value: number };
export type SelectParam = { id: string; kind: "select"; options: readonly string[]; value: string };
export type ParamDef = RangeParam | SelectParam;
export type ParamValues = Record<string, number | string>;

export type Hint = "drag" | "interact" | "move" | "scroll";

// What every experiment component receives. `paramsRef` always holds the latest values, so an
// animation loop can read it without being rebuilt; `params` is for experiments that render from state.
export type ExperimentProps = {
  params: ParamValues;
  paramsRef: MutableRefObject<ParamValues>;
  reduced: boolean;
  fail: () => void;
};

export type ExperimentEntry = {
  id: string;
  tags: readonly Tag[];
  tech: readonly string[];
  params: readonly ParamDef[];
  hint: Hint;
  gl?: boolean;
  tall?: boolean;
  load: () => Promise<{ default: ComponentType<ExperimentProps> }>;
};

export const num = (p: ParamValues, id: string, fallback = 0): number => {
  const v = p[id];
  return typeof v === "number" ? v : fallback;
};
export const str = (p: ParamValues, id: string, fallback = ""): string => {
  const v = p[id];
  return typeof v === "string" ? v : fallback;
};
