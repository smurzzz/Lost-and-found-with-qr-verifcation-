// ============================================================================
// ClaimIt — POST /api/match      (02-ARCHITECTURE.md §6)
// Runs as the service role. Scans found items for a probable match against a
// lost report (find_possible_matches), flags the report as 'possible_match',
// writes 'matched' audit rows, and best-effort pushes an Expo notification to
// the reporter.
//
// Contract:
//   POST /match
//   body: { lostReportId: string }
//   auth: Bearer <session access token> — the caller must own the report (the student who
//         filed it), or be staff/admin.
//
// Guard rails (AGENTS.md):
//   * Never touches items.status — the 'claimed' transition stays exclusively
//     on /items/:id/release.
//   * lost_reports.status moves monotonically searching → possible_match; the
//     'matched' audit rows are written only on that transition (idempotent
//     re-runs don't duplicate history).
//   * The push is best-effort: a missing/invalid Expo token degrades to the
//     in-app UI states (Matches screen), never an error.
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface MatchBody {
  lostReportId?: string;
}

interface TokenClaims {
  sub?: string;
}

interface MatchResult {
  id: string;
  [key: string]: unknown;
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

/** Fire the Expo push. Best-effort: notified = false on any failure. */
async function notify(admin: AdminClient, ownerId: string, matchCount: number): Promise<boolean> {
  let pushToken: string | null = null;
  try {
    const { data, error } = await admin
      .from('users')
      .select('push_token')
      .eq('id', ownerId)
      .single();
    if (error || !data?.push_token) return false;
    pushToken = data.push_token;
  } catch {
    return false;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: pushToken,
        title: 'Possible match found',
        body:
          matchCount === 1
            ? 'We found an item that may match your lost report — check Possible Matches.'
            : `We found ${matchCount} items that may match your lost report — check Possible Matches.`,
        channelId: 'matches',
      }),
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
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

  // --- Auth: authenticated caller (must own the report or be staff) ----------
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return fail(401, 'unauthenticated', 'Missing bearer token.');
  }
  const token = authHeader.slice('Bearer '.length);
  let callerId: string | null = null;
  try {
    const payloadPart = token.split('.')[1];
    const claims = JSON.parse(
      atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')),
    ) as TokenClaims;
    callerId = claims.sub ?? null;
  } catch {
    return fail(401, 'unauthenticated', 'Malformed bearer token.');
  }
  if (!callerId) {
    return fail(401, 'unauthenticated', 'Token has no subject.');
  }

  const { data: caller, error: callerError } = await admin
    .from('users')
    .select('id, role')
    .eq('id', callerId)
    .single();

  if (callerError || !caller) {
    return fail(403, 'unknown_user', 'Caller is not a registered user.');
  }

  // --- Parse + validate body -------------------------------------------------
  let body: MatchBody;
  try {
    body = (await req.json()) as MatchBody;
  } catch {
    return fail(400, 'bad_body', 'Invalid JSON body.');
  }
  const lostReportId = (body.lostReportId ?? '').trim();
  if (!UUID_RE.test(lostReportId)) {
    return fail(400, 'bad_body', 'lostReportId must be a valid UUID.');
  }

  // --- Load the report + ownership check -------------------------------------
  const { data: report, error: reportError } = await admin
    .from('lost_reports')
    .select('id, reported_by, status, category, description, lost_location, lost_date')
    .eq('id', lostReportId)
    .single();

  if (reportError || !report) {
    return fail(404, 'not_found', 'No lost report with that id.');
  }
  if (report.reported_by !== callerId && caller.role !== 'staff' && caller.role !== 'admin') {
    return fail(403, 'forbidden', 'You can only match your own lost reports.');
  }

  // --- Run the matching scan (v1: find_possible_matches, migration 04) -------
  const { data: matches, error: matchError } = await admin.rpc('find_possible_matches', {
    target_report_id: lostReportId,
  });

  if (matchError) {
    return fail(500, 'match_failed', `Matching scan failed: ${matchError.message}`);
  }
  const matchRows = (matches ?? []) as MatchResult[];

  if (matchRows.length === 0) {
    return json({ ok: true, matches: 0, report_status: report.status, notified: false });
  }

  // --- Transition searching → possible_match once (idempotent) ----------------
  let finalStatus = report.status;
  if (report.status !== 'possible_match') {
    const { error: updateError } = await admin
      .from('lost_reports')
      .update({ status: 'possible_match' })
      .eq('id', report.id);
    if (updateError) {
      return fail(500, 'update_failed', `Could not flag the report: ${updateError.message}`);
    }
    for (const item of matchRows) {
      const { error: auditError } = await admin.from('audit_log').insert({
        item_id: item.id,
        event_type: 'matched',
        actor_id: null,
        note: 'Item matched with a lost report.',
      });
      if (auditError) {
        return fail(
          500,
          'audit_failed',
          `Report flagged but the audit row failed: ${auditError.message}`,
        );
      }
    }
    finalStatus = 'possible_match';
  }

  // --- Best-effort push to the reporter ---------------------------------------
  const notified = await notify(admin, report.reported_by, matchRows.length);

  return json({ ok: true, matches: matchRows.length, report_status: finalStatus, notified });
});
