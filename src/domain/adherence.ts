import type { Intake, Medication, Schedule } from '../db/types';
import { dosesOnDay } from './reminders';
import { addDays } from './time';

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
