import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { PressableScale } from '../../components/PressableScale';
import { Text } from '../../components/Text';
import { Gauge, Legend, onLevel } from '../../components/Status';
import { Button, Card, Chips, ErrorBox, H, Loading, P, Row, Screen, TapText } from '../../components/ui';
import { dayStatus, LEVEL_COLOR, LEVEL_LABEL, type DayStatus } from '../../domain/analysis';
import { loadAnalysisInput, loadDay, loadMonthMarks, type DayData } from '../../domain/day';
import { INTAKE_LABEL } from '../../domain/labels';
import { addDays, DIAS_CORTOS, durationMinutes, formatDateLong, formatDuration, formatTime, localDateKey, monthGrid, monthName, startOfWeek } from '../../domain/time';
import { useActive } from '../../services/session';
import { useData } from '../../services/useData';
import { MIN_TOUCH, useTheme } from '../../theme';

type Mode = 'mes' | 'semana' | 'dia';

export default function Calendario() {
  const { store, profile } = useActive();
  const t = useTheme();
  const today = localDateKey(new Date());
  const [mode, setMode] = useState<Mode>('mes');
  const [selected, setSelected] = useState(today);
  const [y, m] = selected.split('-').map(Number) as [number, number];

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(selected), i));
  const month = useData(() => loadMonthMarks(store, profile.id, y, m - 1), [y, m]);
  const day = useData(() => loadDay(store, profile.id, selected), [selected]);
  // Semáforo de cada día del mes visible (una sola lectura; se recalcula al anotar algo).
  const status = useData(async () => {
    const input = await loadAnalysisInput(store, profile.id);
    const map = new Map<string, DayStatus>();
    for (const k of monthGrid(y, m - 1)) map.set(k, dayStatus(k, input, today));
    for (const k of weekDays) if (!map.has(k)) map.set(k, dayStatus(k, input, today));
    return map;
  }, [y, m, selected]);

  const step = mode === 'mes' ? 'mes' : mode === 'semana' ? 7 : 1;
  function move(dir: -1 | 1) {
    if (step === 'mes') {
      const d = new Date(y, m - 1 + dir, 1);
      setSelected(localDateKey(d));
    } else setSelected(addDays(selected, step * dir));
  }

  const cells = mode === 'mes' ? monthGrid(y, m - 1) : mode === 'semana' ? weekDays : [];

  return (
    <Screen tabs>
      <Chips options={[{ value: 'mes', label: 'Mes' }, { value: 'semana', label: 'Semana' }, { value: 'dia', label: 'Día' }]} value={mode} onChange={setMode} />
      <Row style={{ justifyContent: 'space-between' }}>
        <Button title="◀" kind="secondary" onPress={() => move(-1)} accessibilityHint="Período anterior" />
        <H level={2}>{mode === 'dia' ? formatDateLong(selected) : `${monthName(m - 1)} ${y}`}</H>
        <Button title="▶" kind="secondary" onPress={() => move(1)} accessibilityHint="Período siguiente" />
      </Row>
      <Button title="Ir a hoy" kind="secondary" onPress={() => setSelected(today)} />

      {mode !== 'dia' ? (
        <View>
          <View style={{ flexDirection: 'row' }}>
            {DIAS_CORTOS.map((d) => <Text key={d} style={{ flex: 1, textAlign: 'center', color: t.muted, fontWeight: '600' }}>{d}</Text>)}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {cells.map((k) => {
              const mk = month.data?.get(k);
              const inMonth = mode === 'semana' || Number(k.split('-')[1]) === m;
              const sel = k === selected;
              const st = status.data?.get(k);
              const lvl = st?.level ?? 'sin_datos';
              return (
                <PressableScale key={k} accessibilityRole="button"
                  accessibilityLabel={`${formatDateLong(k)}. ${LEVEL_LABEL[lvl]}. ${mk?.episodes ?? 0} síntomas, ${mk?.appointments ?? 0} citas`}
                  onPress={() => setSelected(k)}
                  containerStyle={{ width: `${100 / 7}%`, padding: 2 }}
                  style={{ width: '100%', minHeight: MIN_TOUCH + 8, alignItems: 'center', justifyContent: 'center', borderRadius: 14,
                    backgroundColor: lvl === 'sin_datos' ? 'transparent' : LEVEL_COLOR[lvl], borderWidth: sel ? 3 : k === today ? 1.5 : 0, borderColor: sel ? t.text : t.primary, opacity: inMonth ? 1 : 0.4, borderCurve: 'continuous' }}>
                  <Text style={{ color: lvl === 'sin_datos' ? t.text : onLevel(lvl), fontWeight: '700' }}>{Number(k.split('-')[2])}</Text>
                  <View style={{ flexDirection: 'row', gap: 3, height: 8 }}>
                    {mk?.episodes ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: lvl === 'sin_datos' ? t.danger : onLevel(lvl) }} /> : null}
                    {mk?.appointments ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: lvl === 'sin_datos' ? t.success : onLevel(lvl) }} /> : null}
                    {mk?.exams ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: lvl === 'sin_datos' ? t.warn : onLevel(lvl) }} /> : null}
                  </View>
                </PressableScale>
              );
            })}
          </View>
          <Legend />
          <P muted small>Puntos: rojo = síntomas · verde = citas · ámbar = estudios. El color del día es el «semáforo» del estado.</P>
        </View>
      ) : null}
      {month.error ? <ErrorBox message={month.error} onRetry={month.reload} /> : null}

      <H level={2}>{formatDateLong(selected)}</H>
      {day.loading && !day.data ? <Loading /> : null}
      {day.error ? <ErrorBox message={day.error} onRetry={day.reload} /> : null}
      {status.data?.get(selected) ? <DayMeter s={status.data.get(selected)!} /> : null}
      {day.data ? <DayDetail d={day.data} /> : null}
      <Button title="Ver análisis semanal y mensual" onPress={() => router.push('/analisis')} />
      <Button title="Anotar un síntoma" kind="secondary" onPress={() => router.push('/episodio/nuevo')} />
      <Button title="Agregar cita" kind="secondary" onPress={() => router.push(`/cita/nueva?fecha=${selected}`)} />
    </Screen>
  );
}

/** Medidor del estado del día seleccionado, con el porqué en palabras. */
function DayMeter({ s }: { s: DayStatus }) {
  const why = s.level === 'sin_datos' ? 'No hay síntomas ni tomas anotadas este día.'
    : [s.episodes ? `${s.episodes} síntoma(s)` : 'Sin síntomas', s.maxIntensity !== null ? `fuerza máxima ${s.maxIntensity}/10` : null, s.severe ? 'convulsión o desmayo' : null, s.omitted ? `${s.omitted} dosis no tomada(s)` : null].filter(Boolean).join(' · ');
  return (
    <Card>
      <Gauge value={s.score} level={s.level} title="Estado del día" />
      <P muted small>{why}</P>
    </Card>
  );
}

function DayDetail({ d }: { d: DayData }) {
  const t = useTheme();
  const empty = !d.episodes.length && !d.appointments.length && !d.doses.length && !d.exams.length && !d.notes.length;
  return (
    <View style={{ gap: 8 }}>
      {empty ? <Card><P muted>Sin registros este día.</P></Card> : null}
      {d.appointments.map((a) => (
        <Card key={a.id}><TapText onPress={() => router.push(`/cita/${a.id}`)} style={{ color: t.success, fontWeight: '700' }}>Cita {formatTime(a.startsAt)} · {a.title}</TapText></Card>
      ))}
      {d.episodes.map((e) => (
        <Card key={e.id}>
          <TapText onPress={() => router.push(`/episodio/${e.id}`)} style={{ color: t.danger, fontWeight: '700' }}>Síntoma {formatTime(e.startedAt)} · {e.kind}</TapText>
          <P muted small>Duró: {formatDuration(durationMinutes(e.startedAt, e.endedAt))}</P>
        </Card>
      ))}
      {d.doses.map((x) => (
        <Card key={x.dueAt + x.schedule.id}>
          <P>{formatTime(x.dueAt)} · {x.medication.name} — {x.intake ? INTAKE_LABEL[x.intake.status] : 'sin anotar'}</P>
        </Card>
      ))}
      {d.exams.map((x) => (
        <Card key={x.id}><TapText onPress={() => router.push(`/examen/${x.id}`)} style={{ color: t.warn, fontWeight: '700' }}>Examen · {x.name}</TapText></Card>
      ))}
      {d.notes.map((n) => (
        <Card key={n.id}><TapText onPress={() => router.push(`/nota/${n.id}`)} style={{ color: t.text }}>Nota ({n.authorRole}): {n.body.slice(0, 120)}</TapText></Card>
      ))}
    </View>
  );
}
