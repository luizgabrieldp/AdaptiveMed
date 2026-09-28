import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20' as any,
    })
  : null;

async function getSupabase() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {}
      },
    },
  });
}

// GET: Retorna os detalhes da assinatura do usuário
export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { searchParams } = new URL(req.url);
    const queryEmail = searchParams.get('email');
    const targetEmail = user?.email || queryEmail;

    if (!targetEmail) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Busca perfil no Supabase
    let profileQuery = supabase.from('profiles').select('*');
    if (user?.id) {
      profileQuery = profileQuery.eq('id', user.id);
    } else {
      // Fallback por e-mail se necessário
      const { data: userData } = await supabase.rpc('get_user_id_by_email', {
        email_input: targetEmail,
      });
      if (userData) {
        profileQuery = profileQuery.eq('id', userData);
      }
    }

    const { data: profile } = await profileQuery.maybeSingle();

    // Se estiver em modo demo ou sem Stripe configurado
    if (!stripe) {
      return NextResponse.json({
        isSubscribed: profile?.is_subscribed ?? true,
        status: profile?.subscription_status || 'active',
        cancelAtPeriodEnd: profile?.cancel_at_period_end ?? false,
        currentPeriodEnd: profile?.current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        planName: 'Plano Pro (Demonstração)',
        amount: 'R$ 7,99/mês',
      });
    }

    // Busca assinatura no Stripe
    let stripeSubscription: Stripe.Subscription | null = null;
    let customer: Stripe.Customer | null = null;

    if (profile?.stripe_subscription_id) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(
          profile.stripe_subscription_id
        );
      } catch (err) {
        console.warn('Erro ao buscar assinatura direta:', err);
      }
    }

    // Se não achou pelo ID direto, pesquisa pelo e-mail do cliente
    if (!stripeSubscription && targetEmail) {
      const customers = await stripe.customers.list({
        email: targetEmail,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customer = customers.data[0];
        const subs = await stripe.subscriptions.list({
          customer: customer.id,
          status: 'all',
          limit: 1,
        });

        if (subs.data.length > 0) {
          stripeSubscription = subs.data[0];
        }
      }
    }

    if (stripeSubscription) {
      const currentPeriodEndSec = (stripeSubscription as any).current_period_end;
      const periodEnd = currentPeriodEndSec
        ? new Date(currentPeriodEndSec * 1000).toISOString()
        : null;
      const planItem = stripeSubscription.items.data[0]?.price;
      const unitAmount = planItem?.unit_amount ? planItem.unit_amount / 100 : 7.99;
      const interval = planItem?.recurring?.interval === 'year' ? 'ano' : 'mês';

      return NextResponse.json({
        isSubscribed: stripeSubscription.status === 'active' || stripeSubscription.status === 'trialing',
        status: stripeSubscription.status,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        currentPeriodEnd: periodEnd,
        planName: unitAmount > 20 ? 'Plano Anual VIP' : 'Plano Mensal Pro',
        amount: `R$ ${unitAmount.toFixed(2).replace('.', ',')}/${interval}`,
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId: typeof stripeSubscription.customer === 'string' ? stripeSubscription.customer : stripeSubscription.customer.id,
      });
    }

    return NextResponse.json({
      isSubscribed: profile?.is_subscribed ?? false,
      status: profile?.subscription_status || 'inactive',
      cancelAtPeriodEnd: profile?.cancel_at_period_end ?? false,
      currentPeriodEnd: profile?.current_period_end || null,
      planName: profile?.is_subscribed ? 'Plano Pro' : 'Nenhum plano ativo',
      amount: 'R$ 7,99/mês',
    });
  } catch (error: any) {
    console.error('Erro na rota GET /api/subscription:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Ações de Cancelamento ou Reativação
export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json();
    const { action, reason, email } = body;
    const targetEmail = user?.email || email;

    if (!targetEmail) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    // Se estiver sem Stripe configurado (ambiente local/demo)
    if (!stripe) {
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({
            cancel_at_period_end: action === 'cancel',
          })
          .eq('id', user.id);
      }

      return NextResponse.json({
        success: true,
        action,
        message:
          action === 'cancel'
            ? 'Assinatura cancelada com sucesso! Seu acesso continuará ativo até o final do ciclo atual.'
            : 'Assinatura reativada com sucesso!',
      });
    }

    // Busca o customer ou a subscription no Stripe
    let subscriptionId: string | null = null;

    if (user?.id) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('stripe_subscription_id, stripe_customer_id')
        .eq('id', user.id)
        .maybeSingle();

      if (prof?.stripe_subscription_id) {
        subscriptionId = prof.stripe_subscription_id;
      }
    }

    if (!subscriptionId && targetEmail) {
      const customers = await stripe.customers.list({
        email: targetEmail,
        limit: 1,
      });

      if (customers.data.length > 0) {
        const subs = await stripe.subscriptions.list({
          customer: customers.data[0].id,
          status: 'active',
          limit: 1,
        });
        if (subs.data.length > 0) {
          subscriptionId = subs.data[0].id;
        }
      }
    }

    if (!subscriptionId) {
      // Se não encontrou assinatura no Stripe, atualiza apenas o banco
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({
            cancel_at_period_end: action === 'cancel',
          })
          .eq('id', user.id);
      }

      return NextResponse.json({
        success: true,
        action,
        message:
          action === 'cancel'
            ? 'Cancelamento registrado. Seu acesso permanecerá liberado até o final do período.'
            : 'Assinatura reativada com sucesso.',
      });
    }

    if (action === 'cancel') {
      // Padrão de mercado: cancel_at_period_end = true (mantém o acesso pago e para as cobranças futuras)
      const updatedSub = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
        metadata: {
          cancellation_reason: reason || 'Não informado',
          cancelled_at: new Date().toISOString(),
        },
      });

      const endSec = (updatedSub as any).current_period_end;
      const periodEndIso = endSec ? new Date(endSec * 1000).toISOString() : null;
      const periodEndDate = endSec
        ? new Date(endSec * 1000).toLocaleDateString('pt-BR')
        : 'o final do ciclo';

      if (user?.id) {
        await supabase
          .from('profiles')
          .update({
            cancel_at_period_end: true,
            current_period_end: periodEndIso,
          })
          .eq('id', user.id);
      }

      return NextResponse.json({
        success: true,
        action: 'cancel',
        periodEnd: periodEndDate,
        message: `Assinatura cancelada. Não haverá novas cobranças no seu cartão e seu acesso permanecerá liberado até ${periodEndDate}.`,
      });
    } else if (action === 'reactivate') {
      // Reativa a renovação automática
      const updatedSub = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      if (user?.id) {
        await supabase
          .from('profiles')
          .update({
            cancel_at_period_end: false,
          })
          .eq('id', user.id);
      }

      return NextResponse.json({
        success: true,
        action: 'reactivate',
        message: 'Assinatura reativada com sucesso! A renovação automática foi restabelecida.',
      });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error: any) {
    console.error('Erro na rota POST /api/subscription:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
