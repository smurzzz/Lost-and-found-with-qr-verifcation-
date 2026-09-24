-- ============================================================================
-- ClaimIt — Phase 10 audit integrity: every transition auto-writes an audit row
-- ----------------------------------------------------------------------------
-- Append-only audit rows for STUDENT-originated transitions are created by
-- SECURITY DEFINER AFTER INSERT triggers, because students hold no audit_log
-- INSERT rights (RLS `audit_log_insert_staff` is staff/admin-only). Previously
-- the client tried to write `claim_requested` itself — under RLS that insert
-- was DENIED for a student after the claim row had already been created, which
-- (a) made the claim appear to error and (b) dropped the audit row. Now both
-- student transitions are atomic with their primary write:
--
--   1. student-reported item -> audit 'reported'
--   2. claim filed           -> audit 'claim_requested'
--
-- (found/confirmed/matched/released already come from the staff/service-role
-- Edge Functions, which bypass RLS — CP-07: every transition leaves a row.)
-- ============================================================================

-- --- 1. Item reported by a student -> 'reported' -----------------------------

create or replace function log_student_reported_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.source = 'student_reported' then
    insert into audit_log (item_id, event_type, actor_id, note)
    values (
      new.id,
      'reported',
      new.reported_by,
      'Student reported a found item; awaiting drop-off.'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists items_student_reported_audit_trigger on items;
create trigger items_student_reported_audit_trigger
  after insert on items
  for each row execute function log_student_reported_item();

-- --- 2. Claim filed -> 'claim_requested' -------------------------------------

create or replace function log_claim_requested_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_log (item_id, event_type, actor_id, note)
  values (new.item_id, 'claim_requested', new.claimant_id, 'Claim request submitted.');
  return new;
end;
$$;

drop trigger if exists claims_requested_audit_trigger on claims;
create trigger claims_requested_audit_trigger
  after insert on claims
  for each row execute function log_claim_requested_audit();