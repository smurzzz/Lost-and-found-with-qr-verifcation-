-- ============================================================================
-- ClaimIt — Phase 2 schema (02-ARCHITECTURE.md §3, verbatim)
-- Applies with: supabase db push  (or the Supabase SQL editor)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type user_role as enum ('student', 'staff', 'admin');
create type item_source as enum ('staff_logged', 'student_reported');
create type item_status as enum ('pending_dropoff', 'available', 'pending_claim', 'claimed');
create type lost_report_status as enum ('searching', 'possible_match', 'claimed', 'closed');
create type claim_status as enum ('pending', 'approved', 'released');
create type audit_event as enum (
  'reported', 'confirmed', 'found', 'matched', 'claim_requested', 'released'
);

-- ---------------------------------------------------------------------------
-- Tables (02-ARCHITECTURE.md §3)
-- ---------------------------------------------------------------------------

create table users (
  id            uuid primary key,            -- Clerk user id (migrated to text in phase 3)
  role          user_role not null default 'student',
  name          text not null,
  email         text not null unique,        -- school domain enforced at signup
  class_or_dept text,
  created_at    timestamptz not null default now()
);

create table items (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  category       text not null,
  description    text not null default '',
  photo_url      text,
  found_location text not null,
  found_date     timestamptz not null default now(),
  source         item_source not null,
  reported_by    uuid references users (id) on delete set null,  -- null if staff_logged
  status         item_status not null default 'pending_dropoff',
  qr_code        text,                       -- null until receipt confirmed
  confirmed_by   uuid references users (id) on delete set null,
  confirmed_at   timestamptz,
  created_at     timestamptz not null default now()
);

create table lost_reports (
  id            uuid primary key default gen_random_uuid(),
  reported_by   uuid not null references users (id) on delete cascade,
  category      text not null,
  description   text not null,
  lost_location text not null,
  lost_date     timestamptz not null default now(),
  status        lost_report_status not null default 'searching',
  created_at    timestamptz not null default now()
);

create table claims (
  id                  uuid primary key default gen_random_uuid(),
  item_id             uuid not null references items (id) on delete cascade,
  claimant_id         uuid not null references users (id) on delete cascade,
  verification_answer text not null,
  status              claim_status not null default 'pending',
  created_at          timestamptz not null default now()
);

create table audit_log (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references items (id) on delete cascade,
  event_type audit_event not null,
  actor_id   uuid references users (id) on delete set null,  -- null = system
  note       text not null default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes for the app's hot paths (feed scan, per-item history, my claims)
-- ---------------------------------------------------------------------------

create index items_status_idx on items (status, found_date desc);
create index items_category_idx on items (category);
create index items_reported_by_idx on items (reported_by);
create index lost_reports_reported_by_idx on lost_reports (reported_by, status);
create index claims_item_idx on claims (item_id, status);
create index claims_claimant_idx on claims (claimant_id, status);
create index audit_log_item_idx on audit_log (item_id, created_at desc);

-- ============================================================================
-- Row-Level Security
-- ============================================================================

alter table users enable row level security;
alter table items enable row level security;
alter table lost_reports enable row level security;
alter table claims enable row level security;
alter table audit_log enable row level security;

-- Helper: current caller's role from their Clerk-synced users row.
-- With no auth (anon) or no users row, this returns null (no access).
create or replace function current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from users where id = auth.uid();
$$;

-- users: you may read your own row; staff may read all (claimant names).
create policy users_select_self on users
  for select using (id = auth.uid() or current_user_role() in ('staff', 'admin'));

-- Items ---------------------------------------------------------------------

-- Everyone authenticated (student or staff) can browse the found-items feed.
create policy items_select_authenticated on items
  for select using (auth.uid() is not null);

-- Students report found items (status stays pending_dropoff; qr_code null).
create policy items_insert_student on items
  for insert to authenticated
  with check (
    source = 'student_reported'
    and reported_by = auth.uid()
    and status = 'pending_dropoff'
    and qr_code is null
  );

-- Staff log found items directly as available (QR generated on confirm/log).
create policy items_insert_staff on items
  for insert to authenticated
  with check (
    current_user_role() in ('staff', 'admin')
    and source = 'staff_logged'
  );

-- Staff update items (edit details, confirm receipt → available).
create policy items_update_staff on items
  for update to authenticated
  using (current_user_role() in ('staff', 'admin'))
  with check (current_user_role() in ('staff', 'admin'));

-- ============================================================================
-- THE NON-NEGOTIABLE CONSTRAINT (02-ARCHITECTURE.md §4)
-- items.status may only become 'claimed' through the release Edge Function,
-- which runs as the service role. Everyone else is blocked by trigger —
-- including staff clients and the anon role (CP-01 / CP-02).
-- ============================================================================

create or replace function enforce_release_only_status_lock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'claimed' and old.status is distinct from 'claimed' then
    -- Only the service role (the release Edge Function) may pass.
    if auth.role() <> 'service_role' then
      raise exception
        'items.status can only be set to claimed via the release endpoint (02-ARCHITECTURE.md §4)';
    end if;
  end if;
  return new;
end;
$$;

create trigger items_status_lock
  before update on items
  for each row execute function enforce_release_only_status_lock();

-- lost_reports: students manage their own; staff read all.
create policy lost_reports_select on lost_reports
  for select using (
    reported_by = auth.uid() or current_user_role() in ('staff', 'admin')
  );

create policy lost_reports_insert_own on lost_reports
  for insert to authenticated
  with check (reported_by = auth.uid());

create policy lost_reports_update_own on lost_reports
  for update to authenticated
  using (reported_by = auth.uid())
  with check (reported_by = auth.uid());

-- claims: students file/read their own; staff read all, approve, and release.
create policy claims_select on claims
  for select using (
    claimant_id = auth.uid() or current_user_role() in ('staff', 'admin')
  );

create policy claims_insert_own on claims
  for insert to authenticated
  with check (
    claimant_id = auth.uid()
    and status = 'pending'
  );

create policy claims_update_staff on claims
  for update to authenticated
  using (current_user_role() in ('staff', 'admin'))
  with check (current_user_role() in ('staff', 'admin'));

-- audit_log: append-only. Staff and system write; authenticated users read
-- (the Audit screen shows per-item history).
create policy audit_log_select on audit_log
  for select using (auth.uid() is not null);

create policy audit_log_insert_staff on audit_log
  for insert to authenticated
  with check (current_user_role() in ('staff', 'admin'));

-- (No UPDATE/DELETE policies anywhere on audit_log — it is append-only.)
