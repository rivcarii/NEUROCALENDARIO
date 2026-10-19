import { localToIso, localDateKey, addDays } from '../src/domain/time';
import { rescheduleAll } from '../src/services/notifications';
import { makeFixture, type Fixture } from './helpers/nodeDriver';

jest.mock('../src/services/ids', () => ({ newId: () => require('node:crypto').randomUUID() }));
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  scheduleNotificationAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  SchedulableTriggerInputTypes: { DATE: 'date' },
  AndroidImportance: { HIGH: 4 },
  AndroidNotificationVisibility: { PRIVATE: 0 },
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const N = require('expo-notifications') as Record<string, jest.Mock>;

let f: Fixture;
let seq = 0;
beforeEach(async () => {
  f = await makeFixture();
  jest.clearAllMocks();
  seq = 0;
  N.getPermissionsAsync!.mockResolvedValue({ granted: true, canAskAgain: true });
  N.requestPermissionsAsync!.mockResolvedValue({ granted: true });
  N.scheduleNotificationAsync!.mockImplementation(async () => `n-${++seq}`);
});
afterEach(() => f.close());

const now = new Date(localToIso('2026-05-05', '09:00'));
const tomorrow = addDays('2026-05-05', 1);

async function seed() {
  const m = await f.owner.create('medication', f.mom, { name: 'NOMBRE-SECRETO-MED' });
  await f.owner.create('schedule', f.mom, { medicationId: m.id, times: ['20:00'], startDate: '2026-05-01' });
  await f.owner.create('appointment', f.mom, { title: 'TITULO-SECRETO-CITA', startsAt: localToIso(tomorrow, '10:00'), remindMinutesBefore: 60 });
  return m;
}

describe('programación de recordatorios', () => {
  it('cancela lo anterior, programa citas y tomas futuras y guarda los ids', async () => {
    await seed();
    const r = await rescheduleAll(f.owner, false, now);
    expect(N.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(r.permission).toBe(true);
    expect(r.scheduled).toBe(N.scheduleNotificationAsync!.mock.calls.length);
    expect(r.scheduled).toBeGreaterThan(10); // 15 tomas (hoy→+14d) + 1 cita
    const rows = await f.db.all<{ notification_id: string; profile_id: string }>('SELECT * FROM reminders');
    expect(rows).toHaveLength(r.scheduled);
    expect(new Set(rows.map((x) => x.profile_id))).toEqual(new Set([f.mom]));
    for (const [arg] of N.scheduleNotificationAsync!.mock.calls as [{ trigger: { date: Date } }][]) {
      expect(arg.trigger.date.getTime()).toBeGreaterThan(now.getTime());
    }
  });

  it('las notificaciones son neutras: sin medicamento ni título de cita', async () => {
    await seed();
    await rescheduleAll(f.owner, false, now);
    const all = JSON.stringify(N.scheduleNotificationAsync!.mock.calls);
    expect(all).not.toMatch(/SECRETO/);
    expect(all).toContain('Tiene un recordatorio');
    N.scheduleNotificationAsync!.mockClear();
    await rescheduleAll(f.owner, true, now);
    expect(JSON.stringify(N.scheduleNotificationAsync!.mock.calls)).toMatch(/NOMBRE-SECRETO-MED/);
  });

  it('reprogramar no duplica y refleja ediciones y borrados', async () => {
    const m = await seed();
    const a = await rescheduleAll(f.owner, false, now);
    const b = await rescheduleAll(f.owner, false, now);
    expect(b.scheduled).toBe(a.scheduled);
    expect(await f.db.all('SELECT 1 FROM reminders')).toHaveLength(b.scheduled);
    expect(N.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(2);

    await f.owner.update('medication', f.mom, m.id, { active: false });
    const c = await rescheduleAll(f.owner, false, now);
    expect(c.scheduled).toBe(1); // solo queda la cita
    await f.owner.remove('medication', f.mom, m.id);
    const apt = (await f.owner.list('appointment', f.mom))[0]!;
    await f.owner.update('appointment', f.mom, apt.id, { status: 'cancelada' });
    const d = await rescheduleAll(f.owner, false, now);
    expect(d.scheduled).toBe(0);
    expect(await f.db.all('SELECT 1 FROM reminders')).toHaveLength(0);
  });

  it('sin permiso no programa nada y lo informa', async () => {
    await seed();
    N.getPermissionsAsync!.mockResolvedValue({ granted: false, canAskAgain: false });
    const r = await rescheduleAll(f.owner, false, now);
    expect(r).toEqual({ scheduled: 0, permission: false });
    expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('respeta el tope de 60 y programa primero los más próximos', async () => {
    const m = await f.owner.create('medication', f.mom, { name: 'M' });
    await f.owner.create('schedule', f.mom, { medicationId: m.id, times: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'], startDate: '2026-05-01' });
    const r = await rescheduleAll(f.owner, false, now);
    expect(r.scheduled).toBe(60);
    const dates = (N.scheduleNotificationAsync!.mock.calls as [{ trigger: { date: Date } }][]).map(([x]) => x.trigger.date.getTime());
    expect([...dates].sort((x, y) => x - y)).toEqual(dates);
    expect(localDateKey(new Date(dates[0]!))).toBe('2026-05-05');
  });

  it('un perfil sin permisos del usuario no se programa', async () => {
    await seed();
    const fam = await f.owner.createFamilyAccount('Familiar');
    const r = await rescheduleAll(f.owner.as(fam.id), false, now);
    expect(r.scheduled).toBe(0);
  });
});
