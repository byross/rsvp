import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { generateQRCodeData } from './qr-generator';
import { generateAndSaveQRCode } from './qr-storage';
import { sendConfirmationEmail } from './emails/sender';
import { hashPassword, verifyPassword, generateToken, verifyToken, extractToken } from './auth-utils';
import { requireAuth, requireSuperAdmin, requireAdmin } from './auth-middleware';

type Bindings = {
  DB: D1Database;
  QR_BUCKET: R2Bucket;
  ALLOWED_ORIGIN: string;
  // Resend email service
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL: string;
  RESEND_FROM_NAME: string;
  // Event information
  EVENT_NAME: string;
  EVENT_DATE: string;
  EVENT_VENUE: string;
  // R2 settings
  R2_PUBLIC_URL: string;
  // Security
  QR_SECRET: string;
  ADMIN_PASSWORD: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS middleware
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.ALLOWED_ORIGIN || 'http://localhost:3000',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// Health check
app.get('/', (c) => {
  return c.json({ 
    message: 'RSVP API is running',
    version: '1.0.0'
  });
});

// ===== Simple Admin Authentication =====

// Simple admin password check
app.post('/api/admin/login', async (c) => {
  try {
    const { password } = await c.req.json();
    
    if (!password) {
      return c.json({ error: 'Password required' }, 400);
    }
    
    if (password === c.env.ADMIN_PASSWORD) {
      // Generate JWT token
      const { generateToken } = await import('./auth-utils');
      const token = await generateToken(
        'admin',
        'admin',
        'admin',
        c.env.QR_SECRET,
        24 * 60 * 60 * 1000 // 24 hours
      );
      
      return c.json({ 
        success: true, 
        token,
        message: 'Login successful' 
      });
    }
    
    return c.json({ error: 'Invalid password' }, 401);
  } catch (error) {
    console.error('Admin login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// Verify admin token (for frontend to check)
app.post('/api/admin/verify', async (c) => {
  try {
    const { token } = await c.req.json();
    
    if (!token) {
      return c.json({ valid: false }, 200);
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
          return c.json({ valid: true });
        }
      }
    } catch (e) {
      // Invalid token format
    }
    
    return c.json({ valid: false }, 200);
  } catch (error) {
    return c.json({ valid: false }, 200);
  }
});

// ===== Authentication APIs (Keep for future use) =====

// Initialize first super admin (one-time setup)
app.post('/api/auth/init', async (c) => {
  try {
    // Check if any users exist
    const existingUsers = await c.env.DB
      .prepare('SELECT COUNT(*) as count FROM users')
      .first();

    if (existingUsers && (existingUsers.count as number) > 0) {
      return c.json({ error: 'System already initialized' }, 400);
    }

    const { username, email, password, full_name } = await c.req.json();

    if (!username || !email || !password) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create super admin
    const userId = `user-super-admin-${crypto.randomUUID()}`;
    await c.env.DB
      .prepare(`
        INSERT INTO users (id, username, email, password_hash, role, full_name, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'super_admin', ?, 1, datetime('now'), datetime('now'))
      `)
      .bind(userId, username, email, passwordHash, full_name || 'Super Administrator')
      .run();

    return c.json({
      success: true,
      message: 'Super admin created successfully',
      user: { id: userId, username, email, role: 'super_admin' }
    });
  } catch (error) {
    console.error('Init error:', error);
    return c.json({ error: 'Failed to initialize' }, 500);
  }
});

// Login
app.post('/api/auth/login', async (c) => {
  try {
    const { username, password } = await c.req.json();

    if (!username || !password) {
      return c.json({ error: 'Username and password are required' }, 400);
    }

    // Find user
    const user = await c.env.DB
      .prepare('SELECT * FROM users WHERE username = ? AND is_active = 1')
      .bind(username)
      .first();

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash as string);
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Update last login
    await c.env.DB
      .prepare('UPDATE users SET last_login = datetime("now") WHERE id = ?')
      .bind(user.id)
      .run();

    // Generate token
    const token = await generateToken(
      user.id as string,
      user.username as string,
      user.role as string,
      c.env.QR_SECRET
    );

    return c.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// Get current user info
app.get('/api/auth/me', requireAuth, async (c) => {
  const user = c.get('user');
  
  try {
    const dbUser = await c.env.DB
      .prepare('SELECT id, username, email, role, full_name, last_login FROM users WHERE id = ?')
      .bind(user.sub)
      .first();

    if (!dbUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user: dbUser });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Failed to get user info' }, 500);
  }
});

// ===== User Management APIs (Super Admin Only) =====

// List all users
app.get('/api/users', requireAuth, requireSuperAdmin, async (c) => {
  try {
    const users = await c.env.DB
      .prepare('SELECT id, username, email, role, full_name, is_active, created_at, last_login FROM users ORDER BY created_at DESC')
      .all();

    return c.json({ users: users.results });
  } catch (error) {
    console.error('List users error:', error);
    return c.json({ error: 'Failed to list users' }, 500);
  }
});

// Create new user
app.post('/api/users', requireAuth, requireSuperAdmin, async (c) => {
  try {
    const { username, email, password, role, full_name } = await c.req.json();

    if (!username || !email || !password || !role) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    if (!['admin', 'super_admin'].includes(role)) {
      return c.json({ error: 'Invalid role' }, 400);
    }

    // Check if username or email already exists
    const existing = await c.env.DB
      .prepare('SELECT id FROM users WHERE username = ? OR email = ?')
      .bind(username, email)
      .first();

    if (existing) {
      return c.json({ error: 'Username or email already exists' }, 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const userId = `user-${crypto.randomUUID()}`;
    await c.env.DB
      .prepare(`
        INSERT INTO users (id, username, email, password_hash, role, full_name, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
      `)
      .bind(userId, username, email, passwordHash, role, full_name || null)
      .run();

    return c.json({
      success: true,
      user: { id: userId, username, email, role, full_name }
    });
  } catch (error) {
    console.error('Create user error:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

// Update user
app.put('/api/users/:id', requireAuth, requireSuperAdmin, async (c) => {
  const userId = c.req.param('id');
  
  try {
    const { email, role, full_name, is_active, password } = await c.req.json();

    const updates: string[] = [];
    const bindings: any[] = [];

    if (email !== undefined) {
      updates.push('email = ?');
      bindings.push(email);
    }
    if (role !== undefined) {
      if (!['admin', 'super_admin'].includes(role)) {
        return c.json({ error: 'Invalid role' }, 400);
      }
      updates.push('role = ?');
      bindings.push(role);
    }
    if (full_name !== undefined) {
      updates.push('full_name = ?');
      bindings.push(full_name);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      bindings.push(is_active ? 1 : 0);
    }
    if (password) {
      const passwordHash = await hashPassword(password);
      updates.push('password_hash = ?');
      bindings.push(passwordHash);
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    updates.push('updated_at = datetime("now")');
    bindings.push(userId);

    await c.env.DB
      .prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...bindings)
      .run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Update user error:', error);
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

// Delete user
app.delete('/api/users/:id', requireAuth, requireSuperAdmin, async (c) => {
  const userId = c.req.param('id');
  const currentUser = c.get('user');

  // Prevent self-deletion
  if (userId === currentUser.sub) {
    return c.json({ error: 'Cannot delete your own account' }, 400);
  }

  try {
    await c.env.DB
      .prepare('DELETE FROM users WHERE id = ?')
      .bind(userId)
      .run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

// Get guest data by token
app.get('/api/rsvp/:token', async (c) => {
  const token = c.req.param('token');
  
  try {
    const guest = await c.env.DB
      .prepare('SELECT * FROM guests WHERE token = ?')
      .bind(token)
      .first();

    if (!guest) {
      return c.json({ error: 'Invalid token' }, 404);
    }

    return c.json({ guest });
  } catch (error) {
    console.error('Database error:', error);
    return c.json({ error: 'Database error' }, 500);
  }
});

// Submit RSVP form
app.post('/api/rsvp/:token', async (c) => {
  const token = c.req.param('token');
  const body = await c.req.json();

  try {
    // Check if token exists
    const guest = await c.env.DB
      .prepare('SELECT * FROM guests WHERE token = ?')
      .bind(token)
      .first();

    if (!guest) {
      return c.json({ error: 'Invalid token' }, 404);
    }

    // Update guest RSVP data
    await c.env.DB
      .prepare(`
        UPDATE guests 
        SET 
          name = ?,
          company = ?,
          rsvp_status = 'confirmed',
          dinner = ?,
          cocktail = ?,
          workshop_type = ?,
          workshop_time = ?,
          updated_at = datetime('now')
        WHERE token = ?
      `)
      .bind(
        body.name || guest.name,
        body.company || guest.company || null,
        body.dinner ? 1 : 0,
        body.cocktail ? 1 : 0,
        body.workshop_type || null,
        body.workshop_time || null,
        token
      )
      .run();

    // Generate QR Code data and save to R2
    const qrData = await generateQRCodeData(
      guest.id as string,
      token,
      body.name || guest.name as string,
      c.env.QR_SECRET
    );
    
    const qrCodeUrl = await generateAndSaveQRCode(
      c.env.QR_BUCKET,
      guest.id as string,
      qrData,
      c.env.R2_PUBLIC_URL
    );

    // Send confirmation email
    const emailResult = await sendConfirmationEmail(
      {
        resendApiKey: c.env.RESEND_API_KEY,
        fromEmail: c.env.RESEND_FROM_EMAIL,
        fromName: c.env.RESEND_FROM_NAME,
      },
      {
        to: guest.email as string,
        guestName: body.name || guest.name as string,
        dinner: body.dinner,
        cocktail: body.cocktail,
        workshopType: body.workshop_type,
        workshopTime: body.workshop_time,
        qrCodeDataURL: qrCodeUrl,
        eventName: c.env.EVENT_NAME,
        eventDate: c.env.EVENT_DATE,
        eventVenue: c.env.EVENT_VENUE,
      }
    );

    if (!emailResult.success) {
      console.error('Failed to send confirmation email:', emailResult.error);
      // Continue even if email fails - RSVP is already saved
    }

    return c.json({ 
      success: true, 
      message: 'RSVP submitted successfully',
      emailSent: emailResult.success,
      messageId: emailResult.messageId,
    });
  } catch (error) {
    console.error('Database error:', error);
    return c.json({ error: 'Failed to submit RSVP' }, 500);
  }
});

// Get statistics (admin only)
app.get('/api/admin/stats', requireAuth, requireAdmin, async (c) => {
  
  try {
    const guests = await c.env.DB
      .prepare('SELECT * FROM guests')
      .all();

    const results = guests.results as any[];

    const stats = {
      total: results.length,
      confirmed: results.filter(g => g.rsvp_status === 'confirmed').length,
      pending: results.filter(g => g.rsvp_status === 'pending').length,
      declined: results.filter(g => g.rsvp_status === 'declined').length,
      dinner: results.filter(g => g.dinner === 1).length,
      cocktail: results.filter(g => g.cocktail === 1).length,
      workshopLeather: results.filter(g => g.workshop_type === 'leather').length,
      workshopPerfume: results.filter(g => g.workshop_type === 'perfume').length,
      workshopByTime: {} as Record<string, number>,
    };

    // Count by workshop type and time
    results.forEach(guest => {
      if (guest.workshop_type && guest.workshop_time) {
        const key = `${guest.workshop_type}-${guest.workshop_time}`;
        stats.workshopByTime[key] = (stats.workshopByTime[key] || 0) + 1;
      }
    });

    return c.json(stats);
  } catch (error) {
    console.error('Database error:', error);
    return c.json({ error: 'Database error' }, 500);
  }
});

// List all guests (admin only)
app.get('/api/admin/guests', requireAuth, requireAdmin, async (c) => {
  
  try {
    const guests = await c.env.DB
      .prepare('SELECT id, name, email, company, phone, invite_type, token, rsvp_status, dinner, cocktail, workshop_type, workshop_time, checked_in, created_at, updated_at FROM guests ORDER BY created_at DESC')
      .all();

    return c.json(guests.results);
  } catch (error) {
    console.error('Database error:', error);
    return c.json({ error: 'Database error' }, 500);
  }
});

// Import guests from CSV (admin only)
app.post('/api/admin/import', requireAuth, requireAdmin, async (c) => {
  
  try {
    const body = await c.req.json();
    const { csvData } = body;

    if (!csvData) {
      return c.json({ error: 'CSV data is required' }, 400);
    }

    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      return c.json({ 
        success: false,
        imported: 0,
        failed: 0,
        errors: ['CSV 文件至少需要包含標題行和一行數據']
      }, 400);
    }

    const headers = lines[0].split(',').map((h: string) => h.trim());
    const requiredHeaders = ['name', 'email', 'invite_type'];
    
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return c.json({
        success: false,
        imported: 0,
        failed: 0,
        errors: [`缺少必要欄位: ${missingHeaders.join(', ')}`]
      }, 400);
    }

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map((v: string) => v.trim());
      const row: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      try {
        const { name, email, company, phone, invite_type } = row;

        if (!name || !email || !invite_type) {
          errors.push(`第 ${i + 1} 行: 缺少必要欄位`);
          failed++;
          continue;
        }

        if (invite_type !== 'named' && invite_type !== 'company') {
          errors.push(`第 ${i + 1} 行: invite_type 必須是 named 或 company`);
          failed++;
          continue;
        }

        const token = `token-${crypto.randomUUID()}`;
        const id = crypto.randomUUID();

        await c.env.DB
          .prepare(`
            INSERT INTO guests (
              id, name, company, email, phone, token, invite_type,
              rsvp_status, dinner, cocktail, checked_in,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 0, 0, 0, datetime('now'), datetime('now'))
          `)
          .bind(id, name, company || null, email, phone || null, token, invite_type)
          .run();

        imported++;
      } catch (error) {
        errors.push(`第 ${i + 1} 行: 導入失敗 - ${error instanceof Error ? error.message : '未知錯誤'}`);
        failed++;
      }
    }

    return c.json({
      success: imported > 0,
      imported,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Import error:', error);
    return c.json({ error: 'Import failed' }, 500);
  }
});

// Export guests to CSV (admin only)
app.get('/api/admin/export', requireAuth, requireAdmin, async (c) => {
  
  try {
    const guests = await c.env.DB
      .prepare('SELECT id, name, email, company, phone, invite_type, token, rsvp_status, dinner, cocktail, workshop_type, workshop_time, checked_in, created_at FROM guests ORDER BY created_at DESC')
      .all();

    const results = guests.results as any[];

    // CSV headers
    const headers = [
      'name', 'company', 'email', 'phone', 'invite_type', 'rsvp_status',
      'dinner', 'cocktail', 'workshop_type', 'workshop_time',
      'checked_in', 'created_at'
    ];

    // Convert to CSV
    const csvRows = [headers.join(',')];
    
    results.forEach(guest => {
      const row = headers.map(header => {
        let value = guest[header];
        
        // Convert boolean/number to string
        if (typeof value === 'number') {
          if (header === 'dinner' || header === 'cocktail' || header === 'checked_in') {
            value = value ? 'Yes' : 'No';
          }
        }
        
        // Handle null values
        if (value === null || value === undefined) {
          value = '';
        }
        
        // Escape commas and quotes
        value = String(value).replace(/"/g, '""');
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${value}"`;
        }
        
        return value;
      });
      
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="guests-export.csv"',
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return c.json({ error: 'Export failed' }, 500);
  }
});

// ===== Guest CRUD Operations =====

// Create new guest
app.post('/api/admin/guests', requireAuth, requireAdmin, async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, company, phone, invite_type } = body;

    // Validate required fields
    if (!name || !email || !invite_type) {
      return c.json({ error: 'Missing required fields: name, email, invite_type' }, 400);
    }

    // Check if email already exists
    const existingGuest = await c.env.DB.prepare(
      'SELECT id FROM guests WHERE email = ?'
    ).bind(email).first();

    if (existingGuest) {
      return c.json({ error: 'Email already exists' }, 400);
    }

    // Generate unique token
    const token = `token_${crypto.randomUUID().replace(/-/g, '').substring(0, 12)}`;

    // Insert new guest
    const result = await c.env.DB.prepare(`
      INSERT INTO guests (id, name, email, company, phone, invite_type, token, rsvp_status, 
                         dinner, cocktail, workshop_type, workshop_time, checked_in, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 0, 0, NULL, NULL, 0, datetime('now'))
    `).bind(
      crypto.randomUUID(),
      name,
      email,
      company || null,
      phone || null,
      invite_type,
      token
    ).run();

    if (result.success) {
      return c.json({ 
        success: true, 
        message: 'Guest created successfully',
        token: token
      });
    } else {
      return c.json({ error: 'Failed to create guest' }, 500);
    }
  } catch (error) {
    console.error('Create guest error:', error);
    return c.json({ error: 'Failed to create guest' }, 500);
  }
});

// Update guest
app.put('/api/admin/guests/:id', requireAuth, requireAdmin, async (c) => {
  try {
    const guestId = c.req.param('id');
    const body = await c.req.json();
    console.log('[Update] Guest ID:', guestId);
    console.log('[Update] Request body:', body);
    const { name, email, company, phone, invite_type, rsvp_status, dinner, cocktail, workshop_type, workshop_time } = body;

    // Validate required fields
    if (!name || !email || !invite_type) {
      return c.json({ error: 'Missing required fields: name, email, invite_type' }, 400);
    }

    // Check if email already exists for another guest
    const existingGuest = await c.env.DB.prepare(
      'SELECT id FROM guests WHERE email = ? AND id != ?'
    ).bind(email, guestId).first();

    if (existingGuest) {
      return c.json({ error: 'Email already exists for another guest' }, 400);
    }

    // Update guest
    const updateQuery = `UPDATE guests SET name = ?, email = ?, company = ?, phone = ?, invite_type = ?, rsvp_status = ?, dinner = ?, cocktail = ?, workshop_type = ?, workshop_time = ?, updated_at = datetime('now') WHERE id = ?`;
    console.log('[Update] SQL query:', updateQuery);
    
    const bindParams = [
      name,
      email,
      company || null,
      phone || null,
      invite_type,
      rsvp_status || 'pending',
      dinner ? 1 : 0,
      cocktail ? 1 : 0,
      workshop_type || null,
      workshop_time || null,
      guestId
    ];
    console.log('[Update] Bind parameters:', bindParams);
    
    const result = await c.env.DB.prepare(updateQuery).bind(...bindParams).run();
    console.log('[Update] Result:', result);

    if (result.success) {
      // Check if the guest exists by verifying the guest ID exists
      const existingGuest = await c.env.DB.prepare('SELECT id FROM guests WHERE id = ?').bind(guestId).first();
      
      if (existingGuest) {
        return c.json({ 
          success: true, 
          message: 'Guest updated successfully',
          changes: result.changes
        });
      } else {
        return c.json({ error: 'Guest not found' }, 404);
      }
    } else {
      return c.json({ error: 'Failed to update guest' }, 500);
    }
  } catch (error) {
    console.error('[Update] Guest error:', error);
    console.error('[Update] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return c.json({ error: 'Failed to update guest', details: error.message }, 500);
  }
});

// Delete guest
app.delete('/api/admin/guests/:id', requireAuth, requireAdmin, async (c) => {
  try {
    const guestId = c.req.param('id');
    console.log('[Delete] Guest ID:', guestId);

    // Check if guest exists first
    const existingGuest = await c.env.DB.prepare('SELECT id FROM guests WHERE id = ?').bind(guestId).first();
    
    if (!existingGuest) {
      console.log('[Delete] Guest not found');
      return c.json({ error: 'Guest not found' }, 404);
    }

    // Delete guest
    const result = await c.env.DB.prepare(
      'DELETE FROM guests WHERE id = ?'
    ).bind(guestId).run();

    console.log('[Delete] Result:', result);

    if (result.success) {
      return c.json({ 
        success: true, 
        message: 'Guest deleted successfully',
        changes: result.changes
      });
    } else {
      return c.json({ error: 'Failed to delete guest' }, 500);
    }
  } catch (error) {
    console.error('[Delete] Guest error:', error);
    console.error('[Delete] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return c.json({ error: 'Failed to delete guest', details: error.message }, 500);
  }
});

// Get single guest by ID
app.get('/api/admin/guests/:id', requireAuth, requireAdmin, async (c) => {
  try {
    const guestId = c.req.param('id');

    const guest = await c.env.DB.prepare(`
      SELECT id, name, email, company, phone, invite_type, token, rsvp_status,
             dinner, cocktail, workshop_type, workshop_time, checked_in, 
             created_at, updated_at
      FROM guests 
      WHERE id = ?
    `).bind(guestId).first();

    if (!guest) {
      return c.json({ error: 'Guest not found' }, 404);
    }

    return c.json(guest);
  } catch (error) {
    console.error('Get guest error:', error);
    return c.json({ error: 'Failed to get guest' }, 500);
  }
});

// Test email sending (for development only)
app.post('/api/test-email', async (c) => {
  const body = await c.req.json();
  const { email, type = 'confirmation' } = body;

  if (!email) {
    return c.json({ error: 'Email is required' }, 400);
  }

  try {
    if (type === 'confirmation') {
      // Generate test QR code and save to R2
      const qrData = await generateQRCodeData(
        'test-id-123',
        'test-token-001',
        '測試用戶',
        c.env.QR_SECRET
      );
      
      const qrCodeUrl = await generateAndSaveQRCode(
        c.env.QR_BUCKET,
        'test-id-123',
        qrData,
        c.env.R2_PUBLIC_URL
      );

      const result = await sendConfirmationEmail(
        {
          resendApiKey: c.env.RESEND_API_KEY,
          fromEmail: c.env.RESEND_FROM_EMAIL,
          fromName: c.env.RESEND_FROM_NAME,
        },
        {
          to: email,
          guestName: '測試用戶',
          dinner: true,
          cocktail: true,
          workshopType: 'leather',
          workshopTime: '1700',
          qrCodeDataURL: qrCodeUrl,
          eventName: c.env.EVENT_NAME,
          eventDate: c.env.EVENT_DATE,
          eventVenue: c.env.EVENT_VENUE,
        }
      );

      return c.json({ 
        success: result.success,
        messageId: result.messageId,
        qrCodeUrl: qrCodeUrl,
        error: result.error,
      });
    }

    return c.json({ error: 'Invalid email type' }, 400);
  } catch (error) {
    console.error('Test email error:', error);
    return c.json({ error: 'Failed to send test email', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Serve QR code images from R2
app.get('/qr/:filename', async (c) => {
  const filename = c.req.param('filename');
  
  try {
    const object = await c.env.QR_BUCKET.get(filename);
    
    if (!object) {
      return c.notFound();
    }

    return new Response(object.body, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('QR code retrieval error:', error);
    return c.json({ error: 'Failed to retrieve QR code' }, 500);
  }
});

// Check-in scan
app.post('/api/scan', async (c) => {
  const body = await c.req.json();
  const { token } = body;

  try {
    // Get guest by token
    const guest = await c.env.DB
      .prepare('SELECT * FROM guests WHERE token = ?')
      .bind(token)
      .first();

    if (!guest) {
      return c.json({ error: 'Invalid QR code' }, 404);
    }

    // Check if already checked in
    if (guest.checked_in) {
      return c.json({ 
        error: 'Already checked in',
        guest: guest,
        status: 'duplicate'
      }, 400);
    }

    // Update check-in status
    await c.env.DB
      .prepare('UPDATE guests SET checked_in = 1 WHERE token = ?')
      .bind(token)
      .run();

    // Log scan
    await c.env.DB
      .prepare(`
        INSERT INTO scan_logs (id, guest_id, scan_time, status)
        VALUES (?, ?, datetime('now'), 'success')
      `)
      .bind(
        crypto.randomUUID(),
        guest.id,
      )
      .run();

    return c.json({ 
      success: true, 
      guest: guest,
      message: 'Check-in successful' 
    });
  } catch (error) {
    console.error('Database error:', error);
    return c.json({ error: 'Check-in failed' }, 500);
  }
});

// Export for Cloudflare Workers
export default app;

