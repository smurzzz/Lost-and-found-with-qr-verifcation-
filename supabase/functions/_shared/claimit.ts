// ============================================================================
// ClaimIt — shared helpers for Edge Functions (02-ARCHITECTURE.md §4)
//
// Imported via `../_shared/claimit.ts` so the QR-minting + staff-auth paths
// ship once (09-FUNCTIONALITY-PROMPT.md §9: "don't duplicate this logic,
// share it"). `supabase functions deploy` bundles this file into each
// function that imports it. Covers CORS/JSON/fail helpers, the signed QR
// token mint+verify (HMAC-SHA256 over the item id), and the staff JWT check.
//
// Deno + esm.sh types; this file is not part of the Expo tsc graph.
//
// Function secret required: CLAIMIT_QR_SECRET — QR mining fails closed (null)
// when it is not set, so deployed functions never produce unsigned tags.
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

// ----------------------------------------------------------------------------
// Signed QR tokens (09 §8 / §11): qr_code stores `<itemId>.<sig>` where sig =
// base64url(HMAC-SHA256(itemId, CLAIMIT_QR_SECRET)). Tokens are minted ONLY by
// server-side Edge Functions (this module) and verified again in /release —
// the scan flow never trusts a client-decoded payload. Seeded FND-XXXXX tags
// from before this change remain valid lookups, but new tags are always signed.
// ----------------------------------------------------------------------------

const QR_SECRET_VAR = 'CLAIMIT_QR_SECRET';

function qrSecret(): string | null {
  return Deno.env.get(QR_SECRET_VAR) ?? null;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const byte of bytes) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmacSha256(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return bytesToBase64Url(new Uint8Array(signature));
}

/** Mint `<itemId>.<sig>` for a specific item. Null if the secret is unset. */
export async function signedQrToken(itemId: string): Promise<string | null> {
  const secret = qrSecret();
  if (!secret) return null;
  const signature = await hmacSha256(secret, itemId);
  return `${itemId}.${signature}`;
}

/** Verify a token's HMAC signature server-side. */
export async function isSignedQrValid(token: string): Promise<boolean> {
  const dot = token.indexOf('.');
  if (dot <= 0 || dot === token.length - 1) return false;
  const itemId = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const secret = qrSecret();
  if (!secret) return false;
  const expected = await hmacSha256(secret, itemId);
  return signature === expected;
}

// --- Staff auth -------------------------------------------------------------

interface TokenClaims {
  sub?: string;
}

export type StaffAuth = { ok: true; staffId: string } | { ok: false; response: Response };

/**
 * Verify the caller is an authenticated staff/admin user (same contract as
 * /release). Decodes the Bearer JWT subject and resolves it against the users
 * table. The token is the app session's access token (applied from Clerk's
 * `supabase` JWT template — `sub` = the Clerk user id = users.id), so this
 * resolves exactly as designed. NOTE: signature verification is not performed
 * here (see the "production hardening" blocker in 07-PROGRESS-TRACKER.md) —
 * acceptable for the current self-hosted demo deployment.
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
    ) as TokenClaims;
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
