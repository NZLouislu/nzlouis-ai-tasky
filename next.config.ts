import type { NextConfig } from "next";

// Bundle analyzer setup
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === '1',
});

const nextConfig: NextConfig = {
  // Build performance optimizations
  productionBrowserSourceMaps: false,
  
  // Skip lint and type checking during build for speed (run separately)
  eslint: {
    ignoreDuringBuilds: true,
  },
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
    ],
    formats: ['image/avif', 'image/webp'],
  },
  
  // SWC compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Module optimizations
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
    'react-icons': {
      transform: 'react-icons/{{member}}',
    },
    'lodash': {
      transform: 'lodash/{{member}}',
    },
    '@supabase/supabase-js': {
      transform: '@supabase/supabase-js/dist/module/{{member}}',
    },
  },
  
  // Experimental features to improve performance
  experimental: {
    optimizePackageImports: [
      'lucide-react', 
      'react-icons', 
      '@supabase/supabase-js',
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
  
  // Webpack optimizations
  webpack: (config, { isServer, dev }) => {
    // Optimize builds
    if (!dev) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Reduce bundle size by aliasing heavy dependencies
        'moment': 'dayjs',
      };
    }
    
    // External packages for server-side
    if (isServer) {
      config.externals.push('sharp');
    }
    
    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
