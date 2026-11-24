import { ImageResponse } from 'next/og';
import { SITE_URL } from '@/lib/seo/site';

export const alt = 'AdaptiveMed — Repetição Espaçada FSRS-6 para Residência Médica';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

const BADGES = ['ENARE', 'USP-SP', 'SUS-SP', 'Caderno de Erros'];
const SITE_HOST = new URL(SITE_URL).host;

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 64px',
          backgroundColor: '#090D16',
          backgroundImage:
            'radial-gradient(circle at 14% 12%, rgba(37, 99, 235, 0.28), transparent 45%), radial-gradient(circle at 88% 84%, rgba(16, 185, 129, 0.22), transparent 42%)',
          color: '#F8FAFC',
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          position: 'relative',
        }}
      >
        {/* Top Brand Bar */}
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
              gap: '18px',
            }}
          >
            <div
              style={{
                width: '58px',
                height: '58px',
                borderRadius: '16px',
                backgroundImage:
                  'linear-gradient(135deg, #2563EB 0%, #4F46E5 55%, #10B981 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 30px rgba(37, 99, 235, 0.35)',
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
                <circle cx="20" cy="10" r="2" />
              </svg>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  fontSize: '30px',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: '#FFFFFF',
                }}
              >
                AdaptiveMed
              </div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#94A3B8',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Plataforma Científica de Revisões
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 20px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(16, 185, 129, 0.14)',
              border: '1px solid rgba(16, 185, 129, 0.38)',
              color: '#6EE7B7',
              fontSize: '17px',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            ALGORITMO FSRS-6
          </div>
        </div>

        {/* Main Headline & Subtitle */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            maxWidth: '1020px',
          }}
        >
          <div
            style={{
              fontSize: '58px',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span>Repetição Espaçada FSRS-6</span>
            <span style={{ color: '#60A5FA' }}>para Residência Médica</span>
          </div>

          <div
            style={{
              fontSize: '24px',
              lineHeight: 1.4,
              color: '#CBD5E1',
              maxWidth: '900px',
              fontWeight: 500,
            }}
          >
            Cronograma semanal adaptativo, caderno de erros inteligente e análise
            estratégica das bancas mais concorridas do Brasil.
          </div>
        </div>

        {/* Badges & Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            paddingTop: '24px',
            borderTop: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            {BADGES.map((badge) => (
              <div
                key={badge}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(30, 41, 59, 0.85)',
                  border: '1px solid rgba(96, 165, 250, 0.28)',
                  color: '#E2E8F0',
                  fontSize: '18px',
                  fontWeight: 700,
                }}
              >
                {badge}
              </div>
            ))}
          </div>

          <div
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#94A3B8',
            }}
          >
            {SITE_HOST}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
