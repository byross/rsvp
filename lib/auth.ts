// Simple admin authentication utilities

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  const token = sessionStorage.getItem('admin_token');
  if (!token) return false;
  
  try {
    // Check if it's a JWT token (has 3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length === 3) {
      // Decode JWT payload
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      
      // Check if token is not expired
      if (payload.exp && payload.exp > now) {
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


