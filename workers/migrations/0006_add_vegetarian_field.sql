-- Add vegetarian field to guests table
ALTER TABLE guests ADD COLUMN vegetarian INTEGER NOT NULL DEFAULT 0;
