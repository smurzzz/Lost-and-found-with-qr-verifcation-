/**
 * Typed API wrappers (02-ARCHITECTURE.md §1): every state-changing call to a
 * Supabase Edge Function goes through this layer — screens and hooks never
 * call fetch() or a raw Supabase client directly for transitions.
 */

import { getClerkSupabaseToken } from '@/lib/authBridge';
import type { ItemRow } from '@/lib/db';
import { getEnv } from '@/lib/env';

export interface LogFoundInput {
  title: string;
  category: string;
  description: string;
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

/** POST /log-found (Edge Function): staff-logged item + server QR tag. */
export async function logFoundItem(input: LogFoundInput): Promise<ItemRow> {
  const token = await getClerkSupabaseToken();
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
