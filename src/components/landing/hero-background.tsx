'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

interface NetworkInformationLike {
  saveData?: boolean;
}

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformationLike;
};

type WindowWithIdleCallback = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const HeroNeuralCanvas = dynamic(
  () => import('./hero-neural-canvas').then(mod => mod.HeroNeuralCanvas),
  {
    ssr: false,
    loading: () => null,
  }
);

export const HeroBackground: React.FC = () => {
  const [shouldLoad3D, setShouldLoad3D] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const desktopQuery = window.matchMedia('(min-width: 768px)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const nav = navigator as NavigatorWithConnection;

    const canUse3D = () =>
      desktopQuery.matches && !motionQuery.matches && !Boolean(nav.connection?.saveData);

    if (!canUse3D()) {
      setShouldLoad3D(false);
      return;
    }

    const win = window as WindowWithIdleCallback;
    let idleHandle: number | null = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    const enable3D = () => {
      if (canUse3D()) {
        setShouldLoad3D(true);
      }
    };

    if (typeof win.requestIdleCallback === 'function') {
      idleHandle = win.requestIdleCallback(enable3D, { timeout: 1500 });
    } else {
      timeoutHandle = setTimeout(enable3D, 600);
    }

    const handlePreferenceChange = () => {
      if (!canUse3D()) {
        setShouldLoad3D(false);
      }
    };

    desktopQuery.addEventListener('change', handlePreferenceChange);
    motionQuery.addEventListener('change', handlePreferenceChange);

    return () => {
      if (idleHandle !== null && typeof win.cancelIdleCallback === 'function') {
        win.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== null) {
        clearTimeout(timeoutHandle);
      }
      desktopQuery.removeEventListener('change', handlePreferenceChange);
      motionQuery.removeEventListener('change', handlePreferenceChange);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Fundo CSS/SVG leve imediato (único renderizado em mobile < 768px, reduced-motion ou saveData) */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.18),transparent_62%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.22),transparent_62%)]" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[min(92vw,760px)] h-[340px] rounded-full bg-gradient-to-tr from-blue-500/15 via-indigo-500/10 to-emerald-500/15 blur-3xl" />

        <svg
          className="absolute inset-x-0 top-6 w-full h-[360px] opacity-35 dark:opacity-45"
          viewBox="0 0 1200 360"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="hero-synapse-primary" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#6366F1" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.25" />
            </linearGradient>
            <linearGradient id="hero-synapse-secondary" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.1" />
              <stop offset="55%" stopColor="#38BDF8" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          <path
            d="M-40 270 C 180 245, 290 120, 520 155 C 740 190, 880 75, 1240 95"
            stroke="url(#hero-synapse-primary)"
            strokeWidth="2.2"
          />
          <path
            d="M-40 305 C 210 270, 350 180, 610 190 C 830 200, 960 120, 1240 140"
            stroke="url(#hero-synapse-secondary)"
            strokeWidth="1.4"
            strokeDasharray="6 8"
          />
          <circle cx="240" cy="196" r="4" fill="#6366F1" fillOpacity="0.7" />
          <circle cx="520" cy="155" r="4.5" fill="#38BDF8" fillOpacity="0.75" />
          <circle cx="790" cy="130" r="4" fill="#3B82F6" fillOpacity="0.75" />
          <circle cx="1020" cy="100" r="5" fill="#10B981" fillOpacity="0.8" />
        </svg>
      </div>

      {/* Canvas Three.js carregado sob demanda apenas em desktop >= 768px sem reduced-motion/saveData */}
      {shouldLoad3D && <HeroNeuralCanvas />}
    </div>
  );
};
