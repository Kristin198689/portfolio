import { createGL, type GLCtx } from "./gl";
import { createLoop, observeSize, trackPointer, type Pointer } from "./kit";

export type Size = { w: number; h: number };
export type Render = (t: number, dt: number, size: Size, ptr: Pointer) => void;

// Boilerplate for a WebGL experiment: claims the single context, tracks size and pointer, runs the
// off-screen-aware loop and tears everything down. `setup` builds the programs and returns the frame function.
export function mountGL(
  placeholder: HTMLCanvasElement,
  reduced: boolean,
  setup: (g: GLCtx, ptr: Pointer, redraw: () => void) => Render | null,
  fail: () => void,
): () => void {
  // A lost WebGL context cannot be revived on the same element (React Strict Mode mounts twice in
  // development), so every mount draws into a fresh canvas that replaces the React-owned placeholder.
  const canvas = document.createElement("canvas");
  canvas.className = placeholder.className;
  canvas.setAttribute("aria-hidden", "true");
  placeholder.style.display = "none";
  placeholder.after(canvas);
  const removeCanvas = () => canvas.remove();
  const g = createGL(canvas);
  if (!g) {
    removeCanvas();
    fail();
    return () => {};
  }
  const size: Size = { w: 1, h: 1 };
  let loop: ReturnType<typeof createLoop> | null = null;
  const redraw = () => loop?.invalidate();
  const { p, dispose } = trackPointer(canvas, reduced ? redraw : undefined);
  const render = setup(g, p, redraw);
  if (!render) {
    dispose();
    g.destroy();
    removeCanvas();
    fail();
    return () => {};
  }
  const stopSize = observeSize(canvas, (w, h) => {
    size.w = w;
    size.h = h;
    g.resize(w, h);
    redraw();
  });
  loop = createLoop(canvas, (t, dt) => render(t, dt, size, p), reduced);
  return () => {
    loop?.stop();
    stopSize();
    dispose();
    g.destroy();
    removeCanvas();
  };
}
