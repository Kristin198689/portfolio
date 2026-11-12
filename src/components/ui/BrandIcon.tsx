import { icons, type IconKey } from "@/config/icons";

// Official brand mark (simple-icons path), drawn in the surrounding text colour.
export function BrandIcon({ name, size = 18 }: { name: IconKey; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
    >
      <path d={icons[name].path} />
    </svg>
  );
}
