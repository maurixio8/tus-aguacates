import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Necesario para deployment estático
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
