import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20' as any,
    })
  : null;

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook Stripe não configurado no servidor.' },
      { status: 503 }
    );
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Cabeçalho stripe-signature ausente.' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error('Falha na verificação de assinatura do webhook Stripe:', err.message);
    return NextResponse.json({ error: 'Assinatura de webhook inválida.' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || session.metadata?.userId;
        const customerId =
          typeof session.customer === 'string' ? session.customer : session.customer?.id || null;
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id || null;

        const isPaid =
          session.payment_status === 'paid' || session.payment_status === 'no_payment_required';

        if (userId && isPaid) {
          const { error: updateError } = await admin
            .from('profiles')
            .update({
              is_subscribed: true,
              subscription_status: 'active',
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              cancel_at_period_end: false,
            })
            .eq('id', userId);
          if (updateError) {
            throw new Error(`Erro ao ativar assinatura no Supabase: ${updateError.message}`);
          }
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id;
        const periodEndSec = (subscription as any).current_period_end;
        const currentPeriodEnd = periodEndSec
          ? new Date(periodEndSec * 1000).toISOString()
          : null;

        const isActive =
          subscription.status === 'active' || subscription.status === 'trialing';
        const mappedStatus =
          subscription.status === 'active' || subscription.status === 'trialing'
            ? subscription.status === 'trialing'
              ? 'trial'
              : 'active'
            : subscription.status === 'canceled'
            ? 'canceled'
            : 'inactive';

        if (customerId) {
          const { error: updateError } = await admin
            .from('profiles')
            .update({
              is_subscribed: isActive,
              subscription_status: mappedStatus,
              stripe_subscription_id: subscription.id,
              cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
              current_period_end: currentPeriodEnd,
            })
            .eq('stripe_customer_id', customerId);
          if (updateError) {
            throw new Error(`Erro ao atualizar assinatura no Supabase: ${updateError.message}`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        if (customerId) {
          const { error: updateError } = await admin
            .from('profiles')
            .update({
              is_subscribed: false,
              subscription_status: 'inactive',
            })
            .eq('stripe_customer_id', customerId);
          if (updateError) {
            throw new Error(`Erro ao registrar falha de pagamento no Supabase: ${updateError.message}`);
          }
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Erro ao processar evento do webhook Stripe:', err);
    return NextResponse.json({ error: 'Erro interno ao processar webhook.' }, { status: 500 });
  }
}
