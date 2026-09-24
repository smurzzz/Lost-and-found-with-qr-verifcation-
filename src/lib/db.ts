/**
 * Typed data access for the Phase 2 schema (supabase/migrations/
 * 20250924000000_phase2_schema.sql). Row types mirror the SQL enums exactly.
 *
 * Every helper returns null-safe results and works with the placeholder-mode
 * client (returns [] / null when Supabase keys are not configured yet).
 * Screens consume these in Phase 4+; Phase 2 lands the contracts.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

/* ------------------------------------------------------------------ */
/* Row types — mirror the SQL schema 1:1                               */
/* ------------------------------------------------------------------ */

export type UserRole = 'student' | 'staff' | 'admin';
export type ItemSource = 'staff_logged' | 'student_reported';
export type ItemStatus = 'pending_dropoff' | 'available' | 'pending_claim' | 'claimed';
export type LostReportStatus = 'searching' | 'possible_match' | 'claimed' | 'closed';
export type ClaimStatus = 'pending' | 'approved' | 'released';
export type AuditEvent =
  'reported' | 'confirmed' | 'found' | 'matched' | 'claim_requested' | 'released';

export interface UserRow {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  class_or_dept: string | null;
  push_token: string | null;
  created_at: string;
}

export interface ItemRow {
  id: string;
  title: string;
  category: string;
  description: string;
  photo_url: string | null;
  found_location: string;
  found_date: string;
  source: ItemSource;
  reported_by: string | null;
  status: ItemStatus;
  qr_code: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
}

export interface LostReportRow {
  id: string;
  reported_by: string;
  category: string;
  description: string;
  lost_location: string;
  lost_date: string;
  status: LostReportStatus;
  created_at: string;
}

export interface ClaimRow {
  id: string;
  item_id: string;
  claimant_id: string;
  verification_answer: string;
  status: ClaimStatus;
  created_at: string;
}

/** Pending claim joined with the claimant name + item for the staff tab. */
export interface PendingClaimRow {
  id: string;
  item_id: string;
  claimant_id: string;
  verification_answer: string;
  status: ClaimStatus;
  created_at: string;
  claimant: { name: string } | null;
  item: { id: string; title: string; category: string; status: ItemStatus } | null;
}

export interface AuditLogRow {
  id: string;
  item_id: string;
  event_type: AuditEvent;
  actor_id: string | null;
  note: string;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function client(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured — set EXPO_PUBLIC_SUPABASE_URL and ' +
        'EXPO_PUBLIC_SUPABASE_ANON_KEY in .env (Phase 0 task 0.4).',
    );
  }
  return supabase;
}

/** Found-items feed, newest first. Pass a category to filter ('All' = no filter). */
export async function fetchItems(category?: string): Promise<ItemRow[]> {
  let query = client().from('items').select('*').order('found_date', { ascending: false });
  if (category && category !== 'All') {
    query = query.eq('category', category);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ItemRow[];
}

/** One item by id (QR tag screen, release flow). */
export async function fetchItemById(id: string): Promise<ItemRow | null> {
  const { data, error } = await client().from('items').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as ItemRow) ?? null;
}

/** The current student's lost reports, newest first. */
export async function fetchMyLostReports(userId: string): Promise<LostReportRow[]> {
  const { data, error } = await client()
    .from('lost_reports')
    .select('*')
    .eq('reported_by', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as LostReportRow[];
}

/** File a lost report. */
export async function insertLostReport(input: {
  reported_by: string;
  category: string;
  description: string;
  lost_location: string;
  lost_date: string;
}): Promise<LostReportRow> {
  const { data, error } = await client().from('lost_reports').insert(input).select('*').single();
  if (error) throw error;
  return data as LostReportRow;
}

/** Student report-found: creates a pending_dropoff item with no QR (CP-03). */
export async function insertStudentFoundItem(input: {
  reported_by: string;
  title: string;
  category: string;
  description: string;
  photo_url: string | null;
  found_location: string;
  found_date: string;
}): Promise<ItemRow> {
  const { data, error } = await client()
    .from('items')
    .insert({ ...input, source: 'student_reported' })
    .select('*')
    .single();
  if (error) throw error;
  return data as ItemRow;
}

/** Staff log-found: item goes straight to available with a QR code. */
export async function insertStaffFoundItem(input: {
  title: string;
  category: string;
  description: string;
  photo_url: string | null;
  found_location: string;
  found_date: string;
  qr_code: string;
  confirmed_by: string;
}): Promise<ItemRow> {
  const { data, error } = await client()
    .from('items')
    .insert({ ...input, source: 'staff_logged' })
    .select('*')
    .single();
  if (error) throw error;
  return data as ItemRow;
}

/** Staff confirm receipt: pending_dropoff → available + QR + audit row. */
export async function confirmReceipt(input: {
  itemId: string;
  staffId: string;
  qrCode: string;
}): Promise<void> {
  const db = client();
  const { error: updateError } = await db
    .from('items')
    .update({
      status: 'available',
      qr_code: input.qrCode,
      confirmed_by: input.staffId,
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', input.itemId);
  if (updateError) throw updateError;

  const { error: auditError } = await db.from('audit_log').insert({
    item_id: input.itemId,
    event_type: 'confirmed',
    actor_id: input.staffId,
    note: 'Receipt confirmed; QR tag generated.',
  });
  if (auditError) throw auditError;
}

/** Submit a claim (status: pending). */
export async function insertClaim(input: {
  item_id: string;
  claimant_id: string;
  verification_answer: string;
}): Promise<ClaimRow> {
  const db = client();
  const { data, error } = await db
    .from('claims')
    .insert({ ...input, status: 'pending' })
    .select('*')
    .single();
  if (error) throw error;

  const { error: auditError } = await db.from('audit_log').insert({
    item_id: input.item_id,
    event_type: 'claim_requested',
    actor_id: input.claimant_id,
    note: 'Claim request submitted.',
  });
  if (auditError) throw auditError;

  return data as ClaimRow;
}

/** Staff approve / reject a pending claim. */
export async function setClaimStatus(input: {
  claimId: string;
  status: ClaimStatus;
}): Promise<void> {
  const { error } = await client()
    .from('claims')
    .update({ status: input.status })
    .eq('id', input.claimId);
  if (error) throw error;
}

/**
 * Pending claims with claimant name + item details, newest first (staff tab).
 * RLS lets staff read all claims, all users (claimant names), and all items,
 * so a plain client query is sufficient — no Edge Function needed.
 */
export async function fetchPendingClaims(): Promise<PendingClaimRow[]> {
  const { data, error } = await client()
    .from('claims')
    .select(
      'id, item_id, claimant_id, verification_answer, status, created_at, ' +
        'claimant:users!claims_claimant_id_fkey(name), ' +
        'item:items!claims_item_id_fkey(id, title, category, status)',
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as PendingClaimRow[];
}

/** Per-item audit trail, oldest first (the Audit screen timeline). */
export async function fetchItemAudit(itemId: string): Promise<AuditLogRow[]> {
  const { data, error } = await client()
    .from('audit_log')
    .select('*')
    .eq('item_id', itemId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as AuditLogRow[];
}

/** The caller's users row (role checks, profile screen). */
export async function fetchUser(userId: string): Promise<UserRow | null> {
  const { data, error } = await client().from('users').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return (data as UserRow) ?? null;
}

/**
 * Store the signed-in student's Expo push token (Phase 6). RLS restricts this
 * to the user's own row and the push_token column only (migration 04).
 */
export async function updatePushToken(userId: string, pushToken: string): Promise<void> {
  const { error } = await client().from('users').update({ push_token: pushToken }).eq('id', userId);
  if (error) throw error;
}
