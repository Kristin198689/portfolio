"use client";

import { useEffect } from "react";

// Wires every [data-print] button on the page to window.print()
export function PrintButtons() {
  useEffect(() => {
    const on = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest("[data-print]")) window.print();
    };
    document.addEventListener("click", on);
    return () => document.removeEventListener("click", on);
  }, []);
  return null;
}
