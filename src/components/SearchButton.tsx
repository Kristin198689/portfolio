"use client";

// Opens the command palette from anywhere (the palette listens for this event).
export function SearchButton({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event("palette:open"))} data-scramble>
      {children}
    </button>
  );
}
