'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useData } from '@/lib/store/data-context';
import {
  ERROR_LOG_CAUSES,
  ERROR_LOG_CAUSE_STYLES,
  ErrorLog,
  ErrorLogCause,
  StudyTopic,
  getAreaStyle,
} from '@/types/database';
import { formatDateBR } from '@/lib/spaced-repetition';
import {
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Pencil,
  Check,
  X,
  BookOpen,
  Filter,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

export default function CadernoErrosPage() {
  const {
    topics,
    areas,
    errorLogs,
    addErrorLog,
    toggleErrorLogReviewed,
    updateErrorLog,
    deleteErrorLog,
  } = useData();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [cause, setCause] = useState<ErrorLogCause>('Lacuna teórica');
  const [questionRef, setQuestionRef] = useState('');
  const [conceptSummary, setConceptSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'drafts' | 'reviewed'>('all');
  const [causeFilter, setCauseFilter] = useState<'all' | ErrorLogCause>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');

  const isDraftToComplete = (err: ErrorLog) =>
    !err.is_reviewed && err.concept_summary.trim().length < 60;

  // Edição inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCause, setEditCause] = useState<ErrorLogCause>('Lacuna teórica');
  const [editRef, setEditRef] = useState('');
  const [editConcept, setEditConcept] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const topicMap = useMemo(() => {
    const map = new Map<string, StudyTopic>();
    topics.forEach(t => map.set(t.id, t));
    return map;
  }, [topics]);

  const sortedTopics = useMemo(
    () =>
      [...topics].sort((a, b) =>
        `${a.area} ${a.subject_name}`.localeCompare(`${b.area} ${b.subject_name}`, 'pt-BR')
      ),
    [topics]
  );

  const metrics = useMemo(() => {
    const total = errorLogs.length;
    const pending = errorLogs.filter(e => !e.is_reviewed).length;
    const drafts = errorLogs.filter(e => !e.is_reviewed && e.concept_summary.trim().length < 60).length;
    const reviewed = total - pending;

    const byCause: Record<ErrorLogCause, number> = {
      'Lacuna teórica': 0,
      'Interpretação': 0,
      'Pegadinha da banca': 0,
      'Distração': 0,
    };
    errorLogs.forEach(e => {
      if (byCause[e.cause] !== undefined) byCause[e.cause] += 1;
    });

    let topCause: { cause: ErrorLogCause; count: number } | null = null;
    for (const c of ERROR_LOG_CAUSES) {
      if (byCause[c] > 0 && (!topCause || byCause[c] > topCause.count)) {
        topCause = { cause: c, count: byCause[c] };
      }
    }

    return { total, pending, drafts, reviewed, byCause, topCause };
  }, [errorLogs]);

  const filteredErrors = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return errorLogs.filter(err => {
      if (statusFilter === 'pending' && err.is_reviewed) return false;
      if (statusFilter === 'drafts' && (err.is_reviewed || err.concept_summary.trim().length >= 60)) return false;
      if (statusFilter === 'reviewed' && !err.is_reviewed) return false;
      if (causeFilter !== 'all' && err.cause !== causeFilter) return false;

      const topic = topicMap.get(err.topic_id);
      if (areaFilter !== 'all' && topic?.area !== areaFilter) return false;

      if (q) {
        const hay = `${err.concept_summary} ${err.question_ref || ''} ${err.cause} ${
          topic?.subject_name || ''
        } ${topic?.area || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [errorLogs, statusFilter, causeFilter, areaFilter, searchTerm, topicMap]);

  const handleOpenCreate = () => {
    if (!selectedTopicId && sortedTopics.length > 0) {
      setSelectedTopicId(sortedTopics[0].id);
    }
    setShowCreateForm(prev => !prev);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetTopicId = selectedTopicId || sortedTopics[0]?.id;
    if (!targetTopicId || !conceptSummary.trim()) return;

    try {
      setIsSaving(true);
      await addErrorLog({
        topic_id: targetTopicId,
        cause,
        concept_summary: conceptSummary.trim(),
        question_ref: questionRef.trim() || undefined,
      });
      setConceptSummary('');
      setQuestionRef('');
      setShowCreateForm(false);
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (err: ErrorLog) => {
    setEditingId(err.id);
    setEditCause(err.cause);
    setEditRef(err.question_ref || '');
    setEditConcept(err.concept_summary);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editConcept.trim()) return;
    try {
      setIsUpdating(true);
      await updateErrorLog(id, {
        cause: editCause,
        question_ref: editRef.trim() || null,
        concept_summary: editConcept.trim(),
      });
      setEditingId(null);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Caderno de Erros
              </h1>
              <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Catalogue seus erros por causa raiz, registre a regra para nunca mais errar e revise antes das provas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="text-xs font-bold gap-1.5 shadow-md shadow-primary/20"
            >
              {showCreateForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              <span>{showCreateForm ? 'Fechar Formulário' : 'Registrar Novo Erro'}</span>
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Registrado
                </p>
                <p className="text-2xl font-black text-foreground mt-0.5 tabular-nums">
                  {metrics.total}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  A Revisar
                </p>
                <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5 tabular-nums">
                  {metrics.pending}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Revisados
                </p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
                  {metrics.reviewed}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-4">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Principal Gargalo
              </p>
              {metrics.topCause ? (
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md border truncate ${
                      ERROR_LOG_CAUSE_STYLES[metrics.topCause.cause]
                    }`}
                  >
                    {metrics.topCause.cause}
                  </span>
                  <span className="text-sm font-black text-foreground tabular-nums">
                    {metrics.topCause.count}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic mt-1.5">Sem dados ainda</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Formulário de Novo Registro */}
        {showCreateForm && (
          <Card className="border-2 border-primary/40 bg-card shadow-lg animate-fade-in">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Catalogar Novo Erro
              </CardTitle>
              <CardDescription className="text-xs">
                Vincule o erro a um assunto estudado, marque a causa raiz e anote a regra de ouro.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              {sortedTopics.length === 0 ? (
                <div className="p-4 rounded-xl bg-muted/40 border border-dashed border-border text-center space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Você ainda não possui nenhum assunto cadastrado no Diário para vincular o erro.
                  </p>
                  <Link href="/diario">
                    <Button size="sm" variant="outline" className="text-xs font-semibold gap-1.5 mt-1">
                      <BookOpen className="h-3.5 w-3.5" /> Ir para o Diário e Registrar Assunto
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Assunto Relacionado
                      </label>
                      <select
                        value={selectedTopicId || sortedTopics[0]?.id || ''}
                        onChange={e => setSelectedTopicId(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        {sortedTopics.map(t => (
                          <option key={t.id} value={t.id}>
                            [{t.area}] {t.subject_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Referência da Questão / Banca (opcional)
                      </label>
                      <Input
                        value={questionRef}
                        onChange={e => setQuestionRef(e.target.value)}
                        placeholder="Ex: ENARE 2024 Q18, USP-SP Q42, Simulado 3..."
                        className="h-10 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Causa Raiz do Erro
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {ERROR_LOG_CAUSES.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCause(c)}
                          className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all text-left ${
                            cause === c
                              ? 'bg-primary/15 text-primary border-primary ring-2 ring-primary/25'
                              : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted/60 hover:text-foreground'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Conceito / Regra para Nunca Mais Errar
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={conceptSummary}
                      onChange={e => setConceptSummary(e.target.value)}
                      placeholder="Ex: Na intoxicação aguda por cocaína com dor torácica, betabloqueador é contraindicado pelo risco de vasoconstrição alfa sem oposição..."
                      className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCreateForm(false)}
                      className="text-xs"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSaving || !conceptSummary.trim()}
                      className="text-xs font-bold gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {isSaving ? 'Salvando...' : 'Salvar no Caderno'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        {/* Barra de Filtros */}
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar por conceito, assunto, grande área ou referência da questão..."
                  className="pl-9 h-9 text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center flex-wrap gap-1 bg-muted/50 p-1 rounded-xl border border-border/60">
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'pending', label: `A revisar (${metrics.pending})` },
                    { id: 'drafts', label: `Para complementar (${metrics.drafts})` },
                    { id: 'reviewed', label: `Revisados (${metrics.reviewed})` },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setStatusFilter(tab.id as 'all' | 'pending' | 'drafts' | 'reviewed')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        statusFilter === tab.id
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <select
                  value={areaFilter}
                  onChange={e => setAreaFilter(e.target.value)}
                  aria-label="Filtrar por Grande Área"
                  className="h-9 rounded-xl border border-border bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">Todas as Áreas</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 mr-1">
                <Filter className="h-3 w-3" /> Causa:
              </span>
              <button
                type="button"
                onClick={() => setCauseFilter('all')}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                  causeFilter === 'all'
                    ? 'bg-primary/15 text-primary border-primary/40'
                    : 'bg-muted/30 text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                Todas ({metrics.total})
              </button>
              {ERROR_LOG_CAUSES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCauseFilter(c)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                    causeFilter === c
                      ? `${ERROR_LOG_CAUSE_STYLES[c]} shadow-sm font-bold`
                      : 'bg-muted/30 text-muted-foreground border-border hover:text-foreground'
                  }`}
                >
                  {c} ({metrics.byCause[c]})
                </button>
              ))}

              {(searchTerm || statusFilter !== 'all' || causeFilter !== 'all' || areaFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setCauseFilter('all');
                    setAreaFilter('all');
                  }}
                  className="ml-auto text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" /> Limpar filtros
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Erros */}
        {filteredErrors.length === 0 ? (
          <Card className="border-dashed border-2 border-border bg-card/60">
            <CardContent className="p-10 text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-sm font-bold text-foreground">
                  {errorLogs.length === 0
                    ? 'Seu Caderno de Erros está pronto'
                    : 'Nenhum erro encontrado com os filtros atuais'}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {errorLogs.length === 0
                    ? 'Toda vez que errar uma questão no cursinho ou simulado, registre aqui o motivo e a regra de ouro para revisar rapidamente.'
                    : 'Tente limpar a busca ou trocar o filtro de causa raiz e status.'}
                </p>
              </div>
              {errorLogs.length === 0 && (
                <Button size="sm" onClick={handleOpenCreate} className="text-xs font-bold gap-1.5">
                  <Plus className="h-4 w-4" /> Registrar Primeiro Erro
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredErrors.map(err => {
              const topic = topicMap.get(err.topic_id);
              const areaName = topic?.area || 'Clínica Médica';
              const areaStyle = getAreaStyle(areaName, areas);
              const isEditing = editingId === err.id;

              return (
                <Card
                  key={err.id}
                  className={`border transition-all shadow-sm ${
                    err.is_reviewed
                      ? 'bg-emerald-500/[0.04] border-emerald-500/25 opacity-85'
                      : 'bg-card border-border hover:border-primary/40'
                  }`}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Topo: Área + Assunto + Ações */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${areaStyle.bg} ${areaStyle.text} ${areaStyle.border}`}
                          >
                            {areaName}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              ERROR_LOG_CAUSE_STYLES[err.cause]
                            }`}
                          >
                            {err.cause}
                          </span>
                          {err.question_ref && (
                            <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/60">
                              {err.question_ref}
                            </span>
                          )}
                          {isDraftToComplete(err) && !isEditing && (
                            <button
                              type="button"
                              onClick={() => startEditing(err)}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/25 transition-colors"
                              title="Pré-registro rápido — clique para detalhar"
                            >
                              Pré-registro • Complementar
                            </button>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-foreground truncate">
                          {topic?.subject_name || 'Assunto removido'}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditing(err)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/70 transition-colors"
                          title="Editar erro"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteErrorLog(err.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Excluir registro"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2.5 pt-1 border-t border-border/60">
                        <div className="grid grid-cols-2 gap-1.5">
                          {ERROR_LOG_CAUSES.map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setEditCause(c)}
                              className={`text-left px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
                                editCause === c
                                  ? 'bg-primary/15 text-primary border-primary'
                                  : 'bg-muted/30 text-muted-foreground border-border'
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                        <Input
                          value={editRef}
                          onChange={e => setEditRef(e.target.value)}
                          placeholder="Referência da questão"
                          className="h-8 text-xs"
                        />
                        <textarea
                          rows={3}
                          value={editConcept}
                          onChange={e => setEditConcept(e.target.value)}
                          className="w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(null)}
                            className="h-7 text-xs"
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={isUpdating || !editConcept.trim()}
                            onClick={() => handleSaveEdit(err.id)}
                            className="h-7 text-xs font-bold gap-1"
                          >
                            <Check className="h-3 w-3" /> Salvar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p
                          className={`text-xs leading-relaxed p-3 rounded-xl border border-border/60 bg-muted/25 whitespace-pre-wrap ${
                            err.is_reviewed ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          {err.concept_summary}
                        </p>

                        <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-muted-foreground">
                          <span>Registrado em {formatDateBR(err.created_at.slice(0, 10))}</span>

                          <div className="flex items-center gap-1.5">
                            {isDraftToComplete(err) && (
                              <button
                                type="button"
                                onClick={() => startEditing(err)}
                                className="px-2.5 py-1 rounded-lg border font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/25 transition-all flex items-center gap-1"
                              >
                                <Pencil className="h-3 w-3" />
                                <span>Complementar</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => toggleErrorLogReviewed(err.id)}
                              className={`px-2.5 py-1 rounded-lg border font-bold transition-all flex items-center gap-1.5 ${
                                err.is_reviewed
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                                  : 'bg-muted/60 text-foreground border-border hover:border-blue-500/50 hover:bg-blue-500/10'
                              }`}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>{err.is_reviewed ? 'Revisado' : 'Marcar como Revisado'}</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
