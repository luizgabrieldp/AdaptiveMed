'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { ReviewsTable } from '@/components/reviews/reviews-table';
import { NewTopicModal } from '@/components/dashboard/new-topic-modal';
import { Button } from '@/components/ui/button';
import { useData } from '@/lib/store/data-context';
import { exportTopicsAndReviewsToCSV } from '@/lib/export/csv-generator';
import { downloadICalendar } from '@/lib/export/ical-generator';
import { Plus, Download, Calendar, BookOpen } from 'lucide-react';

export default function RevisoesPage() {
  const { topics, reviews } = useData();
  const [newTopicOpen, setNewTopicOpen] = useState(false);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header da Tela */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Diário de Revisões
              </h1>
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Acompanhe seus assuntos estudados, os 8 ciclos de repetição espaçada e seus status de retenção.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportTopicsAndReviewsToCSV(topics, reviews)}
              className="text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5" /> Exportar CSV
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadICalendar(topics, reviews)}
              className="text-xs gap-1.5"
            >
              <Calendar className="h-3.5 w-3.5 text-blue-400" /> Sincronizar Calendário
            </Button>

            <Button
              onClick={() => setNewTopicOpen(true)}
              size="sm"
              className="text-xs gap-1.5 font-bold shadow-md shadow-primary/20"
            >
              <Plus className="h-4 w-4" /> Registrar Novo Assunto
            </Button>
          </div>
        </div>

        {/* Tabela Interativa Avançada */}
        <ReviewsTable />
      </div>

      <NewTopicModal open={newTopicOpen} onOpenChange={setNewTopicOpen} />
    </AppLayout>
  );
}
