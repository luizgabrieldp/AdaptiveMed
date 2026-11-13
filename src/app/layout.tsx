import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { DataProvider } from '@/lib/store/data-context';

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

export const metadata: Metadata = {
  title: 'AdaptiveMed - Repetição Espaçada & Análise para Residência Médica',
  description:
    'Plataforma educacional adaptativa de alto rendimento para estudantes e candidatos a provas de residência médica. Algoritmo inteligente de fixação de memória.',
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
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <ThemeProvider>
          <DataProvider>{children}</DataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
