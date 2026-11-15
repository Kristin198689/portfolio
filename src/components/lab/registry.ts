import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { ExperimentEntry, ExperimentProps } from "./types";

// To add an experiment: create experiments/<Name>.tsx (default export, takes ExperimentProps), add ONE entry
// here and the strings under `exp.<id>` in messages/*.json (lab namespace). It is loaded only when opened.
export const experiments: readonly ExperimentEntry[] = [
  {
    id: "kinetic",
    tags: ["gsap", "typography"],
    tech: ["GSAP", "Timeline", "Stagger"],
    hint: "interact",
    params: [
      { id: "speed", kind: "range", min: 0.3, max: 3, step: 0.1, value: 1 },
      { id: "intensity", kind: "range", min: 10, max: 100, step: 1, value: 45 },
      { id: "easing", kind: "select", options: ["sine", "power", "elastic", "expo", "back"], value: "sine" },
    ],
    load: () => import("./experiments/Kinetic"),
  },
  {
    id: "magnetic",
    tags: ["gsap", "typography", "cursor"],
    tech: ["GSAP quickTo", "Pointer Events"],
    hint: "move",
    params: [
      { id: "strength", kind: "range", min: 10, max: 100, step: 1, value: 55 },
      { id: "radius", kind: "range", min: 60, max: 320, step: 10, value: 170 },
    ],
    load: () => import("./experiments/Magnetic"),
  },
  {
    id: "scramble",
    tags: ["typography", "typescript"],
    tech: ["requestAnimationFrame", "TypeScript"],
    hint: "interact",
    params: [
      { id: "speed", kind: "range", min: 0.3, max: 3, step: 0.1, value: 1 },
      { id: "charset", kind: "select", options: ["letters", "binary", "symbols"], value: "letters" },
    ],
    load: () => import("./experiments/Scramble"),
  },
  {
    id: "liquid",
    tags: ["typography", "css"],
    tech: ["SVG feTurbulence", "feDisplacementMap", "CSS filter"],
    hint: "move",
    params: [
      { id: "intensity", kind: "range", min: 0, max: 120, step: 1, value: 40 },
      { id: "speed", kind: "range", min: 0, max: 3, step: 0.1, value: 1 },
      { id: "density", kind: "range", min: 2, max: 30, step: 1, value: 12 },
    ],
    load: () => import("./experiments/LiquidType"),
  },
  {
    id: "trail",
    tags: ["cursor", "physics"],
    tech: ["Canvas 2D", "Pointer Events"],
    hint: "move",
    params: [
      { id: "length", kind: "range", min: 10, max: 90, step: 1, value: 45 },
      { id: "width", kind: "range", min: 4, max: 40, step: 1, value: 18 },
    ],
    load: () => import("./experiments/Trail"),
  },
  {
    id: "elastic",
    tags: ["cursor", "physics", "typescript"],
    tech: ["Canvas 2D", "Spring integration"],
    hint: "move",
    params: [
      { id: "strength", kind: "range", min: 10, max: 100, step: 1, value: 55 },
      { id: "count", kind: "range", min: 4, max: 24, step: 1, value: 12 },
    ],
    load: () => import("./experiments/Elastic"),
  },
  {
    id: "liquidimage",
    tags: ["webgl", "image"],
    tech: ["WebGL", "GLSL fragment shader", "Texture"],
    gl: true,
    hint: "move",
    params: [
      { id: "distortion", kind: "range", min: 0, max: 3, step: 0.05, value: 1 },
      { id: "speed", kind: "range", min: 0, max: 3, step: 0.1, value: 1 },
      { id: "image", kind: "select", options: ["noform", "beauty", "pizza", "detailing"], value: "noform" },
    ],
    load: () => import("./experiments/LiquidImage"),
  },
  {
    id: "sphere",
    tags: ["webgl"],
    tech: ["WebGL", "GL points", "Vertex shader noise"],
    gl: true,
    hint: "drag",
    params: [
      { id: "count", kind: "range", min: 2000, max: 40000, step: 1000, value: 12000 },
      { id: "intensity", kind: "range", min: 0, max: 1.2, step: 0.05, value: 0.6 },
      { id: "rotation", kind: "range", min: 0, max: 3, step: 0.1, value: 1 },
    ],
    load: () => import("./experiments/Sphere"),
  },
  {
    id: "mesh",
    tags: ["webgl"],
    tech: ["WebGL", "Indexed lines", "Value noise"],
    gl: true,
    hint: "move",
    params: [
      { id: "density", kind: "range", min: 16, max: 120, step: 2, value: 56 },
      { id: "intensity", kind: "range", min: 0, max: 2, step: 0.05, value: 0.9 },
      { id: "speed", kind: "range", min: 0, max: 3, step: 0.1, value: 1 },
    ],
    load: () => import("./experiments/Mesh"),
  },
  {
    id: "gradient",
    tags: ["webgl", "css"],
    tech: ["WebGL", "fbm domain warping", "GLSL"],
    gl: true,
    hint: "move",
    params: [
      { id: "distortion", kind: "range", min: 0, max: 2, step: 0.05, value: 0.8 },
      { id: "scale", kind: "range", min: 0.8, max: 5, step: 0.1, value: 2.2 },
      { id: "speed", kind: "range", min: 0, max: 3, step: 0.1, value: 1 },
    ],
    load: () => import("./experiments/Gradient"),
  },
  {
    id: "repulse",
    tags: ["physics", "cursor", "typography"],
    tech: ["Canvas 2D", "Pixel sampling", "Springs"],
    hint: "move",
    params: [
      { id: "density", kind: "range", min: 1, max: 16, step: 1, value: 10 },
      { id: "strength", kind: "range", min: 10, max: 100, step: 1, value: 60 },
    ],
    load: () => import("./experiments/Repulse"),
  },
  {
    id: "gravity",
    tags: ["physics", "typescript"],
    tech: ["Canvas 2D", "Impulse collisions", "Pointer drag"],
    hint: "drag",
    params: [
      { id: "gravity", kind: "range", min: 5, max: 120, step: 1, value: 60 },
      { id: "bounce", kind: "range", min: 10, max: 95, step: 1, value: 70 },
      { id: "count", kind: "range", min: 3, max: 40, step: 1, value: 14 },
    ],
    load: () => import("./experiments/Gravity"),
  },
  {
    id: "scroll",
    tags: ["scroll", "gsap", "image"],
    tech: ["clip-path", "Scroll velocity", "Parallax"],
    hint: "scroll",
    params: [
      { id: "intensity", kind: "range", min: 0, max: 100, step: 1, value: 50 },
      { id: "parallax", kind: "range", min: 0, max: 100, step: 1, value: 50 },
    ],
    load: () => import("./experiments/ScrollReveal"),
  },
  {
    id: "compare",
    tags: ["image", "css", "react"],
    tech: ["CSS clip-path", "CSS filter", "React state"],
    hint: "drag",
    params: [
      { id: "mode", kind: "select", options: ["grayscale", "sepia", "blur", "invert"], value: "grayscale" },
      { id: "intensity", kind: "range", min: 10, max: 100, step: 1, value: 100 },
    ],
    load: () => import("./experiments/BeforeAfter"),
  },
  {
    id: "micro",
    tags: ["micro", "css", "react", "typescript", "gsap"],
    tech: ["React", "TypeScript", "CSS keyframes", "GSAP elastic"],
    hint: "interact",
    tall: true,
    params: [{ id: "speed", kind: "range", min: 0.5, max: 3, step: 0.1, value: 1 }],
    load: () => import("./experiments/Micro"),
  },
  {
    id: "playground",
    tags: ["css", "react", "typescript"],
    tech: ["Shadow DOM", "Container queries", "React"],
    hint: "interact",
    tall: true,
    params: [],
    load: () => import("./experiments/Playground"),
  },
];

export const lazyExperiments: Record<string, LazyExoticComponent<ComponentType<ExperimentProps>>> =
  Object.fromEntries(experiments.map((e) => [e.id, lazy(e.load)]));

export const defaultsOf = (e: ExperimentEntry) => Object.fromEntries(e.params.map((p) => [p.id, p.value]));
