import type { MetadataRoute } from 'next';
import { LAST_CONTENT_UPDATE, absoluteUrl } from '@/lib/seo/site';
import { BANCAS_SEO } from '@/lib/seo/bancas';
import { GUIAS_SEO } from '@/lib/seo/guias';

const DEFAULT_LAST_MODIFIED = new Date(LAST_CONTENT_UPDATE);

function toStableDate(value?: string): Date {
  if (!value) return DEFAULT_LAST_MODIFIED;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? DEFAULT_LAST_MODIFIED : parsed;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/'),
      lastModified: DEFAULT_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: absoluteUrl('/bancas'),
      lastModified: DEFAULT_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: absoluteUrl('/guias'),
      lastModified: DEFAULT_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: absoluteUrl('/metodologia'),
      lastModified: DEFAULT_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: absoluteUrl('/privacidade'),
      lastModified: DEFAULT_LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: absoluteUrl('/termos'),
      lastModified: DEFAULT_LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  const bancaEntries: MetadataRoute.Sitemap = BANCAS_SEO.map((banca) => ({
    url: absoluteUrl(`/bancas/${banca.slug}`),
    lastModified: toStableDate(banca.lastModified),
    changeFrequency: 'monthly',
    priority: 0.85,
  }));

  const guiaEntries: MetadataRoute.Sitemap = GUIAS_SEO.map((guia) => ({
    url: absoluteUrl(`/guias/${guia.slug}`),
    lastModified: toStableDate(guia.lastModified),
    changeFrequency: 'monthly',
    priority: 0.85,
  }));

  return [...staticEntries, ...bancaEntries, ...guiaEntries];
}
