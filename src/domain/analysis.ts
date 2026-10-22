import type { Episode, Intake, Medication, Schedule } from '../db/types';
import { computeAdherence } from './adherence';
import { addDays, isoToLocalDateKey, localDateKey } from './time';

/**
 * Análisis DESCRIPTIVO de lo que el paciente anotó. No diagnostica.
 * El «semáforo» y el medidor (0–100) son una regla propia de la app, no una escala clínica validada:
 * se apoyan en las bandas de dolor de la escala numérica 0–10 (leve 1–3, moderado 4–6, intenso 7–10)
 * y en los eventos que en los diarios de epilepsia se recomienda vigilar (convulsión, pérdida de conocimiento).
 */

export type Level = 'verde' | 'amarillo' | 'rojo' | 'sin_datos';
export type PainBand = 'sin_dato' | 'leve' | 'moderado' | 'intenso';

export const LEVEL_LABEL: Record<Level, string> = { verde: 'Tranquilo', amarillo: 'Con molestias', rojo: 'Día difícil', sin_datos: 'Sin registros' };
export const LEVEL_COLOR: Record<Level, string> = { verde: '#2E7D4F', amarillo: '#E0A800', rojo: '#C0392B', sin_datos: '#B8C2CC' };
export const PAIN_BAND_LABEL: Record<PainBand, string> = { sin_dato: 'Sin fuerza anotada', leve: 'Leve (1–3)', moderado: 'Moderado (4–6)', intenso: 'Intenso (7–10)' };

export const SEVERE_KINDS = ['Convulsión', 'Desmayo'];
const HEADACHE = 'Dolor de cabeza';

export function painBand(intensity: number | null): PainBand {
  if (intensity === null) return 'sin_dato';
  return intensity <= 3 ? 'leve' : intensity <= 6 ? 'moderado' : 'intenso';
}

export interface AnalysisInput { episodes: Episode[]; medications: Medication[]; schedules: Schedule[]; intakes: Intake[] }

export interface DayStatus {
  dateKey: string;
  level: Level;
  /** 0 (muy mal día) a 100 (sin molestias); null si no hay registros. */
  score: number | null;
  episodes: number;
  maxIntensity: number | null;
  severe: boolean;
  headache: boolean;
  /** Algún síntoma con medicina tomada para aliviarlo (medicación «de rescate»). */
  rescue: boolean;
  taken: number;
  omitted: number;
}

const intakeDay = (i: Intake) => isoToLocalDateKey(i.scheduledAt ?? i.takenAt ?? '1970-01-01T00:00:00Z');

export function levelFromScore(score: number): Exclude<Level, 'sin_datos'> {
  return score >= 80 ? 'verde' : score >= 50 ? 'amarillo' : 'rojo';
}

/** Estado de un día a partir de síntomas (fuerza, cantidad, eventos graves) y tomas omitidas. */
export function dayStatus(dateKey: string, input: AnalysisInput, todayKey: string): DayStatus {
  const eps = input.episodes.filter((e) => isoToLocalDateKey(e.startedAt) === dateKey);
  const ints = input.intakes.filter((i) => i.status !== 'pospuesta' && intakeDay(i) === dateKey);
  const taken = ints.filter((i) => i.status === 'tomada').length;
  const omitted = ints.filter((i) => i.status === 'omitida').length;
  const base = { dateKey, episodes: eps.length, taken, omitted };
  const severe = eps.some((e) => SEVERE_KINDS.includes(e.kind));
  const headache = eps.some((e) => e.kind === HEADACHE);
  const rescue = eps.some((e) => (e.relatedMedicationIds ?? []).length > 0);
  const known = eps.map((e) => e.intensity).filter((n): n is number => n !== null);
  const maxIntensity = known.length ? Math.max(...known) : null;
  if (dateKey > todayKey || (eps.length === 0 && taken === 0 && omitted === 0)) {
    return { ...base, level: 'sin_datos', score: null, maxIntensity, severe, headache, rescue };
  }
  let penalty = 0;
  if (eps.length > 0) {
    const i = maxIntensity ?? 5; // sin fuerza anotada: se supone moderada
    penalty += i <= 3 ? i * 5 : i <= 6 ? i * 7 : i * 9;
    penalty += Math.min(15, (eps.length - 1) * 5);
  }
  if (severe) penalty += 60;
  penalty += Math.min(30, omitted * 10);
  const score = Math.max(0, 100 - penalty);
  return { ...base, level: levelFromScore(score), score, maxIntensity, severe, headache, rescue };
}

export interface Finding {
  tone: 'bien' | 'info' | 'atencion' | 'importante';
  title: string;
  text: string;
  /** Fuente o criterio en el que se apoya. */
  basis: string;
}

export interface PeriodSummary {
  fromKey: string;
  toKey: string;
  days: number;
  tracked: number;
  levels: Record<Level, number>;
  daily: DayStatus[];
  avgScore: number | null;
  overall: Level;
  episodes: number;
  painDays: number;
  headacheDays: number;
  avgIntensity: number | null;
  maxIntensity: number | null;
  bands: Record<PainBand, number>;
  highPainDays: number;
  severeEvents: number;
  /** Días con medicina tomada para un síntoma. */
  rescueDays: number;
  /** Días seguidos sin convulsión ni desmayo al final del período (null si nunca hubo). */
  crisisFreeStreak: number | null;
  topTriggers: { label: string; count: number }[];
  /** Horas de sueño medias anotadas en los síntomas (null si no hay). */
  avgSleep: number | null;
  adherence: { scheduled: number; taken: number; skipped: number; unrecorded: number; pct: number | null };
  partOfDay: { label: string; count: number }[];
  topKinds: { kind: string; count: number }[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;

function partOf(iso: string): string {
  const h = new Date(iso).getHours();
  return h < 6 ? 'Madrugada' : h < 12 ? 'Mañana' : h < 19 ? 'Tarde' : 'Noche';
}

export function summarizePeriod(input: AnalysisInput, fromKey: string, toKey: string, now: Date): PeriodSummary {
  const todayKey = localDateKey(now);
  const daily: DayStatus[] = [];
  for (let d = fromKey; d <= toKey; d = addDays(d, 1)) daily.push(dayStatus(d, input, todayKey));
  const levels: Record<Level, number> = { verde: 0, amarillo: 0, rojo: 0, sin_datos: 0 };
  for (const d of daily) levels[d.level]++;
  const scored = daily.filter((d) => d.score !== null);
  const avgScore = scored.length ? Math.round(scored.reduce((a, d) => a + d.score!, 0) / scored.length) : null;

  const eps = input.episodes.filter((e) => { const k = isoToLocalDateKey(e.startedAt); return k >= fromKey && k <= toKey; });
  const ints = eps.map((e) => e.intensity).filter((n): n is number => n !== null);
  const bands: Record<PainBand, number> = { sin_dato: 0, leve: 0, moderado: 0, intenso: 0 };
  for (const e of eps) bands[painBand(e.intensity)]++;
  const kinds = new Map<string, number>();
  for (const e of eps) kinds.set(e.kind, (kinds.get(e.kind) ?? 0) + 1);
  const parts = new Map<string, number>([['Madrugada', 0], ['Mañana', 0], ['Tarde', 0], ['Noche', 0]]);
  for (const e of eps) parts.set(partOf(e.startedAt), (parts.get(partOf(e.startedAt)) ?? 0) + 1);

  const trig = new Map<string, number>();
  for (const e of eps) for (const tr of e.declaredTriggers ?? []) trig.set(tr, (trig.get(tr) ?? 0) + 1);
  const sleeps = eps.map((e) => e.sleepHours).filter((n): n is number => n !== null && n !== undefined);
  const lastSevere = input.episodes.filter((e) => SEVERE_KINDS.includes(e.kind) && isoToLocalDateKey(e.startedAt) <= toKey)
    .map((e) => isoToLocalDateKey(e.startedAt)).sort().pop();
  const end = toKey < todayKey ? toKey : todayKey;
  let streak: number | null = null;
  if (lastSevere) { streak = 0; for (let d = lastSevere; d < end; d = addDays(d, 1)) streak++; }
  const adh = computeAdherence(input.medications, input.schedules, input.intakes, fromKey, toKey, now);
  const sum = (f: (a: (typeof adh)[number]) => number) => adh.reduce((a, x) => a + f(x), 0);
  const scheduled = sum((a) => a.scheduled), taken = sum((a) => a.taken);

  return {
    fromKey, toKey, days: daily.length, tracked: scored.length, levels, daily, avgScore,
    overall: avgScore === null ? 'sin_datos' : levelFromScore(avgScore),
    episodes: eps.length,
    painDays: daily.filter((d) => d.episodes > 0).length,
    headacheDays: daily.filter((d) => d.headache).length,
    avgIntensity: ints.length ? round1(ints.reduce((a, b) => a + b, 0) / ints.length) : null,
    maxIntensity: ints.length ? Math.max(...ints) : null,
    bands,
    highPainDays: daily.filter((d) => (d.maxIntensity ?? 0) >= 7).length,
    severeEvents: eps.filter((e) => SEVERE_KINDS.includes(e.kind)).length,
    rescueDays: daily.filter((d) => d.rescue).length,
    crisisFreeStreak: streak,
    topTriggers: [...trig].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, 5),
    avgSleep: sleeps.length ? round1(sleeps.reduce((a, b) => a + b, 0) / sleeps.length) : null,
    adherence: { scheduled, taken, skipped: sum((a) => a.skipped), unrecorded: sum((a) => a.unrecorded), pct: scheduled ? Math.round((taken / scheduled) * 100) : null },
    partOfDay: [...parts].map(([label, count]) => ({ label, count })),
    topKinds: [...kinds].map(([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count || a.kind.localeCompare(b.kind)),
  };
}

const B_NRS = 'Escala numérica del dolor 0–10: bandas leve 1–3, moderado 4–6, intenso 7–10; cambio de ≥2 puntos o ≥30 % se considera clínicamente relevante (AAFP; revisión en Ann Palliat Med 2015; IMMPACT).';
const B_ICHD = 'Clasificación Internacional de Cefaleas, 3.ª ed. (ICHD-3, Cephalalgia 2018): cefalea crónica = 15 o más días al mes durante más de 3 meses.';
const B_DIARY = 'Recomendaciones para diarios de crisis (organizaciones de epilepsia): anotar fecha, hora, duración, desencadenantes y recuperación.';
const B_MOH = 'ICHD-3, cefalea por uso excesivo de medicación: tomar analgésicos simples 15 o más días al mes, o triptanes/combinados/opioides 10 o más días al mes, durante más de 3 meses.';
const B_TRIG = 'Diarios de cefalea: registrar desencadenantes ayuda a reconocer patrones; un desencadenante no siempre provoca crisis.';
const B_ADH = 'Umbral convencional de buena adherencia: tomar al menos el 80 % de las dosis.';

/** Hallazgos legibles. `prev` es el período anterior de igual duración (si existe). */
export function findingsFor(cur: PeriodSummary, prev: PeriodSummary | null): Finding[] {
  const out: Finding[] = [];
  const days = cur.days;
  if (cur.tracked < Math.ceil(days / 2) && days >= 5) {
    out.push({ tone: 'info', title: 'Faltan registros', text: `Solo ${cur.tracked} de ${days} días tienen anotaciones. El análisis puede no reflejar cómo estuvo realmente.`, basis: 'Los diarios son útiles si se llenan con constancia.' });
  }
  if (cur.severeEvents > 0) {
    out.push({
      tone: 'importante', title: 'Convulsión o desmayo anotado',
      text: `Se anotaron ${cur.severeEvents} evento(s) de convulsión o pérdida de conocimiento. Cuéntelo al neurólogo con fecha, hora, duración y cómo se recuperó. Si una crisis dura más de 5 minutos o no se recupera, llame a urgencias.`,
      basis: B_DIARY,
    });
  }
  if (days >= 28) {
    const perMonth = Math.round((cur.headacheDays * 30) / days);
    if (perMonth >= 15) {
      out.push({
        tone: 'importante', title: `Dolor de cabeza en unos ${perMonth} días al mes`,
        text: `Hubo dolor de cabeza en ${cur.headacheDays} de ${days} días. Con 15 o más días al mes durante más de 3 meses se habla de cefalea crónica; un solo mes no basta para decirlo, pero conviene comentar este patrón con el médico.`,
        basis: B_ICHD,
      });
    }
  }
  if (days >= 28 && cur.rescueDays > 0) {
    const perMonth = Math.round((cur.rescueDays * 30) / days);
    if (perMonth >= 10) {
      out.push({
        tone: 'atencion', title: `Medicina para el síntoma en unos ${perMonth} días al mes`,
        text: `Se anotó medicina para aliviar un síntoma en ${cur.rescueDays} de ${days} días. Tomar calmantes con mucha frecuencia puede mantener el dolor de cabeza; no cambie nada por su cuenta, coméntelo con el médico.`,
        basis: B_MOH,
      });
    }
  }
  if (cur.topTriggers.length > 0 && cur.episodes >= 3) {
    const tt = cur.topTriggers[0]!;
    if (tt.count >= 2) out.push({ tone: 'info', title: `Posible desencadenante: ${tt.label.toLowerCase()}`, text: `Se anotó en ${tt.count} de ${cur.episodes} síntomas. Es una coincidencia registrada, no prueba que sea la causa.`, basis: B_TRIG });
  }
  if (cur.highPainDays > 0) {
    out.push({
      tone: cur.highPainDays >= 3 ? 'importante' : 'atencion', title: `${cur.highPainDays} día(s) con dolor intenso`,
      text: `En ${cur.highPainDays} día(s) la fuerza llegó a 7 o más de 10 (máximo ${cur.maxIntensity}/10). Anote qué ayudó o empeoró y comuníquelo al médico.`,
      basis: B_NRS,
    });
  }
  if (prev && prev.tracked > 0 && cur.tracked > 0) {
    if (cur.avgIntensity !== null && prev.avgIntensity !== null) {
      const d = round1(cur.avgIntensity - prev.avgIntensity);
      const rel = prev.avgIntensity > 0 ? d / prev.avgIntensity : 0;
      if (d >= 2 || rel >= 0.3) out.push({ tone: 'atencion', title: 'El dolor subió frente al período anterior', text: `La fuerza media pasó de ${prev.avgIntensity} a ${cur.avgIntensity} de 10 (${d > 0 ? '+' : ''}${d}).`, basis: B_NRS });
      else if (d <= -2 || rel <= -0.3) out.push({ tone: 'bien', title: 'El dolor bajó frente al período anterior', text: `La fuerza media pasó de ${prev.avgIntensity} a ${cur.avgIntensity} de 10 (${d}).`, basis: B_NRS });
    }
    if (prev.episodes >= 2 && cur.episodes >= 3 && cur.episodes >= prev.episodes * 1.5) {
      out.push({ tone: 'atencion', title: 'Más síntomas que en el período anterior', text: `Se anotaron ${cur.episodes} síntomas frente a ${prev.episodes} antes.`, basis: 'Comparación descriptiva entre períodos de igual duración.' });
    } else if (prev.episodes >= 3 && cur.episodes <= prev.episodes * 0.5) {
      out.push({ tone: 'bien', title: 'Menos síntomas que en el período anterior', text: `Se anotaron ${cur.episodes} síntomas frente a ${prev.episodes} antes.`, basis: 'Comparación descriptiva entre períodos de igual duración.' });
    }
  }
  const a = cur.adherence;
  if (a.pct !== null && a.pct < 80) {
    out.push({ tone: 'atencion', title: `Tomó el ${a.pct} % de las dosis anotadas`, text: `De ${a.scheduled} dosis programadas: ${a.taken} tomadas, ${a.skipped} no tomadas y ${a.unrecorded} sin anotar. Si hay dificultad para tomarlas, coméntelo con el médico en lugar de suspender por su cuenta.`, basis: B_ADH });
  }
  if (cur.episodes >= 4) {
    const top = [...cur.partOfDay].sort((x, y) => y.count - x.count)[0]!;
    if (top.count / cur.episodes >= 0.5) out.push({ tone: 'info', title: `Suele ocurrir por la ${top.label.toLowerCase()}`, text: `${top.count} de ${cur.episodes} síntomas fueron en ese momento del día. Es un dato descriptivo, no una causa.`, basis: 'Distribución por momento del día de los síntomas anotados.' });
  }
  if (cur.episodes === 0 && cur.tracked >= Math.min(5, days)) {
    out.push({ tone: 'bien', title: 'Período sin síntomas anotados', text: 'No se anotó ningún síntoma en los días con registro.', basis: 'Solo refleja lo anotado.' });
  }
  if (out.length === 0) out.push({ tone: 'info', title: 'Sin alertas', text: 'No se encontraron patrones que destacar con lo anotado.', basis: 'Análisis descriptivo.' });
  return out;
}

export interface PeriodAnalysis { current: PeriodSummary; previous: PeriodSummary; findings: Finding[] }

export function analyzePeriod(input: AnalysisInput, fromKey: string, toKey: string, now: Date): PeriodAnalysis {
  const current = summarizePeriod(input, fromKey, toKey, now);
  const prevTo = addDays(fromKey, -1);
  const previous = summarizePeriod(input, addDays(prevTo, -(current.days - 1)), prevTo, now);
  return { current, previous, findings: findingsFor(current, previous) };
}

export const SOURCES: { text: string; url?: string }[] = [
  { text: 'Escala numérica del dolor (NRS 0–10): bandas y cambio clínicamente relevante — AAFP', url: 'www.aafp.org/pubs/afp/issues/2008/0515/p1457.html' },
  { text: 'Puntos de corte de dolor leve, moderado e intenso: revisión de la literatura — Annals of Palliative Medicine', url: 'apm.amegroups.org/article/view/7959' },
  { text: 'Headache Classification Committee of the IHS. ICHD-3. Cephalalgia 2018;38(1):1–211', url: 'ichd-3.org' },
  { text: 'Diario de cefalea: frecuencia, duración, intensidad 0–10, medicación, desencadenantes y relación con la menstruación — LITFL', url: 'litfl.com/headache-diary/' },
  { text: 'Calendario de crisis mensual con clave por tipo de crisis — Northwestern Medicine', url: 'www.nm.org (Seizure Calendar)' },
  { text: 'Diarios de crisis: qué anotar — Epilepsy Action Australia', url: 'www.epilepsy.org.au/about-epilepsy/understanding-epilepsy/seizure-triggers/' },
];

export const PAIN_SCALE_ROWS: [string, string, string][] = [
  ['0', 'Sin dolor', 'Sin molestia'],
  ['1–3', 'Leve', 'Se nota, pero permite hacer las actividades'],
  ['4–6', 'Moderado', 'Estorba las actividades; cuesta concentrarse'],
  ['7–10', 'Intenso', 'Muy fuerte; impide hacer actividades, 10 = el peor imaginable'],
];
