'use client';

import React, { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useData } from '@/lib/store/data-context';
import { PrevalentTopic, getAreaStyle } from '@/types/database';
import { PlanTopicModal } from '@/components/diary/plan-topic-modal';
import {
  Flame,
  ArrowUp,
  ArrowDown,
  Plus,
  Search,
  BookOpen,
  CalendarPlus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  GraduationCap,
  Filter,
} from 'lucide-react';

export default function PrevalenciaPage() {
  const {
    prevalentTopics,
    addPrevalentTopic,
    updatePrevalentTopic,
    deletePrevalentTopic,
    reorderPrevalentTopics,
    topics,
    areas,
  } = useData();

  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('TODAS');
  const [selectedPrevalenceFilter, setSelectedPrevalenceFilter] = useState<string>('TODAS');
  const [searchQuery, setSearchQuery] = useState('');

  // Modais de Criação / Edição de Assunto Prevalente
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PrevalentTopic | null>(null);

  // Form State
  const [formArea, setFormArea] = useState('');
  const [formSubjectName, setFormSubjectName] = useState('');
  const [formPrevalence, setFormPrevalence] = useState<'ALTA' | 'MEDIA' | 'BAIXA'>('ALTA');
  const [formBanca, setFormBanca] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Modal de Agendamento no Diário
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planTargetSubject, setPlanTargetSubject] = useState<{
    subjectName: string;
    area: string;
  } | null>(null);

  // Mapeia tópicos já cadastrados no Diário (por nome minúsculo)
  const existingTopicsMap = useMemo(() => {
    const map = new Map<string, { isPlanned: boolean; isStudied: boolean }>();
    topics.forEach(t => {
      const nameKey = t.subject_name.trim().toLowerCase();
      const isPlanned = Boolean(t.is_planned);
      map.set(nameKey, {
        isPlanned,
        isStudied: !isPlanned,
      });
    });
    return map;
  }, [topics]);

  // Lista ordenada de assuntos prevalentes
  const sortedPrevalentTopics = useMemo(() => {
    return [...prevalentTopics].sort((a, b) => a.rank_order - b.rank_order);
  }, [prevalentTopics]);

  // Filtros aplicados
  const filteredTopics = useMemo(() => {
    return sortedPrevalentTopics.filter(item => {
      // Filtro de área
      if (selectedAreaFilter !== 'TODAS' && item.area !== selectedAreaFilter) {
        return false;
      }
      // Filtro de prevalência
      if (selectedPrevalenceFilter !== 'TODAS' && item.prevalence_level !== selectedPrevalenceFilter) {
        return false;
      }
      // Busca por texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.subject_name.toLowerCase().includes(q);
        const matchesArea = item.area.toLowerCase().includes(q);
        const matchesBanca = item.banca?.toLowerCase().includes(q);
        const matchesNotes = item.frequency_notes?.toLowerCase().includes(q);
        if (!matchesName && !matchesArea && !matchesBanca && !matchesNotes) {
          return false;
        }
      }
      return true;
    });
  }, [sortedPrevalentTopics, selectedAreaFilter, selectedPrevalenceFilter, searchQuery]);

  // Handlers para Mover Posição (Hierarquia)
  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;
    const currentList = [...sortedPrevalentTopics];
    const itemToMove = filteredTopics[index];
    const prevItem = filteredTopics[index - 1];

    // Encontra os índices globais
    const idxA = currentList.findIndex(p => p.id === itemToMove.id);
    const idxB = currentList.findIndex(p => p.id === prevItem.id);

    if (idxA !== -1 && idxB !== -1) {
      // Inverte posições na lista global
      const temp = currentList[idxA];
      currentList[idxA] = currentList[idxB];
      currentList[idxB] = temp;

      await reorderPrevalentTopics(currentList.map(p => p.id));
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index >= filteredTopics.length - 1) return;
    const currentList = [...sortedPrevalentTopics];
    const itemToMove = filteredTopics[index];
    const nextItem = filteredTopics[index + 1];

    const idxA = currentList.findIndex(p => p.id === itemToMove.id);
    const idxB = currentList.findIndex(p => p.id === nextItem.id);

    if (idxA !== -1 && idxB !== -1) {
      const temp = currentList[idxA];
      currentList[idxA] = currentList[idxB];
      currentList[idxB] = temp;

      await reorderPrevalentTopics(currentList.map(p => p.id));
    }
  };

  // Abrir modal de criação
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormArea(areas[0]?.name || 'Clínica Médica');
    setFormSubjectName('');
    setFormPrevalence('ALTA');
    setFormBanca('ENARE / USP');
    setFormNotes('');
    setEditModalOpen(true);
  };

  // Abrir modal de edição
  const handleOpenEditModal = (item: PrevalentTopic) => {
    setEditingItem(item);
    setFormArea(item.area);
    setFormSubjectName(item.subject_name);
    setFormPrevalence(item.prevalence_level);
    setFormBanca(item.banca || '');
    setFormNotes(item.frequency_notes || '');
    setEditModalOpen(true);
  };

  // Salvar Criação ou Edição
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubjectName.trim()) return;

    if (editingItem) {
      await updatePrevalentTopic(editingItem.id, {
        area: formArea,
        subject_name: formSubjectName.trim(),
        prevalence_level: formPrevalence,
        banca: formBanca.trim() || undefined,
        frequency_notes: formNotes.trim() || undefined,
      });
    } else {
      const maxRank = prevalentTopics.reduce((max, p) => Math.max(max, p.rank_order || 0), 0);
      await addPrevalentTopic({
        area: formArea,
        subject_name: formSubjectName.trim(),
        prevalence_level: formPrevalence,
        rank_order: maxRank + 1,
        banca: formBanca.trim() || undefined,
        frequency_notes: formNotes.trim() || undefined,
      });
    }

    setEditModalOpen(false);
  };

  // Agendar no Diário
  const handleScheduleInDiary = (item: PrevalentTopic) => {
    setPlanTargetSubject({
      subjectName: item.subject_name,
      area: item.area,
    });
    setPlanModalOpen(true);
  };

  // Métricas do Topo
  const highCount = prevalentTopics.filter(p => p.prevalence_level === 'ALTA').length;
  const inDiaryCount = prevalentTopics.filter(p =>
    existingTopicsMap.has(p.subject_name.trim().toLowerCase())
  ).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Principal */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Assuntos Prevalentes da Banca
              </h1>
              <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-400">
                <Flame className="h-6 w-6 fill-amber-500 stroke-[2.2]" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Hierarquia estratégica dos temas com maior probabilidade de queda nas principais provas de residência (ENARE, USP, UNICAMP, SUS-SP).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleOpenCreateModal}
              className="text-xs gap-1.5 font-bold shadow-md shadow-primary/20"
            >
              <Plus className="h-4 w-4" /> Novo Assunto Prevalente
            </Button>
          </div>
        </div>

        {/* Cards de Métricas Estratégicas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3.5 bg-card border-border">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Mapeado
            </p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-extrabold text-foreground">
                {prevalentTopics.length}
              </span>
              <Badge variant="outline" className="text-[10px]">
                Assuntos
              </Badge>
            </div>
          </Card>

          <Card className="p-3.5 bg-card border-border">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Alta Prevalência
            </p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-extrabold text-amber-400">
                {highCount}
              </span>
              <Badge variant="hoje" className="text-[10px] gap-1">
                <Flame className="h-2.5 w-2.5 fill-amber-500" /> Prioridade Máxima
              </Badge>
            </div>
          </Card>

          <Card className="p-3.5 bg-card border-border">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Presentes no Diário
            </p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-extrabold text-emerald-400">
                {inDiaryCount}
              </span>
              <Badge variant="concluido" className="text-[10px]">
                {prevalentTopics.length > 0
                  ? `${Math.round((inDiaryCount / prevalentTopics.length) * 100)}% Coberto`
                  : '0%'}
              </Badge>
            </div>
          </Card>

          <Card className="p-3.5 bg-card border-border">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Foco das Bancas
            </p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-bold text-foreground truncate">
                ENARE / USP / UNICAMP
              </span>
              <Badge variant="secondary" className="text-[10px]">
                Top 2025/2026
              </Badge>
            </div>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Campo de Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por tema, grande área, banca ou frequência..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            {/* Filtro por Nível de Prevalência */}
            <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto">
              <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1 mr-1">
                <Filter className="h-3 w-3" /> Nível:
              </span>
              {(['TODAS', 'ALTA', 'MEDIA', 'BAIXA'] as const).map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSelectedPrevalenceFilter(level)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedPrevalenceFilter === level
                      ? level === 'ALTA'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  }`}
                >
                  {level === 'TODAS' ? 'Todos' : level}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro por Grande Área (Tabs) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-border/60 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedAreaFilter('TODAS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                selectedAreaFilter === 'TODAS'
                  ? 'bg-foreground text-background font-bold shadow-xs'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              }`}
            >
              Todas as Áreas ({sortedPrevalentTopics.length})
            </button>

            {areas.map(area => {
              const count = sortedPrevalentTopics.filter(p => p.area === area.name).length;
              const isSelected = selectedAreaFilter === area.name;
              const areaStyle = getAreaStyle(area.name, areas);

              return (
                <button
                  key={area.name}
                  type="button"
                  onClick={() => setSelectedAreaFilter(area.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? `${areaStyle.bg} ${areaStyle.text} ring-1 ring-inset ring-current font-bold`
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  }`}
                >
                  <span>{area.name}</span>
                  <span className="text-[10px] opacity-75 font-normal">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista Hierárquica de Assuntos Prevalentes */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          {filteredTopics.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
                <Flame className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                Nenhum assunto prevalente encontrado com os filtros atuais.
              </p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Tente ajustar a busca ou clique no botão acima para cadastrar um novo tema de alta incidência.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {filteredTopics.map((item, index) => {
                const areaStyle = getAreaStyle(item.area, areas);
                const statusInDiary = existingTopicsMap.get(item.subject_name.trim().toLowerCase());
                const isFirst = index === 0;
                const isLast = index === filteredTopics.length - 1;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors group"
                  >
                    {/* Lado Esquerdo: Posição + Informações do Assunto */}
                    <div className="flex items-start sm:items-center space-x-3.5 flex-1 min-w-0">
                      {/* Posição Hierárquica */}
                      <div className="flex flex-col items-center justify-center h-10 w-9 rounded-xl bg-muted/60 border border-border shrink-0">
                        <span className="text-xs font-black text-foreground">
                          #{item.rank_order}
                        </span>
                        {item.rank_order <= 3 && (
                          <Flame className="h-3 w-3 text-amber-400 fill-amber-400 mt-0.5" />
                        )}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground tracking-tight truncate">
                            {item.subject_name}
                          </h4>

                          <Badge
                            className={`text-[10px] font-semibold border ${areaStyle.bg} ${areaStyle.text} ${areaStyle.border}`}
                          >
                            {item.area}
                          </Badge>

                          {item.prevalence_level === 'ALTA' ? (
                            <Badge variant="hoje" className="text-[10px] gap-1">
                              <Flame className="h-2.5 w-2.5 fill-amber-500" /> Alta Incidência
                            </Badge>
                          ) : item.prevalence_level === 'MEDIA' ? (
                            <Badge variant="secondary" className="text-[10px]">
                              Média Incidência
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">
                              Baixa Incidência
                            </Badge>
                          )}

                          {item.banca && (
                            <span className="text-[10px] text-muted-foreground font-medium px-2 py-0.5 rounded-md bg-muted/40 border border-border/40">
                              {item.banca}
                            </span>
                          )}
                        </div>

                        {item.frequency_notes && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {item.frequency_notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Lado Direito: Status no Diário + Ações */}
                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                      {/* Status no Diário */}
                      {statusInDiary ? (
                        statusInDiary.isStudied ? (
                          <Badge variant="concluido" className="text-[10px] gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Já Estudado
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <Clock className="h-3 w-3" /> Na Agenda
                          </Badge>
                        )
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleScheduleInDiary(item)}
                          className="h-8 text-xs gap-1 text-primary border-primary/30 hover:bg-primary/10 font-semibold"
                          title="Agendar este assunto no Diário de Estudos"
                        >
                          <CalendarPlus className="h-3.5 w-3.5" /> Agendar
                        </Button>
                      )}

                      {/* Botões de Mover Hierarquia */}
                      <div className="flex items-center rounded-lg bg-muted/50 p-0.5 border border-border/60">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isFirst}
                          onClick={() => handleMoveUp(index)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          title="Aumentar prioridade (subir)"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isLast}
                          onClick={() => handleMoveDown(index)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          title="Diminuir prioridade (descer)"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Editar */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEditModal(item)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Editar tema"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>

                      {/* Deletar */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Remover "${item.subject_name}" da lista de assuntos prevalentes?`)) {
                            deletePrevalentTopic(item.id);
                          }
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        title="Remover tema"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criação / Edição de Assunto Prevalente */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                <Flame className="h-5 w-5 fill-amber-500" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  {editingItem ? 'Editar Assunto Prevalente' : 'Cadastrar Assunto Prevalente'}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Defina o tema, sua grande área e a taxa de relevância na banca.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSaveItem} className="space-y-4 py-2">
            {/* Nome do Assunto */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Nome do Tema / Assunto *
              </label>
              <Input
                required
                value={formSubjectName}
                onChange={e => setFormSubjectName(e.target.value)}
                placeholder="Ex: Doença do Refluxo Gastroesofágico (DRGE)"
                className="text-xs"
              />
            </div>

            {/* Grande Área */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Grande Área *
              </label>
              <select
                value={formArea}
                onChange={e => setFormArea(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-card px-3 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              >
                {areas.map(a => (
                  <option key={a.name} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Grau de Prevalência */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Nível de Incidência / Prevalência
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['ALTA', 'MEDIA', 'BAIXA'] as const).map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormPrevalence(level)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      formPrevalence === level
                        ? level === 'ALTA'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {level === 'ALTA' ? '🔥 Alta' : level === 'MEDIA' ? '⚡ Média' : 'Baixa'}
                  </button>
                ))}
              </div>
            </div>

            {/* Bancas em Destaque */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Bancas em Destaque
              </label>
              <Input
                value={formBanca}
                onChange={e => setFormBanca(e.target.value)}
                placeholder="Ex: ENARE / USP / UNICAMP"
                className="text-xs"
              />
            </div>

            {/* Notas / Observações de Frequência */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Dicas & Padrão de Cobrança da Banca
              </label>
              <textarea
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
                rows={3}
                placeholder="Ex: Incidência altíssima em questões clínicas. Foco nas indicações cirúrgicas e sintomas de alarme."
                className="w-full rounded-md border border-input bg-card p-2 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs font-bold shadow-md shadow-primary/20"
              >
                {editingItem ? 'Salvar Alterações' : 'Cadastrar Assunto'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Agendamento Rápido no Diário */}
      <PlanTopicModal
        open={planModalOpen}
        onOpenChange={setPlanModalOpen}
        defaultArea={planTargetSubject?.area}
        defaultSubject={planTargetSubject?.subjectName}
      />
    </AppLayout>
  );
}
