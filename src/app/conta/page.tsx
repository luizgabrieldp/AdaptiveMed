'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/lib/store/data-context';
import { CancelSubscriptionModal } from '@/components/subscription/cancel-subscription-modal';
import {
  CreditCard,
  User,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  LogOut,
  RefreshCw,
  Loader2,
  Target,
} from 'lucide-react';

interface SubscriptionData {
  isSubscribed: boolean;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  planName: string;
  amount: string;
}

export default function ContaPage() {
  const { profile, user, isDemoMode, signOut } = useData();
  const [subData, setSubData] = useState<SubscriptionData | null>(null);
  const [isLoadingSub, setIsLoadingSub] = useState<boolean>(true);
  const [cancelModalOpen, setCancelModalOpen] = useState<boolean>(false);
  const [portalLoading, setPortalLoading] = useState<boolean>(false);
  const [reactivateLoading, setReactivateLoading] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchSubscription = async () => {
    try {
      setIsLoadingSub(true);
      const email = user?.email || profile?.id;
      const res = await fetch(`/api/subscription${email ? `?email=${encodeURIComponent(email)}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setSubData(data);
      }
    } catch (err) {
      console.error('Erro ao carregar assinatura:', err);
    } finally {
      setIsLoadingSub(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user, profile]);

  const handleOpenStripePortal = async () => {
    try {
      setPortalLoading(true);
      setActionNotice(null);
      const res = await fetch('/api/subscription/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setActionNotice({
          type: 'error',
          message: data.error || 'Não foi possível abrir o portal do Stripe no momento.',
        });
      }
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || 'Erro ao conectar ao portal do Stripe.',
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const handleReactivate = async () => {
    try {
      setReactivateLoading(true);
      setActionNotice(null);
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reactivate' }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionNotice({
          type: 'success',
          message: 'Assinatura reativada com sucesso! A renovação automática continuará ativa.',
        });
        await fetchSubscription();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || 'Erro ao reativar assinatura.',
      });
    } finally {
      setReactivateLoading(false);
    }
  };

  const handleCancelSuccess = (periodEnd?: string) => {
    setActionNotice({
      type: 'success',
      message: `Assinatura cancelada. Nenhuma cobrança adicional será realizada e seu acesso está garantido até ${periodEnd || 'o fim do ciclo'}.`,
    });
    fetchSubscription();
  };

  const formattedPeriodEnd = subData?.currentPeriodEnd
    ? new Date(subData.currentPeriodEnd).toLocaleDateString('pt-BR')
    : null;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Cabeçalho da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-5">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
              <User className="h-6 w-6 text-primary" />
              Minha Conta & Assinatura
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Gerencie seus dados de acesso, preferências e plano de estudos do AdaptiveMed.
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchSubscription}
            disabled={isLoadingSub}
            className="self-start text-xs text-muted-foreground hover:text-foreground gap-1.5"
            title="Atualizar dados da conta"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingSub ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>
        </div>

        {/* Notificação de Sucesso ou Erro */}
        {actionNotice && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
              actionNotice.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-destructive/15 border-destructive/30 text-destructive'
            }`}
          >
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            )}
            <span>{actionNotice.message}</span>
          </div>
        )}

        {/* CARD PRINCIPAL: GESTÃO DA ASSINATURA */}
        <Card className="border-border shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-primary/15 text-primary">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Plano & Assinatura</CardTitle>
                  <CardDescription className="text-xs">
                    Detalhes do seu plano atual e controle de cobranças
                  </CardDescription>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {isDemoMode ? (
                  <Badge variant="secondary" className="gap-1 font-semibold text-xs">
                    <Sparkles className="h-3 w-3 text-blue-400" /> Modo Demonstração
                  </Badge>
                ) : subData?.cancelAtPeriodEnd ? (
                  <Badge variant="atrasado" className="gap-1 font-semibold text-xs bg-amber-500/15 text-amber-300 border-amber-500/30">
                    <AlertTriangle className="h-3 w-3 text-amber-400" /> Cancelamento Agendado
                  </Badge>
                ) : subData?.isSubscribed ? (
                  <Badge variant="concluido" className="gap-1 font-semibold text-xs">
                    <CheckCircle2 className="h-3 w-3" /> Assinatura Ativa
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1 font-semibold text-xs">
                    Pendente
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-5">
            {/* Resumo do Plano */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-muted/40 border border-border">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Plano Atual
                </p>
                <p className="text-base font-extrabold text-foreground mt-0.5">
                  {subData?.planName || (isDemoMode ? 'AdaptiveMed VIP' : 'Plano Pro')}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Valor da Cobrança
                </p>
                <p className="text-base font-extrabold text-foreground mt-0.5">
                  {subData?.amount || 'R$ 7,99/mês'}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {subData?.cancelAtPeriodEnd ? 'Acesso Garantido Até' : 'Próxima Renovação'}
                </p>
                <p className="text-base font-extrabold text-foreground mt-0.5">
                  {formattedPeriodEnd || (isDemoMode ? 'Acesso Ilimitado' : 'Renovação Automática')}
                </p>
              </div>
            </div>

            {/* Aviso quando o cancelamento está agendado */}
            {subData?.cancelAtPeriodEnd && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-300">
                      Sua assinatura não será renovada
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      Seu pedido de cancelamento foi concluído. Não haverá novas cobranças no seu cartão e seu acesso completo permanecerá liberado até <strong className="text-foreground">{formattedPeriodEnd}</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Botões de Ação da Assinatura */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Botão para Portal do Cliente Stripe (alterar cartão, ver recibos) */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenStripePortal}
                  disabled={portalLoading}
                  className="text-xs h-9 gap-1.5 border-border hover:bg-muted"
                >
                  {portalLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span>Recibos & Alterar Cartão</span>
                </Button>
              </div>

              {/* Botão de Cancelamento / Reativação */}
              <div>
                {subData?.cancelAtPeriodEnd ? (
                  <Button
                    size="sm"
                    onClick={handleReactivate}
                    disabled={reactivateLoading}
                    className="text-xs h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1.5 shadow-sm"
                  >
                    {reactivateLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    <span>Reativar Assinatura</span>
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setCancelModalOpen(true)}
                    className="text-xs h-9 font-bold gap-1.5 shadow-sm"
                  >
                    <span>Cancelar Assinatura</span>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CARD SECUNDÁRIO: DADOS DO ESTUDANTE & METAS */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Perfil do Estudante</CardTitle>
                  <CardDescription className="text-xs">
                    Metas de aprovação, especialidade e bancas configuradas
                  </CardDescription>
                </div>
              </div>

              <Link href="/onboarding">
                <Button variant="outline" size="sm" className="text-xs h-8 gap-1 border-border">
                  <span>Editar Metas</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                <span className="text-muted-foreground text-[11px]">Nome de Usuário</span>
                <p className="font-bold text-foreground text-sm mt-0.5">
                  {profile?.full_name || 'Estudante de Medicina'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                <span className="text-muted-foreground text-[11px]">E-mail de Acesso</span>
                <p className="font-bold text-foreground text-sm mt-0.5 truncate">
                  {user?.email || (isDemoMode ? 'admin123@adaptivemed.app' : 'Não informado')}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                <span className="text-muted-foreground text-[11px]">Especialidade Alvo</span>
                <p className="font-bold text-foreground text-sm mt-0.5">
                  {profile?.target_specialty || 'Residência Médica Geral'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                <span className="text-muted-foreground text-[11px]">Nota de Corte Alvo</span>
                <p className="font-bold text-foreground text-sm mt-0.5">
                  {profile?.target_cutoff_percentage ? `${profile.target_cutoff_percentage}%` : '80% (Padrão)'}
                </p>
              </div>
            </div>

            {profile?.target_exams && profile.target_exams.length > 0 && (
              <div className="pt-2">
                <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                  Bancas e Concursos Selecionados:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.target_exams.map(exam => (
                    <span
                      key={exam}
                      className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-foreground border border-border"
                    >
                      {exam}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CARD TERCIÁRIO: SEGURANÇA E ENCERRAMENTO DE SESSÃO */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>
            Dúvidas ou suporte? Entre em contato pelo e-mail de suporte da plataforma.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await signOut();
              window.location.href = '/login';
            }}
            className="text-xs text-destructive hover:bg-destructive/10 gap-1.5"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair da Minha Conta</span>
          </Button>
        </div>
      </div>

      {/* Modal de Cancelamento com Feedback */}
      <CancelSubscriptionModal
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        currentPeriodEnd={subData?.currentPeriodEnd}
        onSuccess={handleCancelSuccess}
      />
    </AppLayout>
  );
}
