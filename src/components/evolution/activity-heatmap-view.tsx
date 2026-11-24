'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StudyTopic, TopicReview, MockExam, InstitutionExam } from '@/types/database';
import { getTodayDateString, addDaysToDate, formatDateBR } from '@/lib/spaced-repetition';
import { Flame, CalendarCheck2 } from 'lucide-react';

export interface ActivityHeatmapViewProps {
  topics: StudyTopic[];
  reviews: TopicReview[];
  mockExams?: MockExam[];
  institutionExams?: InstitutionExam[];
  compact?: boolean;
  title?: string;
  description?: string;
  referenceDate?: string;
}

interface DayCell {
  dateStr: string;
  count: number;
  questions: number;
  studies: number;
  reviewsCount: number;
  examsCount: number;
  level: 0 | 1 | 2 | 3 | 4;
  isFuture: boolean;
}

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const ActivityHeatmapView: React.FC<ActivityHeatmapViewProps> = ({
  topics,
  reviews,
  mockExams = [],
  institutionExams = [],
  compact = false,
  title = 'Mapa de Consistência Anual (365 dias)',
  description = 'Frequência diária combinando estudos iniciais (R0), revisões concluídas e simulados.',
  referenceDate,
}) => {
  const todayStr = useMemo(() => referenceDate || getTodayDateString(), [referenceDate]);
  const [hoveredDay, setHoveredDay] = useState<DayCell | null>(null);

  const { weeks, monthLabels, totalActiveDays, totalActivities, totalQuestionsYear, bestStreak } =
    useMemo(() => {
      const activityMap = new Map<
        string,
        { studies: number; reviewsCount: number; examsCount: number; questions: number }
      >();

      const bump = (
        dateStr: string | null | undefined,
        field: 'studies' | 'reviewsCount' | 'examsCount',
        questions = 0
      ) => {
        if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;
        const curr = activityMap.get(dateStr) || {
          studies: 0,
          reviewsCount: 0,
          examsCount: 0,
          questions: 0,
        };
        curr[field] += 1;
        curr.questions += Math.max(0, questions || 0);
        activityMap.set(dateStr, curr);
      };

      for (const t of topics) {
        if (!t.is_planned && t.initial_date) {
          bump(t.initial_date.slice(0, 10), 'studies', t.initial_questions || 0);
        }
      }
      for (const r of reviews) {
        if (r.completed_date) {
          bump(r.completed_date.slice(0, 10), 'reviewsCount', r.questions_done || 0);
        }
      }
      for (const m of mockExams) {
        bump(m.exam_date?.slice(0, 10), 'examsCount', m.total_questions || 0);
      }
      for (const inst of institutionExams) {
        bump(inst.created_at?.slice(0, 10), 'examsCount', 0);
      }

      // Alinha o início da grade ao domingo de ~52 semanas atrás para fechar 53 colunas completas até hoje
      const numDays = compact ? 182 : 364;
      const rawStart = addDaysToDate(todayStr, -numDays);
      const [sy, sm, sd] = rawStart.split('-').map(Number);
      const startDateObj = new Date(sy, sm - 1, sd);
      const startDow = startDateObj.getDay(); // 0 = Dom
      const alignedStart = addDaysToDate(rawStart, -startDow);

      const [ty, tm, td] = todayStr.split('-').map(Number);
      const todayObj = new Date(ty, tm - 1, td);
      const endDow = todayObj.getDay();
      const alignedEnd = addDaysToDate(todayStr, 6 - endDow);

      const allCells: DayCell[] = [];
      let cursor = alignedStart;
      let activeDays = 0;
      let sumActivities = 0;
      let sumQuestions = 0;
      let runningStreak = 0;
      let maxStreak = 0;

      // Guard against infinite loop (max 400 dias)
      for (let i = 0; i < 400; i++) {
        const isFuture = cursor > todayStr;
        const info = activityMap.get(cursor);
        const count = info ? info.studies + info.reviewsCount + info.examsCount : 0;
        const questions = info ? info.questions : 0;

        let level: 0 | 1 | 2 | 3 | 4 = 0;
        if (!isFuture && count > 0) {
          activeDays += 1;
          sumActivities += count;
          sumQuestions += questions;
          runningStreak += 1;
          if (runningStreak > maxStreak) maxStreak = runningStreak;

          const score = count + Math.floor(questions / 30);
          if (score >= 6) level = 4;
          else if (score >= 4) level = 3;
          else if (score >= 2) level = 2;
          else level = 1;
        } else if (!isFuture) {
          runningStreak = 0;
        }

        allCells.push({
          dateStr: cursor,
          count,
          questions,
          studies: info?.studies || 0,
          reviewsCount: info?.reviewsCount || 0,
          examsCount: info?.examsCount || 0,
          level,
          isFuture,
        });

        if (cursor >= alignedEnd) break;
        cursor = addDaysToDate(cursor, 1);
      }

      const weekCols: DayCell[][] = [];
      for (let i = 0; i < allCells.length; i += 7) {
        weekCols.push(allCells.slice(i, i + 7));
      }

      const labels: { weekIndex: number; label: string }[] = [];
      let lastMonth = -1;
      weekCols.forEach((col, wIdx) => {
        const firstValid = col.find(c => !c.isFuture) || col[0];
        if (!firstValid) return;
        const monthIdx = parseInt(firstValid.dateStr.split('-')[1], 10) - 1;
        if (monthIdx !== lastMonth) {
          const prev = labels[labels.length - 1];
          if (prev && wIdx - prev.weekIndex < 3) {
            if (prev.weekIndex === 0) {
              labels[labels.length - 1] = { weekIndex: wIdx, label: MONTHS_PT[monthIdx] };
            }
          } else {
            labels.push({ weekIndex: wIdx, label: MONTHS_PT[monthIdx] });
          }
          lastMonth = monthIdx;
        }
      });

      return {
        weeks: weekCols,
        monthLabels: labels,
        totalActiveDays: activeDays,
        totalActivities: sumActivities,
        totalQuestionsYear: sumQuestions,
        bestStreak: maxStreak,
      };
    }, [topics, reviews, mockExams, institutionExams, todayStr, compact]);

  const getCellStyle = (cell: DayCell) => {
    if (cell.isFuture) {
      return 'bg-transparent border border-transparent opacity-20 cursor-default';
    }
    switch (cell.level) {
      case 0:
        return 'bg-muted/70 dark:bg-slate-800/70 border border-border/50 hover:border-foreground/40';
      case 1:
        return 'bg-emerald-500/25 dark:bg-emerald-900/70 border border-emerald-500/30 hover:border-emerald-400';
      case 2:
        return 'bg-emerald-500/50 dark:bg-emerald-700/80 border border-emerald-500/40 hover:border-emerald-400';
      case 3:
        return 'bg-emerald-500/80 dark:bg-emerald-500/85 border border-emerald-400/50 hover:border-emerald-300';
      case 4:
        return 'bg-emerald-600 dark:bg-emerald-400 border border-emerald-400 shadow-sm shadow-emerald-500/30 hover:scale-110';
    }
  };

  return (
    <Card className="border-border bg-card shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
              <CalendarCheck2 className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">{title}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1"
            >
              <Flame className="h-3 w-3 text-amber-500" />
              <span>{totalActiveDays} dias ativos</span>
            </Badge>
            <Badge variant="outline" className="text-[11px] font-semibold font-mono tabular-nums">
              {totalActivities} sessões • {totalQuestionsYear.toLocaleString('pt-BR')} Qs
            </Badge>
            <Badge variant="secondary" className="text-[11px] font-semibold">
              Recorde: {bestStreak}d
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-3">
        <div className="overflow-x-auto pb-2 scrollbar-thin">
          <div className="inline-flex flex-col gap-1.5 min-w-max">
            {/* Linha dos Meses */}
            <div className="flex items-center pl-8 text-[10px] font-semibold text-muted-foreground relative h-4">
              {monthLabels.map((m, idx) => (
                <span
                  key={`${m.label}-${idx}`}
                  style={{ left: `${32 + m.weekIndex * 14}px` }}
                  className="absolute whitespace-nowrap"
                >
                  {m.label}
                </span>
              ))}
            </div>

            {/* Matriz Semanas x Dias */}
            <div className="flex gap-2">
              {/* Rótulos dos dias da semana */}
              <div className="flex flex-col justify-between py-0.5 text-[9px] font-medium text-muted-foreground w-6 shrink-0 select-none">
                <span>{WEEKDAYS_PT[0]}</span>
                <span>{WEEKDAYS_PT[1]}</span>
                <span></span>
                <span>{WEEKDAYS_PT[3]}</span>
                <span></span>
                <span>{WEEKDAYS_PT[5]}</span>
                <span></span>
              </div>

              <div className="flex gap-[3px]">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-[3px]">
                    {week.map(cell => (
                      <button
                        key={cell.dateStr}
                        type="button"
                        disabled={cell.isFuture}
                        onMouseEnter={() => !cell.isFuture && setHoveredDay(cell)}
                        onFocus={() => !cell.isFuture && setHoveredDay(cell)}
                        onMouseLeave={() => setHoveredDay(null)}
                        aria-label={`${formatDateBR(cell.dateStr)}: ${cell.count} atividades, ${cell.questions} questões`}
                        className={`w-[11px] h-[11px] rounded-[2.5px] transition-all focus:outline-none focus:ring-1 focus:ring-primary ${getCellStyle(
                          cell
                        )}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Barra inferior: Tooltip vivo + Legenda */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
          <div className="min-h-[18px] flex items-center gap-2">
            {hoveredDay ? (
              <span className="text-foreground font-medium">
                <strong className="font-mono">{formatDateBR(hoveredDay.dateStr)}</strong>:{' '}
                {hoveredDay.count === 0
                  ? 'Nenhuma atividade registrada'
                  : `${hoveredDay.studies} estudo(s), ${hoveredDay.reviewsCount} revisão(ões), ${hoveredDay.examsCount} simulado(s) • ${hoveredDay.questions} questões`}
              </span>
            ) : (
              <span>Passe o cursor ou toque em um quadrado para ver os detalhes do dia.</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px]">Menos</span>
            <span className="w-[10px] h-[10px] rounded-[2px] bg-muted/70 dark:bg-slate-800/70 border border-border/50" />
            <span className="w-[10px] h-[10px] rounded-[2px] bg-emerald-500/25 dark:bg-emerald-900/70 border border-emerald-500/30" />
            <span className="w-[10px] h-[10px] rounded-[2px] bg-emerald-500/50 dark:bg-emerald-700/80 border border-emerald-500/40" />
            <span className="w-[10px] h-[10px] rounded-[2px] bg-emerald-500/80 dark:bg-emerald-500/85 border border-emerald-400/50" />
            <span className="w-[10px] h-[10px] rounded-[2px] bg-emerald-600 dark:bg-emerald-400 border border-emerald-400" />
            <span className="text-[10px]">Mais</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
