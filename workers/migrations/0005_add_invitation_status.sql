-- Add invitation email status tracking fields
ALTER TABLE guests ADD COLUMN invitation_sent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE guests ADD COLUMN invitation_sent_at DATETIME;
ALTER TABLE guests ADD COLUMN invitation_message_id TEXT;

-- Create index for invitation status
CREATE INDEX IF NOT EXISTS idx_guests_invitation_sent ON guests(invitation_sent);
CREATE INDEX IF NOT EXISTS idx_guests_invitation_sent_at ON guests(invitation_sent_at);

