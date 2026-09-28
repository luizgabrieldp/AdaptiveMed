'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck2,
  TrendingUp,
  GraduationCap,
  User,
} from 'lucide-react';
import { useData } from '@/lib/store/data-context';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { stats } = useData();

  const items = [
    {
      label: 'Início',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: stats.todayReviewsCount > 0 ? stats.todayReviewsCount : undefined,
    },
    {
      label: 'Revisões',
      href: '/revisoes',
      icon: CalendarCheck2,
    },
    {
      label: 'Evolução',
      href: '/evolucao',
      icon: TrendingUp,
    },
    {
      label: 'Simulados',
      href: '/simulados',
      icon: GraduationCap,
    },
    {
      label: 'Conta',
      href: '/conta',
      icon: User,
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/85 backdrop-blur-xl border-t border-border px-3 py-1.5 flex items-center justify-around safe-bottom shadow-lg">
      {items.map(item => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
              isActive
                ? 'text-primary font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="relative">
              <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 h-4 min-w-[16px] px-1 bg-amber-500 text-slate-950 text-[10px] font-bold rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
