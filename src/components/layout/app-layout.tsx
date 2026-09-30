'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { BottomNav } from './bottom-nav';
import { useData } from '@/lib/store/data-context';
import { Loader2 } from 'lucide-react';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { user, profile, isLoading } = useData();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
        return;
      }
      const hasActivePlan = Boolean(
        profile?.is_subscribed || profile?.subscription_status === 'active'
      );
      if (!hasActivePlan) {
        router.replace('/pagamento');
      }
    }
  }, [user, profile, isLoading, router]);

  // Enquanto carrega ou se não tiver permissão, bloqueia a renderização do layout
  if (
    isLoading ||
    !user ||
    (!profile?.is_subscribed && profile?.subscription_status !== 'active')
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-xs">Verificando plano de estudos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Desktop */}
      <Sidebar />

      {/* Main Content Area com rolagem independente */}
      <div className="flex flex-1 flex-col h-full overflow-y-auto overflow-x-hidden pb-20 lg:pb-8">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Bottom Navigation Mobile */}
      <BottomNav />
    </div>
  );
};
