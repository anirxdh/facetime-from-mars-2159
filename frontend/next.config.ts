import type { NextConfig } from "next";

// On Netlify, /api/* is served by Netlify Functions (frontend/netlify/functions,
// routed by netlify.toml), so the local FastAPI proxy below is not used there.
// NETLIFY is set in Netlify CI builds, NETLIFY_LOCAL in Netlify CLI builds.
const onNetlify = process.env.NETLIFY === "true" || process.env.NETLIFY_LOCAL === "true";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.replit.dev", "*.repl.co", "*.riker.replit.dev"],
  async rewrites() {
    if (onNetlify) return [];
    return [
      {
        // Local development: proxy to the FastAPI backend (backend/main.py).
        source: "/api/:path*",
        destination: `${process.env.BACKEND_URL || "http://localhost:8000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
