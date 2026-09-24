/**
 * React Query hooks for claims (Phase 7). Claim Verification writes through the
 * RLS-guarded insertClaim helper (claim 'pending' + 'claim_requested' audit;
 * migration 05's trigger moves the item available → pending_claim, server-side);
 * the staff Pending Claims tab reads via fetchPendingClaims. Writes always go
 * through /lib/db helpers / /lib/api wrappers — never raw client calls.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchClaimsForItem, fetchPendingClaims, insertClaim, setClaimStatus } from '@/lib/db';

interface UsePendingClaimsOptions {
  enabled?: boolean;
}

/** Staff: pending claims joined with claimant + item, newest first. */
export function usePendingClaims(options: UsePendingClaimsOptions = {}) {
  return useQuery({
    queryKey: ['claims', 'pending'],
    queryFn: fetchPendingClaims,
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}

/** Claims on one item with claimant name, newest first (release sheet). */
export function useClaimsForItem(itemId: string | null | undefined) {
  return useQuery({
    queryKey: ['claims', 'item', itemId ?? ''],
    queryFn: () => fetchClaimsForItem(itemId as string),
    enabled: Boolean(itemId),
    staleTime: 30_000,
  });
}

/** Student: file a claim on an item (status 'pending' + item → pending_claim). */
export function useClaimItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof insertClaim>[0]) => insertClaim(input),
    onSuccess: (claim) => {
      // The item's status changed to pending_claim; the claim list changed too.
      void queryClient.invalidateQueries({ queryKey: ['items'] });
      void queryClient.invalidateQueries({ queryKey: ['claims'] });
      void queryClient.setQueryData(['claim', claim.id], claim);
    },
  });
}

/** Staff: approve a pending claim (RLS claims_update_staff). */
export function useApproveClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (claimId: string) => setClaimStatus({ claimId, status: 'approved' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['claims'] });
    },
  });
}
