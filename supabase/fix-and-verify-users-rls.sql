-- ============================================================================
-- ClaimIt — apply the Clerk sub-based RLS fix AND verify it, in one run.
-- (v3 — probe cleanup used set_config('role','') which Postgres rejects with
--  22023 "role '' does not exist"; that aborted the run and rolled the fix
--  back. The probe is now wrapped so NO statement in this file can abort the
--  transaction: every failure becomes a report, the fix always commits.)
--
-- HOW TO USE
--   1. Supabase Dashboard → SQL Editor (project yunhwfguknapqtrjouwv).
--   2. Paste the WHOLE file → Run.
--   3. Read the output:
--        • Table 1 = live policies on users (users_insert_self must contain
--          auth.jwt() ->> 'sub')
--        • Table 2 = "fixed ✅" or "STILL BROKEN — …"
--        • Messages tab = "PROBE RESULT: …"
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. The fix (critical part — pure DDL, idempotent).
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
-- 2. Verify: live policies on users (eyeball check).
-- ---------------------------------------------------------------------------

select policyname, cmd, with_check
from pg_policies
where schemaname = 'public' and tablename = 'users'
order by policyname;

-- ---------------------------------------------------------------------------
-- 3. Verify: did the fix stick?
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
-- 4. Probe: simulate the app's insert as a Clerk caller. EVERY step is
--    exception-guarded; a failure is reported, never thrown, so the run
--    (and the fix above) always commits. Output → Messages tab.
-- ---------------------------------------------------------------------------

do $probe$
declare
  insert_err text;
  cleanup_err text;
begin
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config(
      'request.jwt.claims',
      '{"sub":"user_2DIAGNOSTICPROBE","role":"authenticated"}',
      true
    );

    insert into users (id, role, name, email)
    values ('user_2DIAGNOSTICPROBE', 'student', 'RLS Probe', 'probe@claimit.test');

    raise notice 'PROBE RESULT: INSERT PASSED — database side is healthy ✅ (if the app still fails, reload it and tell me the new login-screen error)';
  exception when others then
    insert_err := sqlerrm;
  end;

  -- Reset to the session role ('none' is the valid reset value; '' is an
  -- error) and clean up the probe row. Both failures are non-fatal.
  begin
    perform set_config('role', 'none', true);
  exception when others then
    raise notice 'PROBE NOTE: could not reset role → %', sqlerrm;
  end;

  begin
    delete from users where id = 'user_2DIAGNOSTICPROBE';
  exception when others then
    cleanup_err := sqlerrm;
  end;

  if insert_err is not null then
    raise notice 'PROBE RESULT: insert rejected → %', insert_err;
  elsif cleanup_err is not null then
    raise notice 'PROBE RESULT: insert passed, but probe row cleanup failed (%). Leftover row user_2DIAGNOSTICPROBE in users — delete it manually whenever.', cleanup_err;
  end if;
end $probe$;
