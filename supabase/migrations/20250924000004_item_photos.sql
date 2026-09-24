-- ============================================================================
-- ClaimIt — item photo storage (Phase 6 functionality pass)
-- Applies with: supabase db push (or the Supabase SQL editor).
--
-- Creates the public `item-photos` bucket and its policies:
--   - anyone can view photos (the feed shows them to all signed-in users)
--   - signed-in users can upload into their own folder (items/<uid>/…)
--   - uploaders may replace/delete their own objects
-- Also adds lost_reports.photo_url so a lost report can carry a reference
-- photo of the missing item.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', true)
on conflict (id) do nothing;

-- Public read (photos render in <Image> without signed URLs).
create policy "item photos public read"
  on storage.objects for select
  using (bucket_id = 'item-photos');

-- Any signed-in user may upload into their own folder (enforced by the
-- (storage.bucket_id = 'item-photos') and name prefix checks below).
create policy "item photos authenticated upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'item-photos'
    and (storage.foldername(name))[1] = auth.jwt() ->> 'sub'
  );

create policy "item photos owner update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'item-photos'
    and (storage.foldername(name))[1] = auth.jwt() ->> 'sub'
  );

create policy "item photos owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'item-photos'
    and (storage.foldername(name))[1] = auth.jwt() ->> 'sub'
  );

-- Lost reports carry an optional reference photo of the missing item.
alter table lost_reports add column if not exists photo_url text;
