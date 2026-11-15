import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.BOMBEROS_VERIFY_BUILD === "1" ? { distDir: ".next-modernization-verification" } : {}),
  async headers() {
    return [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-store" }, { key: "Service-Worker-Allowed", value: "/" }] }, { source: "/release.json", headers: [{ key: "Cache-Control", value: "no-store" }] }, { source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
      { key: "Permissions-Policy", value: "camera=(self), geolocation=(self), microphone=()" },
    ] }];
  },
};

export default nextConfig;
