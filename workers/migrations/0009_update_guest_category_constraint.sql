-- Update guest_category CHECK constraint to include 'guest' type
-- SQLite doesn't support modifying CHECK constraints directly, so we need to rebuild the table
-- Note: We need to disable foreign key checks temporarily to rebuild the table

-- Step 1: Disable foreign key checks
PRAGMA foreign_keys = OFF;

-- Step 2: Create new table with updated CHECK constraint
CREATE TABLE guests_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  token TEXT UNIQUE NOT NULL,
  invite_type TEXT NOT NULL CHECK(invite_type IN ('named', 'company')),
  rsvp_status TEXT NOT NULL DEFAULT 'pending' CHECK(rsvp_status IN ('pending', 'confirmed', 'declined')),
  guest_category TEXT NOT NULL DEFAULT 'netcraft' CHECK(guest_category IN ('netcraft', 'vip', 'guest', 'regular')),
  dinner INTEGER NOT NULL DEFAULT 0,
  cocktail INTEGER NOT NULL DEFAULT 0,
  vegetarian INTEGER NOT NULL DEFAULT 0,
  workshop_type TEXT CHECK(workshop_type IN ('leather', 'perfume')),
  workshop_time TEXT CHECK(workshop_time IN ('1630', '1700', '1730', '1800')),
  seat_no TEXT,
  checked_in INTEGER NOT NULL DEFAULT 0,
  invitation_sent INTEGER NOT NULL DEFAULT 0,
  invitation_sent_at DATETIME,
  invitation_message_id TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Copy all data from old table to new table
INSERT INTO guests_new (
  id, name, company, email, phone, token, invite_type, rsvp_status, guest_category,
  dinner, cocktail, vegetarian, workshop_type, workshop_time, seat_no, checked_in,
  invitation_sent, invitation_sent_at, invitation_message_id, created_at, updated_at
)
SELECT 
  id, name, company, email, phone, token, invite_type, rsvp_status, guest_category,
  dinner, cocktail, COALESCE(vegetarian, 0) as vegetarian, workshop_type, workshop_time, seat_no, checked_in,
  COALESCE(invitation_sent, 0) as invitation_sent, invitation_sent_at, invitation_message_id, created_at, updated_at
FROM guests;

-- Step 4: Drop old table
DROP TABLE guests;

-- Step 5: Rename new table to original name
ALTER TABLE guests_new RENAME TO guests;

-- Step 6: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_guests_token ON guests(token);
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);
CREATE INDEX IF NOT EXISTS idx_guests_rsvp_status ON guests(rsvp_status);
CREATE INDEX IF NOT EXISTS idx_guests_phone ON guests(phone);
CREATE INDEX IF NOT EXISTS idx_guests_guest_category ON guests(guest_category);

-- Step 7: Re-enable foreign key checks
PRAGMA foreign_keys = ON;

