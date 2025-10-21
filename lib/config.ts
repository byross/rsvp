/**
 * API 配置
 * 統一管理所有 API 端點
 */

// 獲取 API 基礎 URL
export const getApiUrl = (): string => {
  // 在構建時嵌入 API URL（通過 next.config.ts 的 env 配置）
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (!apiUrl) {
    // 這應該永遠不會發生，因為 next.config.ts 有 fallback
    console.error('❌ CRITICAL: NEXT_PUBLIC_API_URL is not set!');
    throw new Error('API URL is not configured');
  }
  
  console.log(`🌐 Using API URL: ${apiUrl}`);
  return apiUrl;
};

// API 端點
export const API_ENDPOINTS = {
  // Admin endpoints
  ADMIN_LOGIN: '/api/admin/login',
  ADMIN_VERIFY: '/api/admin/verify', 
  ADMIN_GUESTS: '/api/admin/guests',
  ADMIN_IMPORT: '/api/admin/import',
  
  // RSVP endpoints  
  RSVP_GET: (token: string) => `/api/rsvp/${token}`,
  RSVP_SUBMIT: (token: string) => `/api/rsvp/${token}`,
  
  // Checkin endpoints
  SCAN: '/api/scan',
} as const;

/**
 * 構建完整的 API URL
 * @param endpoint API 端點路徑
 * @returns 完整的 API URL
 */
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = getApiUrl();
  return `${baseUrl}${endpoint}`;
};

/**
 * API 請求助手函數
 * @param endpoint API 端點
 * @param options fetch 選項
 * @returns fetch Promise
 */
export const apiRequest = async (
  endpoint: string, 
  options?: RequestInit
): Promise<Response> => {
  const url = buildApiUrl(endpoint);
  
  console.log(`🌐 API Request: ${options?.method || 'GET'} ${url}`);
  
  return fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
};
