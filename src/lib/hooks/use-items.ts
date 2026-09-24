/**
 * React Query hooks for items data. AGENTS.md: screens fetch only through
 * /lib/hooks (never inline useEffect + fetch); transitions go through the
 * /lib/api wrappers.
 */

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  confirmReceivedItem,
  logFoundItem,
  releaseItem,
  type LogFoundInput,
  type ReleaseInput,
} from '@/lib/api/items';
import {
  fetchAuditFeed,
  fetchItemById,
  fetchItems,
  fetchStudentReports,
  type AuditEventRow,
} from '@/lib/db';

interface UseItemsOptions {
  enabled?: boolean;
}

/** The found-items list, newest first (used by the staff dashboard). */
export function useFoundItems(options: UseItemsOptions = {}) {
  return useQuery({
    queryKey: ['items', 'found'],
    queryFn: () => fetchItems(),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}

/** Student-reported items awaiting staff confirmation (dashboard tab). */
export function useStudentReports(options: UseItemsOptions = {}) {
  return useQuery({
    queryKey: ['items', 'student_reports'],
    queryFn: () => fetchStudentReports(),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}

/** Per-item audit groups: events chronological within, newest group first. */
export interface AuditGroup {
  item: AuditEventRow['item'];
  events: AuditEventRow[];
}

/** Staff Audit tab feed, grouped per item for the expandable timelines. */
export function useAuditFeed(enabled: boolean) {
  const query = useQuery({
    queryKey: ['audit', 'feed'],
    queryFn: fetchAuditFeed,
    staleTime: 30_000,
    enabled,
  });

  const groups = useMemo<AuditGroup[]>(() => {
    const rows = query.data ?? [];
    const byId = new Map<string, AuditGroup>();
    for (const event of rows) {
      if (!event.item) continue;
      const group = byId.get(event.item.id);
      if (group) {
        group.events.push(event);
      } else {
        byId.set(event.item.id, { item: event.item, events: [event] });
      }
    }
    const result = [...byId.values()].map((group) => ({
      ...group,
      // chronological within each item's timeline (AL-02)
      events: group.events.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    }));
    // groups ordered by their newest event
    result.sort((a, b) => {
      const at = a.events[a.events.length - 1]?.created_at ?? '';
      const bt = b.events[b.events.length - 1]?.created_at ?? '';
      return bt.localeCompare(at);
    });
    return result;
  }, [query.data]);

  return { ...query, groups };
}

/** A single item by id (QR Tag screen, detail views). */
export function useItem(itemId: string | null | undefined) {
  return useQuery({
    queryKey: ['item', itemId ?? ''],
    queryFn: () => fetchItemById(itemId as string),
    enabled: Boolean(itemId),
    staleTime: 30_000,
  });
}

/** Staff log-found: writes through the Edge Function and refreshes the lists. */
export function useLogFoundItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LogFoundInput) => logFoundItem(input),
    onSuccess: (item) => {
      // Seed the detail cache so the QR Tag screen renders instantly.
      queryClient.setQueryData(['item', item.id], item);
      void queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

/** Staff confirm-receipt: Edge Function, seeds the detail + refreshes lists. */
export function useConfirmReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => confirmReceivedItem(itemId),
    onSuccess: (item) => {
      // Seed the detail cache so the QR Tag screen renders instantly.
      queryClient.setQueryData(['item', item.id], item);
      void queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

/**
 * Staff QR release: the ONLY write path that may mark an item claimed
 * (Phase 9 — routes through the /release Edge Function). On success every
 * list + the detail cache refresh so the claimed state shows everywhere.
 */
export function useReleaseItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReleaseInput) => releaseItem(input),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['items'] });
      void queryClient.invalidateQueries({ queryKey: ['claims'] });
      void queryClient.invalidateQueries({ queryKey: ['item', result.itemId] });
    },
  });
}
