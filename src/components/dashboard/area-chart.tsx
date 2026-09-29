'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useData } from '@/lib/store/data-context';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { BarChart3, PieChart, ShieldCheck } from 'lucide-react';

export const AreaPerformanceChart: React.FC = () => {
  const { stats, profile, areas } = useData();
  const [chartType, setChartType] = useState<'bar' | 'radar'>('bar');
  const targetCutoff = profile?.target_cutoff_percentage || 80;

  const chartData = areas.map(a => {
    const item = stats.areaAccuracy[a.name];
    // Se o nome for longo, pega as 2 primeiras palavras ou reduz
    const shortName =
      a.name.length > 12 ? a.name.split(' ').slice(0, 2).join(' ') : a.name;

    return {
      area: a.name,
      shortName,
      percentage: item ? item.percentage : 0,
      totalQuestions: item ? item.total : 0,
      correctQuestions: item ? item.correct : 0,
      topicsCount: item ? item.topicsCount : 0,
      color: a.color,
    };
  });

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base sm:text-lg font-bold">
            Desempenho por Grande Área
          </CardTitle>
          <CardDescription>
            Percentual médio de acertos nas Grandes Áreas de estudo cadastradas.
          </CardDescription>
        </div>

        <div className="flex items-center space-x-1 bg-muted/60 p-1 rounded-lg border border-border">
          <button
            onClick={() => setChartType('bar')}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              chartType === 'bar'
                ? 'bg-card text-foreground font-bold shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Gráfico de Barras"
          >
            <BarChart3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setChartType('radar')}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              chartType === 'radar'
                ? 'bg-card text-foreground font-bold shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Gráfico Radar"
          >
            <PieChart className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-1 pb-3">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 10 }}>
                <XAxis
                  dataKey="shortName"
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={val => `${val}%`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-border bg-card p-3 shadow-xl text-xs space-y-1">
                          <p className="font-bold text-foreground">{data.area}</p>
                          <p className="text-emerald-400 font-semibold">
                            Acurácia: {data.percentage}%
                          </p>
                          <p className="text-muted-foreground">
                            {data.correctQuestions} de {data.totalQuestions} questões
                          </p>
                          <p className="text-muted-foreground">
                            {data.topicsCount} {data.topicsCount === 1 ? 'assunto' : 'assuntos'} cadastrados
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={targetCutoff}
                  stroke="#10B981"
                  strokeDasharray="4 4"
                  label={{
                    value: `Sua Meta (${targetCutoff}%)`,
                    position: 'top',
                    fill: '#10B981',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}
                />
                <Bar dataKey="percentage" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <RadarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis
                  dataKey="shortName"
                  stroke="#94A3B8"
                  fontSize={11}
                  tick={{ fill: '#94A3B8' }}
                />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  stroke="#475569"
                  fontSize={10}
                  tickFormatter={val => `${val}%`}
                />
                <Radar
                  name="Acurácia"
                  dataKey="percentage"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.4}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-xl border border-border bg-card p-3 shadow-xl text-xs">
                          <p className="font-bold text-foreground">{data.area}</p>
                          <p className="text-blue-400 font-semibold mt-1">
                            Acurácia: {data.percentage}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Legenda das Áreas */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-border/60">
          {chartData.map(item => (
            <div key={item.area} className="flex items-center space-x-1.5 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.shortName}:</span>
              <span className="font-bold text-foreground">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
