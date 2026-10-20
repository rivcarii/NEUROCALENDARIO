import type { Appointment, Episode, Exam, Intake, Medication, Note, Schedule } from '../db/types';
import { analyzePeriod, LEVEL_LABEL, PAIN_BAND_LABEL, PAIN_SCALE_ROWS, SOURCES, type Finding, type Level } from './analysis';
import { computeAdherence } from './adherence';
import { computeEpisodeStats } from './stats';
import { durationMinutes, formatDateShort, formatDateTime, formatDuration, isoToLocalDateKey } from './time';

export interface ReportSections {
  /** Resumen clínico: semáforo, escala de dolor, comparación y hallazgos. */
  analysis?: boolean;
  episodes: boolean;
  medications: boolean;
  appointments: boolean;
  exams: boolean;
  notes: boolean;
}

export interface ReportInput {
  profileName: string;
  fromKey: string;
  toKey: string;
  generatedAt: Date;
  generatedBy: string;
  sections: ReportSections;
  episodes: Episode[];
  medications: Medication[];
  schedules: Schedule[];
  intakes: Intake[];
  appointments: Appointment[];
  exams: Exam[];
  notes: Note[];
}

export const DISCLAIMER =
  'Este resumen reúne lo que el paciente anotó en la app y no constituye un diagnóstico ni una recomendación médica. ' +
  'Las estadísticas son descriptivas y no demuestran relaciones de causa y efecto. ' +
  'Consulte siempre con un profesional sanitario antes de tomar decisiones sobre el tratamiento.';

/** Modelo del documento: un solo contenido que se dibuja como HTML (teléfono) o como PDF directo (navegador). */
export type Block =
  | { t: 'h1' | 'h2' | 'h3'; text: string }
  | { t: 'p'; text: string; style?: 'muted' | 'warn' }
  | { t: 'kv'; rows: [string, string][] }
  | { t: 'table'; headers: string[]; rows: string[][]; empty?: string }
  | { t: 'bars'; title: string; data: { label: string; value: number }[] }
  | { t: 'strip'; title: string; cells: { label: string; level: Level }[] }
  | { t: 'gauge'; label: string; value: number | null; level: Level }
  | { t: 'finding'; finding: Finding }
  | { t: 'list'; items: string[] };

export function buildReportDoc(r: ReportInput): Block[] {
  const inRange = (key: string) => key >= r.fromKey && key <= r.toKey;
  const eps = r.episodes.filter((e) => inRange(isoToLocalDateKey(e.startedAt))).sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const b: Block[] = [
    { t: 'h1', text: 'Resumen de seguimiento neurológico' },
    { t: 'kv', rows: [
      ['Persona', r.profileName],
      ['Período', `${formatDateShort(r.fromKey)} a ${formatDateShort(r.toKey)}`],
      ['Creado', `${formatDateTime(r.generatedAt.toISOString())} por ${r.generatedBy}`],
    ] },
    { t: 'p', text: DISCLAIMER, style: 'warn' },
  ];

  if (r.sections.analysis) {
    const { current: c, previous: p, findings } = analyzePeriod(r, r.fromKey, r.toKey, r.generatedAt);
    const fmt = (n: number | null, u = '') => (n === null ? 'sin datos' : `${n}${u}`);
    const delta = (a: number | null, z: number | null) => (a === null || z === null ? '—' : `${a - z > 0 ? '+' : ''}${Math.round((a - z) * 10) / 10}`);
    b.push(
      { t: 'h2', text: 'Resumen clínico del período' },
      { t: 'gauge', label: `Estado general: ${LEVEL_LABEL[c.overall]}`, value: c.avgScore, level: c.overall },
      { t: 'p', text: 'Medidor de 0 a 100 (100 = sin molestias) calculado día a día con la fuerza del dolor, cuántos síntomas hubo, eventos graves y dosis no tomadas. Es una regla de la app, no una escala clínica validada.', style: 'muted' },
      { t: 'strip', title: 'Semáforo por día (verde: tranquilo · amarillo: con molestias · rojo: día difícil · gris: sin registros)',
        cells: c.daily.map((d) => ({ label: String(Number(d.dateKey.slice(8))), level: d.level })) },
      { t: 'table', headers: ['Indicador', 'Este período', 'Período anterior', 'Cambio'], rows: [
        ['Días con registros', `${c.tracked} de ${c.days}`, `${p.tracked} de ${p.days}`, '—'],
        ['Días tranquilos / con molestias / difíciles', `${c.levels.verde} / ${c.levels.amarillo} / ${c.levels.rojo}`, `${p.levels.verde} / ${p.levels.amarillo} / ${p.levels.rojo}`, '—'],
        ['Síntomas anotados', String(c.episodes), String(p.episodes), delta(c.episodes, p.episodes)],
        ['Días con síntomas', String(c.painDays), String(p.painDays), delta(c.painDays, p.painDays)],
        ['Días con dolor de cabeza (cefalea)', String(c.headacheDays), String(p.headacheDays), delta(c.headacheDays, p.headacheDays)],
        ['Fuerza media (escala 0–10)', fmt(c.avgIntensity), fmt(p.avgIntensity), delta(c.avgIntensity, p.avgIntensity)],
        ['Fuerza máxima (0–10)', fmt(c.maxIntensity), fmt(p.maxIntensity), '—'],
        ['Días con dolor intenso (7–10)', String(c.highPainDays), String(p.highPainDays), delta(c.highPainDays, p.highPainDays)],
        ['Convulsiones o desmayos', String(c.severeEvents), String(p.severeEvents), delta(c.severeEvents, p.severeEvents)],
        ['Medicinas tomadas (% de lo programado)', c.adherence.pct === null ? 'sin datos' : `${c.adherence.pct} %`, p.adherence.pct === null ? 'sin datos' : `${p.adherence.pct} %`, delta(c.adherence.pct, p.adherence.pct)],
      ] },
      { t: 'h3', text: 'Escala de dolor usada (numérica, 0–10)' },
      { t: 'table', headers: ['Puntos', 'Nivel', 'Qué significa'], rows: PAIN_SCALE_ROWS.map((x) => [...x]) },
      { t: 'table', headers: ['Nivel de los síntomas anotados', 'Cantidad'], rows: (Object.keys(c.bands) as (keyof typeof c.bands)[]).map((k) => [PAIN_BAND_LABEL[k], String(c.bands[k])]) },
      { t: 'bars', title: 'Momento del día en que ocurrieron los síntomas', data: c.partOfDay.map((x) => ({ label: x.label, value: x.count })) },
      { t: 'h3', text: 'Hallazgos para comentar con el médico' },
      ...findings.map((f): Block => ({ t: 'finding', finding: f })),
    );
  }

  if (r.sections.episodes) {
    const s = computeEpisodeStats(r.episodes, r.fromKey, r.toKey);
    const fmt = (n: number | null, unit = '') => (n === null ? 'sin datos' : `${n}${unit}`);
    const dur = (n: number | null) => (n === null ? 'sin datos' : formatDuration(Math.round(n)));
    b.push(
      { t: 'h2', text: 'Síntomas' },
      { t: 'list', items: [
        `Síntomas anotados: ${s.count}, en ${s.daysWithEpisodes} día(s)`,
        `Duración habitual: ${dur(s.avgMinutes)} · la mitad duró menos de: ${dur(s.medianMinutes)} · máxima: ${s.maxMinutes === null ? 'sin datos' : formatDuration(s.maxMinutes)} (${s.withDuration} de ${s.count} con hora de fin)`,
        `Fuerza del síntoma (0–10, según el paciente), media: ${fmt(s.avgIntensity)} · máxima: ${fmt(s.maxIntensity)} (${s.withIntensity} de ${s.count} con fuerza anotada)`,
      ] },
      { t: 'bars', title: 'Síntomas por semana (inicio de semana MM-DD)', data: s.perWeek.map((w) => ({ label: w.weekStart.slice(5), value: w.count })) },
      ...(s.byKind.length ? [{ t: 'table', headers: ['Síntoma', 'Veces'], rows: s.byKind.map((k) => [k.kind, String(k.count)]) } as Block] : []),
      { t: 'h3', text: 'Detalle' },
      { t: 'table', headers: ['Inicio', 'Duración', 'Síntoma', 'Fuerza (0–10)', 'Cómo quedó', 'Notas del paciente'],
        rows: eps.map((e) => [formatDateTime(e.startedAt), formatDuration(durationMinutes(e.startedAt, e.endedAt)), e.kind, e.intensity === null ? '—' : String(e.intensity), e.recovery.replace('_', ' '), e.notes]) },
    );
  }
  if (r.sections.medications) {
    const adh = computeAdherence(r.medications, r.schedules, r.intakes, r.fromKey, r.toKey, r.generatedAt);
    b.push(
      { t: 'h2', text: 'Medicinas' },
      { t: 'table', headers: ['Medicina', 'Dosis', 'Recetada por', 'Activa'], rows: r.medications.map((m) => [m.name, m.doseText, m.prescriber, m.active ? 'Sí' : 'No']) },
      { t: 'h3', text: 'Lo que debía tomar y lo que anotó' },
      { t: 'table', headers: ['Medicina', 'Debía tomar', 'Tomó', 'No tomó', 'Sin anotar'], rows: adh.map((a) => [a.name, String(a.scheduled), String(a.taken), String(a.skipped), String(a.unrecorded)]) },
      { t: 'p', text: 'Solo refleja lo que el paciente anotó en la app.', style: 'muted' },
    );
  }
  if (r.sections.appointments) {
    const ap = r.appointments.filter((a) => inRange(isoToLocalDateKey(a.startsAt))).sort((a, z) => a.startsAt.localeCompare(z.startsAt));
    b.push({ t: 'h2', text: 'Citas médicas' }, { t: 'table', headers: ['Fecha', 'Título', 'Profesional', 'Lugar', 'Estado'], rows: ap.map((a) => [formatDateTime(a.startsAt), a.title, a.provider, a.location, a.status]) });
  }
  if (r.sections.exams) {
    const ex = r.exams.filter((e) => inRange(e.examDate)).sort((a, z) => a.examDate.localeCompare(z.examDate));
    b.push({ t: 'h2', text: 'Estudios y resultados' }, { t: 'table', headers: ['Fecha', 'Estudio', 'Estado', 'De dónde viene el resultado', 'Resultado'],
      rows: ex.map((e) => [formatDateShort(e.examDate), e.name, e.status.replace('_', ' '), e.status === 'con_resultado' ? (e.resultSource === 'informe_medico' ? 'Informe del médico' : 'Anotado por el paciente') : '—', e.resultText]) });
  }
  if (r.sections.notes) {
    const ns = r.notes.filter((n) => inRange(n.noteDate)).sort((a, z) => a.noteDate.localeCompare(z.noteDate));
    b.push({ t: 'h2', text: 'Notas' }, { t: 'table', headers: ['Fecha', 'Autor', 'Nota'], rows: ns.map((n) => [formatDateShort(n.noteDate), n.authorRole, n.body]) });
  }
  if (r.sections.analysis) {
    b.push({ t: 'h2', text: 'Fuentes consultadas' }, { t: 'list', items: SOURCES.map((s) => (s.url ? `${s.text} (${s.url})` : s.text)) });
  }
  b.push({ t: 'p', text: DISCLAIMER, style: 'muted' });
  return b;
}
