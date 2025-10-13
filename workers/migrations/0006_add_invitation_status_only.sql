-- Add invitation email status tracking fields (if not exists)
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- So we'll use a different approach

-- First, try to add the columns (will fail if they already exist, but that's OK)
-- We'll handle this in the application code

-- Add invitation_sent column
ALTER TABLE guests ADD COLUMN invitation_sent INTEGER NOT NULL DEFAULT 0;

-- Add invitation_sent_at column  
ALTER TABLE guests ADD COLUMN invitation_sent_at DATETIME;

-- Add invitation_message_id column
ALTER TABLE guests ADD COLUMN invitation_message_id TEXT;

-- Create indexes for invitation status
CREATE INDEX IF NOT EXISTS idx_guests_invitation_sent ON guests(invitation_sent);
CREATE INDEX IF NOT EXISTS idx_guests_invitation_sent_at ON guests(invitation_sent_at);
