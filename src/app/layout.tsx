import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { DataProvider } from '@/lib/store/data-context';
import { FocusTimerProvider } from '@/components/focus/focus-timer-context';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
});

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://adaptive-med.vercel.app').replace(
  /\/+$/,
  ''
);

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'AdaptiveMed - Repetição Espaçada & Análise para Residência Médica',
    template: '%s | AdaptiveMed',
  },
  description:
    'Plataforma de repetição espaçada adaptativa (FSRS-6), caderno de erros inteligente, cronograma semanal e foco 3D para estudantes e candidatos à Residência Médica (ENARE, USP-SP, SUS-SP, SES-PE e mais).',
  keywords: [
    'residência médica',
    'repetição espaçada',
    'FSRS-6',
    'cronograma residência médica',
    'caderno de erros medicina',
    'ENARE',
    'USP-SP',
    'SUS-SP',
    'AdaptiveMed',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: SITE_URL,
    siteName: 'AdaptiveMed',
    title: 'AdaptiveMed - Repetição Espaçada & Análise para Residência Médica',
    description:
      'Organize suas revisões com algoritmo científico FSRS-6, caderno de erros inteligente e análise por banca para aprovação na Residência Médica.',
    images: [
      {
        url: '/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'AdaptiveMed',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'AdaptiveMed - Repetição Espaçada para Residência Médica',
    description:
      'Cronograma adaptativo FSRS-6, caderno de erros e foco para candidatos à Residência Médica.',
    images: ['/icons/icon-512.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AdaptiveMed',
  },
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#090D16',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`dark ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'AdaptiveMed',
              applicationCategory: 'EducationalApplication',
              operatingSystem: 'Web',
              inLanguage: 'pt-BR',
              url: SITE_URL,
              description:
                'Plataforma de repetição espaçada adaptativa (FSRS-6), caderno de erros inteligente e cronograma para Residência Médica.',
            }),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('adaptivemed_theme');var p=window.location.pathname;if(t==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');}else if(t==='dark'){document.documentElement.classList.remove('light');document.documentElement.classList.add('dark');}else if(p==='/'){document.documentElement.classList.remove('light');document.documentElement.classList.add('dark');}else{var sysDark=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',sysDark);document.documentElement.classList.toggle('light',!sysDark);}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <ThemeProvider>
          <DataProvider>
            <FocusTimerProvider>{children}</FocusTimerProvider>
          </DataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
