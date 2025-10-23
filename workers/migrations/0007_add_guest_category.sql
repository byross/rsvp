-- Add guest_category field to guests table
ALTER TABLE guests ADD COLUMN guest_category TEXT NOT NULL DEFAULT 'netcraft' CHECK(guest_category IN ('netcraft', 'vip', 'regular'));

-- Update all existing records to have 'netcraft' as default category
UPDATE guests SET guest_category = 'netcraft' WHERE guest_category IS NULL;
