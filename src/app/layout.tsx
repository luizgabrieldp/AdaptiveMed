import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/layout/theme-provider';
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from '@/lib/seo/site';
import {
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
} from '@/lib/seo/json-ld';

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
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
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: SITE_NAME,
    title: `${SITE_NAME} - ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: SITE_NAME,
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

function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationJsonLd = buildOrganizationJsonLd();
  const webSiteJsonLd = buildWebSiteJsonLd();

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
            __html: serializeJsonLd(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(webSiteJsonLd),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('adaptivemed_theme');var p=window.location.pathname;if(t==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');}else if(t==='dark'){document.documentElement.classList.remove('light');document.documentElement.classList.add('dark');}else if(p==='/'){document.documentElement.classList.remove('light');document.documentElement.classList.add('dark');}else{var sysDark=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',sysDark);document.documentElement.classList.toggle('light',!sysDark);}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
