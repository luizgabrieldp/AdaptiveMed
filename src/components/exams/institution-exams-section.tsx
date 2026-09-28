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
import { NewInstitutionModal } from './new-institution-modal';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Building2, Plus, Trash2, TrendingUp, Trophy } from 'lucide-react';

export const InstitutionExamsSection: React.FC = () => {
  const { institutionExams, deleteInstitutionExam } = useData();
  const [modalOpen, setModalOpen] = useState(false);

  // Lista única de instituições existentes
  const availableInstitutions = useMemo(() => {
    const list = Array.from(new Set(institutionExams.map(i => i.institution_name))).sort();
    return list.length > 0 ? list : ['USP-SP', 'ENARE', 'UNICAMP', 'SUS-SP'];
  }, [institutionExams]);

  const [selectedInst, setSelectedInst] = useState<string>(availableInstitutions[0] || 'USP-SP');

  // Filtra as provas da instituição selecionada e ordena por ano
  const filteredExams = useMemo(() => {
    return institutionExams
      .filter(i => i.institution_name === selectedInst)
      .sort((a, b) => a.exam_year - b.exam_year);
  }, [institutionExams, selectedInst]);

  // Dados para o gráfico temporal de anos (2018 a 2026)
  const chartData = useMemo(() => {
    return filteredExams.map(item => ({
      year: String(item.exam_year),
      score: item.score_percentage,
    }));
  }, [filteredExams]);

  // Média da instituição selecionada
  const averageScore = useMemo(() => {
    if (filteredExams.length === 0) return 0;
    const sum = filteredExams.reduce((acc, cur) => acc + cur.score_percentage, 0);
    return Math.round((sum / filteredExams.length) * 10) / 10;
  }, [filteredExams]);

  return (
    <div className="space-y-6">
      {/* Header & Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-400" />
            Provas na Íntegra por Instituição & Banca
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Analise a evolução das suas notas ano a ano nas provas reais de cada concurso de Residência Médica.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          size="sm"
          className="gap-1.5 font-bold shadow-sm"
        >
          <Plus className="h-4 w-4" /> Registrar Prova de Banca
        </Button>
      </div>

      {/* Seletor de Instituições */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {availableInstitutions.map(inst => {
          const isSelected = selectedInst === inst;
          const count = institutionExams.filter(i => i.institution_name === inst).length;

          return (
            <button
              key={inst}
              onClick={() => setSelectedInst(inst)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                  : 'bg-card border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {inst} ({count})
            </button>
          );
        })}
      </div>

      {/* Gráfico Temporal de Linha */}
      <Card className="border-border p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Evolução Histórica na {selectedInst}
            </h3>
            <p className="text-xs text-muted-foreground">
              Pontuação obtida por ano de prova oficial
            </p>
          </div>

          {filteredExams.length > 0 && (
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-muted-foreground">Média nesta banca:</span>
              <Badge variant={averageScore >= 80 ? 'concluido' : 'secondary'} className="font-bold">
                {averageScore}%
              </Badge>
            </div>
          )}
        </div>

        {chartData.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Nenhuma prova registrada para {selectedInst}. Clique em &quot;Registrar Prova de Banca&quot; acima.
          </div>
        ) : (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 15, right: 20, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis
                  dataKey="year"
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  domain={[50, 100]}
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
                          <p className="font-bold text-foreground">
                            {selectedInst} - Prova {data.year}
                          </p>
                          <p className="text-emerald-400 font-extrabold text-sm">
                            Nota: {data.score}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={80}
                  stroke="#10B981"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Nota de Corte Segura (80%)',
                    position: 'top',
                    fill: '#10B981',
                    fontSize: 10,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  name="Nota (%)"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#3B82F6', strokeWidth: 2, stroke: '#0B0F17' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Tabela de Provas Registradas na Instituição */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Instituição</TableHead>
            <TableHead className="text-center">Ano da Prova</TableHead>
            <TableHead className="text-center">Nota / Acerto (%)</TableHead>
            <TableHead className="text-center">Avaliação</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredExams.map(i => {
            const isHigh = i.score_percentage >= 80;
            return (
              <TableRow key={i.id}>
                <TableCell className="font-bold text-foreground">
                  {i.institution_name}
                </TableCell>
                <TableCell className="text-center font-bold text-xs">
                  {i.exam_year}
                </TableCell>
                <TableCell className="text-center font-extrabold text-sm text-primary">
                  {i.score_percentage}%
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={isHigh ? 'concluido' : 'secondary'} className="text-[10px]">
                    {isHigh ? 'Corte Atingido' : 'Em Evolução'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteInstitutionExam(i.id)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <NewInstitutionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultInstitution={selectedInst}
      />
    </div>
  );
};
