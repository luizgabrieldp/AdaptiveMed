'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { RetentionChart } from '@/components/evolution/retention-chart';
import { AreaBreakdownCards } from '@/components/evolution/area-breakdown-cards';
import { TrendingUp, Award, Zap } from 'lucide-react';
import { useData } from '@/lib/store/data-context';

export default function EvolucaoPage() {
  const { stats, topics } = useData();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header da Tela */}
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Curva de Retenção & Evolução
            </h1>
            <TrendingUp className="h-6 w-6 text-emerald-400" />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Visualize a eficiência cognitiva da repetição espaçada na fixação de longo prazo dos assuntos médicos.
          </p>
        </div>

        {/* Gráfico Principal da Curva de Retenção */}
        <RetentionChart />

        {/* Resumo por Grande Área */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">
              Consolidação por Grande Área
            </h3>
            <span className="text-xs text-muted-foreground">
              Média ponderada de todas as revisões realizadas
            </span>
          </div>
          <AreaBreakdownCards />
        </div>
      </div>
    </AppLayout>
  );
}
