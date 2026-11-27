'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/lib/store/data-context';
import { getTodayDateString } from '@/lib/spaced-repetition';
import {
  Bell,
  BellRing,
  BellOff,
  CheckCircle2,
  Sparkles,
  Flame,
  ShieldCheck,
  Send,
  AlertCircle,
} from 'lucide-react';

const LAST_NOTIF_DATE_KEY = 'adaptivemed_last_notif_date';
const NOTIF_PROMPT_DISMISSED_KEY = 'adaptivemed_notif_dismissed';

export const NotificationManager: React.FC = () => {
  const { stats, streakConfig } = useData();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [modalOpen, setModalOpen] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const minDailyQuestions = streakConfig?.minDailyQuestions ?? 10;
  const streakRuleType = streakConfig?.ruleType ?? 'questions_or_mock';
  const streakGoalDescription =
    streakRuleType === 'mock_only'
      ? 'concluído um simulado hoje'
      : streakRuleType === 'questions_only'
      ? `resolvido as ${minDailyQuestions} questões mínimas`
      : streakRuleType === 'questions_and_mock'
      ? `resolvido as ${minDailyQuestions} questões mínimas e concluído um simulado`
      : `resolvido as ${minDailyQuestions} questões mínimas ou o simulado`;

  // Checa permissão atual do navegador
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!('Notification' in window)) {
        setPermission('unsupported');
      } else {
        setPermission(Notification.permission);
      }
    }
  }, []);

  // Notificação diária automática se concedido
  useEffect(() => {
    if (typeof window === 'undefined' || permission !== 'granted') return;

    try {
      const today = getTodayDateString();
      const lastSent = localStorage.getItem(LAST_NOTIF_DATE_KEY);

      if (lastSent !== today && stats.todayReviewsCount > 0) {
        new Notification('AdaptiveMed: Fila de Hoje', {
          body: `Você tem ${stats.todayReviewsCount} ${
            stats.todayReviewsCount === 1 ? 'assunto' : 'assuntos'
          } para revisar hoje. Não perca sua ofensiva de ${stats.currentStreak} dias!`,
          icon: '/favicon.ico',
        });
        localStorage.setItem(LAST_NOTIF_DATE_KEY, today);
      }
    } catch (err) {
      console.warn('Erro ao disparar notificação automática:', err);
    }
  }, [permission, stats.todayReviewsCount, stats.currentStreak]);

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        new Notification('AdaptiveMed: Notificações Ativadas! 🎉', {
          body: 'Lembretes de revisões e avisos da sua ofensiva chegarão direto aqui na sua central.',
          icon: '/favicon.ico',
        });
        setTestSent(true);
      }
    } catch (err) {
      console.error('Erro ao pedir permissão de notificações:', err);
    }
  };

  const sendTestNotification = () => {
    if (typeof window === 'undefined' || !('Notification' in window) || permission !== 'granted') {
      return;
    }

    try {
      new Notification('AdaptiveMed: Teste de Lembrete', {
        body: `Lembrete ativo: você tem ${stats.todayReviewsCount} revisão(ões) pendentes e ${stats.currentStreak} dias de ofensiva!`,
        icon: '/favicon.ico',
      });
      setTestSent(true);
      setTimeout(() => setTestSent(false), 4000);
    } catch (err) {
      console.error('Erro ao enviar teste:', err);
    }
  };

  return (
    <>
      {/* Botão de Notificação no Header / Top Bar */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all border border-transparent hover:border-border/60"
        title={
          permission === 'granted'
            ? 'Notificações ativas no navegador'
            : permission === 'unsupported'
            ? 'Notificações não suportadas neste navegador'
            : 'Configurar notificações de estudo'
        }
        aria-label={
          permission === 'granted'
            ? 'Notificações ativas no navegador'
            : permission === 'unsupported'
            ? 'Notificações não suportadas neste navegador'
            : 'Configurar notificações de estudo'
        }
      >
        {permission === 'granted' ? (
          <BellRing className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        ) : permission === 'denied' ? (
          <BellOff className="h-4 w-4 text-rose-600 dark:text-rose-400 opacity-60" />
        ) : permission === 'unsupported' ? (
          <BellOff className="h-4 w-4 text-muted-foreground opacity-60" />
        ) : (
          <Bell className="h-4 w-4 text-muted-foreground" />
        )}

        {permission === 'default' && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500" />
        )}
      </button>

      {/* Modal de Gestão de Notificações */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                <BellRing className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Notificações no Navegador & Celular
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Receba avisos das revisões do dia e alertas para proteger sua ofensiva.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Status atual */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Status de Notificações:</span>
              {permission === 'granted' ? (
                <Badge variant="concluido" className="gap-1 text-xs">
                  <CheckCircle2 className="h-3 w-3" /> Permitido no Navegador
                </Badge>
              ) : permission === 'denied' ? (
                <Badge variant="destructive" className="gap-1 text-xs">
                  <BellOff className="h-3 w-3" /> Bloqueado no Navegador
                </Badge>
              ) : permission === 'unsupported' ? (
                <Badge variant="outline" className="gap-1 text-xs text-muted-foreground border-border">
                  <BellOff className="h-3 w-3" /> Não Suportado
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-xs text-amber-600 dark:text-amber-400 border-amber-500/30">
                  <AlertCircle className="h-3 w-3" /> Aguardando Permissão
                </Badge>
              )}
            </div>

            {/* Como funciona */}
            <div className="space-y-2 text-muted-foreground leading-relaxed">
              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <p>
                  <strong className="text-foreground">Lembrete Diário da Fila:</strong> Se houver assuntos programados para hoje ou em atraso, você receberá um alerta automático.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  <Flame className="h-3.5 w-3.5" />
                </div>
                <p>
                  <strong className="text-foreground">Proteção de Ofensiva:</strong> Alerta preventivo se o dia estiver acabando e você ainda não tiver {streakGoalDescription}.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
                <p>
                  <strong className="text-foreground">Mac, Windows e Celular:</strong> No Mac e Windows, os alertas aparecem na sua Central de Notificações nativa. No celular, aparecem como banner do app web.
                </p>
              </div>
            </div>

            {permission === 'unsupported' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                Este navegador não suporta notificações web nativas neste modo (por exemplo, iOS Safari fora da Tela de Início). Para receber alertas no iPhone/iPad, adicione o AdaptiveMed à Tela de Início ou utilize um navegador compatível no desktop/Android.
              </div>
            )}

            {permission === 'denied' && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-[11px] text-destructive leading-relaxed">
                As notificações estão bloqueadas nas configurações do seu navegador. Para ativá-las, clique no ícone de cadeado ao lado da URL na barra de endereços e altere a opção &quot;Notificações&quot; para &quot;Permitir&quot;.
              </div>
            )}

            {testSent && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Notificação enviada! Verifique a central de notificações do seu sistema.</span>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            {permission !== 'granted' && permission !== 'denied' && (
              <Button
                type="button"
                onClick={requestPermission}
                disabled={permission === 'unsupported'}
                className="w-full sm:w-auto font-bold text-xs gap-1.5 shadow-md shadow-primary/20"
              >
                <BellRing className="h-4 w-4" />
                {permission === 'unsupported'
                  ? 'Notificações Indisponíveis'
                  : 'Ativar Notificações no Navegador'}
              </Button>
            )}

            {permission === 'granted' && (
              <Button
                type="button"
                variant="outline"
                onClick={sendTestNotification}
                className="w-full sm:w-auto text-xs gap-1.5 border-border"
              >
                <Send className="h-3.5 w-3.5" />
                Enviar Notificação de Teste
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalOpen(false)}
              className="w-full sm:w-auto text-xs text-muted-foreground"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
