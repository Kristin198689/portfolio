import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isProd = process.env.NODE_ENV === "production";

// CSP is production only: the dev server needs eval and websockets.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self'",
  "font-src 'self'",
  "connect-src 'self' https://api.github.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        { key: "Content-Security-Policy", value: csp },
      ]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // the dev server also answers on 127.0.0.1 (without this Next blocks it and the motion layer never starts)
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Every copy of the site on a *.vercel.app address (production and previews) is kept out of search
      // results: only volodina.de is meant to be indexed. The pages stay reachable, and "noindex" is
      // read from the header, so this does not touch the main domain at all.
      {
        source: "/:path*",
        has: [{ type: "host", value: "(.*)\\.vercel\\.app" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  async redirects() {
    // www is only a door: it sends everyone (and search engines, permanently) to the bare domain.
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.volodina.de" }],
        destination: "https://volodina.de/:path*",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
