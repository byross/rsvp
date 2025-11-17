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
        ? 'https://rsvp-api.momini.app' 
        : 'http://localhost:8787'),
    NEXT_PUBLIC_EVENT_NAME: process.env.NEXT_PUBLIC_EVENT_NAME || process.env.EVENT_NAME || '天網資訊科技（澳門）有限公司三十週年晚宴',
    NEXT_PUBLIC_EVENT_DATE: process.env.NEXT_PUBLIC_EVENT_DATE || process.env.EVENT_DATE || '2025年12月17日（星期三）',
    NEXT_PUBLIC_EVENT_VENUE: process.env.NEXT_PUBLIC_EVENT_VENUE || process.env.EVENT_VENUE || '澳門銀河國際會議中心地下宴會廳',
  },
};

export default nextConfig;
