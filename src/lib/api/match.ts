/**
 * Typed API wrappers (02-ARCHITECTURE.md §1): POST /match (Edge Function) runs
 * the server-side matching scan for a lost report and can fire a push
 * notification. Screens and hooks never call the Edge Function directly — they
 * go through this layer.
 */

import { getSupabaseAccessToken } from '@/lib/token';
import { ApiError } from '@/lib/api/items';
import { getEnv } from '@/lib/env';

export interface RunMatchingResult {
  matches: number;
  reportStatus: string | null;
  notified: boolean;
}

interface MatchPayload {
  ok?: boolean;
  matches?: number;
  report_status?: string | null;
  notified?: boolean;
  error?: { code?: string; message?: string };
}

/** POST /match: scan found items for a probable match against a lost report. */
export async function runMatching(lostReportId: string): Promise<RunMatchingResult> {
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
    response = await fetch(`${env.supabaseUrl}/functions/v1/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ lostReportId }),
    });
  } catch {
    throw new ApiError(0, 'network', 'Could not reach the server. Check your connection.');
  }

  let payload: MatchPayload | null = null;
  try {
    payload = (await response.json()) as MatchPayload;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok) {
    const message = payload?.error?.message ?? 'Could not check for matches.';
    throw new ApiError(response.status, payload?.error?.code ?? 'unknown', message);
  }
  return {
    matches: payload.matches ?? 0,
    reportStatus: payload.report_status ?? null,
    notified: payload.notified ?? false,
  };
}
