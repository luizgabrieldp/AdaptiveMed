import { TopicReview, StudyTopic } from '@/types/database';
import { addDaysToDate, getTodayDateString } from '@/lib/spaced-repetition';

/**
 * Escape conforme RFC 5545 (seção 3.3.11 Text) para prevenir iCalendar Injection:
 * remove caracteres de controle e escapa \, ;, , e quebras de linha.
 */
export function escapeICalText(raw: string | null | undefined): string {
  return String(raw ?? '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

function isValidIsoDateDigits(digits: string): boolean {
  if (!/^\d{8}$/.test(digits)) return false;
  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));
  if (year < 1970 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const dt = new Date(Date.UTC(year, month - 1, day));
  return (
    dt.getUTCFullYear() === year &&
    dt.getUTCMonth() === month - 1 &&
    dt.getUTCDate() === day
  );
}

export function generateICalendarFile(
  topics: StudyTopic[],
  reviews: TopicReview[],
  daysAhead: number = 60
): string {
  const today = getTodayDateString();
  const todayDigits = today.replace(/[^0-9]/g, '').slice(0, 8);
  const maxDate = addDaysToDate(today, daysAhead);

  const topicMap = new Map<string, StudyTopic>();
  topics.forEach(t => topicMap.set(t.id, t));

  const upcomingReviews = reviews.filter(
    r => !r.completed_date && typeof r.scheduled_date === 'string' && r.scheduled_date <= maxDate
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

  upcomingReviews.forEach((rev, index) => {
    const topic = topicMap.get(rev.topic_id);
    const subjectName = escapeICalText(topic?.subject_name || 'Assunto de Residência');
    const area = escapeICalText(topic?.area || 'Medicina');
    const safeId = String(rev.id ?? '').replace(/[^a-zA-Z0-9_-]/g, '') || `rev-${index + 1}`;

    const rawDateDigits = String(rev.scheduled_date ?? '').replace(/[^0-9]/g, '').slice(0, 8);
    const dateFormatted = isValidIsoDateDigits(rawDateDigits) ? rawDateDigits : todayDigits;
    const safeIsoDate = `${dateFormatted.slice(0, 4)}-${dateFormatted.slice(4, 6)}-${dateFormatted.slice(6, 8)}`;
    const nextDayDigits = addDaysToDate(safeIsoDate, 1).replace(/[^0-9]/g, '').slice(0, 8);
    const nextDay = isValidIsoDateDigits(nextDayDigits) ? nextDayDigits : dateFormatted;
    const parsedRevNum = Number(rev.review_number);
    const safeRevNum =
      Number.isFinite(parsedRevNum) && parsedRevNum > 0 ? Math.trunc(parsedRevNum) : 1;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:adaptivemed-rev-${safeId}@adaptivemed.app`);
    lines.push(`DTSTAMP:${dateFormatted}T000000Z`);
    lines.push(`DTSTART;VALUE=DATE:${dateFormatted}`);
    lines.push(`DTEND;VALUE=DATE:${nextDay}`);
    lines.push(`SUMMARY:[R${safeRevNum}] ${subjectName} (${area})`);
    lines.push(
      `DESCRIPTION:Ciclo de Repetição Espaçada Adaptativa R${safeRevNum} do AdaptiveMed.\\nAssunto: ${subjectName}\\nGrande Área: ${area}\\nAgendado pelo algoritmo adaptativo de fixação de memória.`
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
