// ============================================================================
// ClaimIt — POST /api/log-found      (02-ARCHITECTURE.md §4)
// Runs as the service role. Creates a staff-logged found item with a server-
// generated QR tag code plus a 'found' audit_log row, then returns the created
// item so the client can render the real (scannable) QR tag.
//
// Contract:
//   POST /log-found
//   body: { title: string, category: string, description?: string,
//           found_location: string, found_date?: string }
//   auth: Bearer <Clerk JWT> — must resolve to a users row with role 'staff'
//         (or 'admin'); the user's id becomes the item's confirmed_by and the
//         audit actor.
//
// A staff-logged item starts life in 'available' (it skips pending_dropoff).
// The 'claimed' transition is still only reachable via /items/:id/release.
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

// No 0/O/1/I — keeps printed tags unambiguous.
const TAG_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
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

interface ClerkClaims {
  sub?: string;
}

// Deno + esm.sh types; this file is not part of the Expo tsc graph.
type AdminClient = ReturnType<typeof createClient>;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function fail(status: number, code: string, message: string): Response {
  return json({ error: { code, message } }, status);
}

/** Random FND-XXXXX tag (5 chars from the unambiguous alphabet). */
function randomTag(): string {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  let tag = '';
  for (const byte of bytes) {
    tag += TAG_ALPHABET[byte % TAG_ALPHABET.length];
  }
  return `FND-${tag}`;
}

/** Mint a unique tag (partial unique index on items.qr_code backs this up). */
async function uniqueQrCode(admin: AdminClient): Promise<string | null> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const tag = randomTag();
    const { count, error } = await admin
      .from('items')
      .select('id', { count: 'exact', head: true })
      .eq('qr_code', tag);
    if (error) return null;
    if ((count ?? 1) === 0) return tag;
  }
  return null;
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
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return fail(401, 'unauthenticated', 'Missing bearer token.');
  }
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
    return fail(403, 'forbidden', 'Only staff can log found items.');
  }

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

  // --- Mint the server-side QR tag -------------------------------------------
  const qrCode = await uniqueQrCode(admin);
  if (!qrCode) {
    return fail(500, 'qr_generation_failed', 'Could not allocate a unique QR tag.');
  }

  const foundDate =
    body.found_date && !Number.isNaN(Date.parse(body.found_date))
      ? new Date(body.found_date).toISOString()
      : new Date().toISOString();
  const now = new Date().toISOString();

  // --- Insert the item --------------------------------------------------------
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
      qr_code: qrCode,
      confirmed_by: staffId,
      confirmed_at: now,
    })
    .select('*')
    .single();

  if (insertError) {
    return fail(500, 'insert_failed', `Could not create the item: ${insertError.message}`);
  }

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
