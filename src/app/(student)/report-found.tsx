/**
 * Report a Found Item — v3 port. Submit goes to the found-success screen.
 */

import { router } from 'expo-router';

import { ReportForm } from '@/components/v3/report-form';
import { BottomNav3 } from '@/components/v3/bottom-nav';
import { tabRoute } from '@/lib/v3-nav';

export default function ReportFoundScreen() {
  return (
    <ReportForm
      type="Found"
      onBack={() => router.push('/(student)/report')}
      onSubmit={() => router.push('/(student)/found-success')}
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
