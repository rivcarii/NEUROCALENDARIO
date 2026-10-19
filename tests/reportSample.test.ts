import { writeFileSync } from 'node:fs';
import { buildReportHtml } from '../src/domain/report';
import { localToIso } from '../src/domain/time';
import { makeFixture } from './helpers/nodeDriver';

// Genera un HTML de ejemplo con datos FICTICIOS para verificar la conversión a PDF
// (scripts/verify-report-pdf.sh). Solo escribe si REPORT_HTML_OUT está definido.
const out = process.env.REPORT_HTML_OUT;
(out ? it : it.skip)('escribe un informe de ejemplo', async () => {
  const f = await makeFixture();
  for (let i = 0; i < 25; i++) {
    const day = `2026-03-${String(1 + (i % 28)).padStart(2, '0')}`;
    await f.owner.create('episode', f.mom, {
      startedAt: localToIso(day, '10:00'), endedAt: i % 3 ? localToIso(day, '10:20') : null,
      kind: i % 2 ? 'Cefalea (ficticia)' : 'Mareo (ficticio)', intensity: i % 10, notes: `Observación ficticia ${i} & <b>`,
    });
  }
  const m = await f.owner.create('medication', f.mom, { name: 'Medicamento ficticio', doseText: '1 comp' });
  await f.owner.create('schedule', f.mom, { medicationId: m.id, times: ['08:00', '20:00'], startDate: '2026-03-01' });
  await f.owner.create('exam', f.mom, { name: 'Resonancia ficticia', examDate: '2026-03-05', status: 'con_resultado', resultText: 'Texto ficticio', resultSource: 'informe_medico' });
  await f.owner.create('appointment', f.mom, { title: 'Control ficticio', startsAt: localToIso('2026-03-20', '09:00'), provider: 'Dra. Ficticia' });
  const [episodes, medications, schedules, intakes, appointments, exams, notes] = await Promise.all(
    (['episode', 'medication', 'schedule', 'intake', 'appointment', 'exam', 'note'] as const).map((e) => f.owner.list(e, f.mom)),
  );
  const html = buildReportHtml({
    profileName: 'Perfil Mamá (ficticio)', fromKey: '2026-03-01', toKey: '2026-03-31', generatedAt: new Date('2026-04-01T12:00:00Z'), generatedBy: 'Propietario Ficticio',
    sections: { episodes: true, medications: true, appointments: true, exams: true, notes: true },
    episodes: episodes as never, medications: medications as never, schedules: schedules as never, intakes: intakes as never,
    appointments: appointments as never, exams: exams as never, notes: notes as never,
  });
  writeFileSync(out!, html);
  f.close();
});
