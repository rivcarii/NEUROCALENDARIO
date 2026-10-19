import type { Appointment, Medication, Schedule } from '../db/types';
import { addDays, localDateKey, localToIso, parseDateKey } from './time';

export interface PlannedReminder {
  kind: 'cita' | 'medicamento';
  refId: string;
  /** Instante ISO UTC en que debe sonar. */
  fireAt: string;
  /** Instante programado de la toma/cita (para marcar la toma). */
  dueAt: string;
}

/** Instantes programados de una pauta para un día local concreto. */
export function dosesOnDay(schedule: Schedule, dateKey: string): string[] {
  if (dateKey < schedule.startDate) return [];
  if (schedule.endDate && dateKey > schedule.endDate) return [];
  if (schedule.daysOfWeek) {
    // 0 = domingo … 6 = sábado (convención de Date.getDay)
    if (!schedule.daysOfWeek.includes(parseDateKey(dateKey).getDay())) return [];
  }
  return [...schedule.times].sort().map((t) => localToIso(dateKey, t));
}

export interface PlanInput {
  now: Date;
  medications: Medication[];
  schedules: Schedule[];
  appointments: Appointment[];
  horizonDays?: number;
  /** iOS limita a 64 notificaciones locales pendientes. */
  maxCount?: number;
}

/**
 * Calcula los recordatorios futuros. Solo medicamentos activos con recordatorios
 * habilitados y citas «programada» con aviso. Devuelve a lo sumo `maxCount`,
 * los más próximos primero.
 */
export function planReminders(input: PlanInput): PlannedReminder[] {
  const { now, medications, schedules, appointments } = input;
  const horizon = input.horizonDays ?? 14;
  const max = input.maxCount ?? 60;
  const activeMeds = new Set(medications.filter((m) => m.active).map((m) => m.id));
  const out: PlannedReminder[] = [];
  const today = localDateKey(now);

  for (const s of schedules) {
    if (!s.remindersEnabled || !activeMeds.has(s.medicationId)) continue;
    for (let i = 0; i <= horizon; i++) {
      for (const due of dosesOnDay(s, addDays(today, i))) {
        if (Date.parse(due) > now.getTime()) out.push({ kind: 'medicamento', refId: s.id, fireAt: due, dueAt: due });
      }
    }
  }
  for (const a of appointments) {
    if (a.status !== 'programada' || a.remindMinutesBefore === null) continue;
    const fire = Date.parse(a.startsAt) - a.remindMinutesBefore * 60000;
    if (fire > now.getTime() && fire < now.getTime() + horizon * 86400000) {
      out.push({ kind: 'cita', refId: a.id, fireAt: new Date(fire).toISOString(), dueAt: a.startsAt });
    }
  }
  return out.sort((a, b) => a.fireAt.localeCompare(b.fireAt)).slice(0, max);
}

export interface NotificationContent {
  title: string;
  body: string;
}

/**
 * Contenido de la notificación. Por defecto es NEUTRO: no revela diagnósticos,
 * síntomas ni nombres de medicamentos en la pantalla bloqueada.
 */
export function notificationContent(r: PlannedReminder, showDetails: boolean, label?: string): NotificationContent {
  if (showDetails && label) {
    return { title: 'NeuroCalendario', body: r.kind === 'cita' ? `Cita: ${label}` : `Es hora de: ${label}` };
  }
  return {
    title: 'NeuroCalendario',
    body: r.kind === 'cita' ? 'Tiene un recordatorio de cita.' : 'Tiene un recordatorio pendiente.',
  };
}
