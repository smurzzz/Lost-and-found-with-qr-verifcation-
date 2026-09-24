// ============================================================================
// ClaimIt — POST /confirm-receipt    (02-ARCHITECTURE.md §4 supporting endpoints)
// Runs as the service role. Staff confirm a student-reported item's arrival:
// the item transitions pending_dropoff → available for the first time, gets a
// server-minted QR tag (the same shared generation path as /log-found), and a
// 'confirmed' audit_log row is written. Returns the updated item so the client
// can render the real (scannable) QR tag.
//
// Contract:
//   POST /confirm-receipt
//   body: { itemId: string }
//   auth: Bearer <Clerk JWT> — must resolve to a users row with role 'staff'
//         (or 'admin'); the user's id becomes the item's confirmed_by and the
//         audit actor.
//
// Preconditions (409 otherwise):
//   - the item exists (404)
//   - source = 'student_reported'   (staff-logged items skip this step)
//   - status = 'pending_dropoff'    (an item confirms exactly once)
//
// The 'claimed' transition is still only reachable via /items/:id/release.
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CORS, fail, json, requireStaffUser, uniqueQrCode } from '../_shared/claimit.ts';

interface ConfirmBody {
  itemId?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }
  if (req.method !== 'POST') {
    return fail(405, 'method_not_allowed', 'Use POST.');
  }

  // --- Service-role client (bypasses RLS; this function IS the trusted path)
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  if (!serviceKey || !supabaseUrl) {
    return fail(500, 'server_config', 'Missing Supabase service configuration.');
  }
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // --- Auth: authenticated staff session (same contract as release) --------
  const auth = await requireStaffUser(req, admin);
  if (!auth.ok) {
    return auth.response;
  }
  const staffId = auth.staffId;

  // --- Parse + validate body -------------------------------------------------
  let body: ConfirmBody;
  try {
    body = (await req.json()) as ConfirmBody;
  } catch {
    return fail(400, 'bad_body', 'Invalid JSON body.');
  }

  const itemId = (body.itemId ?? '').trim();
  if (!itemId) {
    return fail(400, 'bad_body', 'itemId is required.');
  }

  // --- Load + validate the item ------------------------------------------------
  const { data: item, error: loadError } = await admin
    .from('items')
    .select('*')
    .eq('id', itemId)
    .maybeSingle();
  if (loadError) {
    return fail(500, 'load_failed', `Could not load the item: ${loadError.message}`);
  }
  if (!item) {
    return fail(404, 'unknown_item', 'No found item with that id.');
  }

  if (item.source !== 'student_reported') {
    return fail(
      409,
      'not_student_reported',
      'Only student-reported items need receipt confirmation.',
    );
  }
  if (item.status !== 'pending_dropoff') {
    const message =
      item.status === 'available'
        ? 'This item was already confirmed.'
        : `An item in state '${item.status}' cannot be confirmed.`;
    return fail(409, 'not_pending', message);
  }

  // --- Mint the server-side QR tag -------------------------------------------
  const qrCode = await uniqueQrCode(admin);
  if (!qrCode) {
    return fail(500, 'qr_generation_failed', 'Could not allocate a unique QR tag.');
  }

  const now = new Date().toISOString();

  // --- Transition the item ----------------------------------------------------
  const { data: updated, error: updateError } = await admin
    .from('items')
    .update({
      status: 'available',
      qr_code: qrCode,
      confirmed_by: staffId,
      confirmed_at: now,
    })
    .eq('id', itemId)
    .select('*')
    .single();

  if (updateError) {
    return fail(500, 'update_failed', `Could not confirm the item: ${updateError.message}`);
  }

  // --- Audit row (best-effort: the item is already committed above) ----------
  const { error: auditError } = await admin.from('audit_log').insert({
    item_id: itemId,
    event_type: 'confirmed',
    actor_id: staffId,
    note: 'Receipt confirmed; QR tag generated.',
  });
  if (auditError) {
    return fail(
      500,
      'audit_failed',
      `Item confirmed but the audit row failed: ${auditError.message}`,
    );
  }

  return json({ ok: true, item: updated });
});
