/**
 * Report a Lost Item — v3 port. Form only; submit returns to Home per the
 * source's flow (report-lost → home).
 */

import { router } from 'expo-router';

import { ReportForm } from '@/components/v3/report-form';

export default function ReportLostScreen() {
  return (
    <ReportForm
      type="Lost"
      onBack={() => router.push('/(student)/report')}
      onSubmit={() => router.push('/(student)/home')}
    />
  );
}
