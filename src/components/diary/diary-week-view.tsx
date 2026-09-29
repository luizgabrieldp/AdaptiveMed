'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/lib/store/data-context';
import { StudyTopic, TopicReview, getAreaStyle } from '@/types/database';
import {
  getTodayDateString,
  formatDateBR,
  calculateReviewStatus,
} from '@/lib/spaced-repetition';
import { ReviewCompletionModal } from '@/components/dashboard/review-completion-modal';
import { RecordPlannedStudyModal } from './record-planned-study-modal';
import { PlanTopicModal } from './plan-topic-modal';
import { EditPlannedTopicModal } from './edit-planned-topic-modal';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  CheckCircle2,
  Clock,
  Target,
  Star,
  BookOpen,
  GripVertical,
  Trash2,
  Sparkles,
  CalendarX,
  AlertCircle,
  Edit2,
} from 'lucide-react';

interface DiaryWeekViewProps {
  onSelectDay: (dateStr: string) => void;
}

export const DiaryWeekView: React.FC<DiaryWeekViewProps> = ({ onSelectDay }) => {
  const {
    topics,
    reviews,
    areas,
    prevalentTopics,
    updatePlannedTopicDate,
    deleteTopic,
    addPlannedTopic,
    distributeWeeklyAutoStudy,
  } = useData();

  const [weekOffset, setWeekOffset] = useState(0);
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);

  // Modais
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<TopicReview | null>(null);

  const [recordStudyModalOpen, setRecordStudyModalOpen] = useState(false);
  const [selectedPlannedTopic, setSelectedPlannedTopic] = useState<StudyTopic | null>(null);

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planModalDate, setPlanModalDate] = useState<string | undefined>(undefined);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTopicToEdit, setSelectedTopicToEdit] = useState<StudyTopic | null>(null);

  // Seção de concluídos na lista lateral
  const [showCompletedSection, setShowCompletedSection] = useState(true);

  // Ref para auto-scroll na coluna de hoje
  const todayColRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (todayColRef.current && weekOffset === 0) {
      todayColRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [weekOffset]);

  // Estado visual de Drop
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);

  const todayStr = useMemo(() => getTodayDateString(), []);

  // Calcula os 7 dias da semana (Segunda a Domingo)
  const weekDays = useMemo(() => {
    const [y, m, d] = todayStr.split('-').map(Number);
    const refDate = new Date(y, m - 1, d);
    refDate.setDate(refDate.getDate() + weekOffset * 7);

    const dayOfWeek = refDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(refDate);
    monday.setDate(monday.getDate() + diffToMonday);

    const days = [];
    const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

    for (let i = 0; i < 7; i++) {
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);

      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      days.push({
        dateStr,
        dayNumber: current.getDate(),
        monthNumber: current.getMonth() + 1,
        dayName: dayNames[i],
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [todayStr, weekOffset]);

  const topicMap = useMemo(() => {
    const map = new Map<string, StudyTopic>();
    topics.forEach(t => map.set(t.id, t));
    return map;
  }, [topics]);

  const highPrevalenceNames = useMemo(() => {
    const set = new Set<string>();
    prevalentTopics.forEach(p => {
      if (p.prevalence_level === 'ALTA' || p.rank_order <= 3) {
        set.add(p.subject_name.trim().toLowerCase());
      }
    });
    return set;
  }, [prevalentTopics]);

  // Itens alocados em cada dia da semana (Revisões, Estudos Planejados e Estudos Iniciais Concluídos)
  const dayItemsMap = useMemo(() => {
    const map = new Map<
      string,
      Array<{
        type: 'review' | 'planned_study' | 'initial_study_done';
        id: string;
        topic?: StudyTopic;
        review?: TopicReview;
        subjectName: string;
        area: string;
        badgeText: string;
        isCompleted: boolean;
        isHighPrevalence: boolean;
        isOverdue: boolean;
      }>
    >();

    weekDays.forEach(d => map.set(d.dateStr, []));

    // 1. Revisões
    reviews.forEach(r => {
      if (map.has(r.scheduled_date)) {
        const topic = topicMap.get(r.topic_id);
        const subjectName = topic?.subject_name || 'Revisão';
        const area = topic?.area || 'Clínica Médica';
        const statusInfo = calculateReviewStatus(r.scheduled_date, r.completed_date, todayStr);
        const isCompleted = Boolean(r.completed_date);
        const isHigh =
          highPrevalenceNames.has(subjectName.toLowerCase()) ||
          Boolean(topic?.tags?.some(t => t.toLowerCase().includes('alta')));

        map.get(r.scheduled_date)!.push({
          type: 'review',
          id: r.id,
          topic,
          review: r,
          subjectName,
          area,
          badgeText: isCompleted ? `R${r.review_number} Feita` : `R${r.review_number}`,
          isCompleted,
          isHighPrevalence: isHigh,
          isOverdue: statusInfo.status === 'ATRASADO',
        });
      }
    });

    // 2. Estudos programados para um dia desta semana
    topics.forEach(t => {
      if (t.is_planned && t.planned_date && map.has(t.planned_date)) {
        const isHigh =
          highPrevalenceNames.has(t.subject_name.toLowerCase()) ||
          Boolean(t.tags?.some(tag => tag.toLowerCase().includes('alta')));

        map.get(t.planned_date)!.push({
          type: 'planned_study',
          id: t.id,
          topic: t,
          subjectName: t.subject_name,
          area: t.area,
          badgeText: 'A Estudar',
          isCompleted: false,
          isHighPrevalence: isHigh,
          isOverdue: t.planned_date < todayStr,
        });
      }
    });

    // 3. Estudos Iniciais Realizados (R0 Concluído) - permanecem no dia em que foram feitos!
    topics.forEach(t => {
      if (!t.is_planned && t.initial_date && map.has(t.initial_date)) {
        const isHigh =
          highPrevalenceNames.has(t.subject_name.toLowerCase()) ||
          Boolean(t.tags?.some(tag => tag.toLowerCase().includes('alta')));

        map.get(t.initial_date)!.push({
          type: 'initial_study_done',
          id: t.id,
          topic: t,
          subjectName: t.subject_name,
          area: t.area,
          badgeText: 'R0 Concluído',
          isCompleted: true,
          isHighPrevalence: isHigh,
          isOverdue: false,
        });
      }
    });

    return map;
  }, [weekDays, reviews, topics, topicMap, highPrevalenceNames, todayStr]);

  // Assuntos concluídos nesta semana (para exibição na barra lateral)
  const weeklyCompletedTopics = useMemo(() => {
    const weekDateSet = new Set(weekDays.map(d => d.dateStr));
    return topics.filter(t => !t.is_planned && t.initial_date && weekDateSet.has(t.initial_date));
  }, [topics, weekDays]);

  // Lista lateral: "Assuntos da Semana" (Sem data fixa OU alocado para esta semana OU pendente de semanas passadas)
  const weeklyBacklogTopics = useMemo(() => {
    const weekDateSet = new Set(weekDays.map(d => d.dateStr));
    const mondayStr = weekDays[0]?.dateStr || '';

    const list = topics.filter(t => {
      if (!t.is_planned) return false;
      // 1. Sem data fixa
      if (!t.planned_date) return true;
      // 2. Alocado para esta semana
      if (weekDateSet.has(t.planned_date)) return true;
      // 3. Pendente acumulado de semanas anteriores (empurrado para a semana atual)
      if (t.planned_date < mondayStr) return true;
      return false;
    });

    // Ordenação: Pendentes de semanas passadas primeiro, depois temas com data, depois sem data fixa
    return list.sort((a, b) => {
      const isPastA = a.planned_date && a.planned_date < mondayStr ? 1 : 0;
      const isPastB = b.planned_date && b.planned_date < mondayStr ? 1 : 0;
      if (isPastA !== isPastB) return isPastB - isPastA;

      if (a.planned_date && b.planned_date) {
        return a.planned_date.localeCompare(b.planned_date);
      }
      if (a.planned_date && !b.planned_date) return -1;
      if (!a.planned_date && b.planned_date) return 1;
      return 0;
    });
  }, [topics, weekDays]);

  // Sugestões da Banca: temas prevalentes que o usuário ainda não cadastrou/estudou
  const suggestedPrevalentTopics = useMemo(() => {
    const existingNames = new Set(topics.map(t => t.subject_name.trim().toLowerCase()));
    return prevalentTopics
      .filter(p => !existingNames.has(p.subject_name.trim().toLowerCase()))
      .slice(0, 4);
  }, [prevalentTopics, topics]);

  const handleAutoScheduleWeek = async () => {
    try {
      setIsAutoScheduling(true);
      const count = await distributeWeeklyAutoStudy(weekDays[0].dateStr);
      if (count === 0) {
        alert('Nenhum assunto pendente sem data para distribuir nesta semana.');
      }
    } catch (err) {
      console.error('Erro ao distribuir auto-estudo:', err);
    } finally {
      setIsAutoScheduling(false);
    }
  };

  const handleOpenItem = (item: {
    type: 'review' | 'planned_study' | 'initial_study_done';
    topic?: StudyTopic;
    review?: TopicReview;
  }) => {
    if (item.type === 'review' && item.review) {
      setSelectedReview(item.review);
      setCompletionModalOpen(true);
    } else if (item.type === 'planned_study' && item.topic) {
      setSelectedPlannedTopic(item.topic);
      setRecordStudyModalOpen(true);
    } else if (item.type === 'initial_study_done' && item.topic) {
      setSelectedTopicToEdit(item.topic);
      setEditModalOpen(true);
    }
  };

  const handleOpenPlanForDate = (dateStr?: string) => {
    setPlanModalDate(dateStr);
    setPlanModalOpen(true);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, topicId: string) => {
    e.dataTransfer.setData('text/plain', topicId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDay !== dateStr) {
      setDragOverDay(dateStr);
    }
  };

  const handleDragLeave = (e: React.DragEvent, dateStr: string) => {
    if (dragOverDay === dateStr) {
      setDragOverDay(null);
    }
  };

  const handleDropOnDay = async (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    setDragOverDay(null);
    const topicId = e.dataTransfer.getData('text/plain');
    if (!topicId) return;

    await updatePlannedTopicDate(topicId, dateStr);
  };

  return (
    <div className="space-y-4">
      {/* Barra de Controles da Semana */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl bg-card border border-border shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-foreground">Grade Semanal</h3>
              <Badge variant="outline" className="text-xs font-semibold">
                {weekDays[0].dayNumber}/{weekDays[0].monthNumber} a {weekDays[6].dayNumber}/{weekDays[6].monthNumber}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Arraste assuntos da lista lateral diretamente para o dia que estudou, ou clique no card para registrar seu rendimento.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center space-x-1.5 sm:space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset(prev => prev - 1)}
            className="h-8 w-8 p-0"
            title="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant={weekOffset === 0 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setWeekOffset(0)}
            className="h-8 text-xs font-semibold px-3"
          >
            Esta Semana
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset(prev => prev + 1)}
            className="h-8 w-8 p-0"
            title="Próxima semana"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoScheduleWeek}
            disabled={isAutoScheduling}
            className="h-8 text-xs font-bold gap-1 border-amber-500/40 text-amber-400 hover:bg-amber-500/10 shadow-xs"
            title="Distribui os assuntos pendentes de Segunda a Sexta, priorizando alta relevância da banca"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400 fill-amber-400/20" />
            {isAutoScheduling ? 'Distribuindo...' : 'Auto-Estudo'}
          </Button>

          <Button
            size="sm"
            onClick={() => handleOpenPlanForDate()}
            className="h-8 text-xs font-bold gap-1 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" /> Programar Estudo
          </Button>
        </div>
      </div>

      {/* Grade Principal: Colunas dos 7 Dias + Coluna Lateral dos Assuntos da Semana */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Painel dos 7 Dias da Semana com Colunas Largas e Rolagem Horizontal Suave */}
        <div className="lg:col-span-3 overflow-x-auto pb-2 scrollbar-thin">
          <div className="flex gap-3 min-w-[1050px]">
            {weekDays.map(day => {
              const items = dayItemsMap.get(day.dateStr) || [];
              const isDragTarget = dragOverDay === day.dateStr;

              return (
                <div
                  key={day.dateStr}
                  ref={day.isToday ? todayColRef : undefined}
                  onDragOver={e => handleDragOver(e, day.dateStr)}
                  onDragLeave={e => handleDragLeave(e, day.dateStr)}
                  onDrop={e => handleDropOnDay(e, day.dateStr)}
                  className={`flex-1 min-w-[200px] p-3 rounded-2xl border flex flex-col justify-between transition-all ${
                    isDragTarget
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/40 shadow-md'
                      : day.isToday
                      ? 'bg-blue-500/5 border-blue-500/40 shadow-xs'
                      : 'bg-card border-border hover:border-border/80'
                  }`}
                >
                  {/* Top Header do Dia */}
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <div>
                        <span
                          className={`text-xs font-bold block ${
                            day.isToday ? 'text-primary font-black' : 'text-foreground'
                          }`}
                        >
                          {day.dayName}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {String(day.dayNumber).padStart(2, '0')}/{String(day.monthNumber).padStart(2, '0')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {day.isToday && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                            Hoje
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenPlanForDate(day.dateStr)}
                          className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/80 transition-colors"
                          title={`Programar estudo para ${day.dayName}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Lista com scroll vertical interno caso passe de 3 itens */}
                    <div className="space-y-2 mt-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                      {items.length === 0 ? (
                        <div className="py-12 text-center text-[11px] text-muted-foreground/60 italic border border-dashed border-border/40 rounded-xl my-2">
                          Arraste um tema aqui
                        </div>
                      ) : (
                        items.map(item => {
                          const style = getAreaStyle(item.area, areas);
                          const isInitialDone = item.type === 'initial_study_done';

                          return (
                            <div
                              key={item.id}
                              draggable={item.type === 'planned_study'}
                              onDragStart={e => {
                                if (item.topic) {
                                  handleDragStart(e, item.topic.id);
                                }
                              }}
                              onClick={() => handleOpenItem(item)}
                              className={`p-2.5 rounded-xl border text-xs space-y-1.5 cursor-pointer transition-all hover:scale-[1.02] shadow-2xs group/item ${
                                isInitialDone
                                  ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/60'
                                  : item.isCompleted
                                  ? 'bg-emerald-500/10 border-emerald-500/25 opacity-75'
                                  : item.isOverdue
                                  ? 'bg-rose-500/10 border-rose-500/35 hover:border-rose-500/60'
                                  : item.type === 'planned_study'
                                  ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/60 cursor-grab active:cursor-grabbing'
                                  : 'bg-muted/60 border-border hover:border-primary/50'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate border ${style.bg} ${style.text} ${style.border}`}
                                >
                                  {item.area.split(' ')[0]}
                                </span>

                                <div className="flex items-center gap-1">
                                  {/* Botão de edição para estudos planejados ou concluídos */}
                                  {item.topic && (
                                    <button
                                      type="button"
                                      onClick={e => {
                                        e.stopPropagation();
                                        setSelectedTopicToEdit(item.topic!);
                                        setEditModalOpen(true);
                                      }}
                                      className="opacity-0 group-hover/item:opacity-100 p-0.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/20 transition-all"
                                      title="Editar assunto"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </button>
                                  )}

                                  {/* Botão de desagendar do dia */}
                                  {item.type === 'planned_study' && item.topic && (
                                    <button
                                      type="button"
                                      onClick={e => {
                                        e.stopPropagation();
                                        updatePlannedTopicDate(item.topic!.id, null);
                                      }}
                                      className="opacity-0 group-hover/item:opacity-100 p-0.5 rounded text-muted-foreground hover:text-amber-400 hover:bg-amber-500/20 transition-all"
                                      title="Remover deste dia (mantém nos Assuntos da Semana)"
                                    >
                                      <CalendarX className="h-3 w-3" />
                                    </button>
                                  )}

                                  <span
                                    className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                                      isInitialDone
                                        ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/30'
                                        : item.isCompleted
                                        ? 'text-emerald-400 bg-emerald-500/15'
                                        : item.type === 'planned_study'
                                        ? 'text-amber-400 bg-amber-500/15'
                                        : item.isOverdue
                                        ? 'text-rose-400 bg-rose-500/15'
                                        : 'text-primary bg-primary/10'
                                    }`}
                                  >
                                    {item.badgeText}
                                  </span>
                                </div>
                              </div>

                              <p className="font-bold text-[11px] text-foreground line-clamp-2 leading-tight">
                                {item.subjectName}
                              </p>

                              {/* Rendimento se R0 concluído */}
                              {isInitialDone && item.topic && (
                                <div className="text-[10px] text-emerald-400 font-semibold flex items-center justify-between">
                                  <span>{item.topic.initial_correct}/{item.topic.initial_questions} questões</span>
                                  <span className="font-bold">{item.topic.initial_percentage}%</span>
                                </div>
                              )}

                              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                                {item.isHighPrevalence && (
                                  <span className="inline-flex items-center gap-0.5 font-bold text-amber-400 text-[9px]">
                                    <Star className="h-2.5 w-2.5 fill-amber-400" /> Top Banca
                                  </span>
                                )}

                                <span className={`font-semibold ml-auto ${isInitialDone ? 'text-emerald-400' : 'text-primary hover:underline'}`}>
                                  {isInitialDone ? 'Concluído ✓' : item.isCompleted ? 'Ver detalhes' : 'Concluir →'}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Rodapé da Coluna */}
                  <div className="pt-2 border-t border-border/40 mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{items.length} {items.length === 1 ? 'item' : 'itens'}</span>
                    <button
                      type="button"
                      onClick={() => onSelectDay(day.dateStr)}
                      className="text-primary hover:underline font-semibold"
                    >
                      Ver Dia →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coluna Lateral: Assuntos da Semana (A Estudar / Arrastáveis) */}
        <div className="lg:col-span-1 space-y-3">
          <Card className="p-4 bg-card border-border shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-bold text-foreground">Assuntos da Semana</h4>
              </div>
              <Badge variant="outline" className="text-xs font-semibold">
                {weeklyBacklogTopics.length}
              </Badge>
            </div>

            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
              💡 <strong>Dica:</strong> Arraste o card diretamente para a coluna do dia em que estudou, ou clique em <em>Registrar Estudo</em>.
            </p>

            <div className="mt-3 space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
              {weeklyBacklogTopics.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl space-y-2">
                  <p>Nenhum assunto programado para esta semana.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenPlanForDate()}
                    className="text-xs font-bold gap-1 mt-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar Assunto
                  </Button>
                </div>
              ) : (
                weeklyBacklogTopics.map(topic => {
                  const style = getAreaStyle(topic.area, areas);

                  return (
                    <div
                      key={topic.id}
                      draggable={true}
                      onDragStart={e => handleDragStart(e, topic.id)}
                      className="p-3 rounded-xl border border-border bg-muted/40 hover:bg-muted/70 hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing shadow-2xs space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <GripVertical className="h-4 w-4 text-muted-foreground/60 shrink-0 group-hover:text-primary transition-colors" />
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate border ${style.bg} ${style.text} ${style.border}`}
                          >
                            {topic.area.split(' ')[0]}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTopicToEdit(topic);
                              setEditModalOpen(true);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-primary transition-opacity"
                            title="Editar assunto"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteTopic(topic.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-rose-400 transition-opacity"
                            title="Remover assunto"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs font-bold text-foreground leading-snug">
                        {topic.subject_name}
                      </p>

                      {/* Indicador de Data / Atraso da semana anterior */}
                      <div className="flex flex-col gap-1 pt-1 border-t border-border/40 text-[10px]">
                        {topic.planned_date && topic.planned_date < (weekDays[0]?.dateStr || '') ? (
                          <span className="text-[9px] font-bold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 rounded flex items-center gap-1 self-start">
                            <AlertCircle className="h-2.5 w-2.5 shrink-0" /> Pendente da semana passada
                          </span>
                        ) : topic.planned_date && topic.planned_date < todayStr ? (
                          <span className="text-[9px] font-bold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 rounded flex items-center gap-1 self-start">
                            <AlertCircle className="h-2.5 w-2.5 shrink-0" /> Atrasado ({formatDateBR(topic.planned_date)})
                          </span>
                        ) : null}

                        <div className="flex items-center justify-between pt-0.5">
                          <span className="text-muted-foreground font-medium">
                            {topic.planned_date ? formatDateBR(topic.planned_date) : 'Sem dia fixo'}
                          </span>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedPlannedTopic(topic);
                              setRecordStudyModalOpen(true);
                            }}
                            className="h-6 text-[10px] font-bold text-primary hover:text-primary hover:bg-primary/10 px-2"
                          >
                            Registrar Estudo →
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Seção Recolhível de Assuntos Concluídos nesta semana */}
            {weeklyCompletedTopics.length > 0 && (
              <div className="pt-3 border-t border-border/60 mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowCompletedSection(prev => !prev)}
                  className="flex items-center justify-between w-full py-1.5 px-2 rounded-lg hover:bg-muted/60 text-xs font-bold transition-colors select-none"
                >
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Concluídos nesta semana ({weeklyCompletedTopics.length})
                  </span>
                  {showCompletedSection ? (
                    <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>

                {showCompletedSection && (
                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
                    {weeklyCompletedTopics.map(topic => {
                      const style = getAreaStyle(topic.area, areas);
                      return (
                        <div
                          key={topic.id}
                          className="p-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 space-y-1.5 shadow-2xs group"
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate border ${style.bg} ${style.text} ${style.border}`}
                            >
                              {topic.area.split(' ')[0]}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTopicToEdit(topic);
                                  setEditModalOpen(true);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-primary transition-opacity"
                                title="Editar assunto"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                R0 Feito
                              </span>
                            </div>
                          </div>

                          <p className="text-xs font-bold text-foreground leading-snug">
                            {topic.subject_name}
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                            <span>{formatDateBR(topic.initial_date)}</span>
                            <span className="font-bold text-emerald-400">
                              {topic.initial_correct}/{topic.initial_questions} ({topic.initial_percentage}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={() => handleOpenPlanForDate()}
              className="w-full text-xs font-bold gap-1.5 mt-3 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar Assunto da Semana
            </Button>
          </Card>

          {/* Card de Sugestões da Banca */}
          {suggestedPrevalentTopics.length > 0 && (
            <Card className="p-3.5 bg-gradient-to-br from-card via-card to-amber-950/20 border-amber-500/30 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center space-x-1.5">
                  <Sparkles className="h-4 w-4 text-amber-400 fill-amber-400/20" />
                  <h4 className="text-xs font-bold text-foreground">Sugestões da Banca</h4>
                </div>
                <Badge variant="secondary" className="text-[9px] bg-amber-500/10 text-amber-300 border-amber-500/20">
                  Mais Frequentes
                </Badge>
              </div>

              <p className="text-[11px] text-muted-foreground leading-tight">
                Temas com alta probabilidade de queda ainda não estudados por você. Adicione à sua semana com 1 clique:
              </p>

              <div className="space-y-2 pt-1">
                {suggestedPrevalentTopics.map(p => {
                  const style = getAreaStyle(p.area, areas);
                  return (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted/70 hover:border-amber-500/40 transition-all flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 mb-0.5">
                          <span
                            className={`text-[8px] font-bold px-1 py-0.2 rounded border ${style.bg} ${style.text} ${style.border}`}
                          >
                            {p.area.split(' ')[0]}
                          </span>
                          {p.banca && (
                            <span className="text-[8px] text-muted-foreground truncate">
                              • {p.banca}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-foreground truncate" title={p.subject_name}>
                          {p.subject_name}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await addPlannedTopic({
                            area: p.area,
                            subject_name: p.subject_name,
                            is_weekly_goal: true,
                          });
                        }}
                        className="h-6 text-[10px] font-bold px-2 text-amber-400 border-amber-500/30 hover:bg-amber-500/15 shrink-0"
                      >
                        + Programar
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modais de Ação Rápida */}
      <ReviewCompletionModal
        open={completionModalOpen}
        onOpenChange={setCompletionModalOpen}
        review={selectedReview}
        topic={selectedReview ? topicMap.get(selectedReview.topic_id) : undefined}
      />

      <RecordPlannedStudyModal
        open={recordStudyModalOpen}
        onOpenChange={setRecordStudyModalOpen}
        topic={selectedPlannedTopic}
      />

      <PlanTopicModal
        open={planModalOpen}
        onOpenChange={setPlanModalOpen}
        defaultDate={planModalDate}
      />

      <EditPlannedTopicModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        topic={selectedTopicToEdit}
      />
    </div>
  );
};
