-- Update guest_category CHECK constraint to include 'guest' type
-- SQLite doesn't support modifying CHECK constraints directly, so we need to rebuild the table
-- Since this is test data, we'll drop foreign key tables first, rebuild guests, then recreate them

-- Step 1: Drop tables with foreign key constraints (test data only)
DROP TABLE IF EXISTS workshop_checkins;
DROP TABLE IF EXISTS scan_logs;

-- Step 2: Create new guests table with updated CHECK constraint
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

-- Step 7: Recreate scan_logs table
CREATE TABLE scan_logs (
  id TEXT PRIMARY KEY,
  guest_id TEXT NOT NULL,
  scan_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  staff_id TEXT,
  status TEXT NOT NULL CHECK(status IN ('success', 'duplicate', 'error')),
  FOREIGN KEY (guest_id) REFERENCES guests(id)
);

-- Step 8: Recreate scan_logs indexes
CREATE INDEX IF NOT EXISTS idx_scan_logs_guest_id ON scan_logs(guest_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_scan_time ON scan_logs(scan_time);

-- Step 9: Recreate workshop_checkins table
CREATE TABLE workshop_checkins (
  id TEXT PRIMARY KEY,
  guest_id TEXT NOT NULL,
  workshop_type TEXT NOT NULL CHECK(workshop_type IN ('leather', 'perfume')),
  workshop_time TEXT NOT NULL CHECK(workshop_time IN ('1630', '1700', '1730', '1800')),
  checked_in_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  staff_id TEXT,
  FOREIGN KEY (guest_id) REFERENCES guests(id)
);

-- Step 10: Recreate workshop_checkins indexes
CREATE INDEX IF NOT EXISTS idx_workshop_checkins_guest_id ON workshop_checkins(guest_id);
CREATE INDEX IF NOT EXISTS idx_workshop_checkins_workshop ON workshop_checkins(workshop_type, workshop_time);
CREATE INDEX IF NOT EXISTS idx_workshop_checkins_checked_in_at ON workshop_checkins(checked_in_at);

