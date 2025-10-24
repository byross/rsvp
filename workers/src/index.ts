import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { generateQRCodeData } from './qr-generator';
import { generateAndSaveQRCode } from './qr-storage';
import { sendConfirmationEmail, sendInvitationEmail } from './emails/sender';
import { 
  generateNamedGuestInvitationEmail, 
  generateCompanyInvitationEmail,
  generateConfirmationEmail 
} from './emails/templates';
import { hashPassword, verifyPassword, generateToken } from './auth-utils';
import { requireAuth, requireSuperAdmin, requireSimpleAuth } from './auth-middleware';
import { GuestCategory } from './types';

type Bindings = {
  DB: any; // D1Database
  QR_BUCKET: any; // R2Bucket
  ALLOWED_ORIGIN: string;
  FRONTEND_URL: string;
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
      // Generate simple token (format: admin:timestamp:signature)
      const timestamp = Date.now();
      const signature = btoa(`${c.env.QR_SECRET}:${timestamp}`).substring(0, 16);
      const tokenData = `admin:${timestamp}:${signature}`;
      const token = btoa(tokenData);
      
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
  const user = (c as any).get('user');
  
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
  const currentUser = (c as any).get('user');

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

    // Determine RSVP status based on dinner and cocktail responses
    let rsvpStatus = 'confirmed';
    if (!body.dinner && !body.cocktail) {
      rsvpStatus = 'declined';
    }

    // Check workshop capacity if workshop is selected
    if (body.workshop_type && body.workshop_time && rsvpStatus === 'confirmed') {
      const capacityResult = await c.env.DB
        .prepare(`
          SELECT COUNT(*) as count 
          FROM guests 
          WHERE workshop_type = ? 
            AND workshop_time = ? 
            AND rsvp_status = 'confirmed'
        `)
        .bind(body.workshop_type, body.workshop_time)
        .first();

      const currentCount = (capacityResult as any)?.count || 0;
      
      // Define capacity limits
      const capacityLimits = {
        leather: 30,
        perfume: 40
      };
      
      const limit = capacityLimits[body.workshop_type as keyof typeof capacityLimits];
      
      if (currentCount >= limit) {
        return c.json({ 
          error: `該時段已滿（${body.workshop_type === 'leather' ? '皮革' : '調香'}工作坊 ${body.workshop_time.slice(0, 2)}:${body.workshop_time.slice(2)} 已達上限 ${limit} 人）`,
          code: 'WORKSHOP_FULL'
        }, 400);
      }
    }

    // Update guest RSVP data (name and company are not editable by guest)
    await c.env.DB
      .prepare(`
        UPDATE guests 
        SET 
          rsvp_status = ?,
          dinner = ?,
          cocktail = ?,
          vegetarian = ?,
          workshop_type = ?,
          workshop_time = ?,
          updated_at = datetime('now')
        WHERE token = ?
      `)
      .bind(
        rsvpStatus,
        body.dinner ? 1 : 0,
        body.cocktail ? 1 : 0,
        body.vegetarian ? 1 : 0,
        body.workshop_type || null,
        body.workshop_time || null,
        token
      )
      .run();

    // Generate QR Code data and save to R2
    const qrData = await generateQRCodeData(
      guest.id as string,
      token,
      guest.name as string,
      guest.guest_category as GuestCategory,
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
        vegetarian: body.vegetarian,
        workshopType: body.workshop_type,
        workshopTime: body.workshop_time,
        qrCodeDataURL: qrCodeUrl,
        guestCategory: guest.guest_category as GuestCategory,
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

// Get workshop availability
app.get('/api/workshop/availability', async (c) => {
  try {
    const times = ['1630', '1700', '1730', '1800'];
    const workshopTypes = ['leather', 'perfume'];
    const capacityLimits = {
      leather: 30,
      perfume: 40
    };

    const availability: any = {
      leather: {},
      perfume: {}
    };

    for (const workshopType of workshopTypes) {
      for (const time of times) {
        const result = await c.env.DB
          .prepare(`
            SELECT COUNT(*) as count 
            FROM guests 
            WHERE workshop_type = ? 
              AND workshop_time = ? 
              AND rsvp_status = 'confirmed'
          `)
          .bind(workshopType, time)
          .first();

        const booked = (result as any)?.count || 0;
        const total = capacityLimits[workshopType as keyof typeof capacityLimits];
        const available = Math.max(0, total - booked);

        availability[workshopType][time] = {
          total,
          booked,
          available
        };
      }
    }

    return c.json(availability);
  } catch (error) {
    console.error('Workshop availability error:', error);
    return c.json({ error: 'Failed to get workshop availability' }, 500);
  }
});

// Workshop check-in endpoints
app.post('/api/workshop/leather/checkin', async (c) => {
  const body = await c.req.json();
  const { token } = body;

  if (!token) {
    return c.json({ error: 'Token is required' }, 400);
  }

  try {
    // Get guest data
    const guest = await c.env.DB
      .prepare('SELECT * FROM guests WHERE token = ?')
      .bind(token)
      .first();

    if (!guest) {
      return c.json({ error: 'Invalid token' }, 404);
    }

    // Check if guest has confirmed leather workshop
    if (guest.workshop_type !== 'leather' || !guest.workshop_time) {
      return c.json({ 
        error: '該嘉賓未選擇皮革工作坊',
        guest: {
          id: guest.id,
          name: guest.name,
          workshop_type: guest.workshop_type,
          workshop_time: guest.workshop_time
        }
      }, 400);
    }

    // Check if already checked in to workshop
    const existingCheckin = await c.env.DB
      .prepare('SELECT * FROM workshop_checkins WHERE guest_id = ? AND workshop_type = ?')
      .bind(guest.id, 'leather')
      .first();

    if (existingCheckin) {
      return c.json({ 
        status: 'duplicate',
        guest: {
          id: guest.id,
          name: guest.name,
          workshop_type: guest.workshop_type,
          workshop_time: guest.workshop_time
        }
      }, 200);
    }

    // Record workshop check-in
    const checkinId = crypto.randomUUID();
    await c.env.DB
      .prepare(`
        INSERT INTO workshop_checkins (id, guest_id, workshop_type, workshop_time, checked_in_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `)
      .bind(checkinId, guest.id, 'leather', guest.workshop_time)
      .run();

    return c.json({ 
      status: 'success',
      guest: {
        id: guest.id,
        name: guest.name,
        workshop_type: guest.workshop_type,
        workshop_time: guest.workshop_time
      }
    });
  } catch (error) {
    console.error('Leather workshop checkin error:', error);
    return c.json({ error: 'Workshop check-in failed' }, 500);
  }
});

app.post('/api/workshop/perfume/checkin', async (c) => {
  const body = await c.req.json();
  const { token } = body;

  if (!token) {
    return c.json({ error: 'Token is required' }, 400);
  }

  try {
    // Get guest data
    const guest = await c.env.DB
      .prepare('SELECT * FROM guests WHERE token = ?')
      .bind(token)
      .first();

    if (!guest) {
      return c.json({ error: 'Invalid token' }, 404);
    }

    // Check if guest has confirmed perfume workshop
    if (guest.workshop_type !== 'perfume' || !guest.workshop_time) {
      return c.json({ 
        error: '該嘉賓未選擇調香工作坊',
        guest: {
          id: guest.id,
          name: guest.name,
          workshop_type: guest.workshop_type,
          workshop_time: guest.workshop_time
        }
      }, 400);
    }

    // Check if already checked in to workshop
    const existingCheckin = await c.env.DB
      .prepare('SELECT * FROM workshop_checkins WHERE guest_id = ? AND workshop_type = ?')
      .bind(guest.id, 'perfume')
      .first();

    if (existingCheckin) {
      return c.json({ 
        status: 'duplicate',
        guest: {
          id: guest.id,
          name: guest.name,
          workshop_type: guest.workshop_type,
          workshop_time: guest.workshop_time
        }
      }, 200);
    }

    // Record workshop check-in
    const checkinId = crypto.randomUUID();
    await c.env.DB
      .prepare(`
        INSERT INTO workshop_checkins (id, guest_id, workshop_type, workshop_time, checked_in_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `)
      .bind(checkinId, guest.id, 'perfume', guest.workshop_time)
      .run();

    return c.json({ 
      status: 'success',
      guest: {
        id: guest.id,
        name: guest.name,
        workshop_type: guest.workshop_type,
        workshop_time: guest.workshop_time
      }
    });
  } catch (error) {
    console.error('Perfume workshop checkin error:', error);
    return c.json({ error: 'Workshop check-in failed' }, 500);
  }
});

// Get statistics (admin only)
app.get('/api/admin/stats', requireSimpleAuth, async (c) => {
  
  try {
    const guests = await c.env.DB
      .prepare('SELECT * FROM guests')
      .all();

    const results = guests.results as any[];

    // Only confirmed guests should be counted for event participation
    const confirmedGuests = results.filter(g => g.rsvp_status === 'confirmed');
    
    const checkedInGuests = confirmedGuests.filter(g => g.checked_in === 1);
    
    const stats = {
      total: results.length,
      confirmed: confirmedGuests.length,
      pending: results.filter(g => g.rsvp_status === 'pending').length,
      declined: results.filter(g => g.rsvp_status === 'declined').length,
      dinner: confirmedGuests.filter(g => g.dinner === 1).length,
      cocktail: confirmedGuests.filter(g => g.cocktail === 1).length,
      workshopLeather: confirmedGuests.filter(g => g.workshop_type === 'leather').length,
      workshopPerfume: confirmedGuests.filter(g => g.workshop_type === 'perfume').length,
      checkedIn: checkedInGuests.length,
      checkInRate: confirmedGuests.length > 0 ? (checkedInGuests.length / confirmedGuests.length) * 100 : 0,
      workshopByTime: {} as Record<string, number>,
    };

    // Count by workshop type and time (only for confirmed guests)
    confirmedGuests.forEach(guest => {
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

// Search guests by name, phone, email, or company (admin only)
app.get('/api/admin/guests/search', requireSimpleAuth, async (c) => {
  try {
    const query = c.req.query('q');
    
    if (!query) {
      return c.json({ error: 'Search query required' }, 400);
    }

    const searchPattern = `%${query}%`;
    const guests = await c.env.DB
      .prepare(`
        SELECT id, name, email, company, phone, invite_type, token, rsvp_status, guest_category,
               dinner, cocktail, vegetarian, workshop_type, workshop_time, checked_in, 
               invitation_sent, invitation_sent_at, invitation_message_id, 
               created_at, updated_at 
        FROM guests 
        WHERE name LIKE ? 
           OR phone LIKE ? 
           OR email LIKE ? 
           OR company LIKE ?
        ORDER BY created_at DESC
        LIMIT 20
      `)
      .bind(searchPattern, searchPattern, searchPattern, searchPattern)
      .all();

    return c.json(guests.results);
  } catch (error) {
    console.error('Search error:', error);
    return c.json({ error: 'Search failed' }, 500);
  }
});

// List all guests (admin only)
app.get('/api/admin/guests', requireSimpleAuth, async (c) => {
  
  try {
    const guests = await c.env.DB
      .prepare('SELECT id, name, email, company, phone, invite_type, token, rsvp_status, guest_category, dinner, cocktail, vegetarian, workshop_type, workshop_time, checked_in, invitation_sent, invitation_sent_at, invitation_message_id, created_at, updated_at FROM guests ORDER BY created_at DESC')
      .all();

    return c.json(guests.results);
  } catch (error) {
    console.error('Database error:', error);
    return c.json({ error: 'Database error' }, 500);
  }
});

// Import guests from CSV (admin only)
app.post('/api/admin/import', requireSimpleAuth, async (c) => {
  
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
      
      headers.forEach((header: string, index: number) => {
        row[header] = values[index] || '';
      });

      try {
        const { name, email, company, phone, invite_type, guest_category } = row;

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

        // Validate guest_category if provided
        const category = guest_category || 'netcraft';
        if (category !== 'netcraft' && category !== 'vip' && category !== 'regular') {
          errors.push(`第 ${i + 1} 行: guest_category 必須是 netcraft, vip 或 regular`);
          failed++;
          continue;
        }

        const token = `token-${crypto.randomUUID()}`;
        const id = crypto.randomUUID();

        await c.env.DB
          .prepare(`
            INSERT INTO guests (
              id, name, company, email, phone, token, invite_type, guest_category,
              rsvp_status, dinner, cocktail, checked_in,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, 0, 0, datetime('now'), datetime('now'))
          `)
          .bind(id, name, company || null, email, phone || null, token, invite_type, category)
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
app.get('/api/admin/export', requireSimpleAuth, async (c) => {
  
  try {
    const guests = await c.env.DB
      .prepare('SELECT id, name, email, company, phone, invite_type, token, rsvp_status, guest_category, dinner, cocktail, vegetarian, workshop_type, workshop_time, checked_in, created_at FROM guests ORDER BY created_at DESC')
      .all();

    const results = guests.results as any[];

    // CSV headers
    const headers = [
      'name', 'company', 'email', 'phone', 'invite_type', 'guest_category', 'rsvp_status',
      'dinner', 'cocktail', 'vegetarian', 'workshop_type', 'workshop_time',
      'checked_in', 'created_at'
    ];

    // Convert to CSV
    const csvRows = [headers.join(',')];
    
    results.forEach(guest => {
      const row = headers.map(header => {
        let value = guest[header];
        
        // Convert boolean/number to string
        if (typeof value === 'number') {
          if (header === 'dinner' || header === 'cocktail' || header === 'vegetarian' || header === 'checked_in') {
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

// ===== Invitation Email Operations =====

// Send invitation email to a single guest
app.post('/api/admin/send-invitation/:id', requireSimpleAuth, async (c) => {
  try {
    const guestId = c.req.param('id');
    
    // Get guest details
    const guest = await c.env.DB
      .prepare('SELECT * FROM guests WHERE id = ?')
      .bind(guestId)
      .first();

    if (!guest) {
      return c.json({ error: 'Guest not found' }, 404);
    }

    // Generate invitation URL
    const inviteUrl = `${c.env.FRONTEND_URL}/rsvp?token=${guest.token}`;

    // Send invitation email
    const emailResult = await sendInvitationEmail(
      {
        resendApiKey: c.env.RESEND_API_KEY,
        fromEmail: c.env.RESEND_FROM_EMAIL,
        fromName: c.env.RESEND_FROM_NAME,
      },
      {
        to: guest.email as string,
        guestName: guest.name as string,
        inviteType: guest.invite_type as 'named' | 'company',
        inviteUrl: inviteUrl,
        eventName: c.env.EVENT_NAME || '活動邀請',
        eventDate: c.env.EVENT_DATE || '2025年10月',
        eventVenue: c.env.EVENT_VENUE || '活動場地',
      }
    );

    if (emailResult.success) {
      // Update invitation status (allow resending)
      await c.env.DB
        .prepare(`
          UPDATE guests 
          SET invitation_sent = 1, 
              invitation_sent_at = datetime('now'), 
              invitation_message_id = ?,
              updated_at = datetime('now')
          WHERE id = ?
        `)
        .bind(emailResult.messageId || null, guestId)
        .run();

      const isResend = guest.invitation_sent === 1;
      return c.json({ 
        success: true, 
        message: isResend ? '邀請郵件重新發送成功' : '邀請郵件發送成功',
        messageId: emailResult.messageId,
        isResend: isResend
      });
    } else {
      return c.json({ 
        success: false, 
        error: emailResult.error || '發送邀請郵件失敗' 
      }, 500);
    }
  } catch (error) {
    console.error('Send invitation error:', error);
    return c.json({ error: 'Failed to send invitation', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Send invitation emails to multiple guests
app.post('/api/admin/send-invitations', requireSimpleAuth, async (c) => {
  try {
    const body = await c.req.json();
    const { guestIds } = body;

    if (!guestIds || !Array.isArray(guestIds) || guestIds.length === 0) {
      return c.json({ error: 'Guest IDs array is required' }, 400);
    }

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const guestId of guestIds) {
      try {
        // Get guest details
        const guest = await c.env.DB
          .prepare('SELECT * FROM guests WHERE id = ?')
          .bind(guestId)
          .first();

        if (!guest) {
          results.push({ guestId, success: false, error: 'Guest not found' });
          failCount++;
          continue;
        }

        // Allow resending (removed skip check)

        // Generate invitation URL
        const inviteUrl = `${c.env.FRONTEND_URL}/rsvp?token=${guest.token}`;

        // Send invitation email
        const emailResult = await sendInvitationEmail(
          {
            resendApiKey: c.env.RESEND_API_KEY,
            fromEmail: c.env.RESEND_FROM_EMAIL,
            fromName: c.env.RESEND_FROM_NAME,
          },
          {
            to: guest.email as string,
            guestName: guest.name as string,
            inviteType: guest.invite_type as 'named' | 'company',
            inviteUrl: inviteUrl,
            eventName: c.env.EVENT_NAME || '活動邀請',
            eventDate: c.env.EVENT_DATE || '2025年10月',
            eventVenue: c.env.EVENT_VENUE || '活動場地',
          }
        );

        if (emailResult.success) {
          // Update invitation status
          await c.env.DB
            .prepare(`
              UPDATE guests 
              SET invitation_sent = 1, 
                  invitation_sent_at = datetime('now'), 
                  invitation_message_id = ?,
                  updated_at = datetime('now')
              WHERE id = ?
            `)
            .bind(emailResult.messageId || null, guestId)
            .run();

          results.push({ 
            guestId, 
            success: true, 
            messageId: emailResult.messageId,
            guestName: guest.name 
          });
          successCount++;
        } else {
          results.push({ 
            guestId, 
            success: false, 
            error: emailResult.error || '發送失敗' 
          });
          failCount++;
        }
      } catch (error) {
        results.push({ 
          guestId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        failCount++;
      }
    }

    return c.json({
      success: true,
      message: `批量發送完成：成功 ${successCount} 個，失敗 ${failCount} 個`,
      results: results,
      summary: {
        total: guestIds.length,
        success: successCount,
        failed: failCount
      }
    });
  } catch (error) {
    console.error('Bulk send invitations error:', error);
    return c.json({ error: 'Failed to send invitations', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// ===== Guest CRUD Operations =====

// Create new guest
app.post('/api/admin/guests', requireSimpleAuth, async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, company, phone, invite_type, guest_category } = body;

    // Validate required fields
    if (!name || !email || !invite_type) {
      return c.json({ error: 'Missing required fields: name, email, invite_type' }, 400);
    }

    // Validate guest_category
    const category = guest_category || 'netcraft';
    if (category !== 'netcraft' && category !== 'vip' && category !== 'regular') {
      return c.json({ error: 'Invalid guest_category. Must be netcraft, vip, or regular' }, 400);
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
      INSERT INTO guests (id, name, email, company, phone, invite_type, guest_category, token, rsvp_status, 
                         dinner, cocktail, workshop_type, workshop_time, checked_in, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, 0, NULL, NULL, 0, datetime('now'))
    `).bind(
      crypto.randomUUID(),
      name,
      email,
      company || null,
      phone || null,
      invite_type,
      category,
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
app.put('/api/admin/guests/:id', requireSimpleAuth, async (c) => {
  try {
    const guestId = c.req.param('id');
    const body = await c.req.json();
    console.log('[Update] Guest ID:', guestId);
    console.log('[Update] Request body:', body);
    const { name, email, company, phone, invite_type, guest_category, rsvp_status, dinner, cocktail, vegetarian, workshop_type, workshop_time } = body;

    // Validate required fields
    if (!name || !email || !invite_type) {
      return c.json({ error: 'Missing required fields: name, email, invite_type' }, 400);
    }

    // Validate guest_category
    const category = guest_category || 'netcraft';
    if (category !== 'netcraft' && category !== 'vip' && category !== 'regular') {
      return c.json({ error: 'Invalid guest_category. Must be netcraft, vip, or regular' }, 400);
    }

    // Check if email already exists for another guest
    const existingGuest = await c.env.DB.prepare(
      'SELECT id FROM guests WHERE email = ? AND id != ?'
    ).bind(email, guestId).first();

    if (existingGuest) {
      return c.json({ error: 'Email already exists for another guest' }, 400);
    }

    // Update guest
    const updateQuery = `UPDATE guests SET name = ?, email = ?, company = ?, phone = ?, invite_type = ?, guest_category = ?, rsvp_status = ?, dinner = ?, cocktail = ?, vegetarian = ?, workshop_type = ?, workshop_time = ?, updated_at = datetime('now') WHERE id = ?`;
    console.log('[Update] SQL query:', updateQuery);
    
    const bindParams = [
      name,
      email,
      company || null,
      phone || null,
      invite_type,
      category,
      rsvp_status || 'pending',
      dinner ? 1 : 0,
      cocktail ? 1 : 0,
      vegetarian ? 1 : 0,
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
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return c.json({ error: 'Failed to update guest', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Delete guest
app.delete('/api/admin/guests/:id', requireSimpleAuth, async (c) => {
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
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return c.json({ error: 'Failed to delete guest', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Get single guest by ID
app.get('/api/admin/guests/:id', requireSimpleAuth, async (c) => {
  try {
    const guestId = c.req.param('id');

    const guest = await c.env.DB.prepare(`
      SELECT id, name, email, company, phone, invite_type, token, rsvp_status, guest_category,
             dinner, cocktail, vegetarian, workshop_type, workshop_time, checked_in, 
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
        'netcraft',
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
          guestCategory: 'netcraft',
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

// ===== Manual Confirmation Email Operations =====

// Send confirmation email manually (admin only)
app.post('/api/admin/send-confirmation/:id', requireSimpleAuth, async (c) => {
  try {
    const guestId = c.req.param('id');
    
    // Get guest details
    const guest = await c.env.DB
      .prepare('SELECT * FROM guests WHERE id = ?')
      .bind(guestId)
      .first();

    if (!guest) {
      return c.json({ error: 'Guest not found' }, 404);
    }

    // Check if guest is confirmed
    if (guest.rsvp_status !== 'confirmed') {
      return c.json({ error: '只能為已確認的嘉賓發送確認郵件' }, 400);
    }

    // Generate QR Code data and save to R2
    const qrData = await generateQRCodeData(
      guest.id as string,
      guest.token as string,
      guest.name as string,
      guest.guest_category as GuestCategory,
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
        guestName: guest.name as string,
        dinner: guest.dinner === 1,
        cocktail: guest.cocktail === 1,
        vegetarian: guest.vegetarian === 1,
        workshopType: guest.workshop_type,
        workshopTime: guest.workshop_time,
        qrCodeDataURL: qrCodeUrl,
        guestCategory: guest.guest_category as GuestCategory,
        eventName: c.env.EVENT_NAME,
        eventDate: c.env.EVENT_DATE,
        eventVenue: c.env.EVENT_VENUE,
      }
    );

    if (emailResult.success) {
      return c.json({ 
        success: true, 
        message: '確認郵件發送成功',
        messageId: emailResult.messageId,
        qrCodeUrl: qrCodeUrl
      });
    } else {
      return c.json({ 
        success: false, 
        error: emailResult.error || '發送確認郵件失敗' 
      }, 500);
    }
  } catch (error) {
    console.error('Send confirmation error:', error);
    return c.json({ error: 'Failed to send confirmation', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// ===== Email Preview Operations =====

// Preview invitation email HTML
app.get('/api/admin/preview-invitation/:id', async (c) => {
  try {
    const guestId = c.req.param('id');
    
    // Get guest details
    const guest = await c.env.DB
      .prepare('SELECT * FROM guests WHERE id = ?')
      .bind(guestId)
      .first();

    if (!guest) {
      return c.json({ error: 'Guest not found' }, 404);
    }

    // Generate invitation URL
    const inviteUrl = `${c.env.FRONTEND_URL}/rsvp?token=${guest.token}`;

    // Generate HTML based on invite type
    const htmlContent = guest.invite_type === 'named'
      ? generateNamedGuestInvitationEmail({
          guestName: guest.name as string,
          inviteUrl: inviteUrl,
          eventName: c.env.EVENT_NAME || '活動邀請',
          eventDate: c.env.EVENT_DATE || '2025年12月17日（星期三）',
          eventVenue: c.env.EVENT_VENUE || '澳門銀河國際會議中心地下宴會廳',
        })
      : generateCompanyInvitationEmail({
          guestName: guest.name as string,
          inviteUrl: inviteUrl,
          eventName: c.env.EVENT_NAME || '活動邀請',
          eventDate: c.env.EVENT_DATE || '2025年12月17日（星期三）',
          eventVenue: c.env.EVENT_VENUE || '澳門銀河國際會議中心地下宴會廳',
        });

    return c.html(htmlContent);
  } catch (error) {
    console.error('Preview invitation error:', error);
    return c.json({ error: 'Failed to preview invitation', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Preview confirmation email HTML
app.get('/api/admin/preview-confirmation/:id', async (c) => {
  try {
    const guestId = c.req.param('id');
    
    // Get guest details
    const guest = await c.env.DB
      .prepare('SELECT * FROM guests WHERE id = ?')
      .bind(guestId)
      .first();

    if (!guest) {
      return c.json({ error: 'Guest not found' }, 404);
    }

    // Generate a preview QR code (for preview purposes only)
    let qrCodeDataURL: string;
    try {
      // Try to generate a real QR code for preview
      const qrData = await generateQRCodeData(
        guest.id as string,
        guest.token as string,
        guest.name as string,
        guest.guest_category as GuestCategory,
        c.env.QR_SECRET
      );
      
      // Generate QR code as data URL for preview (not saved to R2)
      const qrResponse = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`);
      if (qrResponse.ok) {
        const qrBlob = await qrResponse.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(qrBlob)));
        qrCodeDataURL = `data:image/png;base64,${base64}`;
      } else {
        // Fallback to placeholder if QR generation fails
        qrCodeDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      }
    } catch (error) {
      console.error('QR code generation failed for preview:', error);
      // Use placeholder if QR generation fails
      qrCodeDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    }

    // Generate confirmation email HTML
    const htmlContent = generateConfirmationEmail({
      guestName: guest.name as string,
      dinner: guest.dinner === 1,
      cocktail: guest.cocktail === 1,
      vegetarian: guest.vegetarian === 1,
      workshopType: guest.workshop_type,
      workshopTime: guest.workshop_time,
      qrCodeDataURL: qrCodeDataURL,
      guestCategory: guest.guest_category as GuestCategory,
      eventName: c.env.EVENT_NAME || '活動邀請',
      eventDate: c.env.EVENT_DATE || '2025年12月17日（星期三）',
      eventVenue: c.env.EVENT_VENUE || '澳門銀河國際會議中心地下宴會廳',
    });

    return c.html(htmlContent);
  } catch (error) {
    console.error('Preview confirmation error:', error);
    return c.json({ error: 'Failed to preview confirmation', details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// ===== Workshop APIs =====

// Workshop availability
app.get('/api/workshop/availability', async (c) => {
  try {
    const times = ['1630', '1700', '1730', '1800'];
    const workshopTypes = ['leather', 'perfume'];
    const capacityLimits = {
      leather: 30,
      perfume: 40
    };

    const availability: any = {
      leather: {},
      perfume: {}
    };

    for (const workshopType of workshopTypes) {
      for (const time of times) {
        const result = await c.env.DB
          .prepare(`
            SELECT COUNT(*) as count
            FROM guests
            WHERE workshop_type = ?
              AND workshop_time = ?
              AND rsvp_status = 'confirmed'
          `)
          .bind(workshopType, time)
          .first();

        const booked = (result as any)?.count || 0;
        const total = capacityLimits[workshopType as keyof typeof capacityLimits];
        const available = Math.max(0, total - booked);

        availability[workshopType][time] = {
          total,
          booked,
          available
        };
      }
    }

    return c.json(availability);
  } catch (error) {
    console.error('Workshop availability error:', error);
    return c.json({ error: 'Failed to get workshop availability' }, 500);
  }
});

// Get workshop check-ins by time slot
app.get('/api/workshop/:type/:time/checkins', async (c) => {
  const workshopType = c.req.param('type');
  const workshopTime = c.req.param('time');

  if (!['leather', 'perfume'].includes(workshopType)) {
    return c.json({ error: 'Invalid workshop type' }, 400);
  }

  if (!['1630', '1700', '1730', '1800'].includes(workshopTime)) {
    return c.json({ error: 'Invalid workshop time' }, 400);
  }

  try {
    const checkins = await c.env.DB
      .prepare(`
        SELECT 
          wc.id,
          wc.checked_in_at,
          g.name,
          g.company,
          g.email,
          g.phone,
          g.invite_type,
          g.rsvp_status
        FROM workshop_checkins wc
        JOIN guests g ON wc.guest_id = g.id
        WHERE wc.workshop_type = ? AND wc.workshop_time = ?
        ORDER BY wc.checked_in_at ASC
      `)
      .bind(workshopType, workshopTime)
      .all();

    return c.json({
      workshop_type: workshopType,
      workshop_time: workshopTime,
      checkins: checkins.results || []
    });
  } catch (error) {
    console.error('Get workshop checkins error:', error);
    return c.json({ error: 'Failed to get workshop check-ins' }, 500);
  }
});

// Get guests who selected specific workshop time slot
app.get('/api/workshop/:type/:time/guests', async (c) => {
  const workshopType = c.req.param('type');
  const workshopTime = c.req.param('time');

  if (!['leather', 'perfume'].includes(workshopType)) {
    return c.json({ error: 'Invalid workshop type' }, 400);
  }

  if (!['1630', '1700', '1730', '1800'].includes(workshopTime)) {
    return c.json({ error: 'Invalid workshop time' }, 400);
  }

  try {
    // Get all guests who selected this workshop time slot
    const guests = await c.env.DB
      .prepare(`
        SELECT 
          g.id,
          g.name,
          g.company,
          g.email,
          g.phone,
          g.invite_type,
          g.rsvp_status,
          CASE WHEN wc.id IS NOT NULL THEN 1 ELSE 0 END as checked_in,
          wc.checked_in_at
        FROM guests g
        LEFT JOIN workshop_checkins wc ON g.id = wc.guest_id AND wc.workshop_type = ? AND wc.workshop_time = ?
        WHERE g.workshop_type = ? 
          AND g.workshop_time = ? 
          AND g.rsvp_status = 'confirmed'
        ORDER BY g.name ASC
      `)
      .bind(workshopType, workshopTime, workshopType, workshopTime)
      .all();

    return c.json({
      workshop_type: workshopType,
      workshop_time: workshopTime,
      guests: guests.results || []
    });
  } catch (error) {
    console.error('Get workshop guests error:', error);
    return c.json({ error: 'Failed to get workshop guests' }, 500);
  }
});

// Export for Cloudflare Workers
export default app;

