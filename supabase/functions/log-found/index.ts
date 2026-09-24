// ============================================================================
// ClaimIt — POST /api/log-found      (02-ARCHITECTURE.md §4)
// Runs as the service role. Creates a staff-logged found item with a server-
// generated signed QR token plus a 'found' audit_log row, then returns the
// created item so the client can render the real (scannable) QR tag.
//
// Contract:
//   POST /log-found
//   body: { title: string, category: string, description?: string,
//           found_location: string, found_date?: string }
//   auth: Bearer <Clerk JWT> — must resolve to a users row with role 'staff'
//         (or 'admin'); the user's id becomes the item's confirmed_by and the
//         audit actor.
//
// QR: the item row is inserted first, then qr_code is set to the signed token
// `<itemId>.<HMAC-SHA256(itemId, CLAIMIT_QR_SECRET)>` (shared _shared/claimit.ts
// mint — never client-side), so a tag can never be forged without the secret.
//
// A staff-logged item starts life in 'available' (it skips pending_dropoff).
// The 'claimed' transition is still only reachable via /release.
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CORS, fail, json, requireStaffUser, signedQrToken } from '../_shared/claimit.ts';

const MAX_TITLE = 120;
const MAX_CATEGORY = 60;
const MAX_DESCRIPTION = 2000;
const MAX_LOCATION = 120;

interface LogFoundBody {
  title?: string;
  category?: string;
  description?: string;
  found_location?: string;
  found_date?: string;
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
  let body: LogFoundBody;
  try {
    body = (await req.json()) as LogFoundBody;
  } catch {
    return fail(400, 'bad_body', 'Invalid JSON body.');
  }

  const title = (body.title ?? '').trim();
  const category = (body.category ?? '').trim();
  const description = (body.description ?? '').trim();
  const foundLocation = (body.found_location ?? '').trim();

  if (!title || !category || !foundLocation) {
    return fail(400, 'bad_body', 'title, category and found_location are required.');
  }
  if (title.length > MAX_TITLE) {
    return fail(400, 'bad_body', `title is too long (max ${MAX_TITLE} characters).`);
  }
  if (category.length > MAX_CATEGORY) {
    return fail(400, 'bad_body', `category is too long (max ${MAX_CATEGORY} characters).`);
  }
  if (foundLocation.length > MAX_LOCATION) {
    return fail(400, 'bad_body', `found_location is too long (max ${MAX_LOCATION} characters).`);
  }
  if (description.length > MAX_DESCRIPTION) {
    return fail(400, 'bad_body', `description is too long (max ${MAX_DESCRIPTION} characters).`);
  }

  // --- Insert the item (qr_code is filled with the signed token below) ------
  const foundDate =
    body.found_date && !Number.isNaN(Date.parse(body.found_date))
      ? new Date(body.found_date).toISOString()
      : new Date().toISOString();
  const now = new Date().toISOString();

  const { data: item, error: insertError } = await admin
    .from('items')
    .insert({
      title,
      category,
      description,
      photo_url: null,
      found_location: foundLocation,
      found_date: foundDate,
      source: 'staff_logged',
      status: 'available',
      qr_code: null,
      confirmed_by: staffId,
      confirmed_at: now,
    })
    .select('*')
    .single();

  if (insertError) {
    return fail(500, 'insert_failed', `Could not create the item: ${insertError.message}`);
  }

  // --- Mint the signed QR token over the item id (server-only secret) -------
  const qrCode = await signedQrToken(item.id);
  if (!qrCode) {
    await admin
      .from('items')
      .delete()
      .eq('id', item.id)
      .catch(() => undefined);
    return fail(
      500,
      'qr_generation_failed',
      'CLAIMIT_QR_SECRET is not configured; could not mint a signed QR tag.',
    );
  }
  const { error: qrUpdateError } = await admin
    .from('items')
    .update({ qr_code: qrCode })
    .eq('id', item.id);
  if (qrUpdateError) {
    await admin
      .from('items')
      .delete()
      .eq('id', item.id)
      .catch(() => undefined);
    return fail(
      500,
      'qr_generation_failed',
      `Could not attach the QR tag: ${qrUpdateError.message}`,
    );
  }
  item.qr_code = qrCode;

  // --- Audit row (best-effort: the item is already committed above) ----------
  const { error: auditError } = await admin.from('audit_log').insert({
    item_id: item.id,
    event_type: 'found',
    actor_id: staffId,
    note: 'Item found and logged with a server-generated QR tag.',
  });
  if (auditError) {
    return fail(
      500,
      'audit_failed',
      `Item created but the audit row failed: ${auditError.message}`,
    );
  }

  return json({ ok: true, item });
});
