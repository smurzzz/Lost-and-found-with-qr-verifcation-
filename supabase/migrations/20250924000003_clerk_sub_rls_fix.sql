-- ============================================================================
-- ClaimIt — fix Clerk identity resolution in RLS (Phase 3 hotfix)
-- Applies with: supabase db push  (or the Supabase SQL editor)
--
-- Problem: 20250924000002_phase3_auth.sql compares users.id (text) against
-- auth.uid()::text. auth.uid() casts the JWT `sub` claim to uuid, and Clerk
-- ids are NOT uuids ('user_2xYzAbC...'), so auth.uid() can never match a
-- Clerk caller. Result: the first-login `users` insert fails with
-- "new row violates row-level security policy for table users" (and the
-- self-select silently returns no rows).
--
-- Fix: identify the caller by the raw `sub` string, per Supabase's
-- third-party-auth guidance: auth.jwt() ->> 'sub'. This is what the app's
-- syncUserOnLogin() inserts as users.id, so the two sides finally agree.
--
-- Idempotent: drops and recreates the affected policies (same names).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. current_user_role(): resolve the caller's row via the Clerk `sub` string.
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

-- ---------------------------------------------------------------------------
-- 2. Recreate every policy that referenced auth.uid(), using the Clerk sub.
--    `(select ...)` form lets the planner evaluate the claim once per query.
-- ---------------------------------------------------------------------------

-- users ---------------------------------------------------------------------

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

-- items ---------------------------------------------------------------------

drop policy if exists items_select_authenticated on items;
create policy items_select_authenticated on items
  for select to authenticated
  using ((select auth.jwt() ->> 'sub') is not null);

drop policy if exists items_insert_student on items;
create policy items_insert_student on items
  for insert to authenticated
  with check (
    source = 'student_reported'
    and reported_by = (select auth.jwt() ->> 'sub')
    and status = 'pending_dropoff'
    and qr_code is null
  );

drop policy if exists items_insert_staff on items;
create policy items_insert_staff on items
  for insert to authenticated
  with check (
    current_user_role() in ('staff', 'admin')
    and source = 'staff_logged'
  );

drop policy if exists items_update_staff on items;
create policy items_update_staff on items
  for update to authenticated
  using (current_user_role() in ('staff', 'admin'))
  with check (current_user_role() in ('staff', 'admin'));

-- lost_reports ---------------------------------------------------------------

drop policy if exists lost_reports_select on lost_reports;
create policy lost_reports_select on lost_reports
  for select using (
    reported_by = (select auth.jwt() ->> 'sub')
    or current_user_role() in ('staff', 'admin')
  );

drop policy if exists lost_reports_insert_own on lost_reports;
create policy lost_reports_insert_own on lost_reports
  for insert to authenticated
  with check (reported_by = (select auth.jwt() ->> 'sub'));

drop policy if exists lost_reports_update_own on lost_reports;
create policy lost_reports_update_own on lost_reports
  for update to authenticated
  using (reported_by = (select auth.jwt() ->> 'sub'))
  with check (reported_by = (select auth.jwt() ->> 'sub'));

-- claims ---------------------------------------------------------------------

drop policy if exists claims_select on claims;
create policy claims_select on claims
  for select using (
    claimant_id = (select auth.jwt() ->> 'sub')
    or current_user_role() in ('staff', 'admin')
  );

drop policy if exists claims_insert_own on claims;
create policy claims_insert_own on claims
  for insert to authenticated
  with check (
    claimant_id = (select auth.jwt() ->> 'sub')
    and status = 'pending'
  );

drop policy if exists claims_update_staff on claims;
create policy claims_update_staff on claims
  for update to authenticated
  using (current_user_role() in ('staff', 'admin'))
  with check (current_user_role() in ('staff', 'admin'));

-- audit_log ------------------------------------------------------------------

drop policy if exists audit_log_select on audit_log;
create policy audit_log_select on audit_log
  for select to authenticated
  using ((select auth.jwt() ->> 'sub') is not null);

drop policy if exists audit_log_insert_staff on audit_log;
create policy audit_log_insert_staff on audit_log
  for insert to authenticated
  with check (current_user_role() in ('staff', 'admin'));
