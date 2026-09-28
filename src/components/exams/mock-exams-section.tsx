'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { useData } from '@/lib/store/data-context';
import { formatDateBR } from '@/lib/spaced-repetition';
import { NewMockModal } from './new-mock-modal';
import {
  GraduationCap,
  Plus,
  Trash2,
  TrendingUp,
  Award,
  AlertCircle,
  BarChart2,
} from 'lucide-react';

export const MockExamsSection: React.FC = () => {
  const { mockExams, deleteMockExam } = useData();
  const [modalOpen, setModalOpen] = useState(false);

  // KPIs automáticos
  const kpis = useMemo(() => {
    if (mockExams.length === 0) {
      return {
        media: 0,
        maior: 0,
        menor: 0,
        distribuicao: {
          gt90: 0,
          f80_90: 0,
          f70_80: 0,
          f50_70: 0,
          lt50: 0,
        },
      };
    }

    const scores = mockExams.map(m => m.score_percentage);
    const sum = scores.reduce((acc, cur) => acc + cur, 0);
    const media = Math.round((sum / scores.length) * 10) / 10;
    const maior = Math.max(...scores);
    const menor = Math.min(...scores);

    const dist = {
      gt90: 0,
      f80_90: 0,
      f70_80: 0,
      f50_70: 0,
      lt50: 0,
    };

    scores.forEach(s => {
      if (s >= 90) dist.gt90++;
      else if (s >= 80) dist.f80_90++;
      else if (s >= 70) dist.f70_80++;
      else if (s >= 50) dist.f50_70++;
      else dist.lt50++;
    });

    return { media, maior, menor, distribuicao: dist };
  }, [mockExams]);

  return (
    <div className="space-y-6">
      {/* Header & Botão de Cadastro */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-400" />
            Simulados Gerais de Residência
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Acompanhe seu desempenho em simulados completos de grandes cursos preparatórios.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          size="sm"
          className="gap-1.5 font-bold shadow-sm"
        >
          <Plus className="h-4 w-4" /> Registrar Simulado
        </Button>
      </div>

      {/* Grid de KPIs Automáticos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 border-border bg-card">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Média Geral
          </p>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-foreground">
              {kpis.media}%
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Em {mockExams.length} {mockExams.length === 1 ? 'simulado' : 'simulados'}
          </p>
        </Card>

        <Card className="p-4 border-border bg-card">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Maior Nota
          </p>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">
              {kpis.maior}%
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
            <Award className="h-3 w-3 text-emerald-400" /> Recorde pessoal
          </p>
        </Card>

        <Card className="p-4 border-border bg-card">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Menor Nota
          </p>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-amber-400">
              {kpis.menor}%
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Ponto de partida</p>
        </Card>

        <Card className="p-4 border-border bg-card">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Acima de 80%
          </p>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-blue-400">
              {kpis.distribuicao.gt90 + kpis.distribuicao.f80_90}
            </span>
            <span className="text-xs text-muted-foreground">provas</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Zona competitiva</p>
        </Card>
      </div>

      {/* Distribuição por Faixas de Corte */}
      <Card className="border-border p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <BarChart2 className="h-4 w-4 text-primary" /> Distribuição por Faixas de Corte
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-emerald-400 font-extrabold text-lg">{kpis.distribuicao.gt90}</p>
            <p className="text-[11px] font-semibold text-foreground mt-0.5">&gt; 90%</p>
            <p className="text-[10px] text-muted-foreground">Excelência</p>
          </div>

          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-blue-400 font-extrabold text-lg">{kpis.distribuicao.f80_90}</p>
            <p className="text-[11px] font-semibold text-foreground mt-0.5">80% a 90%</p>
            <p className="text-[10px] text-muted-foreground">Aprovado USP/ENARE</p>
          </div>

          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <p className="text-indigo-400 font-extrabold text-lg">{kpis.distribuicao.f70_80}</p>
            <p className="text-[11px] font-semibold text-foreground mt-0.5">70% a 80%</p>
            <p className="text-[10px] text-muted-foreground">Competitivo</p>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-amber-400 font-extrabold text-lg">{kpis.distribuicao.f50_70}</p>
            <p className="text-[11px] font-semibold text-foreground mt-0.5">50% a 70%</p>
            <p className="text-[10px] text-muted-foreground">Intermediário</p>
          </div>

          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 col-span-2 sm:col-span-1">
            <p className="text-rose-400 font-extrabold text-lg">{kpis.distribuicao.lt50}</p>
            <p className="text-[11px] font-semibold text-foreground mt-0.5">&lt; 50%</p>
            <p className="text-[10px] text-muted-foreground">Alerta Crítico</p>
          </div>
        </div>
      </Card>

      {/* Tabela de Simulados */}
      {mockExams.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-card border border-dashed border-border space-y-2">
          <p className="text-sm font-bold text-foreground">Nenhum simulado registrado</p>
          <p className="text-xs text-muted-foreground">
            Cadastre seu primeiro simulado geral para gerar as estatísticas e faixas de corte.
          </p>
          <Button onClick={() => setModalOpen(true)} size="sm" className="mt-2 text-xs">
            Cadastrar Simulado
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Simulado</TableHead>
              <TableHead className="text-center">Data</TableHead>
              <TableHead className="text-center">Questões</TableHead>
              <TableHead className="text-center">Acertos</TableHead>
              <TableHead className="text-center">Nota Final</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockExams.map(m => {
              const isHigh = m.score_percentage >= 80;

              return (
                <TableRow key={m.id}>
                  <TableCell className="font-bold text-foreground">
                    {m.exam_name}
                  </TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">
                    {formatDateBR(m.exam_date)}
                  </TableCell>
                  <TableCell className="text-center text-xs font-semibold">
                    {m.total_questions}
                  </TableCell>
                  <TableCell className="text-center text-xs font-semibold text-emerald-400">
                    {m.correct_answers}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={isHigh ? 'concluido' : 'secondary'}
                      className="font-black text-xs"
                    >
                      {m.score_percentage}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMockExam(m.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      title="Excluir Simulado"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <NewMockModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
};
