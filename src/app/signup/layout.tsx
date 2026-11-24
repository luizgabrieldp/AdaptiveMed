import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Criar conta',
  description:
    'Crie sua conta no AdaptiveMed para organizar revisões espaçadas FSRS-6, caderno de erros inteligente e simulados de Residência Médica.',
  alternates: {
    canonical: '/signup',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
