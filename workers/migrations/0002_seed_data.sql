-- Sample seed data for testing (optional)
-- This file can be used to add test data to your database

-- Example named guest (情況一)
INSERT OR IGNORE INTO guests (
  id, name, company, email, token, invite_type, rsvp_status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '張三',
  'ABC Company',
  'zhang.san@example.com',
  'token_abc123',
  'named',
  'pending'
);

-- Example company invitation (情況二)
INSERT OR IGNORE INTO guests (
  id, name, company, email, token, invite_type, rsvp_status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  'To be confirmed',
  'XYZ Corporation',
  'contact@xyzcorp.com',
  'token_xyz789',
  'company',
  'pending'
);

-- Example confirmed guest with workshop
INSERT OR IGNORE INTO guests (
  id, name, company, email, token, invite_type, rsvp_status, 
  dinner, cocktail, workshop_type, workshop_time
) VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  '李四',
  'DEF Ltd',
  'li.si@example.com',
  'token_def456',
  'named',
  'confirmed',
  1,
  1,
  'leather',
  '1700'
);



