'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/lib/store/data-context';
import {
  Stethoscope,
  Target,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Percent,
  Plus,
  X,
  Search,
  ChevronDown,
  MapPin,
  HelpCircle,
} from 'lucide-react';

// LISTA EXTENSA DE ESPECIALIDADES MÉDICAS REGULAMENTADAS (50+)
const ALL_SPECIALTIES = [
  'Acupuntura',
  'Alergia e Imunologia',
  'Anestesiologia',
  'Angiologia',
  'Cardiologia',
  'Cirurgia Cardiovascular',
  'Cirurgia da Mão',
  'Cirurgia de Cabeça e Pescoço',
  'Cirurgia do Aparelho Digestivo',
  'Cirurgia Geral',
  'Cirurgia Oncológica',
  'Cirurgia Pediátrica',
  'Cirurgia Plástica',
  'Cirurgia Torácica',
  'Cirurgia Vascular',
  'Clínica Médica',
  'Coloproctologia',
  'Dermatologia',
  'Endocrinologia e Metabologia',
  'Endoscopia',
  'Gastroenterologia',
  'Genética Médica',
  'Geriatria',
  'Ginecologia e Obstetrícia',
  'Hematologia e Hemoterapia',
  'Homeopatia',
  'Infectologia',
  'Mastologia',
  'Medicina de Emergência',
  'Medicina de Família e Comunidade',
  'Medicina do Trabalho',
  'Medicina do Tráfego',
  'Medicina Esportiva',
  'Medicina Física e Reabilitação',
  'Medicina Intensiva',
  'Medicina Legal e Perícia Médica',
  'Medicina Nuclear',
  'Medicina Preventiva e Social',
  'Nefrologia',
  'Neurocirurgia',
  'Neurologia',
  'Nutrologia',
  'Oftalmologia',
  'Oncologia Clínica',
  'Ortopedia e Traumatologia',
  'Otorrinolaringologia',
  'Patologia',
  'Patologia Clínica / Medicina Laboratorial',
  'Pediatria',
  'Pneumologia',
  'Psiquiatria',
  'Radiologia e Diagnóstico por Imagem',
  'Radioterapia',
  'Reumatologia',
  'Urologia',
];

// BANCAS CATEGORIZADAS COM FORTE DESTAQUE PARA O NORDESTE
interface ExamCategory {
  category: string;
  badge: string;
  highlight?: boolean;
  exams: { code: string; name: string; state?: string }[];
}

const CATEGORIZED_EXAMS: ExamCategory[] = [
  {
    category: 'Região Nordeste (Destaque Principal)',
    badge: '🌟 Nordeste em Foco',
    highlight: true,
    exams: [
      { code: 'ENARE', name: 'Exame Nacional de Residência (Forte presença no NE)' },
      { code: 'SES-PE', name: 'Secretaria Estadual de Saúde de Pernambuco', state: 'PE' },
      { code: 'SURCE', name: 'Seleção Unificada para Residência Médica do Ceará', state: 'CE' },
      { code: 'PSU-BA', name: 'Processo Seletivo Unificado da Bahia (CEREM-BA)', state: 'BA' },
      { code: 'PSU-AL', name: 'Processo Seletivo Unificado de Alagoas', state: 'AL' },
      { code: 'UFRN', name: 'Universidade Federal do Rio Grande do Norte', state: 'RN' },
      { code: 'UFPB / UFCG', name: 'Universidades Federais da Paraíba', state: 'PB' },
      { code: 'UFMA', name: 'Universidade Federal do Maranhão', state: 'MA' },
      { code: 'UFPI', name: 'Universidade Federal do Piauí', state: 'PI' },
      { code: 'UFS', name: 'Universidade Federal de Sergipe', state: 'SE' },
      { code: 'IMIP', name: 'Instituto de Medicina Integral Prof. Fernando Figueira', state: 'PE' },
      { code: 'HUWC / MEAC', name: 'Hospital Universitário Walter Cantídio (UFC)', state: 'CE' },
      { code: 'HC-UFPE', name: 'Hospital das Clínicas da UFPE', state: 'PE' },
      { code: 'HCP', name: 'Hospital de Câncer de Pernambuco', state: 'PE' },
    ],
  },
  {
    category: 'Região Sudeste',
    badge: '🏛️ Sudeste',
    exams: [
      { code: 'USP-SP', name: 'Universidade de São Paulo (Capital)', state: 'SP' },
      { code: 'USP-RP', name: 'Universidade de São Paulo (Ribeirão Preto)', state: 'SP' },
      { code: 'UNICAMP', name: 'Universidade Estadual de Campinas', state: 'SP' },
      { code: 'UNIFESP', name: 'Escola Paulista de Medicina (UNIFESP)', state: 'SP' },
      { code: 'SUS-SP', name: 'Processo Seletivo Unificado SUS São Paulo', state: 'SP' },
      { code: 'SCMSP', name: 'Santa Casa de Misericórdia de São Paulo', state: 'SP' },
      { code: 'IAMSPE', name: 'Inst. de Assistência Médica ao Servidor Público Estadual', state: 'SP' },
      { code: 'PSU-MG', name: 'Processo Seletivo Unificado de Minas Gerais', state: 'MG' },
      { code: 'UFRJ', name: 'Universidade Federal do Rio de Janeiro', state: 'RJ' },
      { code: 'UERJ', name: 'Universidade do Estado do Rio de Janeiro', state: 'RJ' },
      { code: 'INCA', name: 'Instituto Nacional de Câncer', state: 'RJ' },
    ],
  },
  {
    category: 'Sul, Centro-Oeste e Demais Regiões',
    badge: '🌎 Outras Regiões',
    exams: [
      { code: 'AMRIGS', name: 'Associação Médica do Rio Grande do Sul / SC / MT' },
      { code: 'AMP', name: 'Associação Médica do Paraná', state: 'PR' },
      { code: 'SES-DF', name: 'Secretaria de Saúde do Distrito Federal', state: 'DF' },
      { code: 'HUB / UnB', name: 'Hospital Universitário de Brasília', state: 'DF' },
      { code: 'UFPR', name: 'Universidade Federal do Paraná', state: 'PR' },
      { code: 'UFSC', name: 'Universidade Federal de Santa Catarina', state: 'SC' },
      { code: 'UFG', name: 'Universidade Federal de Goiás', state: 'GO' },
      { code: 'UFPA', name: 'Universidade Federal do Pará', state: 'PA' },
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, updateProfile } = useData();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Passo 1: Especialidades (Múltipla Seleção)
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [specialtySearch, setSpecialtySearch] = useState<string>('');
  const [isSpecialtyDropdownOpen, setIsSpecialtyDropdownOpen] = useState(false);
  const [customSpecialty, setCustomSpecialty] = useState<string>('');
  const specialtyDropdownRef = useRef<HTMLDivElement>(null);

  // Passo 2: Bancas (Múltipla Seleção com Foco Nordeste)
  const [selectedExams, setSelectedExams] = useState<string[]>(['ENARE', 'SES-PE', 'SURCE']);
  const [examSearch, setExamSearch] = useState<string>('');
  const [isExamDropdownOpen, setIsExamDropdownOpen] = useState(false);
  const [customExam, setCustomExam] = useState<string>('');
  const examDropdownRef = useRef<HTMLDivElement>(null);

  // Passo 3: Meta de Corte e Ano da Prova Flexível
  const [cutoffPercentage, setCutoffPercentage] = useState<number>(80);
  const currentYear = new Date().getFullYear();
  const [targetYear, setTargetYear] = useState<number>(currentYear);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pré-carrega dados existentes do perfil se houver
  useEffect(() => {
    if (profile) {
      if (profile.target_specialty) {
        const parts = profile.target_specialty
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
        if (parts.length > 0) {
          setSelectedSpecialties(parts);
        }
      }
      if (profile.target_exams && profile.target_exams.length > 0) {
        setSelectedExams(profile.target_exams);
      }
      if (profile.target_cutoff_percentage) {
        setCutoffPercentage(profile.target_cutoff_percentage);
      }
      if (profile.target_year) {
        setTargetYear(profile.target_year);
      }
    }
  }, [profile]);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        specialtyDropdownRef.current &&
        !specialtyDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSpecialtyDropdownOpen(false);
      }
      if (
        examDropdownRef.current &&
        !examDropdownRef.current.contains(event.target as Node)
      ) {
        setIsExamDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Handlers de Especialidade ---
  const toggleSpecialty = (spec: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  const handleAddCustomSpecialty = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSpecialty.trim();
    if (!trimmed) return;
    if (!selectedSpecialties.includes(trimmed)) {
      setSelectedSpecialties(prev => [...prev, trimmed]);
    }
    setCustomSpecialty('');
  };

  const filteredSpecialties = ALL_SPECIALTIES.filter(s =>
    s.toLowerCase().includes(specialtySearch.toLowerCase())
  );

  // --- Handlers de Bancas ---
  const toggleExam = (examCode: string) => {
    setSelectedExams(prev =>
      prev.includes(examCode) ? prev.filter(e => e !== examCode) : [...prev, examCode]
    );
  };

  const handleAddCustomExam = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = customExam.trim().toUpperCase();
    if (!formatted) return;
    if (!selectedExams.includes(formatted)) {
      setSelectedExams(prev => [...prev, formatted]);
    }
    setCustomExam('');
  };

  // --- Conclusão do Onboarding ---
  const handleFinish = async () => {
    const finalSpecialtiesString =
      selectedSpecialties.length > 0
        ? selectedSpecialties.join(', ')
        : 'Residência Médica';

    try {
      setIsSubmitting(true);
      await updateProfile({
        target_specialty: finalSpecialtiesString,
        target_exams: selectedExams.length > 0 ? selectedExams : ['ENARE'],
        target_cutoff_percentage: cutoffPercentage,
        target_year: Number(targetYear) || currentYear,
        onboarding_completed: true,
      });

      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#3B82F6', '#10B981', '#F59E0B'],
        });
      } catch {
        // Fallback silencioso
      }

      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 900);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Luzes de fundo sutis */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl space-y-6 relative z-10">
        {/* Topo / Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 shadow-xl shadow-blue-500/25 mb-1">
            <Stethoscope className="h-6 w-6 text-white stroke-[2.2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Personalize seu Cronograma Adaptativo
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            Configuração sob medida: suas especialidades de interesse, bancas prioritárias e meta de aprovação.
          </p>
        </div>

        {/* Indicador de Passos */}
        <div className="flex items-center justify-center space-x-3 text-xs font-semibold">
          <div
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full border transition-all ${
              step === 1
                ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                : step > 1
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-border text-muted-foreground'
            }`}
          >
            <span>1. Especialidades</span>
          </div>
          <div className="w-4 h-0.5 bg-border" />
          <div
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full border transition-all ${
              step === 2
                ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                : step > 2
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-border text-muted-foreground'
            }`}
          >
            <span>2. Bancas & Regiões</span>
          </div>
          <div className="w-4 h-0.5 bg-border" />
          <div
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full border transition-all ${
              step === 3
                ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                : 'border-border text-muted-foreground'
            }`}
          >
            <span>3. Ano & Nota de Corte</span>
          </div>
        </div>

        <Card className="border-border shadow-2xl">
          {/* PASSO 1: Especialidades Médicas (Menu Suspenso com Seleção Múltipla + Outros) */}
          {step === 1 && (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
                    <Target className="h-4 w-4" /> Passo 1 de 3
                  </div>
                  <Badge variant="outline" className="text-[11px] font-medium border-blue-500/30 text-blue-400">
                    Seleção Múltipla Permitida
                  </Badge>
                </div>
                <CardTitle className="text-xl">Qual é a sua especialidade alvo?</CardTitle>
                <CardDescription>
                  Selecione uma ou mais especialidades (caso esteja em dúvida entre áreas).
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Especialidades Selecionadas (Chips) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                    <span>Especialidades escolhidas ({selectedSpecialties.length}):</span>
                    {selectedSpecialties.length > 1 && (
                      <span className="text-[11px] text-amber-400">
                        Indeciso(a) entre {selectedSpecialties.length} opções
                      </span>
                    )}
                  </label>

                  {selectedSpecialties.length === 0 ? (
                    <div className="p-3 rounded-xl border border-dashed border-border text-xs text-muted-foreground text-center">
                      Nenhuma especialidade selecionada ainda. Abra o menu abaixo para escolher.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-xl border border-border">
                      {selectedSpecialties.map(spec => (
                        <span
                          key={spec}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-primary text-primary-foreground shadow-sm animate-in fade-in"
                        >
                          {spec}
                          <button
                            type="button"
                            onClick={() => toggleSpecialty(spec)}
                            className="hover:bg-primary-foreground/20 rounded p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Menu Suspenso / Combobox Pesquisável */}
                <div className="relative" ref={specialtyDropdownRef}>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Abrir menu suspenso de especialidades
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsSpecialtyDropdownOpen(!isSpecialtyDropdownOpen)}
                    className="w-full h-11 px-3 rounded-xl border border-border bg-card flex items-center justify-between text-left text-sm text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-primary" />
                      {isSpecialtyDropdownOpen
                        ? 'Pesquise ou clique nas especialidades...'
                        : 'Clique para abrir a lista completa (+50 opções)'}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform ${
                        isSpecialtyDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isSpecialtyDropdownOpen && (
                    <div className="absolute z-50 mt-1.5 w-full bg-card border border-border rounded-xl shadow-2xl p-2 space-y-2 animate-in fade-in max-h-80 flex flex-col">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Buscar especialidade (ex: Cirurgia, Pediatria, Oftalmo)..."
                          value={specialtySearch}
                          onChange={e => setSpecialtySearch(e.target.value)}
                          className="pl-8 text-xs h-9 bg-background"
                          autoFocus
                        />
                      </div>

                      <div className="overflow-y-auto space-y-1 pr-1 flex-1">
                        {filteredSpecialties.length === 0 ? (
                          <div className="p-3 text-center text-xs text-muted-foreground">
                            Nenhuma especialidade encontrada para &quot;{specialtySearch}&quot;.
                          </div>
                        ) : (
                          filteredSpecialties.map(spec => {
                            const isSelected = selectedSpecialties.includes(spec);
                            return (
                              <button
                                key={spec}
                                type="button"
                                onClick={() => toggleSpecialty(spec)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                                  isSelected
                                    ? 'bg-primary/15 text-primary font-bold'
                                    : 'hover:bg-muted text-foreground'
                                }`}
                              >
                                <span>{spec}</span>
                                {isSelected && (
                                  <span className="text-[11px] font-bold text-primary">✓ Selecionada</span>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Opção para Adicionar Especialidade Customizada (Outros) */}
                <div className="pt-2 border-t border-border">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Não encontrou sua área? Adicione outra:
                  </label>
                  <form onSubmit={handleAddCustomSpecialty} className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Ex: Mastologia, Medicina Esportiva, Angiorradiologia..."
                      value={customSpecialty}
                      onChange={e => setCustomSpecialty(e.target.value)}
                      className="text-xs h-9"
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      disabled={!customSpecialty.trim()}
                      className="text-xs shrink-0 font-semibold"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
                    </Button>
                  </form>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end pt-4 border-t border-border">
                <Button
                  onClick={() => setStep(2)}
                  disabled={selectedSpecialties.length === 0}
                  className="gap-2 font-bold shadow-md shadow-primary/20"
                >
                  Avançar para Bancas <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </>
          )}

          {/* PASSO 2: Provas e Bancas (Menu Suspenso com DESTAQUE FORTE NO NORDESTE) */}
          {step === 2 && (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
                    <GraduationCap className="h-4 w-4" /> Passo 2 de 3
                  </div>
                  <Badge variant="outline" className="text-[11px] font-medium border-emerald-500/30 text-emerald-400">
                    Nordeste & Sudeste
                  </Badge>
                </div>
                <CardTitle className="text-xl">Quais provas e bancas você prestará?</CardTitle>
                <CardDescription>
                  Selecione todas as instituições alvo. As principais bancas do Nordeste e Sudeste já estão catalogadas.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Bancas Selecionadas (Chips) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                    <span>Bancas Selecionadas ({selectedExams.length}):</span>
                    <span className="text-[11px] text-emerald-400 font-medium">
                      Multi-seleção ativa
                    </span>
                  </label>

                  {selectedExams.length === 0 ? (
                    <div className="p-3 rounded-xl border border-dashed border-border text-xs text-muted-foreground text-center">
                      Nenhuma banca selecionada. Abra as opções abaixo ou adicione a sua.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-xl border border-border">
                      {selectedExams.map(exam => (
                        <span
                          key={exam}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500 text-slate-950 shadow-sm animate-in fade-in"
                        >
                          {exam}
                          <button
                            type="button"
                            onClick={() => toggleExam(exam)}
                            className="hover:bg-slate-950/20 rounded p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bloco 1: Destaque Especial Nordeste */}
                <div className="p-3.5 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                        🌟 Principais Bancas do Nordeste
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      Clique para marcar/desmarcar
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CATEGORIZED_EXAMS[0].exams.map(exam => {
                      const isSelected = selectedExams.includes(exam.code);
                      return (
                        <button
                          key={exam.code}
                          type="button"
                          onClick={() => toggleExam(exam.code)}
                          className={`text-left p-2 rounded-lg border text-xs transition-all ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500 text-slate-950 font-bold shadow-sm'
                              : 'border-border bg-card/80 hover:bg-muted text-foreground font-medium'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{exam.code}</span>
                            {exam.state && (
                              <span
                                className={`text-[10px] px-1 rounded ${
                                  isSelected ? 'bg-slate-900/20 text-slate-950' : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {exam.state}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Menu Suspenso / Combobox para Outras Bancas e Sudeste */}
                <div className="relative" ref={examDropdownRef}>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Menu suspenso com Sudeste e demais regiões
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsExamDropdownOpen(!isExamDropdownOpen)}
                    className="w-full h-11 px-3 rounded-xl border border-border bg-card flex items-center justify-between text-left text-sm text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-emerald-400" />
                      {isExamDropdownOpen
                        ? 'Selecione as bancas do Sudeste ou outras...'
                        : 'Abrir lista de bancas do Sudeste, Sul e Centro-Oeste'}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform ${
                        isExamDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isExamDropdownOpen && (
                    <div className="absolute z-50 mt-1.5 w-full bg-card border border-border rounded-xl shadow-2xl p-2 space-y-3 animate-in fade-in max-h-80 overflow-y-auto">
                      {CATEGORIZED_EXAMS.slice(1).map(cat => (
                        <div key={cat.category} className="space-y-1.5">
                          <div className="text-[11px] font-bold text-muted-foreground uppercase px-2 tracking-wide flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-primary" />
                            {cat.badge}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {cat.exams.map(exam => {
                              const isSelected = selectedExams.includes(exam.code);
                              return (
                                <button
                                  key={exam.code}
                                  type="button"
                                  onClick={() => toggleExam(exam.code)}
                                  className={`text-left px-2.5 py-1.5 rounded-lg border text-xs transition-colors flex items-center justify-between ${
                                    isSelected
                                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 font-bold'
                                      : 'border-border hover:bg-muted text-foreground'
                                  }`}
                                >
                                  <div>
                                    <div className="font-bold">{exam.code}</div>
                                    <div className="text-[10px] text-muted-foreground line-clamp-1">
                                      {exam.name}
                                    </div>
                                  </div>
                                  {isSelected && <span className="text-emerald-400 font-bold">✓</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Adicionar outra banca livremente */}
                <div className="pt-2 border-t border-border">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Não encontrou seu hospital ou prova? Adicione manualmente:
                  </label>
                  <form onSubmit={handleAddCustomExam} className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Ex: IAMSPE, Sírio-Libanês, Marinha do Brasil, SES-GO..."
                      value={customExam}
                      onChange={e => setCustomExam(e.target.value)}
                      className="text-xs h-9 uppercase"
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      disabled={!customExam.trim()}
                      className="text-xs shrink-0 font-semibold"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
                    </Button>
                  </form>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between pt-4 border-t border-border">
                <Button variant="ghost" onClick={() => setStep(1)} className="gap-1.5 text-xs">
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={selectedExams.length === 0}
                  className="gap-2 font-bold shadow-md shadow-primary/20"
                >
                  Avançar para Meta e Ano <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </>
          )}

          {/* PASSO 3: Meta de Corte e Ano da Prova (FLEXÍVEL PARA QUALQUER ANO: 1º AO 6º ANO) */}
          {step === 3 && (
            <>
              <CardHeader>
                <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
                  <Percent className="h-4 w-4" /> Passo 3 de 3
                </div>
                <CardTitle className="text-xl">Qual é o ano da sua prova e meta de nota?</CardTitle>
                <CardDescription>
                  Seja você estudante do 1º ano começando a base ou interno no ano da prova, o algoritmo calibra seus ciclos.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Seletor de Ano Totalmente Flexível */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-primary" /> Ano em que prestará a Residência
                    </label>
                    <span className="text-sm font-black text-primary">
                      Concurso {targetYear}
                    </span>
                  </div>

                  {/* Campo numérico para digitar livremente */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        min={currentYear}
                        max={currentYear + 10}
                        value={targetYear}
                        onChange={e => setTargetYear(parseInt(e.target.value, 10) || currentYear)}
                        className="text-base font-bold h-11"
                      />
                    </div>
                  </div>

                  {/* Pílulas de Atalho Rápido para todas as etapas da faculdade */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-muted-foreground">
                      Ou escolha seu momento atual na graduação médica:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setTargetYear(currentYear)}
                        className={`p-2 rounded-xl border font-bold text-center transition-all ${
                          targetYear === currentYear
                            ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                            : 'border-border bg-card hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        <div>Este ano</div>
                        <div className="text-[11px] font-normal">({currentYear})</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTargetYear(currentYear + 1)}
                        className={`p-2 rounded-xl border font-bold text-center transition-all ${
                          targetYear === currentYear + 1
                            ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                            : 'border-border bg-card hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        <div>6º ano / Reta Final</div>
                        <div className="text-[11px] font-normal">({currentYear + 1})</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTargetYear(currentYear + 2)}
                        className={`p-2 rounded-xl border font-bold text-center transition-all ${
                          targetYear === currentYear + 2
                            ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                            : 'border-border bg-card hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        <div>5º ano / Internato</div>
                        <div className="text-[11px] font-normal">({currentYear + 2})</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTargetYear(currentYear + 4)}
                        className={`p-2 rounded-xl border font-bold text-center transition-all ${
                          targetYear >= currentYear + 3
                            ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                            : 'border-border bg-card hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        <div>1º ao 4º ano</div>
                        <div className="text-[11px] font-normal">({currentYear + 4})</div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Slider / Seletor de Meta de Corte */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="flex justify-between items-baseline">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Meta de Aproveitamento Desejada
                    </label>
                    <span className="text-3xl font-black text-emerald-400">
                      {cutoffPercentage}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="60"
                    max="95"
                    step="1"
                    value={cutoffPercentage}
                    onChange={e => setCutoffPercentage(parseInt(e.target.value, 10))}
                    className="w-full h-2.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />

                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>60% (Básico)</span>
                    <span className="text-blue-400 font-semibold">80% (Corte Geral Competitivo)</span>
                    <span className="text-emerald-400 font-semibold">90%+ (Top Concorridas)</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-card border border-border text-xs space-y-1">
                    <p className="font-bold text-foreground">
                      {cutoffPercentage >= 85
                        ? '🔥 Meta de Alto Rendimento'
                        : cutoffPercentage >= 80
                        ? '🎯 Meta de Aprovação Competitiva'
                        : '📈 Meta de Construção de Base'}
                    </p>
                    <p className="text-muted-foreground">
                      {cutoffPercentage >= 85
                        ? 'Excelente para especialidades de acesso direto concorridíssimas (Dermatologia, Oftalmologia, Anestesiologia na USP/ENARE/SURCE).'
                        : cutoffPercentage >= 80
                        ? 'Faixa de nota segura para aprovação na grande maioria dos programas e hospitais universitários do país.'
                        : 'Ritmo inicial ideal para consolidar os temas fundamentais das 5 Grandes Áreas com revisões espaçadas contínuas.'}
                    </p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between pt-4 border-t border-border">
                <Button variant="ghost" onClick={() => setStep(2)} className="gap-1.5 text-xs">
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={isSubmitting}
                  variant="success"
                  className="gap-2 font-bold shadow-lg shadow-emerald-600/20"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isSubmitting ? 'Salvando Plano...' : 'Concluir e Acessar Meu Cronograma'}
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
