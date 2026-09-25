-- ClaimIt — Promote faldashenry25@gmail.com to staff
--
-- Run in Supabase Dashboard → SQL Editor.
--
-- The user's `users` row must already exist (created on their first sign-in).
-- If they have never signed in, there is no row yet — have them sign in once
-- (they land as a student), then run this and have them sign out + back in.
--
-- After running: sign out in the app and sign back in (or fully reload it) —
-- the entry screen re-reads the users row and routes to the staff dashboard.

update users
set role = 'staff'
where email = 'faldashenry25@gmail.com';

-- Verify: the row should show role = staff.
select id, name, email, role, created_at
from users
order by role, name;
