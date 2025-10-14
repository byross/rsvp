import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Note: Static export doesn't support rewrites
  // API calls use full URLs from NEXT_PUBLIC_API_URL
};

export default nextConfig;
