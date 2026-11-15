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
  computeRebalancedSchedule,
} from '../src/lib/spaced-repetition';
import { sanitizeCsvCell } from '../src/lib/export/csv-generator';
import { escapeICalText, generateICalendarFile } from '../src/lib/export/ical-generator';
import {
  calculateFocusOutcome,
  collectFinalErrorDrafts,
  createInitialQuickErrorState,
  getLastStudiedMinutesForTopic,
  getTopicCurrentMomentLabel,
  getTreeGrowthStage,
  formatSecondsHMS,
  formatDurationCompact,
  createDefaultForestGarden,
  getNurserySlotProgress,
  getBoostWallet,
  applyBoostToGarden,
  STAGE_BLOCK_SECONDS,
  FULL_TREE_SECONDS,
} from '../src/lib/focus-timer';
import type { StudySession, StudyTopic, TopicReview } from '../src/types/database';

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

test('computeRebalancedSchedule redistribui atrasados respeitando cota diária e ordem cronológica', () => {
  const ref = '2026-06-15';
  const mkRev = (id: string, scheduled_date: string, completed_date: string | null = null): TopicReview => ({
    id,
    topic_id: 't1',
    user_id: 'u1',
    review_number: 1,
    scheduled_date,
    completed_date,
    questions_done: completed_date ? 20 : null,
    questions_correct: completed_date ? 16 : null,
    percentage: completed_date ? 80 : null,
    created_at: '2026-06-01T00:00:00Z',
  });

  const mockReviews: TopicReview[] = [
    mkRev('done', '2026-06-05', '2026-06-05'),
    mkRev('today-1', ref),
    mkRev('future-1', '2026-06-16'),
    mkRev('future-2', '2026-06-16'),
    mkRev('over-old', '2026-06-08'),
    mkRev('over-mid', '2026-06-10'),
    mkRev('over-new', '2026-06-14'),
  ];

  // Cota máxima = 2/dia. Hoje já tem 1 ('today-1'), amanhã (16) já tem 2 ('future-1', 'future-2').
  // Então 'over-old' vai para 2026-06-15 (completa cota 2),
  // 2026-06-16 já está lotado (2/2), então 'over-mid' e 'over-new' vão para 2026-06-17!
  const updates = computeRebalancedSchedule(mockReviews, 2, ref);
  assert.equal(updates.length, 3);
  assert.deepEqual(updates, [
    { reviewId: 'over-old', newScheduledDate: '2026-06-15' },
    { reviewId: 'over-mid', newScheduledDate: '2026-06-17' },
    { reviewId: 'over-new', newScheduledDate: '2026-06-17' },
  ]);

  // Lista sem atrasos retorna []
  assert.deepEqual(
    computeRebalancedSchedule([mkRev('f', '2026-06-20')], 2, ref),
    []
  );
});

test('calculateFocusOutcome, getTreeGrowthStage e formatters de foco funcionam corretamente', () => {
  // Menos de 60s não deve registrar
  assert.deepEqual(calculateFocusOutcome('pomodoro', 45, 1500), {
    status: 'withered',
    treesEarned: 0,
    shouldRecord: false,
  });

  // Pomodoro 25 min concluído = 1 árvore
  assert.deepEqual(calculateFocusOutcome('pomodoro', 1500, 1500), {
    status: 'completed',
    treesEarned: 1,
    shouldRecord: true,
  });

  // Pomodoro 50 min concluído = 2 árvores
  assert.deepEqual(calculateFocusOutcome('pomodoro', 3000, 3000), {
    status: 'completed',
    treesEarned: 2,
    shouldRecord: true,
  });

  // Pomodoro interrompido com >= 60s = galho seco
  assert.deepEqual(calculateFocusOutcome('pomodoro', 600, 1500), {
    status: 'withered',
    treesEarned: 0,
    shouldRecord: true,
  });

  // Cronômetro livre 20 min = completa horas sem galho seco (0 árvores)
  assert.deepEqual(calculateFocusOutcome('stopwatch', 1200, null), {
    status: 'completed',
    treesEarned: 0,
    shouldRecord: true,
  });

  // Cronômetro livre 55 min = 2 árvores completas (50 min)
  assert.deepEqual(calculateFocusOutcome('stopwatch', 3300, null), {
    status: 'completed',
    treesEarned: 2,
    shouldRecord: true,
  });

  assert.equal(getTreeGrowthStage(0.1), 'seed');
  assert.equal(getTreeGrowthStage(0.4), 'sprout');
  assert.equal(getTreeGrowthStage(0.6), 'sapling');
  assert.equal(getTreeGrowthStage(0.85), 'mature');

  assert.equal(formatSecondsHMS(65), '01:05');
  assert.equal(formatSecondsHMS(3665), '01:01:05');
  assert.equal(formatDurationCompact(5400), '1h 30min');
});

test('Viveiro paralelo de 3 plantas (4x25min) e Boosts por Questões funcionam corretamente', () => {
  let garden = createDefaultForestGarden(['Clínica Médica', 'Cirurgia Geral', 'Pediatria']);
  assert.equal(garden.slots.length, 3);
  assert.equal(FULL_TREE_SECONDS, 4 * STAGE_BLOCK_SECONDS);

  // 55 questões = 5 Água (10q), 2 Adubos (25q), 1 Abelha (50q)
  const wallet = getBoostWallet(55, garden.boostsSpent);
  assert.deepEqual(wallet.available, { water: 5, fertilizer: 2, bees: 1 });

  // Aplica Adubo (+25 min) no canteiro 0 -> vai para Estágio 2 (1500s)
  const resFert = applyBoostToGarden(garden, 55, 'fertilizer', 0, '2026-11-13', 1000);
  assert.equal(resFert.applied, true);
  assert.equal(resFert.harvestedCount, 0);
  assert.equal(resFert.nextGarden.slots[0].accumulatedSeconds, 1500);
  assert.equal(getNurserySlotProgress(resFert.nextGarden.slots[0].accumulatedSeconds).stageNumber, 2);

  // Aplica Enxame de Abelhas (+25 min em TODOS os 3 canteiros!)
  const resBees = applyBoostToGarden(resFert.nextGarden, 55, 'bees', 0, '2026-11-13', 2000);
  assert.equal(resBees.applied, true);
  assert.equal(resBees.nextGarden.slots[0].accumulatedSeconds, 3000); // Estágio 3
  assert.equal(resBees.nextGarden.slots[1].accumulatedSeconds, 1500); // Estágio 2
  assert.equal(resBees.nextGarden.slots[2].accumulatedSeconds, 1500); // Estágio 2

  // Mais 2 Adubos no canteiro 0 (3000 + 3000 = 6000s) -> colhe 1 árvore madura para floresta e zera canteiro 0
  let step = applyBoostToGarden(resBees.nextGarden, 100, 'fertilizer', 0, '2026-11-13', 3000);
  assert.equal(step.nextGarden.slots[0].accumulatedSeconds, 4500);
  step = applyBoostToGarden(step.nextGarden, 100, 'fertilizer', 0, '2026-11-13', 4000);
  assert.equal(step.harvestedCount, 1);
  assert.equal(step.nextGarden.slots[0].accumulatedSeconds, 0);
  assert.equal(step.nextGarden.maturedTrees.length, 1);
  assert.equal(step.nextGarden.maturedTrees[0].area, 'Clínica Médica');
});

test('getTopicCurrentMomentLabel retorna R0 para planejado, menor revisão pendente ou Concluído (R8)', () => {
  assert.equal(getTopicCurrentMomentLabel({ id: 't1', is_planned: true }, []), 'R0');

  const reviewsMixed: Array<Pick<TopicReview, 'topic_id' | 'review_number' | 'completed_date'>> = [
    { topic_id: 't2', review_number: 1, completed_date: '2026-11-10' },
    { topic_id: 't2', review_number: 3, completed_date: null },
    { topic_id: 't2', review_number: 2, completed_date: null },
  ];
  assert.equal(getTopicCurrentMomentLabel({ id: 't2', is_planned: false }, reviewsMixed), 'R2');

  const reviewsAllDone: Array<Pick<TopicReview, 'topic_id' | 'review_number' | 'completed_date'>> = [
    { topic_id: 't3', review_number: 1, completed_date: '2026-11-10' },
    { topic_id: 't3', review_number: 2, completed_date: '2026-11-14' },
  ];
  assert.equal(
    getTopicCurrentMomentLabel({ id: 't3', is_planned: false }, reviewsAllDone),
    'Concluído (R8)'
  );
});

test('getLastStudiedMinutesForTopic puxa última sessão finalizada (>=60s) hoje e prioriza topic_id', () => {
  const baseSession = (
    id: string,
    overrides: Partial<StudySession>
  ): StudySession => ({
    id,
    user_id: 'u1',
    area: 'Medicina Preventiva',
    mode: 'stopwatch',
    duration_seconds: 1500,
    started_at: '2026-11-15T10:00:00Z',
    ended_at: '2026-11-15T10:25:00Z',
    session_date: '2026-11-15',
    status: 'completed',
    trees_earned: 1,
    created_at: '2026-11-15T10:25:00Z',
    ...overrides,
  });

  const sessions: StudySession[] = [
    // Ontem: deve ser ignorada
    baseSession('old', {
      topic_id: 'ofidismo',
      duration_seconds: 3600,
      session_date: '2026-11-14',
      ended_at: '2026-11-14T18:00:00Z',
    }),
    // Menor que 60s hoje: deve ser ignorada
    baseSession('tiny', {
      topic_id: 'ofidismo',
      duration_seconds: 45,
      ended_at: '2026-11-15T15:00:00Z',
    }),
    // Sessão mais antiga de hoje para o assunto (20 min)
    baseSession('s1', {
      topic_id: 'ofidismo',
      duration_seconds: 1200,
      ended_at: '2026-11-15T11:00:00Z',
    }),
    // Sessão mais recente de hoje para o assunto (32 min) -> deve vencer!
    baseSession('s2', {
      topic_id: 'ofidismo',
      duration_seconds: 1920,
      ended_at: '2026-11-15T14:00:00Z',
    }),
    // Sessão geral da mesma área sem assunto fixo (40 min) -> usada só quando topicId não casa
    baseSession('area-only', {
      topic_id: undefined,
      duration_seconds: 2400,
      ended_at: '2026-11-15T14:30:00Z',
    }),
  ];

  const byTopic = getLastStudiedMinutesForTopic(sessions, 'ofidismo', 'Medicina Preventiva', '2026-11-15');
  assert.equal(byTopic?.minutes, 32);
  assert.equal(byTopic?.session.id, 's2');

  const byAreaFallback = getLastStudiedMinutesForTopic(sessions, 'outro-assunto', 'Medicina Preventiva', '2026-11-15');
  assert.equal(byAreaFallback?.minutes, 40);
  assert.equal(byAreaFallback?.session.id, 'area-only');

  const noMatch = getLastStudiedMinutesForTopic(sessions, 'outro-assunto', 'Pediatria', '2026-11-15');
  assert.equal(noMatch, null);
});

test('collectFinalErrorDrafts preserva rascunhos adicionados e linha pendente sem perder dados', () => {
  const state = createInitialQuickErrorState();
  state.drafts = [
    {
      localId: '1',
      cause: 'Pegadinha da banca',
      concept_summary: '  Crotálico causa rabdomiólise e IRA  ',
      question_ref: ' Q10 ',
    },
  ];
  state.pendingCause = 'Lacuna teórica';
  state.pendingSummary = '  Botrópico consome fibrinogênio e causa incoagulabilidade ';
  state.pendingRef = 'ENARE 2024';

  const collected = collectFinalErrorDrafts(state);
  assert.equal(collected.length, 2);
  assert.deepEqual(collected[0], {
    cause: 'Pegadinha da banca',
    concept_summary: 'Crotálico causa rabdomiólise e IRA',
    question_ref: 'Q10',
  });
  assert.deepEqual(collected[1], {
    cause: 'Lacuna teórica',
    concept_summary: 'Botrópico consome fibrinogênio e causa incoagulabilidade',
    question_ref: 'ENARE 2024',
  });
});

console.log(`\nTodos os ${passed} testes passaram com 100% de sucesso!`);
