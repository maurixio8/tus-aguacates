import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix workspace root issue
  outputFileTracingRoot: __dirname,

  images: {
    unoptimized: true,
  },
  trailingSlash: false, // Desactivado para evitar problemas con CORS en APIs
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
};

export default nextConfig;
