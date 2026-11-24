import { ImageResponse } from 'next/og';
import {
  BANCAS_SEO,
  formatRegionLabel,
  getBancaBySlug,
} from '@/lib/seo/bancas';
import { SITE_NAME } from '@/lib/seo/site';

export const alt = 'Guia de Banca de Residência Médica — AdaptiveMed';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export function generateStaticParams(): Array<{ slug: string }> {
  return BANCAS_SEO.map((banca) => ({ slug: banca.slug }));
}

interface OgImageProps {
  params?: Promise<{ slug?: string }> | { slug?: string };
}

export default async function Image({ params }: OgImageProps) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams?.slug ?? '';
  const banca = slug ? getBancaBySlug(slug) : undefined;

  const shortName = banca?.shortName ?? 'Bancas de Residência';
  const regionLabel = banca ? formatRegionLabel(banca.region) : 'Brasil';
  const titleText =
    banca?.title ?? 'Guias de Bancas de Residência Médica e Revalida';
  const titleFontSize = titleText.length > 58 ? '44px' : '48px';
  const subtitleText =
    banca?.questionCount ??
    'Temas de alta incidência, formato da prova e revisão adaptativa FSRS-6';
  const organizerText = banca?.organizer ?? SITE_NAME;
  const headerSubtitle = `Guia Estratégico da Banca • ${organizerText}`;
  const urlSlugLabel = banca ? `/bancas/${banca.slug}` : '/bancas';

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
            'radial-gradient(circle at 12% 15%, rgba(37, 99, 235, 0.34), transparent 45%), radial-gradient(circle at 88% 85%, rgba(16, 185, 129, 0.24), transparent 45%)',
          padding: '48px 56px',
          color: '#F8FAFC',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        {/* TOPO: MARCA + TAG DE REGIÃO */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
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
                color: '#FFFFFF',
                fontSize: '24px',
                fontWeight: 800,
              }}
            >
              A
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: '#F8FAFC',
                }}
              >
                {SITE_NAME}
              </span>
              <span
                style={{
                  fontSize: '14px',
                  color: '#94A3B8',
                  fontWeight: 600,
                }}
              >
                Repetição Espaçada FSRS-6 • Residência Médica
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 18px',
                borderRadius: '999px',
                backgroundColor: 'rgba(59, 130, 246, 0.18)',
                border: '1px solid rgba(96, 165, 250, 0.45)',
                color: '#93C5FD',
                fontSize: '18px',
                fontWeight: 700,
              }}
            >
              {regionLabel}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 18px',
                borderRadius: '999px',
                backgroundColor: 'rgba(16, 185, 129, 0.16)',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                color: '#6EE7B7',
                fontSize: '18px',
                fontWeight: 700,
              }}
            >
              {shortName}
            </div>
          </div>
        </div>

        {/* CENTRO: TÍTULO DA BANCA */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxWidth: '1060px',
          }}
        >
          <span
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#60A5FA',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {headerSubtitle}
          </span>

          <div
            style={{
              display: 'flex',
              fontSize: titleFontSize,
              fontWeight: 900,
              lineHeight: 1.14,
              letterSpacing: '-0.03em',
              color: '#FFFFFF',
            }}
          >
            {titleText}
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: '21px',
              fontWeight: 500,
              lineHeight: 1.38,
              color: '#CBD5E1',
            }}
          >
            {subtitleText}
          </div>
        </div>

        {/* RODAPÉ: 5 GRANDES ÁREAS + CTA VISUAL */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(148, 163, 184, 0.22)',
            paddingTop: '24px',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            {[
              { label: 'Clínica', color: '#3B82F6' },
              { label: 'Cirurgia', color: '#10B981' },
              { label: 'Pediatria', color: '#F59E0B' },
              { label: 'GO', color: '#EC4899' },
              { label: 'Preventiva', color: '#8B5CF6' },
            ].map((area) => (
              <div
                key={area.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(17, 24, 39, 0.9)',
                  border: '1px solid rgba(148, 163, 184, 0.24)',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#E2E8F0',
                }}
              >
                <div
                  style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '999px',
                    backgroundColor: area.color,
                  }}
                />
                <span>{area.label}</span>
              </div>
            ))}
          </div>

          <span
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#93C5FD',
            }}
          >
            {urlSlugLabel}
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
