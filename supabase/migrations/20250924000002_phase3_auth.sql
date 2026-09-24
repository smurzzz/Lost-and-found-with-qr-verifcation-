-- ============================================================================
-- ClaimIt — Phase 3 auth support (real Clerk identity)
-- Applies with: supabase db push  (or the Supabase SQL editor)
--
-- Phase 2 seeded the users table with fixed UUIDs and typed users.id as uuid.
-- Real Clerk user ids are NOT uuids (they look like 'user_2xYzAbC...'), and
-- RLS resolves the caller via auth.uid() (the Clerk JWT 'sub' claim). For the
-- synced users row to match auth.uid(), users.id and the columns that
-- reference it must be text.
--
-- Also adds the missing self-signup policy: a new student creates their own
-- users row (role forced to 'student'). Staff stay invite-only — their row
-- must be provisioned by an admin/service role, never self-created.
--
-- PostgreSQL cannot alter a column's type while RLS policies / SQL functions
-- depend on that column, so every dependent object is dropped first and
-- recreated afterwards. The migration is idempotent (safe to re-run after a
-- partial apply).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Drop everything that depends on the columns we are about to re-typify.
-- ---------------------------------------------------------------------------

drop policy if exists users_select_self on users;
drop policy if exists users_insert_self on users;
drop policy if exists items_select_authenticated on items;
drop policy if exists items_insert_student on items;
drop policy if exists items_insert_staff on items;
drop policy if exists items_update_staff on items;
drop policy if exists lost_reports_select on lost_reports;
drop policy if exists lost_reports_insert_own on lost_reports;
drop policy if exists lost_reports_update_own on lost_reports;
drop policy if exists claims_select on claims;
drop policy if exists claims_insert_own on claims;
drop policy if exists claims_update_staff on claims;
drop policy if exists audit_log_select on audit_log;
drop policy if exists audit_log_insert_staff on audit_log;

drop function if exists current_user_role();

-- ---------------------------------------------------------------------------
-- 1. users.id is uuid → text; drop inbound FKs first, re-add them after.
-- ---------------------------------------------------------------------------

alter table items drop constraint if exists items_reported_by_fkey;
alter table items drop constraint if exists items_confirmed_by_fkey;
alter table lost_reports drop constraint if exists lost_reports_reported_by_fkey;
alter table claims drop constraint if exists claims_claimant_id_fkey;
alter table audit_log drop constraint if exists audit_log_actor_id_fkey;

alter table users alter column id type text;
alter table items alter column reported_by type text;
alter table items alter column confirmed_by type text;
alter table lost_reports alter column reported_by type text;
alter table claims alter column claimant_id type text;
alter table audit_log alter column actor_id type text;

alter table items add constraint items_reported_by_fkey
  foreign key (reported_by) references users (id) on delete set null;
alter table items add constraint items_confirmed_by_fkey
  foreign key (confirmed_by) references users (id) on delete set null;
alter table lost_reports add constraint lost_reports_reported_by_fkey
  foreign key (reported_by) references users (id) on delete cascade;
alter table claims add constraint claims_claimant_id_fkey
  foreign key (claimant_id) references users (id) on delete cascade;
alter table audit_log add constraint audit_log_actor_id_fkey
  foreign key (actor_id) references users (id) on delete set null;

-- ---------------------------------------------------------------------------
-- 2. current_user_role(): users.id is now text; compare against auth.uid()::text.
-- ---------------------------------------------------------------------------

create or replace function current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from users where id = auth.uid()::text;
$$;

-- ---------------------------------------------------------------------------
-- 3. Recreate every RLS policy from Phase 2, with bare column comparisons
--    against auth.uid() updated to auth.uid()::text (id columns are now text;
--    PostgreSQL has no implicit uuid = text, and no CREATE OR REPLACE POLICY).
-- ---------------------------------------------------------------------------

-- users: you may read your own row; staff may read all (claimant names).
drop policy if exists users_select_self on users;
create policy users_select_self on users
  for select using (id = auth.uid()::text or current_user_role() in ('staff', 'admin'));

-- Items ---------------------------------------------------------------------

-- Everyone authenticated (student or staff) can browse the found-items feed.
drop policy if exists items_select_authenticated on items;
create policy items_select_authenticated on items
  for select using (auth.uid() is not null);

-- Students report found items (status stays pending_dropoff; qr_code null).
drop policy if exists items_insert_student on items;
create policy items_insert_student on items
  for insert to authenticated
  with check (
    source = 'student_reported'
    and reported_by = auth.uid()::text
    and status = 'pending_dropoff'
    and qr_code is null
  );

-- Staff log found items directly as available (QR generated on confirm/log).
drop policy if exists items_insert_staff on items;
create policy items_insert_staff on items
  for insert to authenticated
  with check (
    current_user_role() in ('staff', 'admin')
    and source = 'staff_logged'
  );

-- Staff update items (edit details, confirm receipt → available).
drop policy if exists items_update_staff on items;
create policy items_update_staff on items
  for update to authenticated
  using (current_user_role() in ('staff', 'admin'))
  with check (current_user_role() in ('staff', 'admin'));

-- lost_reports: students manage their own; staff read all.
drop policy if exists lost_reports_select on lost_reports;
create policy lost_reports_select on lost_reports
  for select using (
    reported_by = auth.uid()::text or current_user_role() in ('staff', 'admin')
  );

drop policy if exists lost_reports_insert_own on lost_reports;
create policy lost_reports_insert_own on lost_reports
  for insert to authenticated
  with check (reported_by = auth.uid()::text);

drop policy if exists lost_reports_update_own on lost_reports;
create policy lost_reports_update_own on lost_reports
  for update to authenticated
  using (reported_by = auth.uid()::text)
  with check (reported_by = auth.uid()::text);

-- claims: students file/read their own; staff read all, approve, and release.
drop policy if exists claims_select on claims;
create policy claims_select on claims
  for select using (
    claimant_id = auth.uid()::text or current_user_role() in ('staff', 'admin')
  );

drop policy if exists claims_insert_own on claims;
create policy claims_insert_own on claims
  for insert to authenticated
  with check (
    claimant_id = auth.uid()::text
    and status = 'pending'
  );

drop policy if exists claims_update_staff on claims;
create policy claims_update_staff on claims
  for update to authenticated
  using (current_user_role() in ('staff', 'admin'))
  with check (current_user_role() in ('staff', 'admin'));

-- audit_log: append-only. Staff and system write; authenticated users read.
drop policy if exists audit_log_select on audit_log;
create policy audit_log_select on audit_log
  for select using (auth.uid() is not null);

drop policy if exists audit_log_insert_staff on audit_log;
create policy audit_log_insert_staff on audit_log
  for insert to authenticated
  with check (current_user_role() in ('staff', 'admin'));

-- ---------------------------------------------------------------------------
-- 4. NEW — student self-signup. The sync insert creates this row on first
--    login; RLS forces role='student' so nobody self-promotes to staff.
-- ---------------------------------------------------------------------------

drop policy if exists users_insert_self on users;
create policy users_insert_self on users
  for insert to authenticated
  with check (id = auth.uid()::text and role = 'student');