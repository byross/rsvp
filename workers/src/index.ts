import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  DB: D1Database;
  ALLOWED_ORIGIN: string;
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

    return c.json({ 
      success: true, 
      message: 'RSVP submitted successfully' 
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

