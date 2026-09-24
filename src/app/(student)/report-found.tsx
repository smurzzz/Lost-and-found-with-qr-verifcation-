/**
 * Report a Found Item — v3 port. Phase 5: writes to items as a
 * student_reported pending_dropoff row with NO QR (CP-03); staff mints the QR
 * later. On success → found-success screen. Demo mode keeps the mock navigate.
 */

import { router } from 'expo-router';

import { ReportForm, type ReportFormValues } from '@/components/v3/report-form';
import { BottomNav3 } from '@/components/v3/bottom-nav';
import { tabRoute } from '@/lib/v3-nav';
import { toIsoStringOrNow } from '@/lib/dates';
import { useReportFoundItem } from '@/lib/hooks/use-reports';
import { useSession } from '@/lib/session';

export default function ReportFoundScreen() {
  const { isDemo, dbUser } = useSession();
  const report = useReportFoundItem();

  function handleSubmit(values: ReportFormValues) {
    if (isDemo) {
      router.push('/(student)/found-success');
      return;
    }
    report.mutate(
      {
        reported_by: dbUser?.id ?? '',
        title: values.title ?? '',
        category: values.category,
        description: values.description,
        photo_url: null,
        found_location: values.location,
        found_date: toIsoStringOrNow(values.date),
      },
      { onSuccess: () => router.push('/(student)/found-success') },
    );
  }

  return (
    <ReportForm
      type="Found"
      onBack={() => router.push('/(student)/report')}
      onSubmit={handleSubmit}
      busy={report.isPending}
      submitError={
        report.isError
          ? report.error instanceof Error
            ? report.error.message
            : 'Could not submit the report.'
          : undefined
      }
      nav={
        <BottomNav3
          role="student"
          active="report"
          onSelect={(tab) => router.push(tabRoute('student', tab))}
        />
      }
    />
  );
}
