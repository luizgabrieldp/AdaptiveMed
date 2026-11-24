const DEFAULT_SITE_URL = 'https://adaptive-med.vercel.app';

function normalizeValidHttpUrl(candidate?: string): string | null {
  const trimmed = candidate?.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (
      (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') ||
      !parsed.hostname
    ) {
      return null;
    }
    return trimmed.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

export const SITE_URL =
  normalizeValidHttpUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
  normalizeValidHttpUrl(process.env.NEXT_PUBLIC_APP_URL) ||
  DEFAULT_SITE_URL;

export const SITE_NAME = 'AdaptiveMed';

export const SITE_TAGLINE =
  'Repetição Espaçada FSRS-6 & Análise para Residência Médica';

export const SITE_DESCRIPTION =
  'Plataforma de repetição espaçada adaptativa (FSRS-6), caderno de erros inteligente, cronograma semanal e modo foco para candidatos à Residência Médica (ENARE, USP-SP, SUS-SP, SES-PE e mais).';

export const SUPPORT_EMAIL: string | null =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || null;

export const LAST_CONTENT_UPDATE = '2026-11-23';

export function absoluteUrl(path: string = '/'): string {
  const trimmed = path.trim();
  if (!trimmed || trimmed === '/') {
    return `${SITE_URL}/`;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const normalizedPath = `/${trimmed.replace(/^\/+/, '')}`;
  return `${SITE_URL}${normalizedPath}`;
}
