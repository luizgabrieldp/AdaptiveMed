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
      payment_method_collection: 'if_required', // CUPOM 100% NÃO EXIGE CARTÃO DE CRÉDITO!
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'session_id é obrigatório' }, { status: 400 });
    }

    if (!stripe) {
      // Modo de teste ou pendência de configuração
      return NextResponse.json({
        valid: true,
        status: 'complete',
        customer_email: null,
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const isValid =
      session.status === 'complete' ||
      session.payment_status === 'paid' ||
      session.payment_status === 'no_payment_required';

    return NextResponse.json({
      valid: isValid,
      status: session.status,
      payment_status: session.payment_status,
      customer_email: session.customer_details?.email || session.customer_email,
      subscription_id: session.subscription,
      customer_id: session.customer,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
