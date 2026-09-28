'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/lib/store/data-context';
import { Stethoscope } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { isLoading, user, isDemoMode, profile } = useData();

  useEffect(() => {
    if (!isLoading) {
      if (user || isDemoMode) {
        if (profile && profile.onboarding_completed === false) {
          router.replace('/onboarding');
        } else {
          router.replace('/dashboard');
        }
      } else {
        router.replace('/login');
      }
    }
  }, [isLoading, user, isDemoMode, profile, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 shadow-xl shadow-blue-500/25 animate-pulse mb-4">
        <Stethoscope className="h-8 w-8 text-white stroke-[2.2]" />
      </div>
      <h1 className="text-xl font-bold text-foreground">AdaptiveMed</h1>
      <p className="text-sm text-muted-foreground mt-1">Carregando cronograma adaptativo...</p>
    </div>
  );
}
