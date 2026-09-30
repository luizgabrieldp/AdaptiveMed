'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/lib/store/data-context';
import { CancelSubscriptionModal } from '@/components/subscription/cancel-subscription-modal';
import { createClient } from '@/lib/supabase/client';
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
  KeyRound,
  Link2,
  Lock,
  Flame,
  Gauge,
  Layers,
  Sparkle,
} from 'lucide-react';
import {
  StreakRuleType,
  DEFAULT_STREAK_CONFIG,
  WorkloadConfig,
  DEFAULT_WORKLOAD_CONFIG,
} from '@/types/database';

interface SubscriptionData {
  isSubscribed: boolean;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  planName: string;
  amount: string;
}

const STREAK_RULES: { id: StreakRuleType; label: string; description: string; badge?: string }[] = [
  {
    id: 'questions_or_mock',
    label: 'Questões OU Simulado',
    description: 'Atingir a meta diária de questões OU concluir um simulado mantém a ofensiva ativa.',
    badge: 'Padrão',
  },
  {
    id: 'questions_only',
    label: 'Apenas Questões',
    description: 'Exige atingir a meta diária de questões (simulados isolados não contam).',
  },
  {
    id: 'questions_and_mock',
    label: 'Questões E Simulado',
    description: 'Exige atingir a meta diária de questões E concluir ao menos um simulado no dia.',
    badge: 'Hardcore',
  },
  {
    id: 'mock_only',
    label: 'Apenas Simulado',
    description: 'Apenas dias em que você realiza simulado mantêm a ofensiva ativa.',
  },
];

export default function ContaPage() {
  const {
    profile,
    user,
    isDemoMode,
    signOut,
    streakConfig,
    updateStreakConfig,
    workloadConfig,
    updateWorkloadConfig,
    stats,
  } = useData();
  const [subData, setSubData] = useState<SubscriptionData | null>(null);
  const [isLoadingSub, setIsLoadingSub] = useState<boolean>(true);
  const [cancelModalOpen, setCancelModalOpen] = useState<boolean>(false);
  const [portalLoading, setPortalLoading] = useState<boolean>(false);
  const [reactivateLoading, setReactivateLoading] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Estados de segurança (senha e Google)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);

  // Estados da Regra da Ofensiva (Streak)
  const currentStreakConfig = streakConfig || profile?.streak_config || DEFAULT_STREAK_CONFIG;
  const [selectedRuleType, setSelectedRuleType] = useState<StreakRuleType>(currentStreakConfig.ruleType);
  const [selectedMinQuestions, setSelectedMinQuestions] = useState<number>(currentStreakConfig.minDailyQuestions || 10);
  const [isUpdatingStreak, setIsUpdatingStreak] = useState(false);
  const [streakSuccessMessage, setStreakSuccessMessage] = useState<string | null>(null);

  // Estados da Capacidade Diária & Gestão de Carga (Anti-Sobrecarga)
  const currentWorkload = workloadConfig || profile?.workload_config || DEFAULT_WORKLOAD_CONFIG;
  const [maxDailyReviews, setMaxDailyReviews] = useState<number>(currentWorkload.maxDailyReviews ?? 3);
  const [maxDailyOverdue, setMaxDailyOverdue] = useState<number>(currentWorkload.maxDailyOverdue ?? 2);
  const [maxDailyNewTopics, setMaxDailyNewTopics] = useState<number>(currentWorkload.maxDailyNewTopics ?? 1);
  const [isUpdatingWorkload, setIsUpdatingWorkload] = useState(false);
  const [workloadSuccessMessage, setWorkloadSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (streakConfig) {
      setSelectedRuleType(streakConfig.ruleType);
      setSelectedMinQuestions(streakConfig.minDailyQuestions);
    }
  }, [streakConfig]);

  useEffect(() => {
    if (workloadConfig) {
      setMaxDailyReviews(workloadConfig.maxDailyReviews ?? 3);
      setMaxDailyOverdue(workloadConfig.maxDailyOverdue ?? 2);
      setMaxDailyNewTopics(workloadConfig.maxDailyNewTopics ?? 1);
    }
  }, [workloadConfig]);

  const handleSaveStreakConfig = async (newRule?: StreakRuleType, newMin?: number) => {
    const finalRule = newRule || selectedRuleType;
    const finalMin = newMin !== undefined ? newMin : selectedMinQuestions;
    try {
      setIsUpdatingStreak(true);
      setStreakSuccessMessage(null);
      await updateStreakConfig({
        ruleType: finalRule,
        minDailyQuestions: finalMin,
      });
      setStreakSuccessMessage('Regra da ofensiva salva com sucesso!');
      setTimeout(() => setStreakSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Erro ao atualizar regra de streak:', err);
    } finally {
      setIsUpdatingStreak(false);
    }
  };

  const handleSaveWorkloadConfig = async (
    customReviews?: number,
    customOverdue?: number,
    customNewTopics?: number
  ) => {
    const finalReviews = customReviews !== undefined ? customReviews : maxDailyReviews;
    const finalOverdue = customOverdue !== undefined ? customOverdue : maxDailyOverdue;
    const finalNewTopics = customNewTopics !== undefined ? customNewTopics : maxDailyNewTopics;

    try {
      setIsUpdatingWorkload(true);
      setWorkloadSuccessMessage(null);
      await updateWorkloadConfig({
        maxDailyReviews: finalReviews,
        maxDailyOverdue: finalOverdue,
        maxDailyNewTopics: finalNewTopics,
      });
      setWorkloadSuccessMessage('Configurações de carga diária salvas com sucesso!');
      setTimeout(() => setWorkloadSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Erro ao atualizar carga diária:', err);
    } finally {
      setIsUpdatingWorkload(false);
    }
  };

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

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordNotice(null);

    if (newPassword.length < 6) {
      setPasswordNotice({ type: 'error', message: 'A senha deve ter no mínimo 6 caracteres.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordNotice({ type: 'error', message: 'As senhas digitadas não conferem.' });
      return;
    }

    try {
      setIsUpdatingPassword(true);
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordNotice({ type: 'success', message: 'Sua senha foi alterada com sucesso!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordNotice({ type: 'error', message: err.message || 'Erro ao atualizar senha.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLinkGoogle = async () => {
    try {
      setIsLinkingGoogle(true);
      setActionNotice(null);
      const supabase = createClient();
      const origin =
        typeof window !== 'undefined' && window.location.origin
          ? window.location.origin
          : 'https://adaptive-med.vercel.app';

      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=/conta`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || 'Erro ao conectar conta Google.',
      });
      setIsLinkingGoogle(false);
    }
  };

  const isGoogleLinked = Boolean(
    user?.app_metadata?.providers?.includes('google') ||
    user?.identities?.some((i: any) => i.provider === 'google')
  );

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

        {/* CARD: REGRA DA OFENSIVA DIÁRIA (STREAK) */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Regra da Ofensiva Diária (Streak)</CardTitle>
                  <CardDescription className="text-xs">
                    Configure os critérios e meta de questões para validar seus dias consecutivos de estudo
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/25">
                  <Flame className="h-4 w-4 fill-amber-400" />
                  {stats.currentStreak} {stats.currentStreak === 1 ? 'dia' : 'dias'} de ofensiva
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-5">
            {/* Status do Dia Atual */}
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                stats.streakQualifiedToday
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                  {stats.streakQualifiedToday ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="text-emerald-400">Ofensiva de hoje garantida! Parabéns pelo foco.</span>
                    </>
                  ) : (
                    <>
                      <Flame className="h-4 w-4 text-amber-400 shrink-0" />
                      <span className="text-amber-300">Ofensiva de hoje pendente — continue praticando para manter o fogo aceso!</span>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Progresso hoje: <strong className="text-foreground">{stats.todayQuestionsCount}</strong> questões feitas • Simulado hoje: <strong className="text-foreground">{stats.todayMockCompleted ? 'Sim (Concluído)' : 'Não'}</strong>
                </p>
              </div>

              <Badge
                variant={stats.streakQualifiedToday ? 'concluido' : 'atrasado'}
                className="self-start sm:self-auto text-[10px] font-semibold shrink-0"
              >
                {stats.streakQualifiedToday ? 'Qualificado Hoje' : 'Pendente'}
              </Badge>
            </div>

            {/* Seleção do Critério da Ofensiva */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-foreground">
                Critério de Validação da Ofensiva
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {STREAK_RULES.map(rule => {
                  const isSelected = selectedRuleType === rule.id;
                  return (
                    <button
                      key={rule.id}
                      type="button"
                      onClick={() => {
                        setSelectedRuleType(rule.id);
                        handleSaveStreakConfig(rule.id, selectedMinQuestions);
                      }}
                      className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/10 ring-1 ring-primary'
                          : 'border-border bg-card hover:bg-muted/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                            {rule.label}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {rule.badge && (
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                                {rule.badge}
                              </span>
                            )}
                            {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug">
                          {rule.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Meta Mínima de Questões */}
            {selectedRuleType !== 'mock_only' && (
              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    Meta Mínima Diária de Questões
                  </label>
                  <span className="text-xs font-extrabold text-primary">
                    🎯 {selectedMinQuestions || 0} questões/dia
                  </span>
                </div>
                <div className="relative max-w-xs">
                  <Input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    min={1}
                    max={500}
                    value={selectedMinQuestions === 0 ? '' : selectedMinQuestions}
                    onChange={e => {
                      const clean = e.target.value.replace(/\D/g, '');
                      const val = clean === '' ? 0 : parseInt(clean, 10);
                      setSelectedMinQuestions(val);
                    }}
                    onBlur={() => {
                      const finalQ = Math.max(1, selectedMinQuestions || 10);
                      setSelectedMinQuestions(finalQ);
                      handleSaveStreakConfig(selectedRuleType, finalQ);
                    }}
                    placeholder="Ex: 15"
                    className="h-10 px-3.5 pr-20 text-sm font-semibold rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
                    questões
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Digite a quantidade desejada de questões diárias para cumprir sua meta.
                </p>
              </div>
            )}

            {/* Feedback e Botão de Salvar */}
            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <div className="text-xs text-muted-foreground">
                {streakSuccessMessage ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1 animate-in fade-in">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {streakSuccessMessage}
                  </span>
                ) : (
                  <span>A alteração passa a valer imediatamente no cálculo diário.</span>
                )}
              </div>

              <Button
                size="sm"
                onClick={() => handleSaveStreakConfig()}
                disabled={isUpdatingStreak}
                className="h-8 text-xs font-bold gap-1.5 shadow-xs"
              >
                {isUpdatingStreak && <Loader2 className="h-3 w-3 animate-spin" />}
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Salvar Regra</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* CARD: CAPACIDADE DIÁRIA & GESTÃO DE CARGA (ANTI-SOBRECARGA) */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
                  <Gauge className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Capacidade Diária & Gestão de Carga (Anti-Sobrecarga)</CardTitle>
                  <CardDescription className="text-xs">
                    Distribuição inteligente de revisões para prevenir acúmulo excessivo e proteger sua retenção
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-purple-400 flex items-center gap-1 bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/25">
                  <Layers className="h-3.5 w-3.5" />
                  Até {maxDailyReviews} revisões/dia
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-5">
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/25 space-y-1.5">
              <p className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-purple-400" />
                Algoritmo Anti-Acúmulo com Rolagem Automática
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Quando uma data no seu calendário atinge a capacidade máxima configurada, novas revisões subsequentes são agendadas automaticamente para o próximo dia com vaga disponível. Isso impede sobrecargas cognitivas e o desestímulo por efeito &quot;bola de neve&quot;.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Controle 1: Max Daily Reviews */}
              <div className="space-y-2 p-3.5 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    Revisões por Dia
                  </label>
                  <span className="text-xs font-black text-purple-400">
                    {maxDailyReviews} temas/dia
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Limite máximo de revisões agendadas para o mesmo dia no calendário.
                </p>
                <div className="flex items-center gap-1.5 pt-1">
                  {[2, 3, 4, 5, 6].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setMaxDailyReviews(num);
                        handleSaveWorkloadConfig(num, maxDailyOverdue, maxDailyNewTopics);
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        maxDailyReviews === num
                          ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                          : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {num}
                      {num === 3 && <span className="block text-[8px] font-normal leading-none opacity-80">Ideal</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Controle 2: Max Daily Overdue */}
              <div className="space-y-2 p-3.5 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    Cota de Atrasados
                  </label>
                  <span className="text-xs font-black text-amber-400">
                    {maxDailyOverdue} na fila hoje
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Revisões em atraso puxadas para o dia atual. O restante fica protegido no backlog.
                </p>
                <div className="flex items-center gap-1.5 pt-1">
                  {[1, 2, 3, 4].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setMaxDailyOverdue(num);
                        handleSaveWorkloadConfig(maxDailyReviews, num, maxDailyNewTopics);
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        maxDailyOverdue === num
                          ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                          : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {num}
                      {num === 2 && <span className="block text-[8px] font-normal leading-none opacity-80">Ideal</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Controle 3: Max Daily New Topics */}
              <div className="space-y-2 p-3.5 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    Novos Assuntos (R0)
                  </label>
                  <span className="text-xs font-black text-blue-400">
                    {maxDailyNewTopics} novo/dia
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Ritmo diário sugerido para primeiro contato com matérias inéditas.
                </p>
                <div className="flex items-center gap-1.5 pt-1">
                  {[1, 2, 3, 4].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setMaxDailyNewTopics(num);
                        handleSaveWorkloadConfig(maxDailyReviews, maxDailyOverdue, num);
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        maxDailyNewTopics === num
                          ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                          : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {num}
                      {num === 1 && <span className="block text-[8px] font-normal leading-none opacity-80">Ideal</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Feedback e Botão de Salvar */}
            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <div className="text-xs text-muted-foreground">
                {workloadSuccessMessage ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1 animate-in fade-in">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {workloadSuccessMessage}
                  </span>
                ) : (
                  <span>Revisões que você concluir passarão a respeitar essas cotas automaticamente.</span>
                )}
              </div>

              <Button
                size="sm"
                onClick={() => handleSaveWorkloadConfig()}
                disabled={isUpdatingWorkload}
                className="h-8 text-xs font-bold gap-1.5 shadow-xs bg-purple-600 hover:bg-purple-500 text-white"
              >
                {isUpdatingWorkload && <Loader2 className="h-3 w-3 animate-spin" />}
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Salvar Cargas</span>
              </Button>
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

        {/* CARD: SEGURANÇA & MÉTODOS DE ACESSO */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Segurança & Métodos de Acesso</CardTitle>
                <CardDescription className="text-xs">
                  Altere sua senha de acesso e vincule sua conta do Google
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-6">
            {/* Vínculo com Conta Google */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground">Acesso com Conta Google</span>
                  {isGoogleLinked ? (
                    <Badge variant="concluido" className="text-[10px] gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Conectado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      Não Conectado
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isGoogleLinked
                    ? 'Sua conta do Google está vinculada. Você pode entrar clicando em "Continuar com o Google" a qualquer momento.'
                    : 'Conecte sua conta do Google para poder fazer login com apenas 1 clique no futuro.'}
                </p>
              </div>

              {!isGoogleLinked && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLinkGoogle}
                  disabled={isLinkingGoogle}
                  className="text-xs h-9 gap-2 shrink-0 border-border hover:bg-muted font-semibold"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>{isLinkingGoogle ? 'Conectando...' : 'Conectar Conta Google'}</span>
                </Button>
              )}
            </div>

            {/* Formulário de Alteração de Senha */}
            <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2 border-t border-border">
              <div className="space-y-1">
                <span className="font-bold text-sm text-foreground">Definir ou Alterar Senha</span>
                <p className="text-xs text-muted-foreground">
                  Crie ou altere uma senha para poder acessar também digitando seu e-mail e senha.
                </p>
              </div>

              {passwordNotice && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in ${
                    passwordNotice.type === 'success'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-destructive/15 border-destructive/30 text-destructive'
                  }`}
                >
                  {passwordNotice.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{passwordNotice.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Nova Senha (mínimo 6 caracteres)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full h-9 rounded-lg border border-border bg-card px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full h-9 rounded-lg border border-border bg-card px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isUpdatingPassword || !newPassword}
                  className="text-xs font-bold gap-1.5 h-9"
                >
                  {isUpdatingPassword && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Salvar Nova Senha</span>
                </Button>
              </div>
            </form>
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
