'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  StudyTopic,
  TopicReview,
  ReviewStatus,
  getAreaStyle,
} from '@/types/database';
import { useData } from '@/lib/store/data-context';
import {
  calculateReviewStatus,
  formatDateBR,
  getTodayDateString,
} from '@/lib/spaced-repetition';
import { TopicDrawer } from './topic-drawer';
import { ReviewCompletionModal } from '@/components/dashboard/review-completion-modal';
import {
  Search,
  Filter,
  CheckCircle2,
  Eye,
  Trash2,
  Calendar,
  AlertCircle,
  Clock,
  Tag,
} from 'lucide-react';

export const ReviewsTable: React.FC = () => {
  const { topics, reviews, deleteTopic, areas, allTags } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('TODAS');
  const [selectedTag, setSelectedTag] = useState<string>('TODAS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');

  // Controle dos modais e drawer
  const [drawerTopic, setDrawerTopic] = useState<StudyTopic | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedReviewToComplete, setSelectedReviewToComplete] = useState<TopicReview | null>(null);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);

  // Mapeamento dos assuntos com sua revisão ativa / pendente mais recente
  const enhancedTopics = useMemo(() => {
    return topics.map(topic => {
      const topicReviews = reviews
        .filter(r => r.topic_id === topic.id)
        .sort((a, b) => a.review_number - b.review_number);

      // Pega a primeira revisão não concluída
      const activeReview = topicReviews.find(r => !r.completed_date);
      // Ou a última revisão se todas estiverem concluídas
      const lastReview = topicReviews[topicReviews.length - 1];

      let statusInfo: { status: ReviewStatus; daysDiff: number; badgeText: string } = {
        status: 'CONCLUÍDO',
        daysDiff: 0,
        badgeText: 'Concluído',
      };

      if (activeReview) {
        statusInfo = calculateReviewStatus(
          activeReview.scheduled_date,
          activeReview.completed_date
        );
      }

      return {
        topic,
        topicReviews,
        activeReview,
        statusInfo,
      };
    });
  }, [topics, reviews]);

  // Filtros em tempo real
  const filteredTopics = useMemo(() => {
    return enhancedTopics.filter(({ topic, statusInfo }) => {
      // Busca por nome do assunto ou tags
      const s = searchTerm.toLowerCase();
      const matchesSearch =
        topic.subject_name.toLowerCase().includes(s) ||
        (topic.tags && topic.tags.some(t => t.toLowerCase().includes(s)));

      // Filtro por Grande Área
      const matchesArea =
        selectedArea === 'TODAS' || topic.area === selectedArea;

      // Filtro por Subárea / Tag
      const matchesTag =
        selectedTag === 'TODAS' || (topic.tags && topic.tags.includes(selectedTag));

      // Filtro por Status
      const matchesStatus =
        selectedStatus === 'TODOS' || statusInfo.status === selectedStatus;

      return matchesSearch && matchesArea && matchesTag && matchesStatus;
    });
  }, [enhancedTopics, searchTerm, selectedArea, selectedTag, selectedStatus]);

  const handleOpenDrawer = (topic: StudyTopic) => {
    setDrawerTopic(topic);
    setDrawerOpen(true);
  };

  const handleOpenComplete = (rev: TopicReview, top: StudyTopic) => {
    setSelectedReviewToComplete(rev);
    setDrawerTopic(top);
    setCompletionModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Barra de Busca e Filtros estilo Airtable */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-card border border-border shadow-sm">
        {/* Campo de Busca */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar assunto ou subárea (ex: Pneumonia, Cardiologia)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 text-xs h-9 bg-muted/40 border-border"
          />
        </div>

        {/* Filtros Dropdown / Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor de Área */}
          <div className="flex items-center space-x-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <select
              value={selectedArea}
              onChange={e => setSelectedArea(e.target.value)}
              className="h-9 rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="TODAS">Todas as Áreas</option>
              {areas.map(a => (
                <option key={a.id} value={a.name}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Seletor de Subárea / Tag */}
          {allTags.length > 0 && (
            <div className="flex items-center space-x-1.5 text-xs text-muted-foreground">
              <Tag className="h-3.5 w-3.5" />
              <select
                value={selectedTag}
                onChange={e => setSelectedTag(e.target.value)}
                className="h-9 rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="TODAS">Todas as Subáreas / Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>
                    #{tag}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Seletor de Status */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="h-9 rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="ATRASADO">🔴 Em Atraso</option>
            <option value="REVISAR HOJE">🟡 Revisar Hoje</option>
            <option value="PROGRAMADO">🔵 Programados</option>
            <option value="CONCLUÍDO">🟢 Concluídos</option>
          </select>
        </div>
      </div>

      {/* Tabela de Assuntos */}
      {filteredTopics.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-card border border-dashed border-border p-6 space-y-2">
          <p className="text-base font-bold text-foreground">Nenhum assunto encontrado</p>
          <p className="text-xs text-muted-foreground">
            Tente ajustar os filtros ou registre um novo assunto para começar.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Grande Área</TableHead>
              <TableHead className="min-w-[200px]">Nome do Assunto</TableHead>
              <TableHead className="text-center">1º Contato</TableHead>
              <TableHead className="text-center">Ciclo Ativo</TableHead>
              <TableHead className="text-center">Data Agendada</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTopics.map(({ topic, activeReview, statusInfo }) => {
              const areaStyle = getAreaStyle(topic.area, areas);

              return (
                <TableRow key={topic.id} className="cursor-pointer group">
                  {/* Grande Área */}
                  <TableCell onClick={() => handleOpenDrawer(topic)}>
                    <span
                      className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${areaStyle.bg} ${areaStyle.text} ${areaStyle.border}`}
                    >
                      {topic.area}
                    </span>
                  </TableCell>

                  {/* Nome do Assunto + Tags */}
                  <TableCell onClick={() => handleOpenDrawer(topic)}>
                    <div className="space-y-0.5">
                      <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                        {topic.subject_name}
                      </p>
                      {topic.tags && topic.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 py-0.5">
                          {topic.tags.map(t => (
                            <span
                              key={t}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border/60"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-[11px] text-muted-foreground">
                        {topic.initial_correct}/{topic.initial_questions} questões na fixação inicial
                      </p>
                    </div>
                  </TableCell>

                  {/* Contato Inicial */}
                  <TableCell className="text-center" onClick={() => handleOpenDrawer(topic)}>
                    <p className="text-xs font-semibold text-foreground">
                      {formatDateBR(topic.initial_date)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {topic.initial_percentage}%
                    </p>
                  </TableCell>

                  {/* Ciclo Ativo */}
                  <TableCell className="text-center" onClick={() => handleOpenDrawer(topic)}>
                    {activeReview ? (
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                        R{activeReview.review_number}
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-400 font-semibold">R8 Final</span>
                    )}
                  </TableCell>

                  {/* Data Agendada */}
                  <TableCell className="text-center" onClick={() => handleOpenDrawer(topic)}>
                    <p className="text-xs font-semibold text-foreground">
                      {activeReview ? formatDateBR(activeReview.scheduled_date) : '-'}
                    </p>
                  </TableCell>

                  {/* Status com Badge Dinâmico */}
                  <TableCell className="text-center" onClick={() => handleOpenDrawer(topic)}>
                    <Badge
                      variant={
                        statusInfo.status === 'CONCLUÍDO'
                          ? 'concluido'
                          : statusInfo.status === 'ATRASADO'
                          ? 'atrasado'
                          : statusInfo.status === 'REVISAR HOJE'
                          ? 'hoje'
                          : 'programado'
                      }
                      className="text-[11px]"
                    >
                      {statusInfo.badgeText}
                    </Badge>
                  </TableCell>

                  {/* Ações */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      {activeReview && (
                        <Button
                          size="sm"
                          variant={statusInfo.status === 'ATRASADO' ? 'destructive' : 'default'}
                          onClick={() => handleOpenComplete(activeReview, topic)}
                          className="h-7 px-2 text-[11px] font-bold gap-1 shadow-sm"
                          title="Concluir este ciclo de revisão agora"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Concluir</span>
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDrawer(topic)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Ver os 8 ciclos de revisão"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Drawer com 8 ciclos */}
      <TopicDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        topic={drawerTopic}
        reviews={reviews}
      />

      {/* Modal de Conclusão */}
      <ReviewCompletionModal
        open={completionModalOpen}
        onOpenChange={setCompletionModalOpen}
        review={selectedReviewToComplete}
        topic={drawerTopic || undefined}
      />
    </div>
  );
};
