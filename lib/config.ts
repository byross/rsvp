/**
 * API 配置
 * 統一管理所有 API 端點
 */

// 獲取 API 基礎 URL
export const getApiUrl = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (!apiUrl) {
    console.error('⚠️ NEXT_PUBLIC_API_URL 未設定');
    // 開發環境默認值
    return typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:8787'
      : 'https://rsvp-api.byross-tech.workers.dev';
  }
  
  return apiUrl;
};

// API 端點
export const API_ENDPOINTS = {
  // Admin endpoints
  ADMIN_LOGIN: '/admin/login',
  ADMIN_VERIFY: '/admin/verify', 
  ADMIN_GUESTS: '/admin/guests',
  ADMIN_IMPORT: '/admin/import',
  
  // RSVP endpoints  
  RSVP_GET: (token: string) => `/rsvp/${token}`,
  RSVP_SUBMIT: (token: string) => `/rsvp/${token}`,
  
  // Checkin endpoints
  SCAN: '/scan',
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
