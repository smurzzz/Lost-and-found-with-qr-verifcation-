/**
 * Typed API wrappers (02-ARCHITECTURE.md §1): every state-changing call to a
 * Supabase Edge Function goes through this layer — screens and hooks never
 * call fetch() or a raw Supabase client directly for transitions.
 */

import { getSupabaseAccessToken } from '@/lib/token';
import type { ItemRow } from '@/lib/db';
import { getEnv } from '@/lib/env';

export interface LogFoundInput {
  title: string;
  category: string;
  description: string;
  photo_url?: string | null;
  found_location: string;
  found_date?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface LogFoundPayload {
  ok?: boolean;
  item?: ItemRow | null;
  error?: { code?: string; message?: string };
}

interface ConfirmReceiptPayload {
  ok?: boolean;
  item?: ItemRow | null;
  error?: { code?: string; message?: string };
}

interface ReleasePayload {
  ok?: boolean;
  itemId?: string;
  claimId?: string;
  error?: { code?: string; message?: string };
}

export interface ReleaseInput {
  itemId: string;
  claimId: string;
  scannedQrCode: string;
}

/** POST /log-found (Edge Function): staff-logged item + server QR tag. */
export async function logFoundItem(input: LogFoundInput): Promise<ItemRow> {
  const token = await getSupabaseAccessToken();
  if (!token) {
    throw new ApiError(401, 'unauthenticated', 'Your session has ended. Please sign in again.');
  }
  const env = getEnv();
  if (!env.isConfigured) {
    throw new ApiError(503, 'not_configured', 'Supabase is not configured.');
  }

  let response: Response;
  try {
    response = await fetch(`${env.supabaseUrl}/functions/v1/log-found`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    });
  } catch {
    throw new ApiError(0, 'network', 'Could not reach the server. Check your connection.');
  }

  let payload: LogFoundPayload | null = null;
  try {
    payload = (await response.json()) as LogFoundPayload;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.item) {
    const message = payload?.error?.message ?? 'Could not log the item.';
    throw new ApiError(response.status, payload?.error?.code ?? 'unknown', message);
  }
  return payload.item;
}

/** POST /confirm-receipt (Edge Function): confirm a student-reported item. */
export async function confirmReceivedItem(itemId: string): Promise<ItemRow> {
  const token = await getSupabaseAccessToken();
  if (!token) {
    throw new ApiError(401, 'unauthenticated', 'Your session has ended. Please sign in again.');
  }
  const env = getEnv();
  if (!env.isConfigured) {
    throw new ApiError(503, 'not_configured', 'Supabase is not configured.');
  }

  let response: Response;
  try {
    response = await fetch(`${env.supabaseUrl}/functions/v1/confirm-receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ itemId }),
    });
  } catch {
    throw new ApiError(0, 'network', 'Could not reach the server. Check your connection.');
  }

  let payload: ConfirmReceiptPayload | null = null;
  try {
    payload = (await response.json()) as ConfirmReceiptPayload;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.item) {
    const message = payload?.error?.message ?? 'Could not confirm the item.';
    throw new ApiError(response.status, payload?.error?.code ?? 'unknown', message);
  }
  return payload.item;
}

/**
 * POST /release (Edge Function): the ONLY write path allowed to mark an item
 * claimed (02-ARCHITECTURE.md §4). Server-side it re-validates the scanned QR
 * against the item and the claim's 'approved' status before touching anything.
 */
export async function releaseItem(
  input: ReleaseInput,
): Promise<{ itemId: string; claimId: string }> {
  const token = await getSupabaseAccessToken();
  if (!token) {
    throw new ApiError(401, 'unauthenticated', 'Your session has ended. Please sign in again.');
  }
  const env = getEnv();
  if (!env.isConfigured) {
    throw new ApiError(503, 'not_configured', 'Supabase is not configured.');
  }

  let response: Response;
  try {
    response = await fetch(`${env.supabaseUrl}/functions/v1/release`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    });
  } catch {
    throw new ApiError(0, 'network', 'Could not reach the server. Check your connection.');
  }

  let payload: ReleasePayload | null = null;
  try {
    payload = (await response.json()) as ReleasePayload;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok) {
    const message = payload?.error?.message ?? 'Could not release the item.';
    throw new ApiError(response.status, payload?.error?.code ?? 'unknown', message);
  }
  return { itemId: payload.itemId ?? input.itemId, claimId: payload.claimId ?? input.claimId };
}
