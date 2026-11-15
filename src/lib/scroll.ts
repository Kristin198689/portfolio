import type Lenis from "lenis";

declare global {
  interface Window {
    __lenis?: Lenis | null;
  }
}

/** Jump to a vertical position. Goes through Lenis when it is running, otherwise Lenis would pull the page back to its own target. */
export function jumpTo(y: number) {
  const lenis = window.__lenis;
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
  else window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
}
