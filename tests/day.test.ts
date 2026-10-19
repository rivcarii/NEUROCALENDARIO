import { loadDay, loadMonthMarks } from '../src/domain/day';
import { localToIso } from '../src/domain/time';
import { makeFixture } from './helpers/nodeDriver';

describe('vista diaria y mensual desde datos persistidos', () => {
  it('une episodios, citas, tomas, exámenes y notas del día de UN perfil', async () => {
    const f = await makeFixture();
    const day = '2026-06-10';
    await f.owner.create('episode', f.mom, { startedAt: localToIso(day, '23:30'), kind: 'Cefalea (ficticia)' });
    await f.owner.create('episode', f.mom, { startedAt: localToIso('2026-06-11', '00:10'), kind: 'Otro día' });
    await f.owner.create('episode', f.me, { startedAt: localToIso(day, '10:00'), kind: 'DEL-OTRO-PERFIL' });
    await f.owner.create('appointment', f.mom, { title: 'Cita', startsAt: localToIso(day, '09:00') });
    await f.owner.create('exam', f.mom, { name: 'Examen', examDate: day });
    await f.owner.create('note', f.mom, { body: 'n', noteDate: day });
    const m = await f.owner.create('medication', f.mom, { name: 'Med' });
    const off = await f.owner.create('medication', f.mom, { name: 'Inactivo', active: false });
    const s = await f.owner.create('schedule', f.mom, { medicationId: m.id, times: ['08:00', '20:00'], startDate: '2026-06-01' });
    await f.owner.create('schedule', f.mom, { medicationId: off.id, times: ['08:00'], startDate: '2026-06-01' });
    await f.owner.recordIntake(f.mom, { medicationId: m.id, scheduleId: s.id, scheduledAt: localToIso(day, '08:00'), status: 'tomada', takenAt: localToIso(day, '08:02') });

    const d = await loadDay(f.owner, f.mom, day);
    expect(d.episodes.map((e) => e.kind)).toEqual(['Cefalea (ficticia)']);
    expect(d.appointments).toHaveLength(1);
    expect(d.exams).toHaveLength(1);
    expect(d.notes).toHaveLength(1);
    expect(d.doses.map((x) => x.intake?.status ?? null)).toEqual(['tomada', null]);
    expect(d.doses).toHaveLength(2); // el medicamento inactivo no aparece

    const marks = await loadMonthMarks(f.owner, f.mom, 2026, 5);
    expect(marks.get(day)).toMatchObject({ episodes: 1, appointments: 1, exams: 1, notes: 1 });
    expect(marks.get('2026-06-11')?.episodes).toBe(1);
    f.close();
  });

  it('normaliza instantes con desfase horario a UTC', async () => {
    const f = await makeFixture();
    const e = await f.owner.create('episode', f.mom, { startedAt: '2026-06-10T10:00:00+02:00', kind: 'x' });
    expect(e.startedAt).toBe('2026-06-10T08:00:00.000Z');
    f.close();
  });
});
