import { randomUUID } from 'node:crypto';
import { buildBackup, decryptBackup, encryptBackup, isEncryptedBackup, restoreBackup, type FileAdapter } from '../src/domain/backup';
import { dosesOnDay, notificationContent, planReminders } from '../src/domain/reminders';
import { computeEpisodeStats } from '../src/domain/stats';
import { addDays, durationMinutes, formatDuration, localToIso, monthGrid, startOfWeek } from '../src/domain/time';
import { AccessDeniedError, ValidationError } from '../src/db/errors';
import { makeFixture, type Fixture } from './helpers/nodeDriver';

describe('tiempo', () => {
  it('calcula duraciones', () => {
    expect(durationMinutes('2026-01-01T10:00:00.000Z', '2026-01-01T11:30:00.000Z')).toBe(90);
    expect(durationMinutes('2026-01-01T10:00:00.000Z', null)).toBeNull();
    expect(durationMinutes('2026-01-01T10:00:00.000Z', '2026-01-01T09:00:00.000Z')).toBeNull();
    expect(formatDuration(90)).toBe('1 h 30 min');
    expect(formatDuration(120)).toBe('2 h');
    expect(formatDuration(5)).toBe('5 min');
  });
  it('semanas y cuadrícula del mes', () => {
    expect(startOfWeek('2026-03-04')).toBe('2026-03-02'); // miércoles → lunes
    expect(startOfWeek('2026-03-01')).toBe('2026-02-23'); // domingo → lunes anterior
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    const g = monthGrid(2026, 1);
    expect(g).toHaveLength(42);
    expect(g[0]).toBe('2026-01-26');
    expect(g).toContain('2026-02-28');
  });
});

describe('estadísticas', () => {
  const mk = (start: string, end: string | null, intensity: number | null, kind = 'Cefalea') =>
    ({ startedAt: start, endedAt: end, intensity, kind }) as never;
  it('calcula frecuencia, duración e intensidad', () => {
    const eps = [
      mk(localToIso('2026-03-02', '10:00'), localToIso('2026-03-02', '10:30'), 4),
      mk(localToIso('2026-03-03', '10:00'), localToIso('2026-03-03', '11:30'), 8),
      mk(localToIso('2026-03-10', '10:00'), null, null, 'Mareo'),
      mk(localToIso('2026-04-20', '10:00'), null, 9), // fuera del rango
    ];
    const s = computeEpisodeStats(eps, '2026-03-01', '2026-03-15');
    expect(s.count).toBe(3);
    expect(s.withDuration).toBe(2);
    expect(s.avgMinutes).toBe(60);
    expect(s.medianMinutes).toBe(60);
    expect(s.maxMinutes).toBe(90);
    expect(s.avgIntensity).toBe(6);
    expect(s.maxIntensity).toBe(8);
    expect(s.byKind[0]).toEqual({ kind: 'Cefalea', count: 2 });
    expect(s.perWeek.map((w) => w.count)).toEqual([0, 2, 1]);
    expect(s.daysWithEpisodes).toBe(3);
  });
  it('sin datos devuelve nulos, no ceros inventados', () => {
    const s = computeEpisodeStats([], '2026-03-01', '2026-03-31');
    expect(s.count).toBe(0);
    expect(s.avgMinutes).toBeNull();
    expect(s.avgIntensity).toBeNull();
    expect(s.medianMinutes).toBeNull();
  });
});

describe('recordatorios', () => {
  const med = { id: 'm1', active: true } as never;
  const sched = (over: object = {}) => ({
    id: 's1', medicationId: 'm1', times: ['20:00', '08:00'], daysOfWeek: null,
    startDate: '2026-05-01', endDate: null, remindersEnabled: true, ...over,
  }) as never;
  it('genera las tomas del día ordenadas y respeta fechas y días', () => {
    expect(dosesOnDay(sched(), '2026-05-05')).toEqual([localToIso('2026-05-05', '08:00'), localToIso('2026-05-05', '20:00')]);
    expect(dosesOnDay(sched(), '2026-04-30')).toEqual([]);
    expect(dosesOnDay(sched({ endDate: '2026-05-03' }), '2026-05-04')).toEqual([]);
    // 2026-05-05 es martes (2); solo lunes (1)
    expect(dosesOnDay(sched({ daysOfWeek: [1] }), '2026-05-05')).toEqual([]);
    expect(dosesOnDay(sched({ daysOfWeek: [2] }), '2026-05-05')).toHaveLength(2);
  });
  it('planifica solo futuro, activos y con avisos; respeta el tope', () => {
    const now = new Date(localToIso('2026-05-05', '09:00'));
    const plan = planReminders({ now, medications: [med], schedules: [sched()], appointments: [], horizonDays: 2 });
    expect(plan[0]!.fireAt).toBe(localToIso('2026-05-05', '20:00')); // la de las 08:00 ya pasó
    expect(plan).toHaveLength(1 + 2 + 2);
    expect(planReminders({ now, medications: [{ id: 'm1', active: false } as never], schedules: [sched()], appointments: [] })).toEqual([]);
    expect(planReminders({ now, medications: [med], schedules: [sched({ remindersEnabled: false })], appointments: [] })).toEqual([]);
    expect(planReminders({ now, medications: [med], schedules: [sched()], appointments: [], maxCount: 3 })).toHaveLength(3);
    const appt = { id: 'a1', status: 'programada', startsAt: localToIso('2026-05-06', '10:00'), remindMinutesBefore: 60 } as never;
    const p2 = planReminders({ now, medications: [], schedules: [], appointments: [appt, { ...(appt as object), id: 'a2', status: 'cancelada' } as never] });
    expect(p2).toHaveLength(1);
    expect(p2[0]!.fireAt).toBe(localToIso('2026-05-06', '09:00'));
  });
  it('las notificaciones son neutras por defecto', () => {
    const r = { kind: 'medicamento', refId: 'x', fireAt: '', dueAt: '' } as const;
    const n = notificationContent(r, false, 'Levetiracetam');
    expect(JSON.stringify(n)).not.toMatch(/Levetiracetam/);
    expect(notificationContent(r, true, 'Levetiracetam').body).toContain('Levetiracetam');
  });
});

describe('copias de seguridad', () => {
  let f: Fixture;
  beforeEach(async () => { f = await makeFixture(); });
  afterEach(() => f.close());

  async function seed() {
    const m = await f.owner.create('medication', f.mom, { name: 'Med ficticio' });
    const s = await f.owner.create('schedule', f.mom, { medicationId: m.id, times: ['08:00'], startDate: '2026-01-01' });
    await f.owner.create('intake', f.mom, { medicationId: m.id, scheduleId: s.id, scheduledAt: '2026-01-01T08:00:00.000Z', status: 'tomada', takenAt: '2026-01-01T08:05:00.000Z' });
    await f.owner.create('episode', f.mom, { startedAt: '2026-01-02T10:00:00.000Z', endedAt: '2026-01-02T10:10:00.000Z', kind: 'Cefalea (ficticia)', relatedMedicationIds: [m.id], associatedSymptoms: ['náusea'] });
    const ex = await f.owner.create('exam', f.mom, { name: 'Examen ficticio', examDate: '2026-01-03' });
    await f.owner.create('document', f.mom, { title: 'Doc', fileName: 'd.pdf', mimeType: 'application/pdf', sizeBytes: 4, sha256: 'c'.repeat(64), storagePath: 'docs/d.pdf', linkedEntity: 'exam', linkedId: ex.id });
    await f.owner.create('note', f.mom, { body: 'nota', noteDate: '2026-01-04' });
    await f.owner.create('appointment', f.mom, { title: 'Cita ficticia', startsAt: '2026-02-01T10:00:00.000Z' });
  }

  it('exporta y restaura como perfil nuevo con ids remapeados y vínculos intactos', async () => {
    await seed();
    const disk = new Map<string, string>([['docs/d.pdf', 'JVBERg==']]);
    const files: FileAdapter = { readBase64: async (p) => { const v = disk.get(p); if (!v) throw new Error('x'); return v; }, writeBase64: async (p, b) => { disk.set(`restored/${p}`, b); } };
    const backup = await buildBackup(f.owner, f.mom, files);
    expect(backup.files['docs/d.pdf']).toBe('JVBERg==');
    const res = await restoreBackup(f.owner, JSON.parse(JSON.stringify(backup)), randomUUID, files);
    expect(res.profileId).not.toBe(f.mom);
    expect(res.counts).toMatchObject({ medication: 1, schedule: 1, intake: 1, episode: 1, exam: 1, document: 1, note: 1, appointment: 1 });
    const meds = await f.owner.list('medication', res.profileId);
    const eps = await f.owner.list('episode', res.profileId);
    expect(eps[0]!.relatedMedicationIds).toEqual([meds[0]!.id]);
    expect(meds[0]!.id).not.toBe((await f.owner.list('medication', f.mom))[0]!.id);
    const docs = await f.owner.list('document', res.profileId);
    const exams = await f.owner.list('exam', res.profileId);
    expect(docs[0]!.linkedId).toBe(exams[0]!.id);
    expect(disk.has('restored/docs/d.pdf')).toBe(true);
    // el original no cambió y el otro perfil sigue vacío
    expect(await f.owner.list('episode', f.mom)).toHaveLength(1);
    expect(await f.owner.list('episode', f.me)).toHaveLength(0);
  });

  it('una copia corrupta no deja perfiles a medias', async () => {
    await seed();
    const backup = await buildBackup(f.owner, f.mom);
    (backup.data.episode[0] as Record<string, unknown>).intensity = 99;
    const before = (await f.owner.listProfiles()).length;
    await expect(restoreBackup(f.owner, backup, randomUUID)).rejects.toBeInstanceOf(ValidationError);
    expect(await f.owner.listProfiles()).toHaveLength(before);
    await expect(restoreBackup(f.owner, { format: 'otra' }, randomUUID)).rejects.toBeInstanceOf(ValidationError);
    await expect(restoreBackup(f.owner, { ...backup, version: 99 }, randomUUID)).rejects.toBeInstanceOf(ValidationError);
  });

  it('exportar exige permiso de lectura sobre el perfil', async () => {
    await seed();
    const fam = await f.owner.createFamilyAccount('Familiar ficticio');
    await expect(buildBackup(f.owner.as(fam.id), f.mom)).rejects.toBeInstanceOf(ValidationError);
    await expect(restoreBackup(f.owner.as(fam.id), { format: 'neurocalendario-backup', version: 1, profile: { displayName: 'x', relationship: '', birthYear: null, color: '#000000' }, data: {} }, randomUUID)).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it('cifra y descifra; rechaza contraseña errónea y manipulación', async () => {
    await seed();
    const backup = await buildBackup(f.owner, f.mom);
    const enc = encryptBackup(backup, 'una-frase-larga-ficticia');
    expect(isEncryptedBackup(enc)).toBe(true);
    expect(JSON.stringify(enc)).not.toMatch(/Cefalea|Med ficticio/);
    expect(decryptBackup(enc, 'una-frase-larga-ficticia').data.episode).toHaveLength(1);
    expect(() => decryptBackup(enc, 'otra-frase-incorrecta')).toThrow(/incorrecta/);
    const tampered = { ...enc, ciphertext: enc.ciphertext.slice(0, -4) + 'AAAA' };
    expect(() => decryptBackup(tampered, 'una-frase-larga-ficticia')).toThrow(ValidationError);
    expect(() => encryptBackup(backup, 'corta')).toThrow(ValidationError);
    expect(() => decryptBackup({ ...enc, params: { N: 2 ** 25, r: 8, p: 1 } }, 'x')).toThrow(/no admitidos/);
  }, 30000);
});
