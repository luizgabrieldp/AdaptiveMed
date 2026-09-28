// Teste de validação rigorosa do algoritmo adaptativo e regras de negócio

function normalizePercentage(percentage) {
  if (percentage <= 1 && percentage > 0) {
    return Math.round(percentage * 100 * 10) / 10;
  }
  return Math.round(percentage * 10) / 10;
}

function calculateNextReviewInterval(percentage, reviewNumber) {
  const normPct = normalizePercentage(percentage);

  if (reviewNumber <= 1) {
    if (normPct < 60) return 3;
    if (normPct <= 65) return 10;
    if (normPct <= 70) return 13;
    if (normPct <= 80) return 20;
    return 23;
  }

  // reviewNumber >= 2
  if (normPct < 60) return 7;
  if (normPct <= 65) return 13;
  if (normPct <= 70) return 18;
  if (normPct <= 80) return 25;
  return 30;
}

const testCases = [
  // Ciclo R1
  { pct: 55, r: 1, expected: 3 },
  { pct: 60, r: 1, expected: 10 },
  { pct: 64.5, r: 1, expected: 10 },
  { pct: 65, r: 1, expected: 10 },
  { pct: 66, r: 1, expected: 13 },
  { pct: 70, r: 1, expected: 13 },
  { pct: 71, r: 1, expected: 20 },
  { pct: 80, r: 1, expected: 20 },
  { pct: 85, r: 1, expected: 23 },
  { pct: 100, r: 1, expected: 23 },

  // Ciclos R2 a R8
  { pct: 55, r: 2, expected: 7 },
  { pct: 60, r: 2, expected: 13 },
  { pct: 65, r: 2, expected: 13 },
  { pct: 68, r: 3, expected: 18 },
  { pct: 70, r: 4, expected: 18 },
  { pct: 75, r: 5, expected: 25 },
  { pct: 80, r: 6, expected: 25 },
  { pct: 82, r: 7, expected: 30 },
  { pct: 95, r: 8, expected: 30 },
];

let passed = 0;
for (const tc of testCases) {
  const result = calculateNextReviewInterval(tc.pct, tc.r);
  if (result === tc.expected) {
    passed++;
  } else {
    console.error(`Falha no caso: pct=${tc.pct}%, R${tc.r} -> esperado ${tc.expected}, obtido ${result}`);
    process.exit(1);
  }
}

console.log(`Todos os ${passed} testes de intervalo adaptativo passaram com 100% de sucesso!`);
