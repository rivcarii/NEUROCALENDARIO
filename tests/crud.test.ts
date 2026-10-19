import { ValidationError, NotFoundError } from '../src/db/errors';
import { makeFixture, type Fixture } from './helpers/nodeDriver';

let f: Fixture;
beforeEach(async () => { f = await makeFixture(); });
afterEach(() => f.close());

describe('CRUD de episodios', () => {
  it('crea, consulta, edita y elimina', async () => {
    const e = await f.owner.create('episode', f.mom, {
      startedAt: '2026-04-01T09:00:00.000Z', kind: 'Temblor (ficticio)', intensity: 4,
    });
    expect(e.profileId).toBe(f.mom);
    expect(e.createdBy).toBe(f.owner.accountId);
    expect(e.recovery).toBe('desconocida');
    const got = await f.owner.get('episode', f.mom, e.id);
    expect(got?.kind).toBe('Temblor (ficticio)');
    const upd = await f.owner.update('episode', f.mom, e.id, { intensity: 7, endedAt: '2026-04-01T09:30:00.000Z' });
    expect(upd.intensity).toBe(7);
    await f.owner.remove('episode', f.mom, e.id);
    expect(await f.owner.get('episode', f.mom, e.id)).toBeUndefined();
  });

  it('rechaza fin anterior al inicio e intensidad fuera de rango', async () => {
    await expect(f.owner.create('episode', f.mom, {
      startedAt: '2026-04-01T09:00:00.000Z', endedAt: '2026-04-01T08:00:00.000Z', kind: 'x',
    })).rejects.toBeInstanceOf(ValidationError);
    await expect(f.owner.create('episode', f.mom, {
      startedAt: '2026-04-01T09:00:00.000Z', kind: 'x', intensity: 11,
    })).rejects.toBeInstanceOf(ValidationError);
    await expect(f.owner.create('episode', f.mom, { startedAt: 'ayer', kind: 'x' })).rejects.toBeInstanceOf(ValidationError);
  });

  it('actualizar o eliminar un id inexistente da NotFound', async () => {
    await expect(f.owner.update('episode', f.mom, 'nope', { intensity: 1 })).rejects.toBeInstanceOf(NotFoundError);
    await expect(f.owner.remove('episode', f.mom, 'nope')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('filtra por período, texto y orden', async () => {
    for (const [d, k] of [['2026-05-01', 'Cefalea'], ['2026-05-10', 'Mareo'], ['2026-06-01', 'Cefalea']] as const) {
      await f.owner.create('episode', f.mom, { startedAt: `${d}T10:00:00.000Z`, kind: `${k} (ficticio)` });
    }
    const may = await f.owner.list('episode', f.mom, { from: '2026-05-01T00:00:00.000Z', to: '2026-06-01T00:00:00.000Z', order: 'asc' });
    expect(may.map((e) => e.startedAt.slice(0, 10))).toEqual(['2026-05-01', '2026-05-10']);
    expect(await f.owner.list('episode', f.mom, { search: 'cefalea' })).toHaveLength(2);
    expect(await f.owner.list('episode', f.mom, { search: '%' })).toHaveLength(0); // comodín escapado
  });
});

describe('citas, exámenes, notas, documentos', () => {
  it('maneja las demás entidades', async () => {
    const a = await f.owner.create('appointment', f.mom, { title: 'Control (ficticio)', startsAt: '2026-07-01T15:00:00.000Z', remindMinutesBefore: 60 });
    expect(a.status).toBe('programada');
    const ex = await f.owner.create('exam', f.mom, { name: 'Resonancia (ficticia)', examDate: '2026-07-02' });
    expect(ex.resultSource).toBe('declarado_por_usuario');
    const u = await f.owner.update('exam', f.mom, ex.id, { status: 'con_resultado', resultText: 'sin hallazgos (ficticio)', resultSource: 'informe_medico' });
    expect(u.resultSource).toBe('informe_medico');
    const n = await f.owner.create('note', f.mom, { body: 'Nota del cuidador', authorRole: 'cuidador', noteDate: '2026-07-03' });
    expect(n.authorRole).toBe('cuidador');
    await expect(f.owner.create('note', f.mom, { body: '  ', noteDate: '2026-07-03' })).rejects.toBeInstanceOf(ValidationError);
    const d = await f.owner.create('document', f.mom, {
      title: 'Informe', fileName: 'i.pdf', mimeType: 'application/pdf', sizeBytes: 1000,
      sha256: 'a'.repeat(64), storagePath: 'docs/x.pdf', linkedEntity: 'exam', linkedId: ex.id,
    });
    // Eliminar el examen desvincula el documento sin dejar referencias rotas
    await f.owner.remove('exam', f.mom, ex.id);
    const d2 = await f.owner.get('document', f.mom, d.id);
    expect(d2?.linkedId).toBeNull();
  });

  it('rechaza tipos de archivo y tamaños no permitidos', async () => {
    const base = { title: 't', fileName: 'x', sizeBytes: 10, sha256: 'a'.repeat(64), storagePath: 'p' };
    await expect(f.owner.create('document', f.mom, { ...base, mimeType: 'application/x-msdownload' as never })).rejects.toBeInstanceOf(ValidationError);
    await expect(f.owner.create('document', f.mom, { ...base, mimeType: 'application/pdf', sizeBytes: 16 * 1024 * 1024 })).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('medicamentos, pautas e ingestas', () => {
  it('evita duplicados de ingesta y limpia dependientes al eliminar', async () => {
    const m = await f.owner.create('medication', f.mom, { name: 'Medicamento X (ficticio)', doseText: '1 comp' });
    const s = await f.owner.create('schedule', f.mom, { medicationId: m.id, times: ['08:00', '20:00'], startDate: '2026-08-01' });
    const at = '2026-08-01T08:00:00.000Z';
    const a = await f.owner.recordIntake(f.mom, { medicationId: m.id, scheduleId: s.id, scheduledAt: at, takenAt: at, status: 'tomada' });
    const b = await f.owner.recordIntake(f.mom, { medicationId: m.id, scheduleId: s.id, scheduledAt: at, status: 'omitida' });
    expect(b.id).toBe(a.id);
    expect(b.status).toBe('omitida');
    expect(await f.owner.list('intake', f.mom)).toHaveLength(1);

    const ep = await f.owner.create('episode', f.mom, { startedAt: at, kind: 'x', relatedMedicationIds: [m.id] });
    await f.owner.remove('medication', f.mom, m.id);
    expect(await f.owner.list('schedule', f.mom)).toHaveLength(0);
    expect(await f.owner.list('intake', f.mom)).toHaveLength(0);
    expect((await f.owner.get('episode', f.mom, ep.id))?.relatedMedicationIds).toEqual([]);
  });

  it('valida horas y días de la pauta', async () => {
    const m = await f.owner.create('medication', f.mom, { name: 'M (ficticio)' });
    await expect(f.owner.create('schedule', f.mom, { medicationId: m.id, times: ['25:00'], startDate: '2026-08-01' })).rejects.toBeInstanceOf(ValidationError);
    await expect(f.owner.create('schedule', f.mom, { medicationId: m.id, times: [], startDate: '2026-08-01' })).rejects.toBeInstanceOf(ValidationError);
    await expect(f.owner.create('schedule', f.mom, { medicationId: m.id, times: ['08:00'], startDate: '2026-08-01', endDate: '2026-07-01' })).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('auditoría y cola de sincronización', () => {
  it('audita autoría sin guardar contenido clínico', async () => {
    const e = await f.owner.create('episode', f.mom, { startedAt: '2026-04-01T09:00:00.000Z', kind: 'DIAGNOSTICO-SECRETO', notes: 'TEXTO-CLINICO' });
    await f.owner.update('episode', f.mom, e.id, { intensity: 3 });
    const log = await f.owner.listAudit(f.mom);
    expect(log.map((l) => l.action)).toEqual(expect.arrayContaining(['create', 'update']));
    expect(JSON.stringify(log)).not.toMatch(/DIAGNOSTICO-SECRETO|TEXTO-CLINICO/);
    expect(log.find((l) => l.action === 'update')?.detail).toBe('intensity');
  });

  it('solo encola cambios cuando la sincronización está activa', async () => {
    await f.owner.create('note', f.mom, { body: 'a', noteDate: '2026-01-01' });
    expect(await f.db.all('SELECT * FROM sync_queue')).toHaveLength(0);
    await f.owner.setSetting('sync_enabled', '1');
    const n = await f.owner.create('note', f.mom, { body: 'b', noteDate: '2026-01-01' });
    await f.owner.remove('note', f.mom, n.id);
    const q = await f.db.all<{ op: string }>('SELECT op FROM sync_queue ORDER BY queued_at, rowid');
    expect(q.map((x) => x.op)).toEqual(['upsert', 'delete']);
  });
});
