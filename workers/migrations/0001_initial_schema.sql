-- Create guests table
CREATE TABLE IF NOT EXISTS guests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  invite_type TEXT NOT NULL CHECK(invite_type IN ('named', 'company')),
  rsvp_status TEXT NOT NULL DEFAULT 'pending' CHECK(rsvp_status IN ('pending', 'confirmed', 'declined')),
  dinner INTEGER NOT NULL DEFAULT 0,
  cocktail INTEGER NOT NULL DEFAULT 0,
  workshop_type TEXT CHECK(workshop_type IN ('leather', 'perfume')),
  workshop_time TEXT CHECK(workshop_time IN ('1630', '1700', '1730', '1800')),
  seat_no TEXT,
  checked_in INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create scan_logs table
CREATE TABLE IF NOT EXISTS scan_logs (
  id TEXT PRIMARY KEY,
  guest_id TEXT NOT NULL,
  scan_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  staff_id TEXT,
  status TEXT NOT NULL CHECK(status IN ('success', 'duplicate', 'error')),
  FOREIGN KEY (guest_id) REFERENCES guests(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_guests_token ON guests(token);
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);
CREATE INDEX IF NOT EXISTS idx_guests_rsvp_status ON guests(rsvp_status);
CREATE INDEX IF NOT EXISTS idx_scan_logs_guest_id ON scan_logs(guest_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_scan_time ON scan_logs(scan_time);





