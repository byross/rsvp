// Authentication utilities

/**
 * Hash password using SHA-256
 */
export async function hashPassword(password: string, salt: string = 'byross-rsvp-salt'): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Verify password
 */
export async function verifyPassword(password: string, hash: string, salt: string = 'byross-rsvp-salt'): Promise<boolean> {
  const inputHash = await hashPassword(password, salt);
  return inputHash === hash;
}

/**
 * Generate JWT token
 */
export async function generateToken(
  userId: string,
  username: string,
  role: string,
  secret: string,
  expiresIn: number = 24 * 60 * 60 * 1000 // 24 hours
): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Date.now();
  const payload = {
    sub: userId,
    username: username,
    role: role,
    iat: Math.floor(now / 1000),
    exp: Math.floor((now + expiresIn) / 1000)
  };

  // Base64 encode header and payload
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  // Create signature
  const message = `${encodedHeader}.${encodedPayload}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(message + secret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = btoa(String.fromCharCode(...hashArray));

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify JWT token
 */
export async function verifyToken(token: string, secret: string): Promise<{
  valid: boolean;
  payload?: any;
  error?: string;
}> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
    }

    const [encodedHeader, encodedPayload, providedSignature] = parts;
    
    // Verify signature
    const message = `${encodedHeader}.${encodedPayload}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(message + secret);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const expectedSignature = btoa(String.fromCharCode(...hashArray));

    if (providedSignature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' };
    }

    // Decode payload
    const payload = JSON.parse(atob(encodedPayload));

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Token expired' };
    }

    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: 'Failed to verify token' };
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}



