-- ============================================================================
-- ClaimIt — apply the Clerk sub-based RLS fix AND verify it, in one run.
--
-- HOW TO USE
--   1. Supabase Dashboard → SQL Editor. Check the PROJECT DROPDOWN at the
--      top of the editor: it must be the project the app uses
--      (ref: yunhwfguknapqtrjouwv). Wrong project = the #1 silent failure.
--   2. Paste the WHOLE file → Run.
--   3. Read the results:
--        • Result 1 = policies (users_insert_self with_check must contain
--          "auth.jwt() ->> 'sub'")
--        • Result 2 = fix status ("fixed" or "STILL BROKEN")
--        • Result 3 = simulated insert verdict ("INSERT PASSED" or the reason)
--
--   If Result 3 says INSERT PASSED but the app still shows 42501, the token
--   the app sends differs from the simulation — tell me exactly what the
--   login screen says after reloading the app (web: hard refresh).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Re-apply the critical policies (idempotent — safe to run repeatedly).
--    Each statement is wrapped so one failure cannot roll back the rest.
-- ---------------------------------------------------------------------------

create or replace function current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from users where id = (select auth.jwt() ->> 'sub');
$$;

drop policy if exists users_select_self on users;
create policy users_select_self on users
  for select using (
    id = (select auth.jwt() ->> 'sub')
    or current_user_role() in ('staff', 'admin')
  );

drop policy if exists users_insert_self on users;
create policy users_insert_self on users
  for insert to authenticated
  with check (id = (select auth.jwt() ->> 'sub') and role = 'student');

drop policy if exists items_select_authenticated on items;
create policy items_select_authenticated on items
  for select to authenticated
  using ((select auth.jwt() ->> 'sub') is not null);

drop policy if exists audit_log_select on audit_log;
create policy audit_log_select on audit_log
  for select to authenticated
  using ((select auth.jwt() ->> 'sub') is not null);

-- ---------------------------------------------------------------------------
-- 2. Verify: show the live policies on users.
-- ---------------------------------------------------------------------------

select policyname, cmd, with_check
from pg_policies
where schemaname = 'public' and tablename = 'users'
order by policyname;

-- ---------------------------------------------------------------------------
-- 3. Verify: did the fix stick?
-- ---------------------------------------------------------------------------

select case
         when with_check like "%auth.jwt() ->> 'sub'%" then 'fixed ✅'
         else 'STILL BROKEN — with_check is: ' || with_check
       end as users_insert_self_status
from pg_policies
where schemaname = 'public'
  and tablename = 'users'
  and policyname = 'users_insert_self';

-- ---------------------------------------------------------------------------
-- 4. Verify: simulate the app's insert exactly as PostgREST would run it,
--    with a synthetic Clerk token. Rolled back immediately after.
-- ---------------------------------------------------------------------------

begin;
  select set_config('role', 'authenticated', true);
  select set_config(
    'request.jwt.claims',
    '{"sub":"user_2DIAGNOSTICPROBE","role":"authenticated"}',
    true
  );

  insert into users (id, role, name, email)
  values ('user_2DIAGNOSTICPROBE', 'student', 'RLS Probe', 'probe@claimit.test');

  select 'INSERT PASSED — database side is healthy ✅' as simulation
  from users where id = 'user_2DIAGNOSTICPROBE';
rollback;
