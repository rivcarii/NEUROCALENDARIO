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

describe('formulario de episodio', () => {
  it('valida el tipo obligatorio y guarda en el perfil activo', async () => {
    await boot(async () => undefined);
    await screen.findByText('Anotar ahora');
    await testRouter.push('/episodio/nuevo');
    expect(await screen.findByText(/Se guardará en: Mamá Ficticia/)).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Cuéntenos qué sintió')).toBeTruthy();
    expect((await holder.db!.get<{ n: number }>('SELECT COUNT(*) AS n FROM episodes'))!.n).toBe(0);

    await fireEvent.changeText(screen.getByLabelText('Otro, o descríbalo con sus palabras'), 'Temblor (ficticio)');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(async () => {
      expect((await holder.db!.get<{ n: number }>('SELECT COUNT(*) AS n FROM episodes'))!.n).toBe(1);
    });
    const ep = await holder.db!.get<{ kind: string; profile_id: string }>('SELECT kind, profile_id FROM episodes');
    const mom = await holder.db!.get<{ id: string }>("SELECT id FROM profiles WHERE display_name = 'Mamá Ficticia'");
    expect(ep).toEqual({ kind: 'Temblor (ficticio)', profile_id: mom!.id });
  });
});
