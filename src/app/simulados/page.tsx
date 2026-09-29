'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MockExamsSection } from '@/components/exams/mock-exams-section';
import { InstitutionExamsSection } from '@/components/exams/institution-exams-section';
import { Button } from '@/components/ui/button';
import { useData } from '@/lib/store/data-context';
import { GraduationCap } from 'lucide-react';

export default function SimuladosPage() {
  const { mockExams, institutionExams } = useData();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header da Tela */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Hub de Simulados & Provas
              </h1>
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Gestão de desempenho em simulados nacionais e evolução histórica em provas na íntegra de bancas.
            </p>
          </div>
        </div>

        {/* Abas: Simulados Gerais vs Provas por Instituição */}
        <Tabs defaultValue="simulados" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="simulados">Simulados Gerais</TabsTrigger>
            <TabsTrigger value="instituicoes">Provas por Instituição</TabsTrigger>
          </TabsList>

          <TabsContent value="simulados">
            <MockExamsSection />
          </TabsContent>

          <TabsContent value="instituicoes">
            <InstitutionExamsSection />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
