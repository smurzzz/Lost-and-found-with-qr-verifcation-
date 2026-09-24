-- ============================================================================
-- ClaimIt — Phase 7: claims wiring
-- ----------------------------------------------------------------------------
-- 1. When a claim is filed, the item it points at moves available →
--    pending_claim — but ONLY when it is currently 'available'. Unconfirmed
--    (pending_dropoff) and already-pending_claim items are left untouched, and
--    this trigger can never write 'claimed' (that transition stays exclusive to
--    the release endpoint + items_status_lock trigger — AGENTS one-rule).
-- 2. A server-side guard against double-claiming: at most one *pending* claim
--    per item. Approved/closed claims still allow a fresh one later.
-- ============================================================================

-- --- 1. Claim filed → item enters the claim pipeline -------------------------

create or replace function enforce_claim_marks_item_pending()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update items
     set status = 'pending_claim'
   where id = new.item_id
     and status = 'available';
  return new;
end;
$$;

drop trigger if exists claims_mark_item_pending_trigger on claims;
create trigger claims_mark_item_pending_trigger
  after insert on claims
  for each row execute function enforce_claim_marks_item_pending();

-- --- 2. One pending claim per item (server-enforced, not just UI) ------------

create unique index if not exists claims_one_pending_per_item
  on claims (item_id) where status = 'pending';