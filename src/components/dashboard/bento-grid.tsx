'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/lib/store/data-context';
import { StreakConfigModal } from './streak-config-modal';
import {
  CalendarClock,
  Flame,
  Target,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  SlidersHorizontal,
} from 'lucide-react';

export const BentoGrid: React.FC = () => {
  const { stats, topics, streakConfig } = useData();
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);

  const minQ = streakConfig?.minDailyQuestions ?? 10;
  const ruleType = streakConfig?.ruleType ?? 'questions_or_mock';

  const getStreakRuleSummary = () => {
    switch (ruleType) {
      case 'questions_only':
        return `Regra ${minQ} Qs`;
      case 'mock_only':
        return 'Regra 1 Sim';
      case 'questions_and_mock':
        return `Regra ${minQ} Qs + 1 Sim`;
      case 'questions_or_mock':
      default:
        return `Regra ${minQ} Qs / 1 Sim`;
    }
  };

  const getStreakProgressText = () => {
    if (stats.streakQualifiedToday) {
      return 'Ofensiva de hoje garantida com sucesso!';
    }
    switch (ruleType) {
      case 'questions_only':
        return `Hoje: ${stats.todayQuestionsCount}/${minQ} questões feitas`;
      case 'mock_only':
        return stats.todayMockCompleted ? 'Simulado do dia concluído!' : 'Simulado do dia pendente';
      case 'questions_and_mock':
        return `Hoje: ${stats.todayQuestionsCount}/${minQ} Qs • Simulado: ${stats.todayMockCompleted ? 'Concluído' : 'Pendente'}`;
      case 'questions_or_mock':
      default:
        return `Hoje: ${stats.todayQuestionsCount}/${minQ} questões ou 1 simulado`;
    }
  };

  const getStreakBadgeText = () => {
    if (stats.streakQualifiedToday) {
      return 'Pontuou Hoje';
    }
    if (ruleType === 'mock_only') {
      return 'Falta 1 simulado';
    }
    if (ruleType === 'questions_and_mock') {
      const diff = Math.max(0, minQ - stats.todayQuestionsCount);
      if (diff > 0 && !stats.todayMockCompleted) {
        return `Faltam ${diff} Qs + Sim`;
      }
      if (diff > 0) {
        return `Faltam ${diff} questões`;
      }
      return 'Falta 1 simulado';
    }
    // questions_only ou questions_or_mock
    const diff = Math.max(0, minQ - stats.todayQuestionsCount);
    return `Faltam ${diff} questões`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Revisões de Hoje (Link -> Diário / Dia) */}
      <Link href="/diario?view=dia" className="block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl group/link">
        <Card className="relative overflow-hidden border-border bg-gradient-to-br from-card via-card to-blue-950/20 group hover:border-blue-500/50 hover:shadow-md transition-all shadow-sm cursor-pointer h-full">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <CardContent className="p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Fila de Hoje
            </span>
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
              <CalendarClock className="h-5 w-5" />
            </div>
          </div>

          <div className="my-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold tracking-tight text-foreground">
                {stats.todayReviewsCount}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {stats.todayReviewsCount === 1 ? 'assunto pendente' : 'assuntos pendentes'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.todayReviewsCount === 0
                ? 'Meta do dia cumprida com sucesso'
                : 'Priorize os temas em atraso e de hoje'}
            </p>
          </div>

          <div className="pt-2 border-t border-border/60 flex items-center justify-between">
            {stats.todayReviewsCount > 0 ? (
              <Badge variant="hoje" className="text-[11px]">
                Ação prioritária
              </Badge>
            ) : (
              <Badge variant="concluido" className="text-[11px]">
                Tudo em dia
              </Badge>
            )}
            <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
              Hoje <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
      </Link>

      {/* Card 2: Sequência de Estudos Ativa (Streak) */}
      <Card className="relative overflow-hidden border-border bg-gradient-to-br from-card via-card to-amber-950/20 group hover:border-amber-500/40 transition-all shadow-sm">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <CardContent className="p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Ofensiva Ativa
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsStreakModalOpen(true);
                }}
                className="p-1 rounded-md text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                title="Configurar meta da ofensiva"
                aria-label="Configurar meta da ofensiva"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <Flame className="h-5 w-5 fill-amber-500 text-amber-500" />
            </div>
          </div>

          <div className="my-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold tracking-tight text-amber-400">
                {stats.currentStreak}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {stats.currentStreak === 1 ? 'dia consecutivo' : 'dias consecutivos'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {getStreakProgressText()}
            </p>
          </div>

          <div className="pt-2 border-t border-border/60 flex items-center justify-between">
            {stats.streakQualifiedToday ? (
              <Badge variant="concluido" className="text-[10px]">
                Pontuou Hoje
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] text-amber-300 bg-amber-500/10 border-amber-500/20">
                {getStreakBadgeText()}
              </Badge>
            )}
            <span className="text-[11px] text-muted-foreground">{getStreakRuleSummary()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Taxa Global de Acertos (Link -> Evolução) */}
      <Link href="/evolucao" className="block focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-xl group/link">
        <Card className="relative overflow-hidden border-border bg-gradient-to-br from-card via-card to-emerald-950/20 group hover:border-emerald-500/50 hover:shadow-md transition-all shadow-sm cursor-pointer h-full">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Acurácia Global
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                <Target className="h-5 w-5" />
              </div>
            </div>

            <div className="my-3">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-emerald-400">
                  {stats.overallAccuracy}%
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  taxa média
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Em {stats.totalQuestions.toLocaleString('pt-BR')} questões resolvidas
              </p>
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between">
              <span className="text-[11px] text-emerald-300 font-medium flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> {topics.length} assuntos catalogados
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                Evolução <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Card 4: Alerta de Vulnerabilidade (Link -> Evolução) */}
      <Link href="/evolucao" className="block focus:outline-none focus:ring-2 focus:ring-rose-500 rounded-xl group/link">
        <Card className="relative overflow-hidden border-border bg-gradient-to-br from-card via-card to-rose-950/20 group hover:border-rose-500/50 hover:shadow-md transition-all shadow-sm cursor-pointer h-full">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Ponto de Atenção
              </span>
              <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>

            <div className="my-3">
              {stats.vulnerableArea ? (
                <>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-extrabold tracking-tight text-rose-400 truncate">
                      {stats.vulnerableArea.area}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Menor acurácia registrada:{' '}
                    <span className="font-bold text-rose-400">
                      {stats.vulnerableArea.accuracy}%
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-foreground">Sem Vulnerabilidades</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cadastre assuntos para mapear seus pontos fracos
                  </p>
                </>
              )}
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between">
              <span className="text-[11px] font-medium text-rose-400">
                Reforço recomendado
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                Diagnóstico <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Modal de Configuração Rápida da Ofensiva */}
      <StreakConfigModal
        open={isStreakModalOpen}
        onOpenChange={setIsStreakModalOpen}
      />
    </div>
  );
};
