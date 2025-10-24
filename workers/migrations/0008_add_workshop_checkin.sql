-- Create workshop_checkins table for tracking workshop-specific check-ins
CREATE TABLE IF NOT EXISTS workshop_checkins (
  id TEXT PRIMARY KEY,
  guest_id TEXT NOT NULL,
  workshop_type TEXT NOT NULL CHECK(workshop_type IN ('leather', 'perfume')),
  workshop_time TEXT NOT NULL CHECK(workshop_time IN ('1630', '1700', '1730', '1800')),
  checked_in_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  staff_id TEXT,
  FOREIGN KEY (guest_id) REFERENCES guests(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workshop_checkins_guest_id ON workshop_checkins(guest_id);
CREATE INDEX IF NOT EXISTS idx_workshop_checkins_workshop ON workshop_checkins(workshop_type, workshop_time);
CREATE INDEX IF NOT EXISTS idx_workshop_checkins_checked_in_at ON workshop_checkins(checked_in_at);
