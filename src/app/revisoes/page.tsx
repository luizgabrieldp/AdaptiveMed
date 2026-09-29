'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DiarioPage from '@/app/diario/page';

export default function RevisoesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/diario');
  }, [router]);

  return <DiarioPage />;
}
