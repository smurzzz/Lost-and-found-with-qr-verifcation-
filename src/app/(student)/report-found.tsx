/**
 * Report a Found Item — v3 port. Submit goes to the found-success screen.
 */

import { router } from 'expo-router';

import { ReportForm } from '@/components/v3/report-form';

export default function ReportFoundScreen() {
  return (
    <ReportForm
      type="Found"
      onBack={() => router.push('/(student)/report')}
      onSubmit={() => router.push('/(student)/found-success')}
    />
  );
}
