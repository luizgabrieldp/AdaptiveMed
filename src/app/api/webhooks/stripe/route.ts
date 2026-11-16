import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20' as any,
    })
  : null;

function extractPeriodEndIso(sub: Stripe.Subscription | null | undefined): string | null {
  if (!sub) return null;
  const periodEndSec =
    (sub as { current_period_end?: number | null }).current_period_end ??
    sub.items?.data?.[0]?.current_period_end;
  return typeof periodEndSec === 'number' && periodEndSec > 0
    ? new Date(periodEndSec * 1000).toISOString()
    : null;
}

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
          let currentPeriodEnd: string | null = null;
          let cancelAtPeriodEnd = false;
          let mappedStatus: 'active' | 'trial' = 'active';

          if (subscriptionId) {
            try {
              const sub = await stripe.subscriptions.retrieve(subscriptionId);
              currentPeriodEnd = extractPeriodEndIso(sub);
              cancelAtPeriodEnd = Boolean(sub.cancel_at_period_end);
              if (sub.status === 'trialing') {
                mappedStatus = 'trial';
              }
            } catch (subErr) {
              console.warn(
                'Aviso ao consultar subscription no checkout.session.completed:',
                subErr
              );
            }
          }

          const updatePayload: Record<string, unknown> = {
            is_subscribed: true,
            subscription_status: mappedStatus,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            cancel_at_period_end: cancelAtPeriodEnd,
          };
          if (currentPeriodEnd) {
            updatePayload.current_period_end = currentPeriodEnd;
          }

          const { error: updateError } = await admin
            .from('profiles')
            .update(updatePayload)
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
            : subscription.customer?.id || null;
        const fallbackUserId = subscription.metadata?.userId;
        const currentPeriodEnd = extractPeriodEndIso(subscription);

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

        const subUpdatePayload = {
          is_subscribed: isActive,
          subscription_status: mappedStatus,
          stripe_subscription_id: subscription.id,
          cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
          current_period_end: currentPeriodEnd,
        };

        let updatedRows: Array<{ id: string }> | null = null;
        if (customerId) {
          const { data, error: updateError } = await admin
            .from('profiles')
            .update(subUpdatePayload)
            .eq('stripe_customer_id', customerId)
            .select('id');
          if (updateError) {
            throw new Error(`Erro ao atualizar assinatura no Supabase: ${updateError.message}`);
          }
          updatedRows = data;
        }

        if ((!updatedRows || updatedRows.length === 0) && fallbackUserId) {
          const { error: fallbackError } = await admin
            .from('profiles')
            .update({
              ...subUpdatePayload,
              ...(customerId ? { stripe_customer_id: customerId } : {}),
            })
            .eq('id', fallbackUserId);
          if (fallbackError) {
            throw new Error(
              `Erro no fallback ao atualizar assinatura no Supabase: ${fallbackError.message}`
            );
          }
        }
        break;
      }

      case 'invoice.paid':
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer?.id || null;
        const rawSubscription =
          (invoice as { subscription?: string | Stripe.Subscription | null }).subscription ??
          invoice.parent?.subscription_details?.subscription ??
          null;
        const subscriptionId =
          typeof rawSubscription === 'string' ? rawSubscription : rawSubscription?.id || null;

        if (
          subscriptionId &&
          customerId &&
          invoice.billing_reason !== 'subscription_create'
        ) {
          let isActive = true;
          let mappedStatus: 'active' | 'trial' = 'active';
          let currentPeriodEnd: string | null = null;
          let cancelAtPeriodEnd: boolean | undefined;
          let fallbackUserId: string | undefined =
            invoice.parent?.subscription_details?.metadata?.userId;

          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            isActive = sub.status === 'active' || sub.status === 'trialing';
            mappedStatus = sub.status === 'trialing' ? 'trial' : 'active';
            currentPeriodEnd = extractPeriodEndIso(sub);
            cancelAtPeriodEnd = Boolean(sub.cancel_at_period_end);
            fallbackUserId = sub.metadata?.userId || fallbackUserId;
          } catch (subErr) {
            console.warn('Aviso ao consultar assinatura em invoice.paid:', subErr);
          }

          if (isActive) {
            const invoiceUpdatePayload: Record<string, unknown> = {
              is_subscribed: true,
              subscription_status: mappedStatus,
              stripe_subscription_id: subscriptionId,
            };
            if (cancelAtPeriodEnd !== undefined) {
              invoiceUpdatePayload.cancel_at_period_end = cancelAtPeriodEnd;
            }
            if (currentPeriodEnd) {
              invoiceUpdatePayload.current_period_end = currentPeriodEnd;
            }

            const { data: updatedRows, error: updateError } = await admin
              .from('profiles')
              .update(invoiceUpdatePayload)
              .eq('stripe_customer_id', customerId)
              .select('id');

            if (updateError) {
              throw new Error(
                `Erro ao registrar fatura paga no Supabase: ${updateError.message}`
              );
            }

            if ((!updatedRows || updatedRows.length === 0) && fallbackUserId) {
              const { error: fallbackError } = await admin
                .from('profiles')
                .update({
                  ...invoiceUpdatePayload,
                  stripe_customer_id: customerId,
                })
                .eq('id', fallbackUserId);
              if (fallbackError) {
                throw new Error(
                  `Erro no fallback de fatura paga no Supabase: ${fallbackError.message}`
                );
              }
            }
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
