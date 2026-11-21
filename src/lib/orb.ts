// Which companion look is active: 0 is the classic mesh, 1 is the liquid drop (the default).
// Stored in localStorage, overridable with ?orb=N, and announced to the companion through an event.
export const ORB_COUNT = 2;
const KEY = "companion-orb";
const EVENT = "orbchange";

export function readOrb(): number {
  try {
    const q = Number(new URLSearchParams(window.location.search).get("orb"));
    if (Number.isInteger(q) && q >= 0 && q < ORB_COUNT && new URLSearchParams(window.location.search).has("orb")) return q;
    const raw = localStorage.getItem(KEY);
    const s = Number(raw);
    // (an empty storage must not count as "0": nothing chosen means the default)
    if (raw !== null && Number.isInteger(s) && s >= 0 && s < ORB_COUNT) return s;
  } catch {
    /* storage can be blocked */
  }
  return 1; // nothing chosen yet: the drop
}

export function setOrb(n: number) {
  try {
    localStorage.setItem(KEY, String(n));
  } catch {
    /* storage can be blocked */
  }
  window.dispatchEvent(new CustomEvent<number>(EVENT, { detail: n }));
}

export function onOrb(cb: (n: number) => void): () => void {
  const h = (e: Event) => cb((e as CustomEvent<number>).detail);
  window.addEventListener(EVENT, h);
  return () => window.removeEventListener(EVENT, h);
}
