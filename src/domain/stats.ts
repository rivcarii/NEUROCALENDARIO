import type { Episode } from '../db/types';
import { addDays, durationMinutes, isoToLocalDateKey, startOfWeek } from './time';

export interface EpisodeStats {
  count: number;
  withDuration: number;
  totalMinutes: number;
  avgMinutes: number | null;
  medianMinutes: number | null;
  maxMinutes: number | null;
  withIntensity: number;
  avgIntensity: number | null;
  maxIntensity: number | null;
  byKind: { kind: string; count: number }[];
  /** Episodios por semana (lunes) dentro del período. */
  perWeek: { weekStart: string; count: number }[];
  /** 0 = lunes … 6 = domingo. */
  byWeekday: number[];
  /** Intensidad media por semana, solo semanas con datos. */
  intensityPerWeek: { weekStart: string; avg: number }[];
  daysWithEpisodes: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Estadísticas DESCRIPTIVAS. No infieren causas ni correlaciones.
 * `fromKey`/`toKey` son AAAA-MM-DD locales (ambos inclusivos).
 */
export function computeEpisodeStats(episodes: Episode[], fromKey: string, toKey: string): EpisodeStats {
  const inRange = episodes.filter((e) => {
    const k = isoToLocalDateKey(e.startedAt);
    return k >= fromKey && k <= toKey;
  });
  const durs = inRange
    .map((e) => durationMinutes(e.startedAt, e.endedAt))
    .filter((d): d is number => d !== null)
    .sort((a, b) => a - b);
  const ints = inRange.map((e) => e.intensity).filter((i): i is number => i !== null);

  const kinds = new Map<string, number>();
  for (const e of inRange) kinds.set(e.kind, (kinds.get(e.kind) ?? 0) + 1);

  const weeks = new Map<string, { n: number; sum: number; k: number }>();
  for (let w = startOfWeek(fromKey); w <= toKey; w = addDays(w, 7)) weeks.set(w, { n: 0, sum: 0, k: 0 });
  const byWeekday = [0, 0, 0, 0, 0, 0, 0];
  const days = new Set<string>();
  for (const e of inRange) {
    const key = isoToLocalDateKey(e.startedAt);
    days.add(key);
    const w = weeks.get(startOfWeek(key));
    if (w) {
      w.n += 1;
      if (e.intensity !== null) { w.sum += e.intensity; w.k += 1; }
    }
    const dow = (new Date(e.startedAt).getDay() + 6) % 7;
    byWeekday[dow] = (byWeekday[dow] ?? 0) + 1;
  }

  const median = durs.length === 0 ? null
    : durs.length % 2 === 1 ? durs[(durs.length - 1) / 2]!
    : (durs[durs.length / 2 - 1]! + durs[durs.length / 2]!) / 2;
  const total = durs.reduce((a, b) => a + b, 0);

  return {
    count: inRange.length,
    withDuration: durs.length,
    totalMinutes: total,
    avgMinutes: durs.length ? round1(total / durs.length) : null,
    medianMinutes: median,
    maxMinutes: durs.length ? durs[durs.length - 1]! : null,
    withIntensity: ints.length,
    avgIntensity: ints.length ? round1(ints.reduce((a, b) => a + b, 0) / ints.length) : null,
    maxIntensity: ints.length ? Math.max(...ints) : null,
    byKind: [...kinds].map(([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count || a.kind.localeCompare(b.kind)),
    perWeek: [...weeks].map(([weekStart, v]) => ({ weekStart, count: v.n })),
    byWeekday,
    intensityPerWeek: [...weeks].filter(([, v]) => v.k > 0).map(([weekStart, v]) => ({ weekStart, avg: round1(v.sum / v.k) })),
    daysWithEpisodes: days.size,
  };
}
