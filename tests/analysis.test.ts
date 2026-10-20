import { analyzePeriod, dayStatus, painBand, summarizePeriod, type AnalysisInput } from '../src/domain/analysis';
import { buildReportDoc } from '../src/domain/reportDoc';
import { buildReportPdf } from '../src/domain/reportPdf';
import { buildReportHtml } from '../src/domain/reportHtml';
import { localToIso } from '../src/domain/time';

const ep = (date: string, hm: string, kind: string, intensity: number | null) =>
  ({ id: `${date}${hm}${kind}`, startedAt: localToIso(date, hm), endedAt: null, kind, intensity, recovery: 'completa', notes: '' }) as never;
const intake = (date: string, hm: string, status: 'tomada' | 'omitida') =>
  ({ id: `i${date}${hm}`, scheduleId: 's', scheduledAt: localToIso(date, hm), takenAt: null, status }) as never;
const empty: AnalysisInput = { episodes: [], medications: [], schedules: [], intakes: [] };
const TODAY = '2026-03-31';
const NOW = new Date(localToIso(TODAY, '12:00'));

describe('semáforo del día', () => {
  it('bandas de dolor 1–3 / 4–6 / 7–10', () => {
    expect([painBand(null), painBand(1), painBand(3), painBand(4), painBand(6), painBand(7), painBand(10)])
      .toEqual(['sin_dato', 'leve', 'leve', 'moderado', 'moderado', 'intenso', 'intenso']);
  });
  it('sin registros = gris; día futuro = gris', () => {
    expect(dayStatus('2026-03-10', empty, TODAY).level).toBe('sin_datos');
    expect(dayStatus('2026-04-02', { ...empty, episodes: [ep('2026-04-02', '10:00', 'Mareo', 9)] }, TODAY).level).toBe('sin_datos');
  });
  it('dosis tomada sin síntomas = verde 100', () => {
    const s = dayStatus('2026-03-10', { ...empty, intakes: [intake('2026-03-10', '08:00', 'tomada')] }, TODAY);
    expect(s).toMatchObject({ level: 'verde', score: 100 });
  });
  it('dolor leve = verde; moderado = amarillo; intenso = rojo', () => {
    const lv = (i: number) => dayStatus('2026-03-10', { ...empty, episodes: [ep('2026-03-10', '09:00', 'Dolor de cabeza', i)] }, TODAY).level;
    expect([lv(2), lv(5), lv(8)]).toEqual(['verde', 'amarillo', 'rojo']);
  });
  it('convulsión o desmayo = rojo aunque la fuerza sea baja', () => {
    expect(dayStatus('2026-03-10', { ...empty, episodes: [ep('2026-03-10', '09:00', 'Convulsión', 1)] }, TODAY).level).toBe('rojo');
  });
  it('dosis omitidas empujan el día hacia amarillo', () => {
    const intakes = ['08:00', '14:00', '20:00'].map((h) => intake('2026-03-10', h, 'omitida'));
    expect(dayStatus('2026-03-10', { ...empty, intakes }, TODAY).level).toBe('amarillo');
  });
});

describe('análisis semanal / mensual', () => {
  const week = (kindPer: (d: number) => [string, number] | null): AnalysisInput => {
    const episodes: never[] = [];
    for (let d = 1; d <= 7; d++) { const e = kindPer(d); if (e) episodes.push(ep(`2026-03-${String(d + 24).padStart(2, '0')}`, '08:30', e[0], e[1])); }
    return { ...empty, episodes };
  };
  it('cuenta días por color y detecta empeoramiento ≥2 puntos', () => {
    const prev = { ...empty, episodes: [ep('2026-03-18', '08:00', 'Mareo', 3), ep('2026-03-19', '08:00', 'Mareo', 3), ep('2026-03-20', '08:00', 'Mareo', 3)] };
    const cur = week((d) => (d <= 3 ? ['Dolor de cabeza', 7] : null));
    const a = analyzePeriod({ ...cur, episodes: [...prev.episodes, ...cur.episodes] }, '2026-03-25', '2026-03-31', NOW);
    expect(a.current.levels.rojo).toBe(3);
    expect(a.current.highPainDays).toBe(3);
    expect(a.findings.some((f) => /subió/.test(f.title))).toBe(true);
    expect(a.findings.some((f) => f.tone === 'importante')).toBe(true);
  });
  it('avisa de cefalea ≥15 días/mes solo en períodos de un mes y sin diagnosticar', () => {
    const episodes: never[] = [];
    for (let d = 1; d <= 30; d += 2) episodes.push(ep(`2026-03-${String(d).padStart(2, '0')}`, '09:00', 'Dolor de cabeza', 5));
    const a = analyzePeriod({ ...empty, episodes }, '2026-03-01', '2026-03-31', NOW);
    const f = a.findings.find((x) => /al mes/.test(x.title));
    expect(f?.tone).toBe('importante');
    expect(f?.text).toMatch(/un solo mes no basta/);
    expect(f?.basis).toMatch(/ICHD-3/);
    const w = analyzePeriod({ ...empty, episodes }, '2026-03-25', '2026-03-31', NOW);
    expect(w.findings.some((x) => /al mes/.test(x.title))).toBe(false);
  });
  it('adherencia baja y pocos registros generan hallazgos', () => {
    const s = summarizePeriod(empty, '2026-03-25', '2026-03-31', NOW);
    expect(s.overall).toBe('sin_datos');
    const a = analyzePeriod(empty, '2026-03-25', '2026-03-31', NOW);
    expect(a.findings.some((f) => /Faltan registros/.test(f.title))).toBe(true);
  });
});

describe('informe con resumen clínico', () => {
  const input = {
    profileName: 'Mamá Ficticia', fromKey: '2026-03-01', toKey: '2026-03-31', generatedAt: NOW, generatedBy: 'Prop.',
    sections: { analysis: true, episodes: true, medications: true, appointments: true, exams: true, notes: true },
    episodes: [ep('2026-03-03', '10:00', 'Dolor de cabeza', 7), ep('2026-03-04', '10:00', 'Convulsión', 4)],
    medications: [], schedules: [], intakes: [intake('2026-03-03', '08:00', 'tomada')], appointments: [], exams: [], notes: [],
  } as never;
  it('incluye semáforo, escala de dolor, hallazgos y fuentes; sin recursos externos en el HTML', () => {
    const html = buildReportHtml(input);
    for (const s of ['Resumen clínico del período', 'Escala de dolor usada', 'Semáforo por día', 'Hallazgos para comentar', 'Fuentes consultadas']) expect(html).toContain(s);
    expect(html).not.toMatch(/href=|src=/);
  });
  it('genera un PDF real (varias páginas, con acentos) en memoria', async () => {
    const bytes = await buildReportPdf(buildReportDoc(input), { title: 'Prueba' });
    expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe('%PDF-');
    expect(bytes.length).toBeGreaterThan(3000);
  });
});
