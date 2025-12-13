import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix workspace root issue
  outputFileTracingRoot: __dirname,

  images: {
    domains: [
      'qxoqgpdqgroyxkwsjtii.supabase.co', // Supabase storage
      'localhost', // Development
      'res.cloudinary.com', // Cloudinary si se usa
    ],
    formats: ['image/webp', 'image/avif'], // Formatos modernos
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 días de caché
    dangerouslyAllowSVG: false, // Seguridad
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false, // Habilitar optimización
  },
  trailingSlash: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    optimizeCss: true,
    scrollRestoration: true,
    webVitalsAttribution: ['CLS', 'LCP'],
  },
  // Compresión para producción
  compress: true,
  // Configuración de headers para caché
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // Optimización del bundle
  webpack: (config, { isServer, dev }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          large: {
            test: /[\\/]node_modules[\\/](puppeteer|@react-google-maps)[\\/]/,
            name: 'large-vendors',
            chunks: 'async',
            priority: 20,
            enforce: true,
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
