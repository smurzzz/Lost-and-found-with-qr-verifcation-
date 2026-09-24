/**
 * React Query hooks for items data. AGENTS.md: screens fetch only through
 * /lib/hooks (never inline useEffect + fetch); transitions go through the
 * /lib/api wrappers.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { logFoundItem, type LogFoundInput } from '@/lib/api/items';
import { fetchItemById, fetchItems } from '@/lib/db';

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
