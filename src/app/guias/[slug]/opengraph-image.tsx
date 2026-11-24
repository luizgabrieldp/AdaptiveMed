import { ImageResponse } from 'next/og';
import { GUIAS_SEO, getGuiaBySlug } from '@/lib/seo/guias';
import { SITE_NAME } from '@/lib/seo/site';

export const alt = 'Guia Editorial AdaptiveMed para Residência Médica';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export function generateStaticParams(): Array<{ slug: string }> {
  return GUIAS_SEO.map((guia) => ({ slug: guia.slug }));
}

interface OgImageProps {
  params?: Promise<{ slug?: string }> | { slug?: string };
}

function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const sliced = text.slice(0, maxLength - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  const base = lastSpace > Math.floor(maxLength * 0.6) ? sliced.slice(0, lastSpace) : sliced;
  const clean = base
    .replace(/[.,;:—–-]+$/, '')
    .replace(/\s+(?:a|o|e|de|da|do|em|para|com|por|no|na|os|as|que)$/i, '')
    .trimEnd();
  return `${clean}...`;
}

export default async function GuiaOpenGraphImage({ params }: OgImageProps) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams?.slug ?? '';
  const guia = slug ? getGuiaBySlug(slug) : undefined;

  const title = guia?.title ?? 'Guias de Estudo para Residência Médica';
  const category = guia?.category ?? 'Guia Prático';
  const readingTime = guia?.readingTimeMinutes ?? 8;
  const description = truncateAtWord(
    guia?.description ??
      'Repetição espaçada FSRS-6, Caderno de Erros inteligente e estratégia de provas médicas.',
    185
  );
  const urlSlugLabel = guia ? `/guias/${guia.slug}` : '/guias';
  const titleFontSize =
    title.length > 72 ? '44px' : title.length > 58 ? '48px' : '54px';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#090D16',
          backgroundImage:
            'radial-gradient(circle at 85% 15%, rgba(59,130,246,0.28), transparent 45%), radial-gradient(circle at 12% 90%, rgba(16,185,129,0.20), transparent 45%)',
          color: '#F8FAFC',
          padding: '56px 64px',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                backgroundImage:
                  'linear-gradient(135deg, #2563EB 0%, #4F46E5 55%, #10B981 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 900,
                color: '#FFFFFF',
              }}
            >
              A
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                {SITE_NAME}
              </span>
              <span style={{ fontSize: '15px', color: '#94A3B8', fontWeight: 600 }}>
                Biblioteca Editorial • Residência Médica
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                padding: '8px 18px',
                borderRadius: '999px',
                backgroundColor: 'rgba(59, 130, 246, 0.18)',
                border: '1px solid rgba(96, 165, 250, 0.45)',
                color: '#93C5FD',
                fontSize: '18px',
                fontWeight: 700,
              }}
            >
              {category}
            </div>
            <div
              style={{
                display: 'flex',
                padding: '8px 16px',
                borderRadius: '999px',
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(71, 85, 105, 0.6)',
                color: '#CBD5E1',
                fontSize: '17px',
                fontWeight: 600,
              }}
            >
              {`${readingTime} min`}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '22px',
            maxWidth: '1040px',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: titleFontSize,
              fontWeight: 900,
              lineHeight: 1.12,
              letterSpacing: '-0.03em',
              color: '#F8FAFC',
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: '22px',
              lineHeight: 1.45,
              color: '#9EADC8',
              fontWeight: 500,
            }}
          >
            {description}
          </div>
        </div>

        {/* Footer bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(51, 65, 85, 0.85)',
            paddingTop: '22px',
            width: '100%',
            gap: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              fontSize: '17px',
              color: '#CBD5E1',
              fontWeight: 600,
            }}
          >
            <span>FSRS-6</span>
            <span style={{ color: '#475569' }}>•</span>
            <span>Caderno de Erros</span>
            <span style={{ color: '#475569' }}>•</span>
            <span>Simulados</span>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: '16px',
              fontWeight: 700,
              color: '#60A5FA',
            }}
          >
            {urlSlugLabel}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
