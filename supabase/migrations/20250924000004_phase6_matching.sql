-- ============================================================================
-- ClaimIt — Phase 6: matching + push notifications
-- ----------------------------------------------------------------------------
-- 1. users.push_token — the Expo push token a student registers on their
--    device; the server reads it so a probable match can trigger a push.
--    RLS: column-level UPDATE grant — a person can only write their OWN row's
--    push_token, never role/name/email (no privilege escalation).
-- 2. find_possible_matches(report_id) — v1 matching (02-ARCHITECTURE.md §6):
--      * hard gates: item not claimed, same category (case-insensitive),
--        found within 14 days of the lost date;
--      * signal: description keyword overlap (a word >= 4 chars shared)
--        OR location proximity (contains / is contained by, case-insensitive).
--    The seeded lost report ("Electronics" headphones at Student Center)
--    matches the White headphones item via category + keyword overlap — that
--    is the Phase 6 exit criterion.
-- ============================================================================

-- --- 1. Notification tokens ----------------------------------------------------

alter table users add column if not exists push_token text;

-- Column-level privilege: RLS decides WHO, the grant decides WHAT columns.
revoke update on table users from authenticated;
grant update (push_token) on table users to authenticated;

drop policy if exists users_update_self_push_token on users;
create policy users_update_self_push_token on users
  for update to authenticated
  using (id = auth.uid()::text)
  with check (id = auth.uid()::text);

-- --- 2. v1 matching scan -------------------------------------------------------

drop function if exists find_possible_matches(uuid);
create function find_possible_matches(target_report_id uuid)
returns setof items
language sql
stable
as $$
  select i.*
  from items i
  join lost_reports l on l.id = find_possible_matches.target_report_id
  where i.status <> 'claimed'
    and lower(i.category) = lower(l.category)
    -- found_date within 14 days of lost_date (forward or backward)
    and abs(extract(epoch from (i.found_date - l.lost_date))) <= 14 * 86400
    and (
      -- description keyword overlap (at least one meaningful shared word)
      exists (
        select 1
        from unnest(string_to_array(lower(l.description), ' ')) as word(word)
        where length(word) >= 4
          and lower(i.description) like '%' || word || '%'
      )
      -- OR location proximity (one contains the other)
      or lower(i.found_location) = lower(l.lost_location)
      or lower(i.found_location) like '%' || lower(l.lost_location) || '%'
      or lower(l.lost_location) like '%' || lower(i.found_location) || '%'
    );
$$;

-- Hot path: matching scans candidates by category + status.
create index if not exists items_match_idx
  on items (category) where status <> 'claimed';