import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, Switch } from 'react-native';
import { Button, Card, Chips, DateTimeField, P, ProfileBar, Row, Screen, errorMessage } from '../components/ui';
import { buildReportHtml, DISCLAIMER, type ReportSections } from '../domain/report';
import { addDays, localDateKey } from '../domain/time';
import { useActive } from '../services/session';

const PRESETS = [{ value: 30, label: '30 días' }, { value: 90, label: '90 días' }, { value: 365, label: '1 año' }, { value: 0, label: 'Personalizado' }];
const LABELS: Record<keyof ReportSections, string> = {
  episodes: 'Episodios y estadísticas', medications: 'Medicamentos y tomas', appointments: 'Citas', exams: 'Exámenes y resultados', notes: 'Notas',
};

export default function Informes() {
  const { store, profile, account } = useActive();
  const today = localDateKey(new Date());
  const [preset, setPreset] = useState(90);
  const [from, setFrom] = useState(addDays(today, -89));
  const [to, setTo] = useState(today);
  const [sections, setSections] = useState<ReportSections>({ episodes: true, medications: true, appointments: true, exams: true, notes: false });
  const [busy, setBusy] = useState(false);

  function pick(p: number) {
    setPreset(p);
    if (p) { setTo(today); setFrom(addDays(today, -p + 1)); }
  }

  async function generate() {
    if (from > to) { Alert.alert('Período no válido', 'La fecha inicial no puede ser posterior a la final.'); return; }
    if (!Object.values(sections).some(Boolean)) { Alert.alert('Seleccione contenido', 'Elija al menos una sección.'); return; }
    setBusy(true);
    try {
      const [episodes, medications, schedules, intakes, appointments, exams, notes] = await Promise.all(
        (['episode', 'medication', 'schedule', 'intake', 'appointment', 'exam', 'note'] as const).map((e) => store.list(e, profile.id)),
      );
      const html = buildReportHtml({
        profileName: profile.displayName, fromKey: from, toKey: to, generatedAt: new Date(), generatedBy: account.displayName, sections,
        episodes: episodes as never, medications: medications as never, schedules: schedules as never, intakes: intakes as never,
        appointments: appointments as never, exams: exams as never, notes: notes as never,
      });
      const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 });
      const stamp = new Date().toISOString().slice(0, 10);
      const safeName = profile.displayName.replace(/[^\p{L}\p{N}]+/gu, '_').slice(0, 30);
      const out = new File(Paths.cache, `Informe_${safeName}_${stamp}.pdf`);
      if (out.exists) out.delete();
      new File(uri).move(out);
      await store.logReport(profile.id, from, to, Object.entries(sections).filter(([, v]) => v).map(([k]) => k));
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(out.uri, { mimeType: 'application/pdf', dialogTitle: 'Informe de seguimiento', UTI: 'com.adobe.pdf' });
      else Alert.alert('Informe generado', `Archivo: ${out.uri}`);
    } catch (e) { Alert.alert('No se pudo generar el informe', errorMessage(e)); } finally { setBusy(false); }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Informes PDF' }} />
      <ProfileBar name={profile.displayName} color={profile.color} label="Informe de" />
      <Screen>
        <Chips label="Período" options={PRESETS} value={preset} onChange={pick} />
        {preset === 0 ? (
          <>
            <DateTimeField label="Desde" withTime={false} date={from} onChange={(d) => d && setFrom(d)} />
            <DateTimeField label="Hasta" withTime={false} date={to} onChange={(d) => d && setTo(d)} />
          </>
        ) : null}
        <Card>
          {(Object.keys(LABELS) as (keyof ReportSections)[]).map((k) => (
            <Row key={k}>
              <Switch accessibilityLabel={LABELS[k]} value={sections[k]} onValueChange={(v) => setSections({ ...sections, [k]: v })} />
              <P>{LABELS[k]}</P>
            </Row>
          ))}
        </Card>
        <P muted small>{DISCLAIMER}</P>
        <P muted small>El PDF se genera en el dispositivo. Al compartirlo, usted decide con quién. Quien lo reciba lo tendrá fuera de la protección de esta aplicación.</P>
        <Button title="Generar y compartir PDF" onPress={generate} loading={busy} />
      </Screen>
    </>
  );
}
