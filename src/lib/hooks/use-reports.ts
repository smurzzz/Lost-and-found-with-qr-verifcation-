/**
 * React Query hooks for student reporting (Phase 5). Report Lost → lost_reports;
 * Report Found → items as pending_dropoff with NO QR (CP-03). Writes go through
 * the RLS-guarded db helpers; the QR is only minted server-side by staff later.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchMyLostReports, insertLostReport, insertStudentFoundItem } from '@/lib/db';

interface UseReportsOptions {
  enabled?: boolean;
}

/** The signed-in student's lost reports, newest first. */
export function useMyLostReports(
  userId: string | null | undefined,
  options: UseReportsOptions = {},
) {
  return useQuery({
    queryKey: ['lost-reports', userId ?? ''],
    queryFn: () => fetchMyLostReports(userId as string),
    enabled: Boolean(userId) && (options.enabled ?? true),
    staleTime: 30_000,
  });
}

/** File a lost report (writes to lost_reports, optional reference photo). */
export function useCreateLostReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof insertLostReport>[0]) => insertLostReport(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['lost-reports'] });
    },
  });
}

/** Report a found item (writes to items as pending_dropoff, no QR). */
export function useReportFoundItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof insertStudentFoundItem>[0]) =>
      insertStudentFoundItem(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}
