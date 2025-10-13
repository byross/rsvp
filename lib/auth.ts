// Simple admin authentication utilities

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  const token = sessionStorage.getItem('admin_token');
  if (!token) return false;
  
  try {
    const decoded = atob(token);
    const parts = decoded.split(':');
    
    if (parts.length === 3 && parts[0] === 'admin') {
      const timestamp = parseInt(parts[1]);
      const now = Date.now();
      
      // Token valid for 24 hours
      if (now - timestamp < 24 * 60 * 60 * 1000) {
        return true;
      }
    }
  } catch (e) {
    // Invalid token
  }
  
  return false;
}

/**
 * Get admin token
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('admin_token');
}

/**
 * Set admin token
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('admin_token', token);
}

/**
 * Clear admin token (logout)
 */
export function logout(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('admin_token');
}

/**
 * Verify token with server
 */
export async function verifyToken(token: string): Promise<boolean> {
  try {
    const response = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    
    const data = await response.json();
    return data.valid === true;
  } catch (error) {
    return false;
  }
}


