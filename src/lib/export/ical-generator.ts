import { TopicReview, StudyTopic } from '@/types/database';
import { addDaysToDate, getTodayDateString } from '@/lib/spaced-repetition';

export function generateICalendarFile(
  topics: StudyTopic[],
  reviews: TopicReview[],
  daysAhead: number = 60
): string {
  const today = getTodayDateString();
  const maxDate = addDaysToDate(today, daysAhead);

  const topicMap = new Map<string, StudyTopic>();
  topics.forEach(t => topicMap.set(t.id, t));

  // Filtra revisões pendentes com scheduled_date <= maxDate
  const upcomingReviews = reviews.filter(
    r => !r.completed_date && r.scheduled_date <= maxDate
  );

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AdaptiveMed//Cronograma de Repetição Espaçada//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:AdaptiveMed - Revisões de Residência Médica',
    'X-WR-TIMEZONE:America/Sao_Paulo',
  ];

  upcomingReviews.forEach(rev => {
    const topic = topicMap.get(rev.topic_id);
    const subjectName = topic?.subject_name || 'Assunto de Residência';
    const area = topic?.area || 'Medicina';

    const dateFormatted = rev.scheduled_date.replace(/-/g, '');
    const nextDay = addDaysToDate(rev.scheduled_date, 1).replace(/-/g, '');

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:adaptivemed-rev-${rev.id}@adaptivemed.app`);
    lines.push(`DTSTAMP:${dateFormatted}T000000Z`);
    lines.push(`DTSTART;VALUE=DATE:${dateFormatted}`);
    lines.push(`DTEND;VALUE=DATE:${nextDay}`);
    lines.push(`SUMMARY:[R${rev.review_number}] ${subjectName} (${area})`);
    lines.push(
      `DESCRIPTION:Ciclo de Repetição Espaçada Adaptativa R${rev.review_number} do AdaptiveMed.\\nAssunto: ${subjectName}\\nGrande Área: ${area}\\nAgendado pelo algoritmo adaptativo de fixação de memória.`
    );
    lines.push('STATUS:CONFIRMED');
    lines.push('TRANSP:TRANSPARENT');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadICalendar(topics: StudyTopic[], reviews: TopicReview[]): void {
  const content = generateICalendarFile(topics, reviews);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `adaptivemed_cronograma_${getTodayDateString()}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
