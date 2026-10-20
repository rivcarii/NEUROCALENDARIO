import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Switch } from 'react-native';
import { Button, Card, Chips, DateTimeField, ErrorBox, P, ProfileBar, Row, Screen, errorMessage } from '../components/ui';
import { buildReportDoc, DISCLAIMER, type ReportSections } from '../domain/reportDoc';
import { buildReportHtml } from '../domain/reportHtml';
import { addDays, localDateKey } from '../domain/time';
import { useActive } from '../services/session';
import { downloadWebPdf, makeWebPdf, openWebPdf, shareWebPdf, type WebPdf } from '../services/pdfOut';

const PRESETS = [{ value: 7, label: '7 días' }, { value: 30, label: '30 días' }, { value: 90, label: '90 días' }, { value: 365, label: '1 año' }, { value: 0, label: 'Personalizado' }];
const LABELS: Record<keyof ReportSections, string> = {
  analysis: 'Resumen clínico: semáforo, escala de dolor y hallazgos', episodes: 'Síntomas y cómo ha estado', medications: 'Medicinas y lo que tomó',
  appointments: 'Citas', exams: 'Estudios y resultados', notes: 'Notas',
};
const KEYS = ['analysis', 'episodes', 'medications', 'appointments', 'exams', 'notes'] as const;

export default function Informes() {
  const { store, profile, account } = useActive();
  const params = useLocalSearchParams<{ desde?: string; hasta?: string }>();
  const today = localDateKey(new Date());
  const given = !!params.desde && !!params.hasta;
  const [preset, setPreset] = useState(given ? 0 : 30);
  const [from, setFrom] = useState(params.desde ?? addDays(today, -29));
  const [to, setTo] = useState(params.hasta ?? today);
  const [sections, setSections] = useState<ReportSections>({ analysis: true, episodes: true, medications: true, appointments: true, exams: true, notes: false });
  const [busy, setBusy] = useState(false);
  const [web, setWeb] = useState<WebPdf | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function pick(p: number) {
    setPreset(p); setWeb(null);
    if (p) { setTo(today); setFrom(addDays(today, -p + 1)); }
  }

  async function generate() {
    if (from > to) { Alert.alert('Período no válido', 'La fecha inicial no puede ser posterior a la final.'); return; }
    if (!Object.values(sections).some(Boolean)) { Alert.alert('Seleccione contenido', 'Elija al menos una sección.'); return; }
    setBusy(true); setErr(null);
    try {
      const [episodes, medications, schedules, intakes, appointments, exams, notes] = await Promise.all(
        (['episode', 'medication', 'schedule', 'intake', 'appointment', 'exam', 'note'] as const).map((e) => store.list(e, profile.id)),
      );
      const input = {
        profileName: profile.displayName, fromKey: from, toKey: to, generatedAt: new Date(), generatedBy: account.displayName, sections,
        episodes: episodes as never, medications: medications as never, schedules: schedules as never, intakes: intakes as never,
        appointments: appointments as never, exams: exams as never, notes: notes as never,
      };
      const stamp = new Date().toISOString().slice(0, 10);
      const safeName = profile.displayName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '_').slice(0, 30) || 'perfil' // solo ASCII: algunos navegadores ignoran nombres con acentos;
      const fileName = `Informe_${safeName}_${stamp}.pdf`;
      const used = Object.entries(sections).filter(([, v]) => v).map(([k]) => k);
      if (Platform.OS === 'web') {
        // El navegador (y la app instalada en iPhone) no tiene «Guardar como PDF» fiable: el PDF se dibuja aquí mismo.
        const { buildReportPdf } = await import('../domain/reportPdf'); // carga diferida: la librería solo se descarga al crear el PDF
        const bytes = await buildReportPdf(buildReportDoc(input), { title: `Resumen de seguimiento - ${profile.displayName}` });
        const pdf = makeWebPdf(bytes, fileName);
        setWeb(pdf);
        await store.logReport(profile.id, from, to, used);
        const r = await shareWebPdf(pdf, 'Resumen de seguimiento');
        if (r === 'no_disponible') downloadWebPdf(pdf);
        return;
      }
      const { uri } = await Print.printToFileAsync({ html: buildReportHtml(input), width: 595, height: 842 });
      const out = new File(Paths.cache, fileName);
      if (out.exists) out.delete();
      new File(uri).move(out);
      await store.logReport(profile.id, from, to, used);
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(out.uri, { mimeType: 'application/pdf', dialogTitle: 'Resumen de seguimiento', UTI: 'com.adobe.pdf' });
      else Alert.alert('Resumen listo', `Archivo: ${out.uri}`);
    } catch (e) { setErr(errorMessage(e)); Alert.alert('No se pudo crear el resumen', errorMessage(e)); } finally { setBusy(false); }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Resumen para el médico' }} />
      <ProfileBar name={profile.displayName} color={profile.color} label="Resumen de" />
      <Screen>
        <Chips label="¿De cuándo?" options={PRESETS} value={preset} onChange={pick} />
        {preset === 0 ? (
          <>
            <DateTimeField label="Desde" withTime={false} date={from} onChange={(d) => { if (d) { setFrom(d); setWeb(null); } }} />
            <DateTimeField label="Hasta" withTime={false} date={to} onChange={(d) => { if (d) { setTo(d); setWeb(null); } }} />
          </>
        ) : null}
        <Card>
          {KEYS.map((k) => (
            <Row key={k}>
              <Switch accessibilityLabel={LABELS[k]} value={sections[k] ?? false} onValueChange={(v) => { setSections({ ...sections, [k]: v }); setWeb(null); }} />
              <P style={{ flex: 1 } as never}>{LABELS[k]}</P>
            </Row>
          ))}
        </Card>
        <P muted small>{DISCLAIMER}</P>
        <P muted small>El PDF se crea en este dispositivo. Al compartirlo, usted decide con quién. Quien lo reciba ya no estará protegido por esta aplicación.</P>
        <Button title="Crear y compartir PDF" onPress={generate} loading={busy} />
        {err ? <ErrorBox message={`No se pudo crear el resumen: ${err}`} /> : null}
        {web ? (
          <Card>
            <P>✔ El PDF está listo: {web.name}</P>
            <P muted small>Si no se abrió el menú de compartir, use uno de estos botones.</P>
            <Row>
              <Button title="Descargar PDF" kind="secondary" onPress={() => downloadWebPdf(web)} />
              <Button title="Abrir PDF" kind="secondary" onPress={() => openWebPdf(web)} />
            </Row>
          </Card>
        ) : null}
      </Screen>
    </>
  );
}
