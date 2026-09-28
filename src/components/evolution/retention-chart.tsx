'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useData } from '@/lib/store/data-context';
import { MEDICAL_AREAS, AREA_COLORS } from '@/types/database';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Sparkles, Filter, BrainCircuit } from 'lucide-react';

export const RetentionChart: React.FC = () => {
  const { topics, reviews } = useData();
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('TODAS');

  // Calcula a média de retenção para cada etapa: Contato Inicial, R1, R2, ..., R8
  const chartData = useMemo(() => {
    const stages = [
      { key: 'initial', label: '1º Contato' },
      { key: 'r1', label: 'R1' },
      { key: 'r2', label: 'R2' },
      { key: 'r3', label: 'R3' },
      { key: 'r4', label: 'R4' },
      { key: 'r5', label: 'R5' },
      { key: 'r6', label: 'R6' },
      { key: 'r7', label: 'R7' },
      { key: 'r8', label: 'R8' },
    ];

    // Filtra tópicos se uma área estiver selecionada
    const relevantTopics =
      selectedAreaFilter === 'TODAS'
        ? topics
        : topics.filter(t => t.area === selectedAreaFilter);

    const relevantTopicIds = new Set(relevantTopics.map(t => t.id));

    // Média geral do aluno
    const overallData: Record<string, { sum: number; count: number }> = {};
    stages.forEach(s => (overallData[s.key] = { sum: 0, count: 0 }));

    // 1º Contato
    relevantTopics.forEach(t => {
      overallData['initial'].sum += t.initial_percentage;
      overallData['initial'].count += 1;
    });

    // Revisões concluídas
    reviews.forEach(r => {
      if (r.completed_date && r.percentage !== null && relevantTopicIds.has(r.topic_id)) {
        const key = `r${r.review_number}`;
        if (overallData[key]) {
          overallData[key].sum += r.percentage;
          overallData[key].count += 1;
        }
      }
    });

    return stages.map(s => {
      const item = overallData[s.key];
      const avg = item.count > 0 ? Math.round((item.sum / item.count) * 10) / 10 : null;

      // Meta ideal projetada (Curva de Superação do Esquecimento)
      const idealValues: Record<string, number> = {
        initial: 70,
        r1: 78,
        r2: 83,
        r3: 87,
        r4: 90,
        r5: 92,
        r6: 94,
        r7: 95,
        r8: 97,
      };

      return {
        stage: s.label,
        suaMedia: avg,
        metaIdeal: idealValues[s.key],
        amostras: item.count,
      };
    });
  }, [topics, reviews, selectedAreaFilter]);

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2">
        <div>
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg font-bold">
              Curva de Fixação e Retenção de Memória
            </CardTitle>
            <span className="p-1 rounded-md bg-primary/10 text-primary">
              <BrainCircuit className="h-4 w-4" />
            </span>
          </div>
          <CardDescription>
            Aproveitamento médio do primeiro contato aos ciclos R1 a R8 (Vencendo a Curva do Esquecimento de Ebbinghaus).
          </CardDescription>
        </div>

        {/* Filtro por Grande Área */}
        <div className="flex items-center space-x-2 text-xs">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={selectedAreaFilter}
            onChange={e => setSelectedAreaFilter(e.target.value)}
            className="h-8 rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="TODAS">Média Geral (Todas)</option>
            {MEDICAL_AREAS.map(a => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis
                dataKey="stage"
                stroke="#64748B"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                domain={[40, 100]}
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={val => `${val}%`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-border bg-card p-3 shadow-xl text-xs space-y-1">
                        <p className="font-bold text-foreground">{label}</p>
                        {data.suaMedia !== null ? (
                          <p className="text-emerald-400 font-semibold">
                            Seu Desempenho Real: {data.suaMedia}%
                          </p>
                        ) : (
                          <p className="text-muted-foreground italic">
                            Aguardando conclusão de revisões neste ciclo
                          </p>
                        )}
                        <p className="text-blue-400 font-medium">
                          Meta de Fixação: {data.metaIdeal}%
                        </p>
                        {data.amostras > 0 && (
                          <p className="text-muted-foreground text-[10px]">
                            Baseado em {data.amostras} {data.amostras === 1 ? 'registro' : 'registros'}
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                height={36}
                wrapperStyle={{ fontSize: 12 }}
              />
              <ReferenceLine
                y={80}
                stroke="#F59E0B"
                strokeDasharray="4 4"
                label={{
                  value: 'Corte Residência (80%)',
                  position: 'insideBottomLeft',
                  fill: '#F59E0B',
                  fontSize: 10,
                }}
              />
              <Line
                type="monotone"
                dataKey="suaMedia"
                name="Sua Curva Real (%)"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ r: 5, fill: '#10B981', strokeWidth: 2, stroke: '#0B0F17' }}
                activeDot={{ r: 7 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="metaIdeal"
                name="Meta Ideal de Fixação (%)"
                stroke="#3B82F6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          <p>
            <span className="font-bold text-white">Como interpretar sua curva:</span> À medida que os ciclos R1 a R8 avançam, os intervalos de tempo aumentam progressivamente (de 3-10 dias até 30 dias). Uma curva ascendente acima de 80% indica que as conexões sinápticas foram consolidadas na memória de longo prazo, garantindo rapidez na prova de residência.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
