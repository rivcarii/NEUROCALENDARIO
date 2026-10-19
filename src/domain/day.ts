import type { Store } from '../db/store';
import type { Appointment, Episode, Exam, Intake, Medication, Note, Schedule } from '../db/types';
import { dosesOnDay } from './reminders';
import { addDays, endOfLocalDayIso, isoToLocalDateKey, monthGrid, startOfLocalDayIso } from './time';

export interface Dose {
  schedule: Schedule;
  medication: Medication;
  dueAt: string;
  intake: Intake | null;
}

export interface DayData {
  dateKey: string;
  episodes: Episode[];
  appointments: Appointment[];
  doses: Dose[];
  exams: Exam[];
  notes: Note[];
}

/** Reúne todo lo persistido de un día local para UN perfil. */
export async function loadDay(store: Store, profileId: string, dateKey: string): Promise<DayData> {
  const from = startOfLocalDayIso(dateKey);
  const to = endOfLocalDayIso(dateKey);
  const [episodes, appointments, medications, schedules, intakes, exams, notes] = await Promise.all([
    store.list('episode', profileId, { from, to, order: 'asc' }),
    store.list('appointment', profileId, { from, to, order: 'asc' }),
    store.list('medication', profileId),
    store.list('schedule', profileId),
    store.list('intake', profileId, { where: {} }),
    store.list('exam', profileId, { from: dateKey, to: addDays(dateKey, 1) }),
    store.list('note', profileId, { from: dateKey, to: addDays(dateKey, 1), order: 'asc' }),
  ]);
  const medById = new Map(medications.map((m) => [m.id, m]));
  const doses: Dose[] = [];
  for (const s of schedules) {
    const med = medById.get(s.medicationId);
    if (!med || !med.active) continue;
    for (const dueAt of dosesOnDay(s, dateKey)) {
      doses.push({ schedule: s, medication: med, dueAt, intake: intakes.find((i) => i.scheduleId === s.id && i.scheduledAt === dueAt) ?? null });
    }
  }
  doses.sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  return { dateKey, episodes, appointments, doses, exams, notes };
}

export interface DayMarks { episodes: number; appointments: number; exams: number; notes: number }

/** Marcas por día para la cuadrícula mensual (42 días visibles). */
export async function loadMonthMarks(store: Store, profileId: string, year: number, month0: number): Promise<Map<string, DayMarks>> {
  const grid = monthGrid(year, month0);
  const first = grid[0]!;
  const last = addDays(grid[41]!, 1);
  const [episodes, appointments, exams, notes] = await Promise.all([
    store.list('episode', profileId, { from: startOfLocalDayIso(first), to: startOfLocalDayIso(last) }),
    store.list('appointment', profileId, { from: startOfLocalDayIso(first), to: startOfLocalDayIso(last) }),
    store.list('exam', profileId, { from: first, to: last }),
    store.list('note', profileId, { from: first, to: last }),
  ]);
  const marks = new Map<string, DayMarks>();
  const get = (k: string) => { let m = marks.get(k); if (!m) { m = { episodes: 0, appointments: 0, exams: 0, notes: 0 }; marks.set(k, m); } return m; };
  for (const e of episodes) get(isoToLocalDateKey(e.startedAt)).episodes++;
  for (const a of appointments) get(isoToLocalDateKey(a.startsAt)).appointments++;
  for (const x of exams) get(x.examDate).exams++;
  for (const n of notes) get(n.noteDate).notes++;
  return marks;
}
