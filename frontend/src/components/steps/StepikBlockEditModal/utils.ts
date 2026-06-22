import type { MatchingPairEdit } from './types';

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function makeMatchingPairsUnique(pairs: MatchingPairEdit[]): MatchingPairEdit[] {
  const usedFirst = new Set<string>();
  const usedSecond = new Set<string>();
  return pairs.map((p) => {
    const firstBase = (p.first ?? '').trim();
    const secondBase = (p.second ?? '').trim();
    let first = firstBase;
    let key = first.toLowerCase();
    let n = 2;
    while (usedFirst.has(key)) {
      first = firstBase + ` (${n})`;
      key = first.toLowerCase();
      n++;
    }
    usedFirst.add(key);
    let second = secondBase;
    key = second.toLowerCase();
    n = 2;
    while (usedSecond.has(key)) {
      second = secondBase + ` (${n})`;
      key = second.toLowerCase();
      n++;
    }
    usedSecond.add(key);
    return { first, second };
  });
}
