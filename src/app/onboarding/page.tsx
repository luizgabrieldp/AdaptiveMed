'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

const COMMON_SPECIALTIES = [
  'Clínica Médica',
  'Cirurgia Geral',
  'Pediatria',
  'Ginecologia e Obstetrícia',
  'Anestesiologia',
  'Dermatologia',
  'Ortopedia e Traumatologia',
  'Oftalmologia',
  'Radiologia',
  'Psiquiatria',
  'Medicina de Emergência',
  'Otorrinolaringologia',
  'Neurologia',
  'Infectologia',
];

const COMMON_EXAMS = [
  'ENARE',
  'USP-SP',
  'UNICAMP',
  'SUS-SP',
  'PSU-MG',
  'AMP',
  'AMRIGS',
  'SCMSP',
  'UFRJ',
  'UNIFESP',
  'SURCE',
  'SES-DF',
];

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, updateProfile, isDemoMode, user, isLoading } = useData();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [customSpecialty, setCustomSpecialty] = useState<string>('');
  const [selectedExams, setSelectedExams] = useState<string[]>(['ENARE', 'USP-SP']);
  const [customExam, setCustomExam] = useState<string>('');
  const [cutoffPercentage, setCutoffPercentage] = useState<number>(80);
  const [targetYear, setTargetYear] = useState<number>(2026);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pré-carrega dados existentes do perfil se houver
  useEffect(() => {
    if (profile) {
      if (profile.target_specialty) {
        if (COMMON_SPECIALTIES.includes(profile.target_specialty)) {
          setSelectedSpecialty(profile.target_specialty);
        } else {
          setSelectedSpecialty('OUTRA');
          setCustomSpecialty(profile.target_specialty);
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

  const toggleExam = (exam: string) => {
    setSelectedExams(prev =>
      prev.includes(exam) ? prev.filter(e => e !== exam) : [...prev, exam]
    );
  };

  const handleAddCustomExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customExam.trim()) return;
    const formatted = customExam.trim().toUpperCase();
    if (!selectedExams.includes(formatted)) {
      setSelectedExams(prev => [...prev, formatted]);
    }
    setCustomExam('');
  };

  const handleFinish = async () => {
    const finalSpecialty =
      selectedSpecialty === 'OUTRA'
        ? customSpecialty.trim() || 'Residência Médica'
        : selectedSpecialty || 'Residência Médica';

    try {
      setIsSubmitting(true);
      await updateProfile({
        target_specialty: finalSpecialty,
        target_exams: selectedExams.length > 0 ? selectedExams : ['ENARE'],
        target_cutoff_percentage: cutoffPercentage,
        target_year: targetYear,
        onboarding_completed: true,
      });

      try {
        confetti({
          particleCount: 100,
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
      }, 1000);
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
            Configuração inicial para calibrar seus objetivos, bancas e notas de corte desejadas.
          </p>
        </div>

        {/* Indicador de Passos */}
        <div className="flex items-center justify-center space-x-3 text-xs font-semibold">
          <div
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full border transition-all ${
              step === 1
                ? 'border-primary bg-primary/10 text-primary font-bold'
                : step > 1
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-border text-muted-foreground'
            }`}
          >
            <span>1. Especialidade</span>
          </div>
          <div className="w-4 h-0.5 bg-border" />
          <div
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full border transition-all ${
              step === 2
                ? 'border-primary bg-primary/10 text-primary font-bold'
                : step > 2
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-border text-muted-foreground'
            }`}
          >
            <span>2. Provas Alvo</span>
          </div>
          <div className="w-4 h-0.5 bg-border" />
          <div
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full border transition-all ${
              step === 3
                ? 'border-primary bg-primary/10 text-primary font-bold'
                : 'border-border text-muted-foreground'
            }`}
          >
            <span>3. Meta de Corte</span>
          </div>
        </div>

        <Card className="border-border shadow-2xl">
          {/* PASSO 1: Especialidade Alvo */}
          {step === 1 && (
            <>
              <CardHeader>
                <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
                  <Target className="h-4 w-4" /> Passo 1 de 3
                </div>
                <CardTitle className="text-xl">Qual é a sua especialidade alvo?</CardTitle>
                <CardDescription>
                  Selecione a área médica em que você deseja ingressar na residência.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COMMON_SPECIALTIES.map(esp => {
                    const isSelected = selectedSpecialty === esp;
                    return (
                      <button
                        key={esp}
                        type="button"
                        onClick={() => {
                          setSelectedSpecialty(esp);
                          setCustomSpecialty('');
                        }}
                        className={`text-xs p-3 rounded-xl border text-left font-semibold transition-all ${
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]'
                            : 'border-border bg-card hover:bg-muted/70 text-foreground'
                        }`}
                      >
                        {esp}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setSelectedSpecialty('OUTRA')}
                    className={`text-xs p-3 rounded-xl border text-left font-semibold transition-all ${
                      selectedSpecialty === 'OUTRA'
                        ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]'
                        : 'border-border bg-card hover:bg-muted/70 text-muted-foreground'
                    }`}
                  >
                    Outra especialidade...
                  </button>
                </div>

                {selectedSpecialty === 'OUTRA' && (
                  <div className="pt-2 animate-in fade-in">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Digite o nome da sua especialidade
                    </label>
                    <Input
                      type="text"
                      placeholder="Ex: Mastologia, Medicina Esportiva, Angiologia..."
                      value={customSpecialty}
                      onChange={e => setCustomSpecialty(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end pt-4 border-t border-border">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!selectedSpecialty || (selectedSpecialty === 'OUTRA' && !customSpecialty.trim())}
                  className="gap-2 font-bold"
                >
                  Avançar para Provas <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </>
          )}

          {/* PASSO 2: Provas Alvo */}
          {step === 2 && (
            <>
              <CardHeader>
                <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
                  <GraduationCap className="h-4 w-4" /> Passo 2 de 3
                </div>
                <CardTitle className="text-xl">Quais provas e bancas você prestará?</CardTitle>
                <CardDescription>
                  Selecione todas as instituições em que você planeja prestar exame (você pode selecionar mais de uma).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {COMMON_EXAMS.map(exam => {
                    const isSelected = selectedExams.includes(exam);
                    return (
                      <button
                        key={exam}
                        type="button"
                        onClick={() => toggleExam(exam)}
                        className={`text-xs px-3.5 py-2 rounded-xl border font-bold transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                            : 'border-border bg-card hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        {isSelected && '✓ '} {exam}
                      </button>
                    );
                  })}
                </div>

                {/* Adicionar outra banca */}
                <div className="pt-2 flex gap-2">
                  <Input
                    type="text"
                    placeholder="Adicionar outra banca (ex: IAMSPE, SES-PE)..."
                    value={customExam}
                    onChange={e => setCustomExam(e.target.value)}
                    className="text-xs h-9"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCustomExam}
                    disabled={!customExam.trim()}
                    className="text-xs shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Selecionadas ({selectedExams.length}):{' '}
                  <span className="font-semibold text-foreground">
                    {selectedExams.join(', ') || 'Nenhuma selecionada'}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-4 border-t border-border">
                <Button variant="ghost" onClick={() => setStep(1)} className="gap-1.5 text-xs">
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={selectedExams.length === 0}
                  className="gap-2 font-bold"
                >
                  Avançar para Nota de Corte <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </>
          )}

          {/* PASSO 3: Meta de Corte e Ano */}
          {step === 3 && (
            <>
              <CardHeader>
                <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
                  <Percent className="h-4 w-4" /> Passo 3 de 3
                </div>
                <CardTitle className="text-xl">Qual é a sua meta de nota de corte?</CardTitle>
                <CardDescription>
                  Defina o percentual de acerto que você deseja alcançar como referência nos simulados e nas revisões.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Seletor de Ano */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" /> Ano da Prova de Residência
                  </label>
                  <div className="grid grid-cols-2 gap-3 max-w-xs">
                    {[2026, 2027].map(year => (
                      <button
                        key={year}
                        type="button"
                        onClick={() => setTargetYear(year)}
                        className={`p-2.5 rounded-xl border text-sm font-bold transition-all ${
                          targetYear === year
                            ? 'border-primary bg-primary text-primary-foreground shadow-md'
                            : 'border-border bg-card hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        Concurso {year}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slider / Seletor de Meta de Corte */}
                <div className="space-y-3">
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
                    <span className="text-emerald-400 font-semibold">90%+ (Top Especialidades)</span>
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
                        ? 'Excelente para especialidades de acesso direto concorridíssimas (Dermatologia, Oftalmologia, Anestesiologia na USP/ENARE).'
                        : cutoffPercentage >= 80
                        ? 'Faixa de nota segura para aprovação na grande maioria dos programas das principais faculdades do Brasil.'
                        : 'Ritmo inicial ideal para consolidar os temas fundamentais das 5 Grandes Áreas antes da reta final.'}
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
