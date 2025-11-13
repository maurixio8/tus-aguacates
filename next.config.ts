import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export', // Incompatible con API routes dinámicas
  images: {
    unoptimized: true,
  },
  trailingSlash: true, // Mejora el routing en deployment estático
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
