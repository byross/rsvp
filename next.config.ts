import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Disable development features for clean static export
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Note: Static export doesn't support rewrites
  // API calls use full URLs from NEXT_PUBLIC_API_URL
};

export default nextConfig;
