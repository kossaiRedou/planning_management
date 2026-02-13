/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize production builds
  reactStrictMode: true,
  
  // Performance optimizations
  swcMinify: true,
  
  // Optimize images
  images: {
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Optimize bundle
    config.optimization = {
      ...config.optimization,
      usedExports: true,
    }
    
    return config
  },
  
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@supabase/supabase-js', 'lucide-react'],
  },
}

module.exports = nextConfig
