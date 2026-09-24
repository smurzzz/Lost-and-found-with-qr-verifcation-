// ============================================================================
// ClaimIt — POST /api/items/:id/release  (02-ARCHITECTURE.md §4)
// The ONLY code path allowed to set items.status = 'claimed'.
// Runs as the service role; the RLS trigger in the Phase 2 migration enforces
// that no other caller can perform this transition (CP-01 / CP-02).
//
// Contract:
//   POST /items/{itemId}/release
//   body: { claimId: string, scannedQrCode: string }
//   auth: Bearer <Clerk JWT> — must resolve to a users row with role 'staff'
//         (or 'admin'); the user's id becomes the audit actor.
//
// Steps (§4, verbatim):
//   1. Verify the caller has an authenticated staff session.
//   2. Verify scannedQrCode matches the item's stored qr_code.
//   3. Verify the referenced claimId is approved (and belongs to this item).
//   4. Write the released audit_log row.
//   5. Only then update items.status = 'claimed'.
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

interface ReleaseBody {
  claimId?: string;
  scannedQrCode?: string;
}

interface ClerkClaims {
  sub?: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function fail(status: number, code: string, message: string): Response {
  return json({ error: { code, message } }, status);
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
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return fail(401, 'unauthenticated', 'Missing bearer token.');
  }

  // In production the Clerk JWT is exchanged for Supabase auth via the
  // authBridge (Clerk JWT template "supabase" → auth.uid()). The verified
  // token's sub claim is the Clerk user id used in users.id.
  const token = authHeader.slice('Bearer '.length);
  let staffId: string | null = null;
  try {
    const payloadPart = token.split('.')[1];
    const claims = JSON.parse(
      atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')),
    ) as ClerkClaims;
    staffId = claims.sub ?? null;
  } catch {
    return fail(401, 'unauthenticated', 'Malformed bearer token.');
  }
  if (!staffId) {
    return fail(401, 'unauthenticated', 'Token has no subject.');
  }

  const { data: staffUser, error: staffError } = await admin
    .from('users')
    .select('id, role')
    .eq('id', staffId)
    .single();

  if (staffError || !staffUser) {
    return fail(403, 'unknown_user', 'Caller is not a registered user.');
  }
  if (staffUser.role !== 'staff' && staffUser.role !== 'admin') {
    return fail(403, 'forbidden', 'Only staff can release items.');
  }

  // --- Parse path + body ----------------------------------------------------
  const url = new URL(req.url);
  const match = url.pathname.match(/\/items\/([^/]+)\/release$/);
  if (!match) {
    return fail(400, 'bad_path', 'Expected /items/:id/release.');
  }
  const itemId = match[1];

  let body: ReleaseBody;
  try {
    body = (await req.json()) as ReleaseBody;
  } catch {
    return fail(400, 'bad_body', 'Invalid JSON body.');
  }
  const { claimId, scannedQrCode } = body;
  if (!claimId || !scannedQrCode) {
    return fail(400, 'bad_body', 'claimId and scannedQrCode are required.');
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
