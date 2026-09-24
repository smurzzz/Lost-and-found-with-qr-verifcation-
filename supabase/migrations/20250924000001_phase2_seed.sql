-- ============================================================================
-- ClaimIt — Phase 2 seed (dev/demo dataset only)
-- Fixed UUIDs so the app mocks and tests can reference them deterministically.
-- ============================================================================

-- Test users (ids are Clerk-shaped; swap for real Clerk ids in Phase 3)
insert into users (id, role, name, email, class_or_dept) values
  ('00000000-0000-4000-8000-000000000001', 'student', 'Alex Morgan',  'alex.morgan@school.edu',  'Class 10B'),
  ('00000000-0000-4000-8000-000000000002', 'staff',   'Maya Chen',    'maya.chen@school.edu',    'Front Desk'),
  ('00000000-0000-4000-8000-000000000003', 'student', 'Taylor Roberts','taylor.roberts@school.edu', 'Class 9A')
on conflict (id) do nothing;

-- Items matching the app's v3 mock feed --------------------------------------
insert into items (id, title, category, description, photo_url, found_location, found_date, source, status, qr_code, confirmed_by, confirmed_at) values
  ('10000000-0000-4000-8000-000000000001', 'Navy backpack',       'Bags',        'Blue canvas backpack with a red keychain', null, 'North Library',  now() - interval '2 hours',  'staff_logged',      'available',      'FND-7X2B9', '00000000-0000-4000-8000-000000000002', now() - interval '1 hour'),
  ('10000000-0000-4000-8000-000000000002', 'White headphones',    'Electronics', 'Over-ear headphones, small blue mark under left ear cup', null, 'Music Room', now() - interval '4 hours', 'staff_logged',      'pending_claim',  'FND-3KQ81', '00000000-0000-4000-8000-000000000002', now() - interval '3 hours'),
  ('10000000-0000-4000-8000-000000000003', 'Green water bottle',  'Other',       'Insulated green bottle, sticker on the lid', null, 'West Gym',      now() - interval '1 day',   'student_reported',  'pending_dropoff', null,       null,                                   null),
  ('10000000-0000-4000-8000-000000000004', 'Black wallet & keys', 'IDs/Cards',   'Black leather wallet with keys attached', null, 'Science Hall',   now() - interval '2 days',  'staff_logged',      'claimed',        'FND-9WM42', '00000000-0000-4000-8000-000000000002', now() - interval '2 days')
on conflict (id) do nothing;

-- Alex's open lost report (matches the white headphones) ---------------------
insert into lost_reports (id, reported_by, category, description, lost_location, lost_date, status) values
  ('20000000-0000-4000-8000-000000000001',
   '00000000-0000-4000-8000-000000000001',
   'Electronics',
   'White over-ear headphones with a small blue mark under the left ear cup',
   'Student Center',
   now() - interval '3 days',
   'possible_match')
on conflict (id) do nothing;

-- Taylor's approved claim on the white headphones ----------------------------
insert into claims (id, item_id, claimant_id, verification_answer, status) values
  ('30000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000002',
   '00000000-0000-4000-8000-000000000003',
   'Small blue marker line under the left ear cup.',
   'approved')
on conflict (id) do nothing;

-- Audit history for the backpack (found → available) -------------------------
insert into audit_log (item_id, event_type, actor_id, note, created_at) values
  ('10000000-0000-4000-8000-000000000001', 'found',   '00000000-0000-4000-8000-000000000002', 'Item was found and logged.',        now() - interval '2 hours'),
  ('10000000-0000-4000-8000-000000000001', 'confirmed','00000000-0000-4000-8000-000000000002', 'Receipt confirmed; QR tag generated.', now() - interval '1 hour');

-- Audit history for the white headphones (found → matched → claim) -----------
insert into audit_log (item_id, event_type, actor_id, note, created_at) values
  ('10000000-0000-4000-8000-000000000002', 'found',           '00000000-0000-4000-8000-000000000002', 'Item was found and logged.',       now() - interval '4 hours'),
  ('10000000-0000-4000-8000-000000000002', 'matched',         null,                                   'Item matched with a lost report.', now() - interval '3 hours'),
  ('10000000-0000-4000-8000-000000000002', 'claim_requested', '00000000-0000-4000-8000-000000000003', 'Claim request submitted.',         now() - interval '2 hours');

-- Audit history for the student-reported bottle ------------------------------
insert into audit_log (item_id, event_type, actor_id, note, created_at) values
  ('10000000-0000-4000-8000-000000000003', 'reported', '00000000-0000-4000-8000-000000000001', 'Student reported a found item; awaiting drop-off.', now() - interval '1 day');
