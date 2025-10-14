import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Note: rewrites don't work with static export
  // API calls should use full URLs in production
};

export default nextConfig;
