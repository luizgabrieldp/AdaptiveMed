import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Entrar na sua conta',
  description:
    'Acesse seu cronograma de repetição espaçada FSRS-6, caderno de erros e estatísticas de Residência Médica no AdaptiveMed.',
  alternates: {
    canonical: '/login',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
