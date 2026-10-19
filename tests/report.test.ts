import { buildReportHtml, computeAdherence, DISCLAIMER, esc } from '../src/domain/report';
import { localToIso } from '../src/domain/time';
import { makeFixture } from './helpers/nodeDriver';

describe('informe', () => {
  it('escapa HTML y contiene período, advertencia, tablas y gráfico', async () => {
    const f = await makeFixture();
    await f.owner.create('episode', f.mom, {
      startedAt: localToIso('2026-03-03', '10:00'), endedAt: localToIso('2026-03-03', '10:45'),
      kind: '<script>alert(1)</script>', intensity: 5, notes: 'a & b',
    });
    await f.owner.create('episode', f.mom, { startedAt: localToIso('2026-05-03', '10:00'), kind: 'FUERA-DE-PERIODO' });
    const [episodes, medications, schedules, intakes, appointments, exams, notes] = await Promise.all(
      (['episode', 'medication', 'schedule', 'intake', 'appointment', 'exam', 'note'] as const).map((e) => f.owner.list(e, f.mom)),
    );
    const html = buildReportHtml({
      profileName: 'Perfil <b>Mamá</b>', fromKey: '2026-03-01', toKey: '2026-03-31',
      generatedAt: new Date('2026-04-01T12:00:00Z'), generatedBy: 'Propietario',
      sections: { episodes: true, medications: true, appointments: true, exams: true, notes: true },
      episodes: episodes as never, medications: medications as never, schedules: schedules as never, intakes: intakes as never,
      appointments: appointments as never, exams: exams as never, notes: notes as never,
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('Perfil &lt;b&gt;Mamá&lt;/b&gt;');
    expect(html).toContain('01/03/2026 a 31/03/2026');
    expect(html).toContain(esc(DISCLAIMER));
    expect(html).toContain('<svg');
    expect(html).toContain('45 min');
    expect(html).not.toContain('FUERA-DE-PERIODO');
    expect(html).not.toMatch(/https?:\/\//); // sin recursos externos
    f.close();
  });

  it('calcula adherencia solo sobre tomas ya vencidas', () => {
    const med = { id: 'm', name: 'M' } as never;
    const sch = { id: 's', medicationId: 'm', times: ['08:00', '20:00'], daysOfWeek: null, startDate: '2026-03-01', endDate: null } as never;
    const intakes = [
      { scheduleId: 's', scheduledAt: localToIso('2026-03-01', '08:00'), status: 'tomada' },
      { scheduleId: 's', scheduledAt: localToIso('2026-03-01', '20:00'), status: 'omitida' },
    ] as never;
    const now = new Date(localToIso('2026-03-02', '09:00'));
    const [a] = computeAdherence([med], [sch], intakes, '2026-03-01', '2026-03-05', now);
    expect(a).toMatchObject({ scheduled: 3, taken: 1, skipped: 1, unrecorded: 1 });
  });
});
