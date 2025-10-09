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

