import type { Appointment, Episode, Exam, Intake, Medication, Note, Schedule } from '../db/types';
import { computeEpisodeStats, type EpisodeStats } from './stats';
import { dosesOnDay } from './reminders';
import { addDays, durationMinutes, formatDateShort, formatDateTime, formatDuration, isoToLocalDateKey } from './time';

export interface ReportSections {
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

export function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export interface Adherence {
  medicationId: string;
  name: string;
  scheduled: number;
  taken: number;
  skipped: number;
  unrecorded: number;
}

/** Tomas programadas vs registradas dentro del período (hasta `now`). */
export function computeAdherence(
  medications: Medication[], schedules: Schedule[], intakes: Intake[], fromKey: string, toKey: string, now: Date,
): Adherence[] {
  return medications.map((m) => {
    let scheduled = 0, taken = 0, skipped = 0;
    for (const s of schedules.filter((x) => x.medicationId === m.id)) {
      for (let d = fromKey; d <= toKey; d = addDays(d, 1)) {
        for (const due of dosesOnDay(s, d)) {
          if (Date.parse(due) > now.getTime()) continue;
          scheduled++;
          const rec = intakes.find((i) => i.scheduleId === s.id && i.scheduledAt === due);
          if (rec?.status === 'tomada') taken++;
          else if (rec?.status === 'omitida') skipped++;
        }
      }
    }
    return { medicationId: m.id, name: m.name, scheduled, taken, skipped, unrecorded: scheduled - taken - skipped };
  }).filter((a) => a.scheduled > 0);
}

function barChartSvg(data: { label: string; value: number }[], title: string): string {
  if (data.length === 0) return '';
  const w = 640, h = 160, pad = 28;
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = (w - pad * 2) / data.length;
  const bars = data.map((d, i) => {
    const bh = ((h - pad * 2) * d.value) / max;
    const x = pad + i * bw + 2;
    return `<rect x="${x.toFixed(1)}" y="${(h - pad - bh).toFixed(1)}" width="${Math.max(1, bw - 4).toFixed(1)}" height="${bh.toFixed(1)}" fill="#2F5D8A"/>` +
      (d.value > 0 ? `<text x="${(x + (bw - 4) / 2).toFixed(1)}" y="${(h - pad - bh - 3).toFixed(1)}" font-size="9" text-anchor="middle">${d.value}</text>` : '') +
      (data.length <= 16 || i % Math.ceil(data.length / 12) === 0
        ? `<text x="${(x + (bw - 4) / 2).toFixed(1)}" y="${h - 10}" font-size="8" text-anchor="middle" fill="#555">${esc(d.label)}</text>` : '');
  }).join('');
  return `<figure><figcaption>${esc(title)}</figcaption><svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="${esc(title)}">` +
    `<line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" stroke="#999"/>${bars}</svg></figure>`;
}

const table = (headers: string[], rows: string[][]) =>
  rows.length === 0 ? '<p class="muted">Sin registros en el período.</p>' :
  `<table><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>` +
  rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('') + '</tbody></table>';

function statsHtml(s: EpisodeStats): string {
  const fmt = (n: number | null, unit = '') => (n === null ? 'sin datos' : `${n}${unit}`);
  return `<ul>
    <li>Síntomas anotados: <b>${s.count}</b>, en <b>${s.daysWithEpisodes}</b> día(s)</li>
    <li>Duración habitual: <b>${esc(s.avgMinutes === null ? 'sin datos' : formatDuration(Math.round(s.avgMinutes)))}</b>
      · la mitad duró menos de: <b>${esc(s.medianMinutes === null ? 'sin datos' : formatDuration(Math.round(s.medianMinutes)))}</b>
      · máxima: <b>${esc(s.maxMinutes === null ? 'sin datos' : formatDuration(s.maxMinutes))}</b>
      <span class="muted">(${s.withDuration} de ${s.count} con hora de fin)</span></li>
    <li>Fuerza del síntoma (0–10, según el paciente), media: <b>${fmt(s.avgIntensity)}</b> · máxima: <b>${fmt(s.maxIntensity)}</b>
      <span class="muted">(${s.withIntensity} de ${s.count} con fuerza anotada)</span></li>
  </ul>` +
  barChartSvg(s.perWeek.map((w) => ({ label: w.weekStart.slice(5), value: w.count })), 'Síntomas por semana (inicio de semana MM-DD)') +
  (s.byKind.length ? table(['Síntoma', 'Veces'], s.byKind.map((k) => [k.kind, String(k.count)])) : '');
}

/** HTML autocontenido (sin recursos externos) para convertir a PDF. */
export function buildReportHtml(r: ReportInput): string {
  const inRange = (key: string) => key >= r.fromKey && key <= r.toKey;
  const eps = r.episodes.filter((e) => inRange(isoToLocalDateKey(e.startedAt))).sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const parts: string[] = [];

  if (r.sections.episodes) {
    const stats = computeEpisodeStats(r.episodes, r.fromKey, r.toKey);
    parts.push(`<h2>Síntomas</h2>${statsHtml(stats)}<h3>Detalle</h3>` +
      table(['Inicio', 'Duración', 'Síntoma', 'Fuerza (0–10)', 'Cómo quedó', 'Notas del paciente'],
        eps.map((e) => [formatDateTime(e.startedAt), formatDuration(durationMinutes(e.startedAt, e.endedAt)), e.kind,
          e.intensity === null ? '—' : String(e.intensity), e.recovery.replace('_', ' '), e.notes])));
  }
  if (r.sections.medications) {
    const adh = computeAdherence(r.medications, r.schedules, r.intakes, r.fromKey, r.toKey, r.generatedAt);
    parts.push('<h2>Medicinas</h2>' +
      table(['Medicina', 'Dosis', 'Recetada por', 'Activa'], r.medications.map((m) => [m.name, m.doseText, m.prescriber, m.active ? 'Sí' : 'No'])) +
      '<h3>Lo que debía tomar y lo que anotó</h3>' +
      table(['Medicina', 'Debía tomar', 'Tomó', 'No tomó', 'Sin anotar'], adh.map((a) => [a.name, String(a.scheduled), String(a.taken), String(a.skipped), String(a.unrecorded)])) +
      '<p class="muted">Solo refleja lo que el paciente anotó en la app.</p>');
  }
  if (r.sections.appointments) {
    const ap = r.appointments.filter((a) => inRange(isoToLocalDateKey(a.startsAt))).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    parts.push('<h2>Citas médicas</h2>' + table(['Fecha', 'Título', 'Profesional', 'Lugar', 'Estado'],
      ap.map((a) => [formatDateTime(a.startsAt), a.title, a.provider, a.location, a.status])));
  }
  if (r.sections.exams) {
    const ex = r.exams.filter((e) => inRange(e.examDate)).sort((a, b) => a.examDate.localeCompare(b.examDate));
    parts.push('<h2>Estudios y resultados</h2>' + table(['Fecha', 'Estudio', 'Estado', 'De dónde viene el resultado', 'Resultado'],
      ex.map((e) => [formatDateShort(e.examDate), e.name, e.status.replace('_', ' '),
        e.status === 'con_resultado' ? (e.resultSource === 'informe_medico' ? 'Informe del médico' : 'Anotado por el paciente') : '—', e.resultText])));
  }
  if (r.sections.notes) {
    const ns = r.notes.filter((n) => inRange(n.noteDate)).sort((a, b) => a.noteDate.localeCompare(b.noteDate));
    parts.push('<h2>Notas</h2>' + table(['Fecha', 'Autor', 'Nota'], ns.map((n) => [formatDateShort(n.noteDate), n.authorRole, n.body])));
  }

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Resumen NeuroCalendario</title>
<style>
  body{font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:11px;color:#1b1b1b;margin:24px}
  h1{font-size:20px;margin:0 0 4px} h2{font-size:15px;border-bottom:2px solid #2F5D8A;padding-bottom:3px;margin-top:22px}
  h3{font-size:12px;margin:12px 0 4px} table{width:100%;border-collapse:collapse;margin:6px 0;page-break-inside:auto}
  tr{page-break-inside:avoid} th,td{border:1px solid #bbb;padding:4px 6px;text-align:left;vertical-align:top}
  th{background:#eef3f8} .muted{color:#666} .warn{border:1px solid #c0392b;background:#fdf1ef;padding:8px;margin:12px 0;font-weight:600}
  figure{margin:8px 0} figcaption{font-size:10px;color:#444}
</style></head><body>
<h1>Resumen de seguimiento neurológico</h1>
<p><b>Persona:</b> ${esc(r.profileName)}<br>
<b>Período:</b> ${esc(formatDateShort(r.fromKey))} a ${esc(formatDateShort(r.toKey))}<br>
<b>Creado:</b> ${esc(formatDateTime(r.generatedAt.toISOString()))} por ${esc(r.generatedBy)}</p>
<div class="warn">${esc(DISCLAIMER)}</div>
${parts.join('\n')}
<p class="muted" style="margin-top:24px">${esc(DISCLAIMER)}</p>
</body></html>`;
}
