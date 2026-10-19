import { fireEvent, screen, waitFor } from '@testing-library/react-native';
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
  await fireEvent.changeText(screen.getByLabelText('Su nombre (propietario de la aplicación)'), 'Propietario Ficticio');
  await fireEvent.changeText(screen.getByLabelText('Nombre de la persona principal de seguimiento'), 'Mamá Ficticia');
  await fireEvent.press(screen.getByRole('button', { name: 'Comenzar' }));
}

jest.setTimeout(60000);

describe('flujos de interfaz con SQLite real', () => {
  afterAll(() => holder.close?.());

  it('onboarding crea propietario y perfil, y muestra el perfil activo en la cabecera', async () => {
    await boot();
    await onboard();
    expect(await screen.findByText('Mamá Ficticia')).toBeTruthy();
    expect(screen.getByText('Registro rápido')).toBeTruthy();
    const rows = await holder.db!.all<{ display_name: string }>('SELECT display_name FROM profiles');
    expect(rows.map((r) => r.display_name)).toEqual(['Mamá Ficticia']);
  });

  it('el registro rápido guarda en SQLite y aparece en el historial', async () => {
    await boot();
    await onboard();
    await screen.findByText('Registro rápido');
    await fireEvent.press(screen.getByRole('button', { name: 'Cefalea' }));
    await waitFor(async () => {
      const n = await holder.db!.get<{ n: number }>('SELECT COUNT(*) AS n FROM episodes');
      expect(n!.n).toBe(1);
    });
    const ep = await holder.db!.get<{ kind: string; is_quick: number; profile_id: string; created_by: string }>('SELECT * FROM episodes');
    expect(ep).toMatchObject({ kind: 'Cefalea', is_quick: 1 });
    const prof = await holder.db!.get<{ id: string }>('SELECT id FROM profiles');
    expect(ep!.profile_id).toBe(prof!.id);
    await fireEvent.press(screen.getAllByText('Episodios')[0]!);
    expect(await screen.findByText('Nuevo episodio')).toBeTruthy();
    expect((await screen.findAllByText('Cefalea')).length).toBeGreaterThan(0);
  });
});

describe('separación de perfiles en la interfaz', () => {
  it('cada perfil solo muestra sus propios episodios y el cambio es explícito', async () => {
    await boot(async (o, ids) => {
      await o.create('episode', ids.mom, { startedAt: new Date().toISOString(), kind: 'EPISODIO-DE-MAMA' });
      await o.create('episode', ids.me, { startedAt: new Date().toISOString(), kind: 'EPISODIO-PROPIO' });
    });
    expect(await screen.findByText('Mamá Ficticia')).toBeTruthy();
    await fireEvent.press(screen.getAllByText('Episodios')[0]!);
    expect(await screen.findByText('EPISODIO-DE-MAMA')).toBeTruthy();
    expect(screen.queryByText('EPISODIO-PROPIO')).toBeNull();

    await testRouter.push('/perfiles');
    await fireEvent.press(await screen.findByText('Usar este perfil'));
    expect(await screen.findByText('Perfil Propio Ficticio')).toBeTruthy();
    await fireEvent.press(screen.getAllByText('Episodios')[0]!);
    expect(await screen.findByText('EPISODIO-PROPIO')).toBeTruthy();
    expect(screen.queryByText('EPISODIO-DE-MAMA')).toBeNull();
  });
});

describe('formulario de episodio', () => {
  it('valida el tipo obligatorio y guarda en el perfil activo', async () => {
    await boot(async () => undefined);
    await screen.findByText('Registro rápido');
    await testRouter.push('/episodio/nuevo');
    expect(await screen.findByText(/Se guardará en: Mamá Ficticia/)).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Indique el tipo de episodio')).toBeTruthy();
    expect((await holder.db!.get<{ n: number }>('SELECT COUNT(*) AS n FROM episodes'))!.n).toBe(0);

    await fireEvent.changeText(screen.getByLabelText('Otro tipo / descripción breve'), 'Temblor (ficticio)');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(async () => {
      expect((await holder.db!.get<{ n: number }>('SELECT COUNT(*) AS n FROM episodes'))!.n).toBe(1);
    });
    const ep = await holder.db!.get<{ kind: string; profile_id: string }>('SELECT kind, profile_id FROM episodes');
    const mom = await holder.db!.get<{ id: string }>("SELECT id FROM profiles WHERE display_name = 'Mamá Ficticia'");
    expect(ep).toEqual({ kind: 'Temblor (ficticio)', profile_id: mom!.id });
  });
});
