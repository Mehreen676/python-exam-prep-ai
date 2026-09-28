import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: do NOT set `output: "standalone"` here — Vercel handles Next.js
  // deployment automatically. The "standalone" output is only needed for
  // Docker / self-hosted deployments.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
