-- ============================================================================
-- ClaimIt — apply the Clerk sub-based RLS fix AND verify it, in one run.
-- (v2 — fixes the double-quoted LIKE literal that errored with 42703, and
--  replaces the BEGIN/ROLLBACK probe with an exception-safe DO block so no
--  statement in this file can roll back the others.)
--
-- HOW TO USE
--   1. Supabase Dashboard → SQL Editor. Confirm the PROJECT is the one the
--      app uses (ref: yunhwfguknapqtrjouwv).
--   2. Paste the WHOLE file → Run.
--   3. Read the output:
--        • Table 1 = live policies on users
--        • Table 2 = "fixed ✅" or "STILL BROKEN — …"
--        • Messages tab = "PROBE RESULT: INSERT PASSED …" or the rejection
--          reason
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Re-apply the critical policies (idempotent — safe to run repeatedly).
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
-- 2. Show the live policies on users (eyeball check).
-- ---------------------------------------------------------------------------

select policyname, cmd, with_check
from pg_policies
where schemaname = 'public' and tablename = 'users'
order by policyname;

-- ---------------------------------------------------------------------------
-- 3. Status: did the fix stick? (single-quoted LIKE literal, '' escaped)
-- ---------------------------------------------------------------------------

select case
         when with_check like '%auth.jwt() ->> ''sub''%' then 'fixed ✅'
         else 'STILL BROKEN — with_check is: ' || coalesce(with_check, 'null')
       end as users_insert_self_status
from pg_policies
where schemaname = 'public'
  and tablename = 'users'
  and policyname = 'users_insert_self';

-- ---------------------------------------------------------------------------
-- 4. Probe: simulate the app's insert as a Clerk caller. Exception-safe —
--    a rejection is reported, not thrown, and the probe row is cleaned up.
--    Output appears in the SQL editor's Messages tab.
-- ---------------------------------------------------------------------------

do $probe$
declare
  probe_err text;
begin
  -- Emulate what PostgREST does for a Clerk JWT:
  perform set_config('role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    '{"sub":"user_2DIAGNOSTICPROBE","role":"authenticated"}',
    true
  );

  begin
    insert into users (id, role, name, email)
    values ('user_2DIAGNOSTICPROBE', 'student', 'RLS Probe', 'probe@claimit.test');
  exception when others then
    probe_err := sqlerrm;
  end;

  -- Back to the session role so the cleanup delete bypasses RLS.
  perform set_config('role', '', true);

  if probe_err is null then
    delete from users where id = 'user_2DIAGNOSTICPROBE';
    raise notice 'PROBE RESULT: INSERT PASSED — database side is healthy ✅ (if the app still fails, the token it sends differs — tell me the new login-screen error)';
  else
    raise notice 'PROBE RESULT: insert rejected → %', probe_err;
  end if;
end $probe$;
