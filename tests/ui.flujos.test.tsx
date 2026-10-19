import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderRouter, testRouter } from 'expo-router/testing-library';
import { randomUUID } from 'node:crypto';
import { Store } from '../src/db/store';
import { freshDb, holder } from './helpers/uiMocks';

jest.mock('../src/services/database', () => ({
  getDb: () => {
    const { holder: h } = require('./helpers/uiMocks');
    return Promise.resolve(h.db);
  },
}));
jest.mock('../src/services/ids', () => ({ newId: () => require('node:crypto').randomUUID() }));
jest.mock('../src/services/notifications', () => ({
  configureNotifications: jest.fn(),
  rescheduleAll: jest.fn().mockResolvedValue({ scheduled: 0, permission: true }),
}));
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn().mockResolvedValue(false), isEnrolledAsync: jest.fn().mockResolvedValue(false),
  authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
}));
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');
jest.mock('expo-font', () => ({
  useFonts: () => [true, null], isLoaded: () => true, isLoading: () => false, loadAsync: async () => undefined,
}));

async function boot(seed?: (owner: Store, ids: { mom: string; me: string }) => Promise<void>) {
  const db = await freshDb();
  if (seed) {
    const owner = await Store.createFirstOwner(db, 'Propietario Ficticio', { newId: randomUUID });
    const mom = await owner.createProfile({ displayName: 'Mamá Ficticia', relationship: 'madre', isPrimary: true });
    const me = await owner.createProfile({ displayName: 'Perfil Propio Ficticio', relationship: 'yo' });
    await seed(owner, { mom: mom.id, me: me.id });
  }
  return renderRouter('./src/app', { initialUrl: '/' });
}

async function onboard() {
  await screen.findByText('Bienvenido a NeuroCalendario');
  await fireEvent.changeText(screen.getByLabelText('Su nombre (quien administra la app)'), 'Propietario Ficticio');
  await fireEvent.changeText(screen.getByLabelText('¿A quién va a acompañar principalmente?'), 'Mamá Ficticia');
  await fireEvent.press(screen.getByRole('button', { name: 'Comenzar' }));
}

jest.setTimeout(60000);

// Desmonta la app y deja asentarse lo pendiente antes de la prueba siguiente (evita act() solapados).
afterEach(async () => {
  await cleanup();
  await act(async () => { await Promise.resolve(); });
});

describe('flujos de interfaz con SQLite real', () => {
  afterAll(() => holder.close?.());

  it('onboarding crea propietario y perfil, y muestra el perfil activo en la cabecera', async () => {
    await boot();
    await onboard();
    expect(await screen.findByText('Mamá Ficticia')).toBeTruthy();
    expect(screen.getByText('Anotar ahora')).toBeTruthy();
    const rows = await holder.db!.all<{ display_name: string }>('SELECT display_name FROM profiles');
    expect(rows.map((r) => r.display_name)).toEqual(['Mamá Ficticia']);
  });

  it('el registro rápido guarda en SQLite y aparece en el historial', async () => {
    await boot();
    await onboard();
    await screen.findByText('Anotar ahora');
    await fireEvent.press(screen.getByRole('button', { name: 'Dolor de cabeza' }));
    await waitFor(async () => {
      const n = await holder.db!.get<{ n: number }>('SELECT COUNT(*) AS n FROM episodes');
      expect(n!.n).toBe(1);
    });
    const ep = await holder.db!.get<{ kind: string; is_quick: number; profile_id: string; created_by: string }>('SELECT * FROM episodes');
    expect(ep).toMatchObject({ kind: 'Dolor de cabeza', is_quick: 1 });
    const prof = await holder.db!.get<{ id: string }>('SELECT id FROM profiles');
    expect(ep!.profile_id).toBe(prof!.id);
    await fireEvent.press(screen.getAllByText('Síntomas')[0]!);
    expect(await screen.findByText('Anotar un síntoma')).toBeTruthy();
    expect((await screen.findAllByText('Dolor de cabeza')).length).toBeGreaterThan(0);
  });
});
