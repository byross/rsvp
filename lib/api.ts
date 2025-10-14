// API utilities for admin requests

import { getToken } from './auth';
import { buildApiUrl } from './config';

/**
 * Make authenticated API request
 */
export async function apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  // Build full URL if it's a relative path
  const fullUrl = url.startsWith('http') ? url : buildApiUrl(url);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  return fetch(fullUrl, {
    ...options,
    headers,
  });
}

/**
 * GET request
 */
export async function apiGet(url: string): Promise<Response> {
  return apiRequest(url, { method: 'GET' });
}

/**
 * POST request
 */
export async function apiPost(url: string, data?: any): Promise<Response> {
  return apiRequest(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : null,
  });
}

/**
 * PUT request
 */
export async function apiPut(url: string, data?: any): Promise<Response> {
  return apiRequest(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : null,
  });
}

/**
 * DELETE request
 */
export async function apiDelete(url: string): Promise<Response> {
  return apiRequest(url, { method: 'DELETE' });
}
