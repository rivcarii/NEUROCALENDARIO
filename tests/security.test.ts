import { AccessDeniedError, NotFoundError, ValidationError } from '../src/db/errors';
import { Store } from '../src/db/store';
import { makeFixture, newId, type Fixture } from './helpers/nodeDriver';

let f: Fixture;
beforeEach(async () => { f = await makeFixture(); });
afterEach(() => f.close());

describe('separación entre perfiles (mismo propietario)', () => {
  it('un id de otro perfil no es accesible usando el perfil activo', async () => {
    const e = await f.owner.create('episode', f.mom, { startedAt: '2026-04-01T09:00:00.000Z', kind: 'SOLO-MAMA' });
    expect(await f.owner.get('episode', f.me, e.id)).toBeUndefined();
    await expect(f.owner.update('episode', f.me, e.id, { intensity: 9 })).rejects.toBeInstanceOf(NotFoundError);
    await expect(f.owner.remove('episode', f.me, e.id)).rejects.toBeInstanceOf(NotFoundError);
    expect(await f.owner.list('episode', f.me)).toHaveLength(0);
    expect((await f.owner.get('episode', f.mom, e.id))?.intensity).toBeNull(); // intacto
  });

  it('no permite referencias cruzadas entre perfiles', async () => {
    const medMom = await f.owner.create('medication', f.mom, { name: 'M (ficticio)' });
    await expect(f.owner.create('schedule', f.me, { medicationId: medMom.id, times: ['08:00'], startDate: '2026-01-01' }))
      .rejects.toBeInstanceOf(ValidationError);
    await expect(f.owner.create('episode', f.me, { startedAt: '2026-01-01T00:00:00.000Z', kind: 'x', relatedMedicationIds: [medMom.id] }))
      .rejects.toBeInstanceOf(ValidationError);
    await expect(f.owner.create('intake', f.me, { medicationId: medMom.id, status: 'tomada' }))
      .rejects.toBeInstanceOf(ValidationError);
    const exMom = await f.owner.create('exam', f.mom, { name: 'E', examDate: '2026-01-01' });
    await expect(f.owner.create('document', f.me, {
      title: 't', fileName: 'a.pdf', mimeType: 'application/pdf', sizeBytes: 5, sha256: 'b'.repeat(64),
      storagePath: `attachments/${f.mom}/p.pdf`, linkedEntity: 'exam', linkedId: exMom.id,
    })).rejects.toBeInstanceOf(ValidationError);
  });

  it('un documento no puede apuntar a archivos de otro perfil ni salir de su carpeta', async () => {
    const base = { title: 't', fileName: 'a.pdf', mimeType: 'application/pdf' as const, sizeBytes: 5, sha256: 'b'.repeat(64) };
    await expect(f.owner.create('document', f.me, { ...base, storagePath: `attachments/${f.mom}/x.pdf` })).rejects.toBeInstanceOf(ValidationError);
    await expect(f.owner.create('document', f.me, { ...base, storagePath: `attachments/${f.me}/../${f.mom}/x.pdf` })).rejects.toBeInstanceOf(ValidationError);
    await expect(f.owner.create('document', f.me, { ...base, storagePath: `attachments/${f.me}/x.pdf`, linkedEntity: 'constructor', linkedId: 'x' })).rejects.toBeInstanceOf(ValidationError);
    const ok = await f.owner.create('document', f.me, { ...base, storagePath: `attachments/${f.me}/x.pdf` });
    await expect(f.owner.update('document', f.me, ok.id, { storagePath: `attachments/${f.mom}/x.pdf` })).rejects.toBeInstanceOf(ValidationError);
  });

  it('un patch no puede mover un registro a otro perfil ni suplantar autoría', async () => {
    const n = await f.owner.create('note', f.mom, { body: 'x', noteDate: '2026-01-01' });
    await f.owner.update('note', f.mom, n.id, { body: 'y', profileId: f.me, createdBy: 'otro' } as never);
    expect((await f.owner.get('note', f.mom, n.id))?.createdBy).toBe(f.owner.accountId);
    expect(await f.owner.list('note', f.me)).toHaveLength(0);
  });

  it('filtros no permitidos y SQL malicioso no se interpretan', async () => {
    await f.owner.create('note', f.mom, { body: 'ok', noteDate: '2026-01-01' });
    await expect(f.owner.list('note', f.mom, { where: { 'body; DROP TABLE notes': 'x' } })).rejects.toBeInstanceOf(ValidationError);
    expect(await f.owner.list('note', f.mom, { search: "'; DROP TABLE notes; --" })).toHaveLength(0);
    expect(await f.owner.list('note', f.mom)).toHaveLength(1);
  });
});

describe('permisos familiares', () => {
  it('sin permiso explícito no hay acceso de ningún tipo', async () => {
    const e = await f.owner.create('note', f.mom, { body: 'privada', noteDate: '2026-01-01' });
    const fam = await f.owner.createFamilyAccount('Familiar ficticio');
    const s = f.owner.as(fam.id);
    await expect(s.list('note', f.mom)).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(s.get('note', f.mom, e.id)).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(s.create('note', f.mom, { body: 'x', noteDate: '2026-01-01' })).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(s.update('note', f.mom, e.id, { body: 'x' })).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(s.remove('note', f.mom, e.id)).rejects.toBeInstanceOf(AccessDeniedError);
    expect(await s.listProfiles()).toHaveLength(0);
    expect(await s.getProfile(f.mom)).toBeUndefined();
    await expect(s.listAudit(f.mom)).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it('lectura no permite escribir; escritura no permite administrar', async () => {
    const fam = await f.owner.createFamilyAccount('Familiar ficticio');
    const n = await f.owner.create('note', f.mom, { body: 'a', noteDate: '2026-01-01' });
    await f.owner.grant(f.mom, fam.id, 'read');
    const s = f.owner.as(fam.id);
    expect(await s.list('note', f.mom)).toHaveLength(1);
    await expect(s.create('note', f.mom, { body: 'x', noteDate: '2026-01-01' })).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(s.remove('note', f.mom, n.id)).rejects.toBeInstanceOf(AccessDeniedError);
    // el perfil de «yo» sigue invisible
    await expect(s.list('note', f.me)).rejects.toBeInstanceOf(AccessDeniedError);

    await f.owner.grant(f.mom, fam.id, 'write');
    const mine = await s.create('note', f.mom, { body: 'del familiar', noteDate: '2026-01-02' });
    expect(mine.createdBy).toBe(fam.id);
    await expect(s.grant(f.mom, fam.id, 'admin')).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(s.deleteProfile(f.mom)).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(s.updateProfile(f.mom, { displayName: 'hack' })).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it('la revocación es inmediata', async () => {
    const fam = await f.owner.createFamilyAccount('Familiar ficticio');
    await f.owner.grant(f.mom, fam.id, 'write');
    const s = f.owner.as(fam.id);
    await s.create('note', f.mom, { body: 'a', noteDate: '2026-01-01' });
    await f.owner.revoke(f.mom, fam.id);
    await expect(s.list('note', f.mom)).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(s.create('note', f.mom, { body: 'b', noteDate: '2026-01-01' })).rejects.toBeInstanceOf(AccessDeniedError);
    // vuelve a conceder
    await f.owner.grant(f.mom, fam.id, 'read');
    expect(await s.list('note', f.mom)).toHaveLength(1);
  });

  it('cuentas familiares no pueden crear perfiles ni cuentas; el propietario no puede ser revocado', async () => {
    const fam = await f.owner.createFamilyAccount('Familiar ficticio');
    const s = f.owner.as(fam.id);
    await expect(s.createProfile({ displayName: 'x' })).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(s.createFamilyAccount('y')).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(s.listAccounts()).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(f.owner.revoke(f.mom, f.owner.accountId)).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it('un tercero con id de cuenta inexistente o suplantado no accede', async () => {
    await f.owner.create('note', f.mom, { body: 'a', noteDate: '2026-01-01' });
    const ghost = f.owner.as(newId());
    await expect(ghost.list('note', f.mom)).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(ghost.createProfile({ displayName: 'x' })).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it('dos propietarios distintos no se ven entre sí', async () => {
    // Un segundo propietario no puede crearse con createFirstOwner (ya hay uno)...
    await expect(Store.createFirstOwner(f.db, 'Otro', { newId })).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it('eliminar el perfil borra sus datos y no toca el otro', async () => {
    await f.owner.create('note', f.mom, { body: 'a', noteDate: '2026-01-01' });
    await f.owner.create('note', f.me, { body: 'b', noteDate: '2026-01-01' });
    await f.owner.deleteProfile(f.mom);
    const left = await f.db.all<{ profile_id: string }>('SELECT profile_id FROM notes');
    expect(left.map((x) => x.profile_id)).toEqual([f.me]);
    const orphan = await f.db.all('SELECT * FROM permissions WHERE profile_id = ?', [f.mom]);
    expect(orphan).toHaveLength(0);
  });
});

describe('integridad referencial', () => {
  it('la base impide filas huérfanas y perfiles inexistentes', async () => {
    await expect(f.db.run(
      `INSERT INTO notes (id, profile_id, created_at, updated_at, created_by, updated_by, body, note_date)
       VALUES ('n','no-existe','t','t',?,?,'b','2026-01-01')`, [f.owner.accountId, f.owner.accountId],
    )).rejects.toThrow();
  });
});
