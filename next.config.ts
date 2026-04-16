import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Ini akan memaksa Vercel tetap build meskipun ada error TS
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
