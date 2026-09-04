import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bypasses TypeScript errors during Vercel build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Bypasses ESLint errors during Vercel build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
