import { StudyTopic, TopicReview, MockExam, InstitutionExam } from '@/types/database';
import { getTodayDateString, formatDateBR } from '@/lib/spaced-repetition';

export function exportTopicsAndReviewsToCSV(
  topics: StudyTopic[],
  reviews: TopicReview[]
): void {
  const topicMap = new Map<string, StudyTopic>();
  topics.forEach(t => topicMap.set(t.id, t));

  const headers = [
    'Grande Área',
    'Nome do Assunto',
    'Data Contato Inicial',
    'Questões Iniciais',
    'Acertos Iniciais',
    'Percentual Inicial (%)',
    'Ciclo da Revisão',
    'Data Programada',
    'Data Conclusão',
    'Questões Feitas',
    'Acertos na Revisão',
    'Percentual na Revisão (%)',
  ];

  const rows: string[][] = [];

  topics.forEach(topic => {
    const topicReviews = reviews
      .filter(r => r.topic_id === topic.id)
      .sort((a, b) => a.review_number - b.review_number);

    if (topicReviews.length === 0) {
      rows.push([
        `"${topic.area}"`,
        `"${topic.subject_name.replace(/"/g, '""')}"`,
        formatDateBR(topic.initial_date),
        String(topic.initial_questions),
        String(topic.initial_correct),
        String(topic.initial_percentage),
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
      ]);
    } else {
      topicReviews.forEach(r => {
        rows.push([
          `"${topic.area}"`,
          `"${topic.subject_name.replace(/"/g, '""')}"`,
          formatDateBR(topic.initial_date),
          String(topic.initial_questions),
          String(topic.initial_correct),
          String(topic.initial_percentage),
          `R${r.review_number}`,
          formatDateBR(r.scheduled_date),
          r.completed_date ? formatDateBR(r.completed_date) : 'Pendente',
          r.questions_done !== null ? String(r.questions_done) : '-',
          r.questions_correct !== null ? String(r.questions_correct) : '-',
          r.percentage !== null ? String(r.percentage) : '-',
        ]);
      });
    }
  });

  const csvContent =
    '\uFEFF' +
    [headers.join(';'), ...rows.map(row => row.join(';'))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `adaptivemed_revisoes_${getTodayDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportExamsToCSV(
  mockExams: MockExam[],
  institutionExams: InstitutionExam[]
): void {
  const headers = ['Tipo', 'Nome / Instituição', 'Data / Ano', 'Questões Totais', 'Acertos', 'Percentual (%)'];
  const rows: string[][] = [];

  mockExams.forEach(m => {
    rows.push([
      'Simulado Geral',
      `"${m.exam_name.replace(/"/g, '""')}"`,
      formatDateBR(m.exam_date),
      String(m.total_questions),
      String(m.correct_answers),
      String(m.score_percentage),
    ]);
  });

  institutionExams.forEach(i => {
    rows.push([
      'Prova de Instituição',
      `"${i.institution_name.replace(/"/g, '""')}"`,
      String(i.exam_year),
      '-',
      '-',
      String(i.score_percentage),
    ]);
  });

  const csvContent =
    '\uFEFF' +
    [headers.join(';'), ...rows.map(row => row.join(';'))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `adaptivemed_simulados_${getTodayDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
