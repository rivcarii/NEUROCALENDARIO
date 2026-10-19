import { Stack } from 'expo-router';
import { useState } from 'react';
import { BarChart } from '../components/charts';
import { Card, Chips, Empty, ErrorBox, H, Loading, P, Screen } from '../components/ui';
import { computeEpisodeStats } from '../domain/stats';
import { addDays, formatDuration, localDateKey } from '../domain/time';
import { useActive } from '../services/session';
import { useData } from '../services/useData';

const PERIODS = [{ value: 30, label: '30 días' }, { value: 90, label: '90 días' }, { value: 180, label: '6 meses' }, { value: 365, label: '1 año' }];
const WD = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export default function Estadisticas() {
  const { store, profile } = useActive();
  const [days, setDays] = useState(90);
  const to = localDateKey(new Date());
  const from = addDays(to, -days + 1);
  const { data, loading, error, reload } = useData(async () => computeEpisodeStats(await store.list('episode', profile.id), from, to), [days]);
  return (
    <>
      <Stack.Screen options={{ title: 'Cómo he estado' }} />
      <Screen>
        <Chips label="¿De cuándo?" options={PERIODS} value={days} onChange={setDays} />
        {loading && !data ? <Loading /> : null}
        {error ? <ErrorBox message={error} onRetry={reload} /> : null}
        {data && data.count === 0 ? <Empty title="No hay síntomas anotados en este período." hint="Los números aparecen cuando anota síntomas." /> : null}
        {data && data.count > 0 ? (
          <>
            <Card>
              <H level={2}>Resumen</H>
              <P>Síntomas: {data.count}, en {data.daysWithEpisodes} día(s)</P>
              <P>Duración habitual: {data.avgMinutes === null ? 'sin datos' : formatDuration(Math.round(data.avgMinutes))} · la mitad duró menos de: {data.medianMinutes === null ? 'sin datos' : formatDuration(Math.round(data.medianMinutes))}</P>
              <P muted small>Calculado con {data.withDuration} de {data.count} síntomas que tienen hora de fin.</P>
              <P>Fuerza media: {data.avgIntensity === null ? 'sin datos' : `${data.avgIntensity}/10`} (máx. {data.maxIntensity ?? '—'})</P>
              <P muted small>Calculado con {data.withIntensity} de {data.count} síntomas con fuerza anotada.</P>
            </Card>
            <Card><BarChart title="Síntomas por semana" data={data.perWeek.map((w) => ({ label: w.weekStart.slice(5), value: w.count }))} /></Card>
            <Card><BarChart title="Síntomas por día de la semana" data={data.byWeekday.map((v, i) => ({ label: WD[i]!, value: v }))} /></Card>
            {data.intensityPerWeek.length ? <Card><BarChart title="Fuerza media por semana" unit="/10" data={data.intensityPerWeek.map((w) => ({ label: w.weekStart.slice(5), value: w.avg }))} /></Card> : null}
            <Card>
              <H level={2}>Por tipo</H>
              {data.byKind.map((k) => <P key={k.kind}>{k.kind}: {k.count}</P>)}
            </Card>
            <P muted small>Son solo cuentas de lo que usted anotó. No dicen la causa ni son un diagnóstico. Coméntelas con su médico.</P>
          </>
        ) : null}
      </Screen>
    </>
  );
}
