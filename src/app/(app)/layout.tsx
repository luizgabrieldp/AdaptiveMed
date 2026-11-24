import type { Metadata } from 'next';
import React from 'react';
import { DataProvider } from '@/lib/store/data-context';
import { FocusTimerProvider } from '@/components/focus/focus-timer-context';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DataProvider>
      <FocusTimerProvider>{children}</FocusTimerProvider>
    </DataProvider>
  );
}
