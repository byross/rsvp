import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { generateQRCodeDataURL } from './qr-generator';
import { sendConfirmationEmail } from './emails/sender';

type Bindings = {
  DB: D1Database;
  ALLOWED_ORIGIN: string;
  // Resend email service
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL: string;
  RESEND_FROM_NAME: string;
  // Event information
  EVENT_NAME: string;
  EVENT_DATE: string;
  EVENT_VENUE: string;
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

    // Generate QR Code
    const qrCodeDataURL = await generateQRCodeDataURL(
      guest.id as string,
      token,
      body.name || guest.name as string,
      c.env.QR_SECRET
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
        qrCodeDataURL,
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
app.get('/api/admin/stats', async (c) => {
  // TODO: Add authentication middleware
  
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
app.get('/api/admin/guests', async (c) => {
  // TODO: Add authentication middleware
  
  try {
    const guests = await c.env.DB
      .prepare('SELECT * FROM guests ORDER BY created_at DESC')
      .all();

    return c.json(guests.results);
  } catch (error) {
    console.error('Database error:', error);
    return c.json({ error: 'Database error' }, 500);
  }
});

// Import guests from CSV (admin only)
app.post('/api/admin/import', async (c) => {
  // TODO: Add authentication middleware
  
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
        const { name, email, company, invite_type } = row;

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
              id, name, company, email, token, invite_type,
              rsvp_status, dinner, cocktail, checked_in,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, 0, 0, datetime('now'), datetime('now'))
          `)
          .bind(id, name, company || null, email, token, invite_type)
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
app.get('/api/admin/export', async (c) => {
  // TODO: Add authentication middleware
  
  try {
    const guests = await c.env.DB
      .prepare('SELECT * FROM guests ORDER BY created_at DESC')
      .all();

    const results = guests.results as any[];

    // CSV headers
    const headers = [
      'name', 'company', 'email', 'invite_type', 'rsvp_status',
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

// Test email sending (for development only)
app.post('/api/test-email', async (c) => {
  const body = await c.req.json();
  const { email, type = 'confirmation' } = body;

  if (!email) {
    return c.json({ error: 'Email is required' }, 400);
  }

  try {
    if (type === 'confirmation') {
      // Generate a test QR code
      const qrCodeDataURL = await generateQRCodeDataURL(
        'test-id-123',
        'test-token-001',
        '測試用戶',
        c.env.QR_SECRET
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
          qrCodeDataURL,
          eventName: c.env.EVENT_NAME,
          eventDate: c.env.EVENT_DATE,
          eventVenue: c.env.EVENT_VENUE,
        }
      );

      return c.json({ 
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      });
    }

    return c.json({ error: 'Invalid email type' }, 400);
  } catch (error) {
    console.error('Test email error:', error);
    return c.json({ error: 'Failed to send test email' }, 500);
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

