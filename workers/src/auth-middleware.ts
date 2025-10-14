// Authentication middleware for Hono

import { Context, Next } from 'hono';
import { verifyToken, extractToken } from './auth-utils';

/**
 * Require authentication middleware
 */
export async function requireAuth(c: Context, next: Next) {
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
  return async (c: Context, next: Next) => {
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


