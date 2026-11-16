'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ActivityHeatmapView } from '@/components/evolution/activity-heatmap';
import {
  getInitialDemoTopics,
  getInitialDemoReviews,
  getInitialDemoMockExams,
  getInitialDemoInstitutionExams,
  getInitialDemoPrevalentTopics,
  getInitialDemoErrorLogs,
} from '@/lib/store/demo-data';
import {
  getTodayDateString,
  addDaysToDate,
  formatDateBR,
  computeRebalancedSchedule,
} from '@/lib/spaced-repetition';
import {
  getAreaStyle,
  StudyTopic,
  TopicReview,
  ErrorLog,
  ERROR_LOG_CAUSES,
  ErrorLogCause,
} from '@/types/database';
import {
  CalendarDays,
  RotateCcw,
  GripVertical,
  Star,
  AlertTriangle,
  CheckCircle2,
  GraduationCap,
  RefreshCw,
  Plus,
  Sparkles,
  Flame,
  TrendingUp,
} from 'lucide-react';

const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const InteractiveDemoShowcase: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [todayStr, setTodayStr] = useState<string>('2026-11-16');

  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [reviews, setReviews] = useState<TopicReview[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [mockExams, setMockExams] = useState<ReturnType<typeof getInitialDemoMockExams>>([]);
  const [institutionExams, setInstitutionExams] = useState<ReturnType<typeof getInitialDemoInstitutionExams>>([]);
  const [prevalentTopics, setPrevalentTopics] = useState<ReturnType<typeof getInitialDemoPrevalentTopics>>([]);
  const [selectedErrorCause, setSelectedErrorCause] = useState<ErrorLogCause | 'TODAS'>('TODAS');
  const [selectedBanca, setSelectedBanca] = useState<string>('TODAS');
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  useEffect(() => {
    setTodayStr(getTodayDateString());
    setTopics(getInitialDemoTopics());
    setReviews(getInitialDemoReviews());
    setErrorLogs(getInitialDemoErrorLogs());
    setMockExams(getInitialDemoMockExams());
    setInstitutionExams(getInitialDemoInstitutionExams());
    setPrevalentTopics(getInitialDemoPrevalentTopics());
    setMounted(true);
  }, []);

  const showcaseDays = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: 5 }, (_, idx) => {
      const dateStr = addDaysToDate(todayStr, idx);
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return {
        dateStr,
        dayName: idx === 0 ? 'Hoje' : idx === 1 ? 'Amanhã' : WEEKDAYS_PT[dt.getDay()],
        shortDate: `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`,
        isToday: idx === 0,
      };
    });
  }, [todayStr, mounted]);

  const overdueReviews = useMemo(
    () => reviews.filter(r => !r.completed_date && r.scheduled_date < todayStr),
    [reviews, todayStr]
  );

  const topicMap = useMemo(() => {
    const m = new Map<string, StudyTopic>();
    topics.forEach(t => m.set(t.id, t));
    return m;
  }, [topics]);

  const handleResetDemo = () => {
    setTodayStr(getTodayDateString());
    setTopics(getInitialDemoTopics());
    setReviews(getInitialDemoReviews());
    setErrorLogs(getInitialDemoErrorLogs());
    setMockExams(getInitialDemoMockExams());
    setInstitutionExams(getInitialDemoInstitutionExams());
    setPrevalentTopics(getInitialDemoPrevalentTopics());
    setDemoNotice('Dados da demonstração restaurados.');
    setTimeout(() => setDemoNotice(null), 3000);
  };

  const handleRebalanceDemo = () => {
    const updates = computeRebalancedSchedule(reviews, 3, todayStr);
    if (updates.length === 0) {
      setDemoNotice('Todas as revisões já estão dentro dos próximos dias sem atraso!');
      setTimeout(() => setDemoNotice(null), 3500);
      return;
    }
    const updateMap = new Map(updates.map(u => [u.reviewId, u.newScheduledDate]));
    setReviews(prev =>
      prev.map(r => (updateMap.has(r.id) ? { ...r, scheduled_date: updateMap.get(r.id)! } : r))
    );
    setDemoNotice(
      `${updates.length} ${updates.length === 1 ? 'revisão atrasada redistribuída' : 'revisões atrasadas redistribuídas'} respeitando cota de 3/dia!`
    );
    setTimeout(() => setDemoNotice(null), 4000);
  };

  const handleDropReview = (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    setDragOverDate(null);
    const reviewId = e.dataTransfer.getData('text/plain');
    if (!reviewId) return;
    setReviews(prev =>
      prev.map(r => (r.id === reviewId ? { ...r, scheduled_date: targetDate } : r))
    );
    setDemoNotice(`Revisão reagendada para ${formatDateBR(targetDate)}.`);
    setTimeout(() => setDemoNotice(null), 2500);
  };

  const handleMoveToNextDay = (rev: TopicReview) => {
    const currentIdx = showcaseDays.findIndex(d => d.dateStr === rev.scheduled_date);
    const nextDay =
      currentIdx >= 0 && currentIdx < showcaseDays.length - 1
        ? showcaseDays[currentIdx + 1].dateStr
        : showcaseDays[0].dateStr;
    setReviews(prev => prev.map(r => (r.id === rev.id ? { ...r, scheduled_date: nextDay } : r)));
    setDemoNotice(`Revisão movida para ${formatDateBR(nextDay)}.`);
    setTimeout(() => setDemoNotice(null), 2500);
  };

  const handleAddPrevalentToDemo = (subjectName: string, area: string) => {
    const exists = topics.some(t => t.subject_name.toLowerCase() === subjectName.toLowerCase());
    if (exists) {
      setDemoNotice(`"${subjectName}" já está na sua grade de demonstração.`);
      setTimeout(() => setDemoNotice(null), 2500);
      return;
    }
    const newId = `demo-added-${Date.now()}`;
    const newTopic: StudyTopic = {
      id: newId,
      user_id: 'demo-user',
      area,
      subject_name: subjectName,
      initial_date: todayStr,
      initial_questions: 0,
      initial_correct: 0,
      initial_percentage: 0,
      is_planned: true,
      planned_date: todayStr,
      is_weekly_goal: true,
      created_at: new Date().toISOString(),
    };
    const newReview: TopicReview = {
      id: `demo-rev-added-${Date.now()}`,
      topic_id: newId,
      user_id: 'demo-user',
      review_number: 1,
      scheduled_date: todayStr,
      completed_date: null,
      questions_done: null,
      questions_correct: null,
      percentage: null,
      created_at: new Date().toISOString(),
    };
    setTopics(prev => [newTopic, ...prev]);
    setReviews(prev => [newReview, ...prev]);
    setDemoNotice(`"${subjectName}" adicionado à coluna Hoje!`);
    setTimeout(() => setDemoNotice(null), 3000);
  };

  const toggleDemoErrorReviewed = (id: string) => {
    setErrorLogs(prev => prev.map(e => (e.id === id ? { ...e, is_reviewed: !e.is_reviewed } : e)));
  };

  const filteredPrevalent = useMemo(() => {
    if (selectedBanca === 'TODAS') return prevalentTopics.slice(0, 6);
    return prevalentTopics
      .filter(p => p.banca?.toLowerCase().includes(selectedBanca.toLowerCase()))
      .slice(0, 6);
  }, [prevalentTopics, selectedBanca]);

  const filteredErrors = useMemo(() => {
    if (selectedErrorCause === 'TODAS') return errorLogs;
    return errorLogs.filter(e => e.cause === selectedErrorCause);
  }, [errorLogs, selectedErrorCause]);

  return (
    <Card className="border-border/80 bg-card/90 backdrop-blur-xl shadow-2xl overflow-hidden">
      <CardContent className="p-4 sm:p-6 space-y-5">
        {/* Top Sandbox Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-primary/15 text-primary border-primary/30 text-[11px] font-bold">
              Sandbox Interativo Real
            </Badge>
            <span className="text-xs text-muted-foreground">
              Teste arrastando cards, rebalanceando atrasos ou marcando erros sem precisar criar conta.
            </span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetDemo}
            className="h-7 text-[11px] font-semibold gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className="h-3 w-3" /> Resetar Demo
          </Button>
        </div>

        {demoNotice && (
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>{demoNotice}</span>
          </div>
        )}

        {!mounted ? (
          <div className="min-h-[380px] rounded-2xl border border-border/60 bg-background/40 flex items-center justify-center p-6 text-xs text-muted-foreground">
            Carregando demonstração interativa...
          </div>
        ) : (
        <Tabs defaultValue="grade" className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto gap-1 p-1">
            <TabsTrigger value="grade" className="text-xs py-2 gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" /> Grade Semanal
            </TabsTrigger>
            <TabsTrigger value="prevalencia" className="text-xs py-2 gap-1.5">
              <Star className="h-3.5 w-3.5" /> Top Banca
            </TabsTrigger>
            <TabsTrigger value="erros" className="text-xs py-2 gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> Erros & Heatmap
            </TabsTrigger>
            <TabsTrigger value="simulados" className="text-xs py-2 gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" /> Simulados
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Grade Semanal D&D + Rebalanceamento 1-Clique */}
          <TabsContent value="grade" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Barra Lateral Atrasados */}
              <div className="lg:col-span-4 p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/[0.06] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                      Revisões Atrasadas ({overdueReviews.length})
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Arraste para um dia ou clique para rebalancear automaticamente.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleRebalanceDemo}
                  disabled={overdueReviews.length === 0}
                  className="w-full h-8 text-xs font-bold gap-1.5 bg-rose-600 hover:bg-rose-500 text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {overdueReviews.length > 0 ? 'Rebalancear Atrasados (1-Clique)' : 'Tudo Rebalanceado ✓'}
                </Button>

                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1 scrollbar-thin">
                  {overdueReviews.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-emerald-500/30 text-center text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                      Zero acúmulo! Tudo distribuído respeitando sua cota diária.
                    </div>
                  ) : (
                    overdueReviews.map(rev => {
                      const topic = topicMap.get(rev.topic_id);
                      if (!topic) return null;
                      const style = getAreaStyle(topic.area);
                      return (
                        <div
                          key={rev.id}
                          draggable
                          onDragStart={e => e.dataTransfer.setData('text/plain', rev.id)}
                          onClick={() => handleMoveToNextDay(rev)}
                          className={`p-2.5 rounded-xl border text-xs space-y-1 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.01] ${style.cardBg} ${style.cardBorder}`}
                          title="Arraste para uma coluna ou clique para mover para Hoje"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-muted-foreground truncate">
                              <GripVertical className="h-3 w-3 shrink-0" /> {topic.area}
                            </span>
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300">
                              R{rev.review_number}
                            </span>
                          </div>
                          <p className="font-bold text-foreground truncate">{topic.subject_name}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Grade de 5 dias */}
              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2.5">
                {showcaseDays.map(day => {
                  const dayReviews = reviews.filter(r => r.scheduled_date === day.dateStr);
                  const isTarget = dragOverDate === day.dateStr;

                  return (
                    <div
                      key={day.dateStr}
                      onDragOver={e => {
                        e.preventDefault();
                        setDragOverDate(day.dateStr);
                      }}
                      onDragLeave={() => setDragOverDate(null)}
                      onDrop={e => handleDropReview(e, day.dateStr)}
                      className={`p-2.5 rounded-2xl border min-h-[220px] flex flex-col gap-2 transition-all ${
                        isTarget
                          ? 'border-primary bg-primary/10 ring-2 ring-primary/40'
                          : day.isToday
                          ? 'border-blue-500/40 bg-blue-500/[0.05]'
                          : 'border-border bg-background/50'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                        <div>
                          <p className={`text-xs font-bold ${day.isToday ? 'text-primary' : 'text-foreground'}`}>
                            {day.dayName}
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground">{day.shortDate}</p>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {dayReviews.length} rev
                        </span>
                      </div>

                      <div className="space-y-1.5 flex-1">
                        {dayReviews.length === 0 ? (
                          <div className="h-full min-h-[120px] flex items-center justify-center text-[10px] text-muted-foreground/60 border border-dashed border-border/50 rounded-xl p-2 text-center">
                            Solte um card aqui
                          </div>
                        ) : (
                          dayReviews.map(rev => {
                            const topic = topicMap.get(rev.topic_id);
                            if (!topic) return null;
                            const style = getAreaStyle(topic.area);
                            const isDone = Boolean(rev.completed_date);
                            return (
                              <div
                                key={rev.id}
                                draggable={!isDone}
                                onDragStart={e => e.dataTransfer.setData('text/plain', rev.id)}
                                onClick={() => !isDone && handleMoveToNextDay(rev)}
                                className={`p-2 rounded-xl border text-[11px] space-y-1 transition-all ${
                                  !isDone ? 'cursor-grab active:cursor-grabbing hover:shadow-sm' : 'opacity-80'
                                } ${style.cardBg} ${style.cardBorder}`}
                                title={!isDone ? 'Arraste para outro dia ou clique para avançar 1 dia' : 'Concluído'}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`text-[9px] font-extrabold truncate ${style.text}`}>
                                    {topic.area.split(' ')[0]}
                                  </span>
                                  <span className="text-[9px] font-mono font-bold text-primary">
                                    R{rev.review_number}
                                  </span>
                                </div>
                                <p className="font-bold text-foreground line-clamp-2 leading-tight">
                                  {topic.subject_name}
                                </p>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: Top Banca & Prevalência */}
          <TabsContent value="prevalencia" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {['TODAS', 'ENARE', 'USP-SP', 'SUS-SP', 'UNIFESP'].map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setSelectedBanca(b)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                      selectedBanca === b
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-background/60 text-muted-foreground border-border hover:text-foreground'
                    }`}
                  >
                    {b === 'TODAS' ? 'Todas as Bancas' : b}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-muted-foreground">
                Clique em <strong>+ Grade</strong> para injetar o tema direto na aba Grade Semanal.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPrevalent.map(item => {
                const style = getAreaStyle(item.area);
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-border bg-background/60 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${style.bg} ${style.text} ${style.border}`}>
                          {item.area}
                        </span>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-500" /> {item.prevalence_level}
                        </span>
                      </div>
                      <h5 className="text-sm font-bold text-foreground leading-snug">{item.subject_name}</h5>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {item.frequency_notes || 'Tema recorrente nas principais provas de residência médica.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                      <span className="text-[10px] font-mono text-muted-foreground truncate">
                        {item.banca || 'Geral'}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddPrevalentToDemo(item.subject_name, item.area)}
                        className="h-7 text-[11px] font-bold gap-1 shrink-0"
                      >
                        <Plus className="h-3 w-3" /> Grade
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* TAB 3: Caderno de Erros Estruturado + Heatmap 365 dias */}
          <TabsContent value="erros" className="space-y-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSelectedErrorCause('TODAS')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      selectedErrorCause === 'TODAS'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background/60 text-muted-foreground border-border'
                    }`}
                  >
                    Todos ({errorLogs.length})
                  </button>
                  {ERROR_LOG_CAUSES.map(cause => (
                    <button
                      key={cause}
                      type="button"
                      onClick={() => setSelectedErrorCause(cause)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        selectedErrorCause === cause
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background/60 text-muted-foreground border-border'
                      }`}
                    >
                      {cause}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredErrors.map(err => {
                  const topic = topicMap.get(err.topic_id);
                  return (
                    <div
                      key={err.id}
                      className={`p-3.5 rounded-2xl border space-y-2 transition-all ${
                        err.is_reviewed
                          ? 'bg-emerald-500/5 border-emerald-500/25 opacity-80'
                          : 'bg-background/70 border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {err.cause}
                          </Badge>
                          {err.question_ref && (
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {err.question_ref}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleDemoErrorReviewed(err.id)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 transition-colors ${
                            err.is_reviewed
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                              : 'bg-muted text-muted-foreground border-border hover:text-foreground'
                          }`}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {err.is_reviewed ? 'Revisado' : 'Marcar Revisado'}
                        </button>
                      </div>
                      <p className="text-xs font-bold text-primary">{topic?.subject_name || 'Assunto'}</p>
                      <p className={`text-xs leading-relaxed ${err.is_reviewed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {err.concept_summary}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <ActivityHeatmapView
              topics={topics}
              reviews={reviews}
              mockExams={mockExams}
              institutionExams={institutionExams}
              compact
              title="Heatmap de Consistência (Demonstração)"
              description="Visualização real do mapa estilo GitHub/Anki alimentado pelos seus estudos e simulados."
            />
          </TabsContent>

          {/* TAB 4: Simulados & Provas na Íntegra */}
          <TabsContent value="simulados" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Simulados Nacionais */}
              <div className="p-4 rounded-2xl border border-border bg-background/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> Simulados Nacionais
                  </h4>
                  <Badge variant="outline" className="text-[10px]">Medcurso / Estratégia / ENARE</Badge>
                </div>
                <div className="space-y-2.5">
                  {mockExams.map(m => (
                    <div key={m.id} className="p-3 rounded-xl border border-border/80 bg-card space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground">{m.exam_name}</span>
                        <span className="font-black font-mono text-emerald-600 dark:text-emerald-400">
                          {m.score_percentage}% ({m.correct_answers}/{m.total_questions})
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
                          style={{ width: `${m.score_percentage}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{formatDateBR(m.exam_date)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Provas na Íntegra */}
              <div className="p-4 rounded-2xl border border-border bg-background/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Flame className="h-4 w-4 text-amber-500" /> Provas na Íntegra por Banca
                  </h4>
                  <Badge variant="outline" className="text-[10px]">Com Nota de Corte</Badge>
                </div>
                <div className="space-y-2.5">
                  {institutionExams.map(inst => (
                    <div key={inst.id} className="p-3 rounded-xl border border-border/80 bg-card space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground">
                          {inst.institution_name} ({inst.exam_year})
                        </span>
                        <span className="font-black font-mono text-blue-600 dark:text-blue-400">
                          {inst.score_percentage}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Prova na íntegra registrada</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> Meta de corte: 80%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        )}
      </CardContent>
    </Card>
  );
};
