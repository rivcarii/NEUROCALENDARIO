import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { BarChart } from '../components/charts';
import { FindingCard, Gauge, Legend, LevelStrip } from '../components/Status';
import { Text } from '../components/Text';
import { Button, Card, Chips, ErrorBox, H, Loading, P, Row, Screen } from '../components/ui';
import { analyzePeriod, PAIN_BAND_LABEL, PAIN_SCALE_ROWS, SOURCES } from '../domain/analysis';
import { loadAnalysisInput } from '../domain/day';
import { addDays, formatDateShort, localDateKey, monthName, startOfWeek } from '../domain/time';
import { useActive } from '../services/session';
import { useData } from '../services/useData';
import { useTheme } from '../theme';

type Mode = 'semana' | 'mes';

export function periodFor(mode: Mode, anchor: string): { from: string; to: string; title: string } {
  if (mode === 'semana') {
    const from = startOfWeek(anchor); const to = addDays(from, 6);
    return { from, to, title: `${formatDateShort(from)} – ${formatDateShort(to)}` };
  }
  const [y, m] = anchor.split('-').map(Number) as [number, number];
  const last = new Date(y, m, 0).getDate();
  return { from: `${y}-${String(m).padStart(2, '0')}-01`, to: `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`, title: `${monthName(m - 1)} ${y}` };
}

export default function Analisis() {
  const { store, profile } = useActive();
  const t = useTheme();
  const today = localDateKey(new Date());
  const params = useLocalSearchParams<{ modo?: string; ancla?: string }>();
  const [mode, setMode] = useState<Mode>(params.modo === 'mes' ? 'mes' : 'semana');
  const [anchor, setAnchor] = useState(params.ancla ?? today);
  const p = periodFor(mode, anchor);
  const { data, loading, error, reload } = useData(async () => analyzePeriod(await loadAnalysisInput(store, profile.id), p.from, p.to, new Date()), [mode, p.from, p.to]);

  function move(dir: -1 | 1) {
    if (mode === 'semana') setAnchor(addDays(anchor, 7 * dir));
    else { const [y, m] = anchor.split('-').map(Number) as [number, number]; setAnchor(localDateKey(new Date(y, m - 1 + dir, 1))); }
  }
  const c = data?.current;
  const dow = (k: string) => Number(k.slice(8));
  return (
    <>
      <Stack.Screen options={{ title: 'Cómo ha estado' }} />
      <Screen>
        <Chips options={[{ value: 'semana', label: 'Semana' }, { value: 'mes', label: 'Mes' }]} value={mode} onChange={(v) => { setMode(v); setAnchor(today); }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Button title="◀" kind="secondary" onPress={() => move(-1)} accessibilityHint="Período anterior" />
          <View style={{ flex: 1, alignItems: 'center' }}><H level={2}>{p.title}</H></View>
          <Button title="▶" kind="secondary" onPress={() => move(1)} accessibilityHint="Período siguiente" />
        </View>
        {loading && !data ? <Loading /> : null}
        {error ? <ErrorBox message={error} onRetry={reload} /> : null}
        {c && data ? (
          <>
            <Card>
              <P muted small>Estado de {profile.displayName}</P>
              <Gauge value={c.avgScore} level={c.overall} title="Estado del período" />
              <P muted small>{c.tracked} de {c.days} días con registros. El medidor combina la fuerza del dolor, cuántos síntomas hubo, eventos graves y dosis no tomadas (100 = sin molestias).</P>
              <LevelStrip cells={c.daily.map((d) => ({ key: d.dateKey, label: String(dow(d.dateKey)), level: d.level }))} />
              <Legend />
            </Card>

            <H level={2}>Qué encontramos</H>
            {data.findings.map((f) => <FindingCard key={f.title} f={f} />)}

            <Card>
              <H level={2}>Los números</H>
              <Row style={{ justifyContent: 'space-between' }}>
                <Stat label="Síntomas" value={String(c.episodes)} prev={data.previous.episodes} cur={c.episodes} />
                <Stat label="Días con dolor de cabeza" value={String(c.headacheDays)} prev={data.previous.headacheDays} cur={c.headacheDays} />
                <Stat label="Fuerza media" value={c.avgIntensity === null ? '—' : `${c.avgIntensity}/10`} prev={data.previous.avgIntensity} cur={c.avgIntensity} />
              </Row>
              <P muted small>Cambio: comparación con el período anterior de igual duración.</P>
              <P>Medicinas tomadas: {c.adherence.pct === null ? 'sin datos' : `${c.adherence.pct} % (${c.adherence.taken} de ${c.adherence.scheduled})`}</P>
            </Card>

            <Card>
              <H level={2}>Escala de dolor (0–10)</H>
              {PAIN_SCALE_ROWS.map(([pts, lvl, txt]) => <P key={pts}><Text style={{ fontWeight: '700', color: t.text }}>{pts} · {lvl}:</Text> {txt}</P>)}
              {(Object.keys(c.bands) as (keyof typeof c.bands)[]).map((k) => <P key={k} muted small>{PAIN_BAND_LABEL[k]}: {c.bands[k]} síntoma(s)</P>)}
            </Card>
            <Card><BarChart title="Momento del día de los síntomas" data={c.partOfDay.map((x) => ({ label: x.label.slice(0, 3), value: x.count }))} /></Card>

            <Button title="Crear informe PDF de este período" onPress={() => router.push(`/informes?desde=${p.from}&hasta=${p.to}`)} />
            <View style={{ gap: 4 }}>
              <P muted small>Es un análisis descriptivo de lo que se anotó; no diagnostica ni sustituye al médico. En una emergencia llame a los servicios de urgencia.</P>
              <P muted small>Fuentes: {SOURCES.map((s) => s.text).join(' · ')}</P>
            </View>
          </>
        ) : null}
      </Screen>
    </>
  );
}

function Stat({ label, value, prev, cur }: { label: string; value: string; prev: number | null; cur: number | null }) {
  const t = useTheme();
  const d = prev === null || cur === null ? null : Math.round((cur - prev) * 10) / 10;
  return (
    <View style={{ flex: 1, minWidth: 90, gap: 2 }}>
      <Text style={{ color: t.text, fontSize: 24, fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: t.muted, fontSize: 13 }}>{label}</Text>
      {d !== null && d !== 0 ? <Text style={{ color: t.muted, fontSize: 12 }}>{d > 0 ? '▲' : '▼'} {Math.abs(d)} vs. antes</Text> : null}
    </View>
  );
}
