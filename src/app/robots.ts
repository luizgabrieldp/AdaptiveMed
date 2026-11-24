import type { MetadataRoute } from 'next';

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://adaptive-med.vercel.app').replace(
  /\/+$/,
  ''
);

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/dashboard',
          '/diario',
          '/revisoes',
          '/erros',
          '/foco',
          '/evolucao',
          '/simulados',
          '/prevalencia',
          '/conta',
          '/onboarding',
          '/pagamento',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
