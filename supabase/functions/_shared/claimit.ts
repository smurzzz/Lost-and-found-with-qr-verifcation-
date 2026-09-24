// ============================================================================
// ClaimIt — shared helpers for Edge Functions (02-ARCHITECTURE.md §4)
//
// Imported via `../_shared/claimit.ts` so the QR-minting + staff-auth paths
// ship once (09-FUNCTIONALITY-PROMPT.md §9: "don't duplicate this logic,
// share it"). `supabase functions deploy` bundles this file into each
// function that imports it.
//
// Deno + esm.sh types; this file is not part of the Expo tsc graph.
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type AdminClient = ReturnType<typeof createClient>;

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

export function fail(status: number, code: string, message: string): Response {
  return json({ error: { code, message } }, status);
}

// No 0/O/1/I — keeps printed tags unambiguous.
const TAG_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Random FND-XXXXX tag (5 chars from the unambiguous alphabet). */
export function randomTag(): string {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  let tag = '';
  for (const byte of bytes) {
    tag += TAG_ALPHABET[byte % TAG_ALPHABET.length];
  }
  return `FND-${tag}`;
}

/** Mint a unique tag (partial unique index on items.qr_code backs this up). */
export async function uniqueQrCode(admin: AdminClient): Promise<string | null> {
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

interface ClerkClaims {
  sub?: string;
}

export type StaffAuth = { ok: true; staffId: string } | { ok: false; response: Response };

/**
 * Verify the caller is an authenticated staff/admin user (same contract as
 * /release). Decodes the Bearer Clerk JWT subject and resolves it against the
 * users table. NOTE: signature verification is not performed here (see the
 * "production hardening" blocker in 07-PROGRESS-TRACKER.md) — acceptable for
 * the current self-hosted demo deployment.
 */
export async function requireStaffUser(req: Request, admin: AdminClient): Promise<StaffAuth> {
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return { ok: false, response: fail(401, 'unauthenticated', 'Missing bearer token.') };
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
    return { ok: false, response: fail(401, 'unauthenticated', 'Malformed bearer token.') };
  }
  if (!staffId) {
    return { ok: false, response: fail(401, 'unauthenticated', 'Token has no subject.') };
  }

  const { data: staffUser, error } = await admin
    .from('users')
    .select('id, role')
    .eq('id', staffId)
    .single();

  if (error || !staffUser) {
    return { ok: false, response: fail(403, 'unknown_user', 'Caller is not a registered user.') };
  }
  if (staffUser.role !== 'staff' && staffUser.role !== 'admin') {
    return { ok: false, response: fail(403, 'forbidden', 'Only staff can perform this action.') };
  }
  return { ok: true, staffId };
}
