import type { Store } from '../db/store';
import { planReminders, type PlannedReminder } from '../domain/reminders';

export interface PlannedWithLabel { profileId: string; r: PlannedReminder; label: string }

/** Próximos recordatorios (medicinas y citas) de todos los perfiles accesibles, ordenados por hora. */
export async function collectPlanned(store: Store, now = new Date()): Promise<PlannedWithLabel[]> {
  const profiles = await store.listProfiles();
  const out: PlannedWithLabel[] = [];
  for (const p of profiles) {
    const [medications, schedules, appointments] = await Promise.all([
      store.list('medication', p.id), store.list('schedule', p.id), store.list('appointment', p.id),
    ]);
    const names = new Map(medications.map((m) => [m.id, m.name]));
    const schedMed = new Map(schedules.map((s) => [s.id, names.get(s.medicationId) ?? '']));
    const aptTitle = new Map(appointments.map((a) => [a.id, a.title]));
    for (const r of planReminders({ now, medications, schedules, appointments })) {
      out.push({ profileId: p.id, r, label: (r.kind === 'cita' ? aptTitle.get(r.refId) : schedMed.get(r.refId)) ?? '' });
    }
  }
  return out.sort((a, b) => a.r.fireAt.localeCompare(b.r.fireAt));
}
