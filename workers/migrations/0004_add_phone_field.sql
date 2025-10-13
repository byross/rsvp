-- Add phone field to guests table
ALTER TABLE guests ADD COLUMN phone TEXT;

-- Create index for phone field
CREATE INDEX IF NOT EXISTS idx_guests_phone ON guests(phone);
