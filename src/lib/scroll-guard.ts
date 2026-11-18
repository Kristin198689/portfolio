// While the page scrolls, tiles under a motionless pointer must not react: otherwise a wheel
// scroll makes layers flash open one after another. `watchScroll` reports whether a scroll is
// in progress and calls `onStart` when one begins.
export function watchScroll(onStart: () => void) {
  let scrolling = false;
  let timer = 0;
  const onScroll = () => {
    if (!scrolling) {
      scrolling = true;
      onStart();
    }
    window.clearTimeout(timer);
    timer = window.setTimeout(() => (scrolling = false), 180);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  return {
    isScrolling: () => scrolling,
    stop: () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
    },
  };
}
