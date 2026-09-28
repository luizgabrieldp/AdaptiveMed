import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20' as any,
    })
  : null;

interface PlanConfig {
  name: string;
  description: string;
  priceInCents: number;
  interval: 'month' | 'year';
}

const PLANS: Record<string, PlanConfig> = {
  monthly: {
    name: 'Plano Mensal - AdaptiveMed Pro',
    description: 'Acesso completo a repetição espaçada adaptativa, simulados e métricas por 1 mês.',
    priceInCents: 799, // R$ 7,99 (com cupom fica R$ 4,99)
    interval: 'month',
  },
  annual: {
    name: 'Plano Anual - AdaptiveMed VIP',
    description: 'Acesso anual com todas as bancas do Brasil, cronograma adaptativo e suporte prioritário.',
    priceInCents: 6990, // R$ 69,90 (equivalente a R$ 5,82/mês)
    interval: 'year',
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId = 'monthly', email } = body;

    const plan = PLANS[planId] || PLANS.monthly;
    const origin = req.headers.get('origin') || 'https://adaptive-med.vercel.app';

    // Se a chave da Stripe ainda não foi adicionada no ambiente Vercel
    if (!stripe) {
      return NextResponse.json(
        {
          url: `${origin}/signup?plan=${planId}&notice=stripe_pending`,
          isPendingConfig: true,
          message:
            'A integração com Stripe foi ativada na aplicação. Para processar cobranças reais, defina STRIPE_SECRET_KEY nas variáveis da Vercel.',
        },
        { status: 200 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email || undefined,
      allow_promotion_codes: true, // HABILITA O CAMPO DE CUPOM DE DESCONTO NO CHECKOUT STRIPE
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: plan.name,
              description: plan.description,
            },
            unit_amount: plan.priceInCents,
            recurring: {
              interval: plan.interval,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/signup?session_id={CHECKOUT_SESSION_ID}&plan=${planId}`,
      cancel_url: `${origin}/#planos`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Erro ao gerar Stripe Checkout:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar checkout do Stripe' },
      { status: 500 }
    );
  }
}
