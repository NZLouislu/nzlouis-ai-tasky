import type { NextConfig } from "next";

// Bundle analyzer setup
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === '1',
});

const nextConfig: NextConfig = {
  // Build performance optimizations
  productionBrowserSourceMaps: false,
  
  // Skip lint and type checking during build for speed (run separately)

  typescript: {
    ignoreBuildErrors: true,
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nkpgzczvxuhbqrifjuer.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  
  // SWC compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Experimental features to improve performance
  experimental: {
    optimizePackageImports: [
      'lucide-react', 
      'react-icons', 
      'zustand',
      '@tanstack/react-query'
    ],
  },
  
  // External packages for server components
  serverExternalPackages: [
    'sharp',
    'bcrypt',
    'prisma',
    '@prisma/client',
    'jira-client'
  ],
};

export default withBundleAnalyzer(nextConfig);
