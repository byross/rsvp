import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // 確保環境變量在構建時可用
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://rsvp-api.byross-tech.workers.dev' 
        : 'http://localhost:8787'),
  },
};

export default nextConfig;
