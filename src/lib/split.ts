// Splits text into words (masks) and characters. Keeps a visually hidden copy for screen readers.
export function splitChars(el: HTMLElement): HTMLElement[] {
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
        for (const ch of Array.from(part)) {
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
