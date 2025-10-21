// Authentication middleware for Hono

import { Context, Next } from 'hono';
import { verifyToken, extractToken } from './auth-utils';

/**
 * Simple admin authentication middleware (for /api/admin/login based auth)
 */
export async function requireSimpleAuth(c: Context, next: Next): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader) {
    return c.json({ error: 'Unauthorized', message: 'No token provided' }, 401);
  }

  // Extract token from "Bearer <token>"
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    return c.json({ error: 'Unauthorized', message: 'No token provided' }, 401);
  }

  // Simple verification - check if token format is valid
  try {
    const decoded = atob(token);
    const parts = decoded.split(':');
    
    if (parts.length === 3 && parts[0] === 'admin') {
      const timestamp = parseInt(parts[1]);
      const now = Date.now();
      
      // Token valid for 24 hours
      if (now - timestamp < 24 * 60 * 60 * 1000) {
        // Add simple user info to context
        c.set('user', { role: 'admin', username: 'admin' });
        await next();
        return;
      }
    }
  } catch (e) {
    // Invalid token format
  }

  return c.json({ error: 'Unauthorized', message: 'Invalid or expired token' }, 401);
}

/**
 * Require authentication middleware (for JWT based auth)
 */
export async function requireAuth(c: Context, next: Next): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');
  const token = extractToken(authHeader || null);

  if (!token) {
    return c.json({ error: 'Unauthorized', message: 'No token provided' }, 401);
  }

  const result = await verifyToken(token, c.env.QR_SECRET); // Reuse QR_SECRET for JWT

  if (!result.valid) {
    return c.json({ error: 'Unauthorized', message: result.error }, 401);
  }

  // Add user info to context
  c.set('user', result.payload);
  
  await next();
}

/**
 * Require specific role middleware
 */
export function requireRole(allowedRoles: string[]) {
  return async (c: Context, next: Next): Promise<Response | void> => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({ error: 'Unauthorized', message: 'No user context' }, 401);
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json({ 
        error: 'Forbidden', 
        message: 'Insufficient permissions' 
      }, 403);
    }

    await next();
  };
}

/**
 * Require super admin middleware
 */
export const requireSuperAdmin = requireRole(['super_admin']);

/**
 * Require admin or super admin middleware
 */
export const requireAdmin = requireRole(['admin', 'super_admin']);


