// ============================================================================
// ClaimIt — POST /release  (02-ARCHITECTURE.md §4)
// The ONLY code path allowed to set items.status = 'claimed'.
// Runs as the service role; the RLS trigger in the Phase 2 migration enforces
// that no other caller can perform this transition (CP-01 / CP-02).
//
// Contract:
//   POST /functions/v1/release
//   body: { itemId: string, claimId: string, scannedQrCode: string }
//   auth: Bearer <Clerk JWT> — must resolve to a users row with role 'staff'
//         (or 'admin'); the user's id becomes the audit actor.
//
// Steps (§4, verbatim):
//   1. Verify the caller has an authenticated staff session.
//   2. Verify scannedQrCode matches the item's stored qr_code.
//   3. Verify the referenced claimId is approved (and belongs to this item).
//   4. Write the released audit_log row.
//   5. Only then update items.status = 'claimed'.
//
// Phase 9 notes:
//   - itemId moved into the body. Supabase invokes this function at
//     /functions/v1/release, so a /items/:id/release path could never be
//     reached from the native client — the body form is what actually ships.
//   - Auth + response helpers are shared via _shared/claimit.ts.
//   - The claim must ALREADY be 'approved'. Approval is a separate staff step
//     (RLS `claims_update_staff`) taken on the release sheet after comparing
//     the verification answer with the physical item.
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CORS, fail, json, requireStaffUser } from '../_shared/claimit.ts';

interface ReleaseBody {
  itemId?: string;
  claimId?: string;
  scannedQrCode?: string;
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

  // --- Step 1: authenticated staff session ---------------------------------
  const auth = await requireStaffUser(req, admin);
  if (!auth.ok) {
    return auth.response;
  }
  const staffId = auth.staffId;

  // --- Parse body -------------------------------------------------------------
  let body: ReleaseBody;
  try {
    body = (await req.json()) as ReleaseBody;
  } catch {
    return fail(400, 'bad_body', 'Invalid JSON body.');
  }
  const { itemId, claimId, scannedQrCode } = body;
  if (!itemId || !claimId || !scannedQrCode) {
    return fail(400, 'bad_body', 'itemId, claimId and scannedQrCode are required.');
  }

  // --- Step 2: scanned QR matches the item's stored qr_code ----------------
  const { data: item, error: itemError } = await admin
    .from('items')
    .select('id, status, qr_code')
    .eq('id', itemId)
    .single();

  if (itemError || !item) {
    return fail(404, 'item_not_found', 'No such item.');
  }
  if (!item.qr_code || item.qr_code !== scannedQrCode) {
    return fail(409, 'qr_mismatch', 'Scanned QR does not match this item.');
  }
  if (item.status === 'claimed') {
    return fail(409, 'already_claimed', 'Item was already released.');
  }

  // --- Step 3: the referenced claim is approved (and for this item) --------
  const { data: claim, error: claimError } = await admin
    .from('claims')
    .select('id, item_id, status, claimant_id')
    .eq('id', claimId)
    .single();

  if (claimError || !claim) {
    return fail(404, 'claim_not_found', 'No such claim.');
  }
  if (claim.item_id !== item.id) {
    return fail(409, 'claim_item_mismatch', 'Claim does not belong to this item.');
  }
  if (claim.status !== 'approved') {
    return fail(409, 'claim_not_approved', 'Claim must be approved before release.');
  }

  // --- Step 4: write the released audit row --------------------------------
  const { error: auditError } = await admin.from('audit_log').insert({
    item_id: item.id,
    event_type: 'released',
    actor_id: staffId,
    note: `QR scan verified handoff to claim ${claim.id}`,
  });
  if (auditError) {
    return fail(500, 'audit_failed', `Could not write audit row: ${auditError.message}`);
  }

  // --- Step 5: only now set items.status = 'claimed' ------------------------
  const { error: updateError } = await admin
    .from('items')
    .update({ status: 'claimed' })
    .eq('id', item.id);

  if (updateError) {
    return fail(500, 'release_failed', `Could not release item: ${updateError.message}`);
  }

  return json({ ok: true, itemId: item.id, claimId: claim.id });
});
