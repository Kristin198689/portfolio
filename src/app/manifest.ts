import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Christina Volodina, web developer",
    short_name: "C. Volodina",
    description: "Portfolio of Christina Volodina: Next.js, SEO, accessibility and motion.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#1f1a4a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
