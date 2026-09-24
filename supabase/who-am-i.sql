-- ============================================================================
-- ClaimIt — db-side identity probe.
-- Run once in the Supabase SQL editor. Then, if login still fails, the
-- login-screen error will append:  [db sees: role=…, sub=…]
--
-- Reading the result:
--   role=authenticated, sub=user_2…  → token accepted; the DB side is fine.
--   role=anonymous,  sub=null        → Supabase REJECTED the token signature.
--       Fix: Supabase dashboard → Authentication → Third-Party Auth → add
--       Clerk with the Frontend API URL (https://<slug>.clerk.accounts.dev).
--   "function who_am_i does not exist" in the app error → this file wasn't
--       run on the same project the app uses.
-- ============================================================================

create or replace function public.who_am_i()
returns json
language sql
stable
as $$
  select json_build_object(
    'jwt_role', auth.role(),
    'uid', auth.uid(),
    'sub', auth.jwt() ->> 'sub'
  );
$$;

grant execute on function public.who_am_i() to anon, authenticated;
