import assert from 'node:assert/strict';
import { Rating } from 'ts-fsrs';
import {
  normalizePercentage,
  mapAccuracyToFsrsRating,
  computeMaxIntervalForExamHorizon,
  calculateDynamicQuestionVolume,
  calculateNextReview,
  interleaveQueueByArea,
  findNextAvailableDate,
  addDaysToDate,
  diffInDays,
  calculateReviewStatus,
  calculateQualifiedStreak,
} from '../src/lib/spaced-repetition';
import { sanitizeCsvCell } from '../src/lib/export/csv-generator';
import { escapeICalText, generateICalendarFile } from '../src/lib/export/ical-generator';
import type { StudyTopic, TopicReview } from '../src/types/database';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  [PASS] ${name}`);
}

console.log('=== AdaptiveMed: Suite de Testes Reais (FSRS-6, Interleaving, Export Security) ===');

test('normalizePercentage suporta 0-1 e 0-100 e clamp de limites', () => {
  assert.equal(normalizePercentage(0.75), 75);
  assert.equal(normalizePercentage(1), 100);
  assert.equal(normalizePercentage(0), 0);
  assert.equal(normalizePercentage(-10), 0);
  assert.equal(normalizePercentage(120), 100);
  assert.equal(normalizePercentage(82.44), 82.4);
});

test('mapAccuracyToFsrsRating mapeia faixas para Again/Hard/Good/Easy', () => {
  assert.equal(mapAccuracyToFsrsRating(35), Rating.Again);
  assert.equal(mapAccuracyToFsrsRating(49.9), Rating.Again);
  assert.equal(mapAccuracyToFsrsRating(50), Rating.Hard);
  assert.equal(mapAccuracyToFsrsRating(69.9), Rating.Hard);
  assert.equal(mapAccuracyToFsrsRating(70), Rating.Good);
  assert.equal(mapAccuracyToFsrsRating(89.9), Rating.Good);
  assert.equal(mapAccuracyToFsrsRating(90), Rating.Easy);
  assert.equal(mapAccuracyToFsrsRating(100), Rating.Easy);
});

test('computeMaxIntervalForExamHorizon modula pelo horizonte da prova (Cepeda et al., 2008)', () => {
  assert.equal(computeMaxIntervalForExamHorizon(undefined, '2026-05-01'), 75);
  // 2026-05-01 -> 2026-11-15 = 198 dias -> 20% = 40 dias
  const midHorizon = computeMaxIntervalForExamHorizon(2026, '2026-05-01');
  assert.equal(midHorizon, 40);
  // Prova iminente (10 dias antes): piso 14 dias
  const nearHorizon = computeMaxIntervalForExamHorizon(2026, '2026-11-05');
  assert.equal(nearHorizon, 14);
  // Prova já passada: teto curto 21 dias
  const pastHorizon = computeMaxIntervalForExamHorizon(2025, '2026-11-05');
  assert.equal(pastHorizon, 21);
});

test('calculateDynamicQuestionVolume respeita curva em U invertido (pico ~60%, piso 10, teto 30)', () => {
  const low = calculateDynamicQuestionVolume(30, 30);
  const peak = calculateDynamicQuestionVolume(60, 30);
  const high = calculateDynamicQuestionVolume(95, 30);

  assert.ok(peak.volume >= low.volume, 'Pico em 60% deve ser >= volume em 30%');
  assert.ok(peak.volume >= high.volume, 'Pico em 60% deve ser >= volume em 95% (anti-overlearning)');
  assert.ok(low.volume >= 10 && low.volume <= 30);
  assert.ok(peak.volume >= 10 && peak.volume <= 30);
  assert.ok(high.volume >= 10 && high.volume <= 30);
});

test('calculateNextReview (FSRS-6) gera R1 >= 3d para >=50% e 2d corretivo para <50%', () => {
  const lapseR0 = calculateNextReview({
    currentCycle: 0,
    accuracy: 40,
    baseQuestionsCount: 20,
    referenceDate: '2026-06-01',
  });
  assert.equal(lapseR0.nextCycle, 1);
  assert.equal(lapseR0.nextIntervalDays, 2);
  assert.equal(lapseR0.fsrsRating, Rating.Again);

  const goodR0 = calculateNextReview({
    currentCycle: 0,
    accuracy: 80,
    baseQuestionsCount: 20,
    referenceDate: '2026-06-01',
  });
  assert.equal(goodR0.nextCycle, 1);
  assert.ok(goodR0.nextIntervalDays >= 3);
  assert.equal(goodR0.fsrsRating, Rating.Good);
});

test('calculateNextReview desacopla review_number em lapses (sem regressão/colisão)', () => {
  const r3Lapse = calculateNextReview({
    currentCycle: 3,
    accuracy: 35,
    baseQuestionsCount: 25,
    previousIntervalDays: 14,
    actualElapsedDays: 18,
    referenceDate: '2026-06-20',
  });
  assert.equal(r3Lapse.nextCycle, 4, 'review_number deve avançar monotonicamente para R4 mesmo em lapse');
  assert.equal(r3Lapse.nextIntervalDays, 2, 'Lapse deve agendar reteste corretivo em 48h');
  assert.ok(r3Lapse.fsrsState && r3Lapse.fsrsState.lapses >= 1);
});

test('calculateNextReview usa actualElapsedDays e reviewHistory reais', () => {
  const shortElapsed = calculateNextReview({
    currentCycle: 2,
    accuracy: 85,
    baseQuestionsCount: 20,
    actualElapsedDays: 5,
    reviewHistory: [
      { date: '2026-05-01', accuracy: 75 },
      { date: '2026-05-06', accuracy: 80 },
    ],
    referenceDate: '2026-05-11',
  });

  const longElapsed = calculateNextReview({
    currentCycle: 2,
    accuracy: 85,
    baseQuestionsCount: 20,
    actualElapsedDays: 25,
    reviewHistory: [
      { date: '2026-05-01', accuracy: 75 },
      { date: '2026-05-06', accuracy: 80 },
    ],
    referenceDate: '2026-05-31',
  });

  assert.ok(
    longElapsed.nextIntervalDays >= shortElapsed.nextIntervalDays,
    'Maior tempo real decorrido com acerto >=85% deve produzir estabilidade/intervalo >= menor tempo'
  );
});

test('interleaveQueueByArea evita áreas consecutivas idênticas quando há alternativas', () => {
  const queue = [
    { id: '1', area: 'Clínica Médica' },
    { id: '2', area: 'Clínica Médica' },
    { id: '3', area: 'Pediatria' },
    { id: '4', area: 'Cirurgia Geral' },
  ];
  const interleaved = interleaveQueueByArea(queue, i => i.area);
  assert.equal(interleaved.length, 4);
  for (let i = 1; i < interleaved.length; i++) {
    assert.notEqual(
      interleaved[i].area,
      interleaved[i - 1].area,
      'Não deve haver duas áreas iguais consecutivas quando há diversidade'
    );
  }
});

test('findNextAvailableDate respeita cota diária e empurra para próximo dia livre', () => {
  const counts = new Map<string, number>([
    ['2026-06-10', 3],
    ['2026-06-11', 3],
    ['2026-06-12', 1],
  ]);
  const next = findNextAvailableDate('2026-06-10', counts, 3);
  assert.equal(next, '2026-06-12');
  assert.equal(diffInDays(next, '2026-06-10'), 2);
});

test('calculateReviewStatus e calculateQualifiedStreak funcionam em casos de borda', () => {
  assert.equal(calculateReviewStatus('2026-06-08', null, '2026-06-10').status, 'ATRASADO');
  assert.equal(calculateReviewStatus('2026-06-10', null, '2026-06-10').status, 'REVISAR HOJE');
  assert.equal(calculateReviewStatus('2026-06-12', null, '2026-06-10').status, 'PROGRAMADO');
  assert.equal(calculateReviewStatus('2026-06-08', '2026-06-09', '2026-06-10').status, 'CONCLUÍDO');

  const streak = calculateQualifiedStreak(
    [{ initial_date: addDaysToDate('2026-06-10', -1), initial_questions: 12 }],
    [{ completed_date: '2026-06-10', questions_done: 10 }],
    [],
    '2026-06-10'
  );
  assert.equal(streak.currentStreak, 2);
  assert.equal(streak.streakQualifiedToday, true);
});

test('sanitizeCsvCell previne CSV Formula Injection (=, +, -, @, tab, cr)', () => {
  assert.equal(sanitizeCsvCell('=CMD("calc")'), '"\'=CMD(""calc"")"');
  assert.equal(sanitizeCsvCell('+1+1'), '"\'+1+1"');
  assert.equal(sanitizeCsvCell('-2+3'), '"\'-2+3"');
  assert.equal(sanitizeCsvCell('@SUM(A1:A2)'), '"\'@SUM(A1:A2)"');
  assert.equal(sanitizeCsvCell('  =1+1'), '"\'  =1+1"');
  assert.equal(sanitizeCsvCell('Cardiologia'), '"Cardiologia"');
});

test('escapeICalText e generateICalendarFile previnem iCalendar Injection (RFC 5545)', () => {
  const malicious = 'IAM\r\nBEGIN:VEVENT\r\nSUMMARY:HACKED;foo,bar\\baz';
  const escaped = escapeICalText(malicious);
  assert.ok(!escaped.includes('\r') && !escaped.includes('\n'));
  assert.ok(escaped.includes('\\;'));
  assert.ok(escaped.includes('\\,'));
  assert.ok(escaped.includes('\\\\'));

  const topics: StudyTopic[] = [
    {
      id: 't1',
      user_id: 'u1',
      area: 'Clínica Médica',
      subject_name: malicious,
      initial_date: '2026-06-01',
      initial_questions: 20,
      initial_correct: 15,
      initial_percentage: 75,
      created_at: '2026-06-01T00:00:00Z',
    },
  ];
  const reviews: TopicReview[] = [
    {
      id: 'r1',
      topic_id: 't1',
      user_id: 'u1',
      review_number: 1,
      scheduled_date: addDaysToDate(new Date().toISOString().slice(0, 10), 1),
      completed_date: null,
      questions_done: null,
      questions_correct: null,
      percentage: null,
      created_at: '2026-06-01T00:00:00Z',
    },
  ];
  const ics = generateICalendarFile(topics, reviews, 30);
  const eventCount = (ics.match(/^BEGIN:VEVENT$/gm) || []).length;
  assert.equal(eventCount, 1, 'Injeção não pode criar linha BEGIN:VEVENT extra');
});

console.log(`\nTodos os ${passed} testes passaram com 100% de sucesso!`);
