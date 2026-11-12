// Splits text into words (masks) and characters. Keeps a visually hidden copy for screen readers.
// Arabic letters join into words, so for Arabic text each word is one unit instead of one letter.
const ARABIC = /[؀-ۿ]/;

export function splitChars(el: HTMLElement): HTMLElement[] {
  // Idempotent: React Strict Mode runs effects twice in development
  if (el.dataset.splitDone === "1") return Array.from(el.querySelectorAll<HTMLElement>(".c"));
  el.dataset.splitDone = "1";
  const original = el.textContent ?? "";

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      const frag = document.createDocumentFragment();
      text.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(" "));
          return;
        }
        const word = document.createElement("span");
        word.className = "w";
        word.setAttribute("aria-hidden", "true");
        const pieces = ARABIC.test(part) ? [part] : Array.from(part);
        for (const ch of pieces) {
          const c = document.createElement("span");
          c.className = "c";
          c.textContent = ch;
          word.appendChild(c);
        }
        frag.appendChild(word);
      });
      node.parentNode?.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach(walk);
    }
  };

  Array.from(el.childNodes).forEach(walk);

  const sr = document.createElement("span");
  sr.className = "srOnly";
  sr.textContent = original;
  el.prepend(sr);

  return Array.from(el.querySelectorAll<HTMLElement>(".c"));
}
