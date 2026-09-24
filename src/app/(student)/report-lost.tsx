/**
 * Report a Lost Item — v3 port. Phase 5: writes to lost_reports via
 * useCreateLostReport, then returns Home. Demo mode keeps the mock navigate.
 */

import { useState } from 'react';
import { router } from 'expo-router';

import { ReportForm, type ReportFormValues } from '@/components/v3/report-form';
import { BottomNav3 } from '@/components/v3/bottom-nav';
import { tabRoute } from '@/lib/v3-nav';
import { toIsoStringOrNow } from '@/lib/dates';
import { uploadItemPhoto } from '@/lib/storage';
import { runMatching } from '@/lib/api/match';
import { useCreateLostReport } from '@/lib/hooks/use-reports';
import { useSession } from '@/lib/session';

export default function ReportLostScreen() {
  const { isDemo, dbUser } = useSession();
  const create = useCreateLostReport();
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleSubmit(values: ReportFormValues) {
    if (isDemo) {
      router.push('/(student)/home');
      return;
    }
    setUploadError(null);
    let photoUrl: string | null = null;
    if (values.photo) {
      try {
        photoUrl = await uploadItemPhoto({
          localUri: values.photo.uri,
          userId: dbUser?.id ?? 'anon',
        });
      } catch (cause) {
        setUploadError(
          cause instanceof Error ? cause.message : 'Could not upload the photo. Try again.',
        );
        return;
      }
    }
    create.mutate(
      {
        reported_by: dbUser?.id ?? '',
        category: values.category,
        description: values.description,
        photo_url: photoUrl,
        lost_location: values.location,
        lost_date: toIsoStringOrNow(values.date),
      },
      {
        onSuccess: (report) => {
          // Phase 6: ask the server to match the new report against found
          // items and notify the reporter if there's a probable match.
          void runMatching(report.id).catch(() => undefined);
          router.push('/(student)/home');
        },
      },
    );
  }

  return (
    <ReportForm
      type="Lost"
      onBack={() => router.push('/(student)/report')}
      onSubmit={handleSubmit}
      busy={create.isPending}
      submitError={
        uploadError ??
        (create.isError
          ? create.error instanceof Error
            ? create.error.message
            : 'Could not submit the report.'
          : undefined)
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
