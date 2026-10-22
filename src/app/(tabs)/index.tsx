import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from '../../components/Text';
import { Deck } from '../../components/Deck';
import { NeuroArt } from '../../components/NeuroArt';
import { PressableScale } from '../../components/PressableScale';
import { Reveal } from '../../components/Reveal';
import { Ring } from '../../components/Ring';
import { Gauge, LevelStrip } from '../../components/Status';
import { SymptomDeck } from '../../components/SymptomDeck';
import { UndoToast, type ToastAction } from '../../components/UndoToast';
import { Button, Card, Empty, ErrorBox, H, Loading, P, Row, Screen, errorMessage, TapText, SectionTitle, notify } from '../../components/ui';
import { analyzePeriod, dayStatus } from '../../domain/analysis';
import { loadAnalysisInput, loadDay, type Dose } from '../../domain/day';
import { addDays, monthName } from '../../domain/time';
import { INTAKE_LABEL } from '../../domain/labels';
import { durationMinutes, formatDateLong, formatDuration, formatTime, localDateKey } from '../../domain/time';
import { useActive, useSession } from '../../services/session';
import { useData } from '../../services/useData';
import { platform, space, useTheme } from '../../theme';
import { font } from '../../theme/type';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const PERIODS = [
  { key: 'manana', label: 'Por la mañana', icon: 'sunny-outline' as IconName, until: 12 },
  { key: 'tarde', label: 'Por la tarde', icon: 'partly-sunny-outline' as IconName, until: 19 },
  { key: 'noche', label: 'Por la noche', icon: 'moon-outline' as IconName, until: 24 },
];

function greeting(hour: number): string {
  return hour < 6 ? 'Buenas noches' : hour < 13 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
}

interface Toast { id: number; message: string; actions: ToastAction[] }

export default function Hoy() {
  const { store, profile } = useActive();
  const { bump } = useSession();
  const t = useTheme();
  const today = localDateKey(new Date());
  const { data, loading, error, reload } = useData(() => loadDay(store, profile.id, today), [today]);
  // Análisis automático: últimos 7 días (semana móvil) y estado de hoy; el del mes se ofrece los primeros días del mes.
  const week = useData(async () => {
    const input = await loadAnalysisInput(store, profile.id);
    const now = new Date();
    const a = analyzePeriod(input, addDays(today, -6), today, now);
    return { a, todayStatus: dayStatus(today, input, today) };
  }, [today]);
  const [toast, setToast] = useState<Toast | null>(null);
  const closeToast = useCallback(() => setToast(null), []);
  // Marca inmediata (antes de que termine de guardar y recargar): así se ve en el acto que «sí se marcó».
  const [marked, setMarked] = useState<Record<string, 'tomada' | 'omitida'>>({});
  const [flash, setFlash] = useState<string | null>(null);
  useEffect(() => {
    if (!flash) return;
    const h = setTimeout(() => setFlash(null), 2200);
    return () => clearTimeout(h);
  }, [flash]);
  const show = (message: string, actions: ToastAction[]) => setToast((prev) => ({ id: (prev?.id ?? 0) + 1, message, actions }));

  async function markDose(medicationId: string, scheduleId: string, dueAt: string, status: 'tomada' | 'omitida', name: string) {
    const key = dueAt + scheduleId;
    setMarked((m) => ({ ...m, [key]: status }));
    try {
      const rec = await store.recordIntake(profile.id, {
        medicationId, scheduleId, scheduledAt: dueAt, status,
        takenAt: status === 'tomada' ? new Date().toISOString() : null,
      });
      bump();
      void (status === 'tomada' ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)).catch(() => undefined);
      show(status === 'tomada' ? `Anotado: tomó ${name}` : `Anotado: no tomó ${name}`, [{
        label: 'Deshacer',
        onPress: () => { void store.remove('intake', profile.id, rec.id).then(() => { setMarked((m) => { const { [key]: _x, ...rest } = m; return rest; }); bump(); closeToast(); }).catch((e) => notify('No se pudo deshacer', errorMessage(e))); },
      }]);
    } catch (e) {
      setMarked((m) => { const { [key]: _x, ...rest } = m; return rest; });
      notify('No se pudo guardar', errorMessage(e));
    }
  }

  async function quick(kind: string) {
    try {
      const ep = await store.create('episode', profile.id, { startedAt: new Date().toISOString(), kind, isQuick: true });
      setFlash(kind);
      bump();
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      const setIntensity = (n: number) => { void store.update('episode', profile.id, ep.id, { intensity: n }).then(() => { bump(); closeToast(); }).catch((e) => notify('No se pudo guardar', errorMessage(e))); };
      show(`Anotado: ${kind}. ¿Qué tan fuerte fue?`, [
        { label: 'Leve', onPress: () => setIntensity(3) },
        { label: 'Media', onPress: () => setIntensity(6) },
        { label: 'Fuerte', onPress: () => setIntensity(9) },
        { label: 'Deshacer', onPress: () => { void store.remove('episode', profile.id, ep.id).then(() => { bump(); closeToast(); }).catch((e) => notify('No se pudo deshacer', errorMessage(e))); } },
      ]);
    } catch (e) { notify('No se pudo guardar', errorMessage(e)); }
  }

  const doses = data?.doses ?? [];
  const statusOf = (d: Dose): string | null => marked[d.dueAt + d.schedule.id] ?? d.intake?.status ?? null;
  const settled = (d: Dose) => { const st = statusOf(d); return st !== null && st !== 'pospuesta'; };
  const counts: Record<string, number> = {};
  for (const e of data?.episodes ?? []) counts[e.kind] = (counts[e.kind] ?? 0) + 1;
  const done = doses.filter(settled).length;
  const next = doses.find((d) => !settled(d));
  const hour = new Date().getHours();

  function doseCard(d: Dose) {
    const st = statusOf(d);
    const takenAt = d.intake?.status === 'tomada' ? d.intake.takenAt : null;
    return (
      <Card key={d.dueAt + d.schedule.id} style={st === 'tomada' ? { borderColor: t.success, borderWidth: 1.5 } : undefined}>
        <Text style={{ color: t.text, fontSize: 17, fontWeight: '600' }}>{formatTime(d.dueAt)} · {d.medication.name}</Text>
        {d.medication.doseText ? <P muted small>{d.medication.doseText}</P> : null}
        {st ? (
          <P>{st === 'tomada' ? `✔ La tomé${takenAt ? ` a las ${formatTime(takenAt)}` : ''}` : `Anotada: «${INTAKE_LABEL[st] ?? st}»`}</P>
        ) : null}
        <Row>
          <Button title="La tomé" kind={st === 'tomada' ? 'primary' : 'secondary'} checked={st === 'tomada'} onPress={() => void markDose(d.medication.id, d.schedule.id, d.dueAt, 'tomada', d.medication.name)} />
          <Button title="No la tomé" kind={st === 'omitida' ? 'danger' : 'secondary'} checked={st === 'omitida'} onPress={() => void markDose(d.medication.id, d.schedule.id, d.dueAt, 'omitida', d.medication.name)} />
        </Row>
      </Card>
    );
  }

  return (
    <Screen tabs footer={toast ? <UndoToast id={toast.id} message={toast.message} actions={toast.actions} onClose={closeToast} /> : null}>
      <Reveal id="hoy" index={0}>
        <View style={{ gap: 2 }}>
          <Text style={{ color: t.muted, fontSize: 15 }}>{greeting(hour)}</Text>
          <H level={2}>{formatDateLong(today)}</H>
        </View>
      </Reveal>

      {data ? (
        <Reveal id="hoy" index={1}>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
              <Ring done={done} total={doses.length} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: t.text, fontFamily: font.displaySemi, fontSize: 19 }}>
                  {doses.length === 0 ? 'Hoy no hay medicinas' : done >= doses.length ? '¡Todo al día!' : `${done} de ${doses.length} medicinas`}
                </Text>
                <P muted small>
                  {next ? `Sigue: ${formatTime(next.dueAt)} · ${next.medication.name}` : doses.length > 0 ? 'Ya anotó todas las de hoy.' : 'Puede añadirlas en la pestaña Medicinas.'}
                </P>
                <P muted small>
                  {data.episodes.length === 0 ? 'Sin síntomas anotados' : `${data.episodes.length} ${data.episodes.length === 1 ? 'síntoma anotado' : 'síntomas anotados'}`}
                  {data.appointments.length > 0 ? ` · ${data.appointments.length} ${data.appointments.length === 1 ? 'cita' : 'citas'}` : ''}
                </P>
              </View>
            </View>
          </Card>
        </Reveal>
      ) : null}

      {week.data ? (
        <Reveal id="hoy" index={1}>
          <Card>
            <H level={2}>Estado de hoy</H>
            <Gauge value={week.data.todayStatus.score} level={week.data.todayStatus.level} title="Estado de hoy" />
            {week.data.todayStatus.level === 'sin_datos' ? <P muted small>Aún no hay síntomas ni tomas anotadas hoy. Cuando las anote, el medidor se llena solo.</P> : null}
            <View style={{ height: 4 }} />
            <H level={2}>Su semana</H>
            <LevelStrip size={34} cells={week.data.a.current.daily.map((d) => ({ key: d.dateKey, label: String(Number(d.dateKey.slice(8))), level: d.level }))} />
            <P small>{week.data.a.findings[0]?.title}</P>
            <Row>
              <Button title="Ver análisis de la semana" kind="secondary" onPress={() => router.push('/analisis')} />
              {new Date().getDate() <= 3 ? <Button title={`Resumen de ${monthName((new Date().getMonth() + 11) % 12).toLowerCase()}`} kind="secondary" onPress={() => router.push(`/analisis?modo=mes&ancla=${addDays(today.slice(0, 8) + '01', -1)}`)} /> : null}
            </Row>
          </Card>
        </Reveal>
      ) : null}

      {next ? (
        <Reveal id="hoy" index={2}>
          <View style={{ backgroundColor: t.primary, borderRadius: platform.cardRadius, padding: space.lg, gap: space.sm, borderCurve: 'continuous' }}>
            <Text style={{ color: t.onPrimary, opacity: 0.85, fontSize: 14 }}>Siguiente medicina · {formatTime(next.dueAt)}</Text>
            <Text style={{ color: t.onPrimary, fontFamily: font.display, fontSize: 24 }}>{next.medication.name}</Text>
            {next.medication.doseText ? <Text style={{ color: t.onPrimary, opacity: 0.85 }}>{next.medication.doseText}</Text> : null}
            <PressableScale
              accessibilityRole="button" accessibilityLabel="Ya la tomé"
              onPress={() => void markDose(next.medication.id, next.schedule.id, next.dueAt, 'tomada', next.medication.name)}
              style={{ minHeight: 56, borderRadius: 999, backgroundColor: t.onPrimary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <Ionicons name="checkmark-circle" size={24} color={t.primary} />
              <Text style={{ color: t.primary, fontSize: 18, fontWeight: '700' }}>Ya la tomé</Text>
            </PressableScale>
          </View>
        </Reveal>
      ) : null}

      <Reveal id="hoy" index={3}><Deck>
        <Card>
          <H level={2}>Anotar ahora</H>
          <P muted small>Elija el tipo de afección y toque el síntoma: se guarda con la hora de ahora en el perfil de {profile.displayName}. Deslice para ver más tipos.</P>
          <SymptomDeck counts={counts} flash={flash} onPick={(k) => void quick(k)} />
          <Button title="Anotar con más detalle" onPress={() => router.push('/episodio/nuevo')} />
        </Card>
      </Deck></Reveal>

      {loading && !data ? <Loading /> : null}
      {error ? <ErrorBox message={error} onRetry={reload} /> : null}

      {data ? (
        <>
          <Reveal id="hoy" index={4}><View style={{ gap: 12 }}>
          <SectionTitle icon="medicinas">Medicinas de hoy</SectionTitle>
          {doses.length > 0 && doses.every(settled) ? (
            <Card style={{ alignItems: 'center' }}>
              <NeuroArt kind="sinapsis" size={150} />
              <P>¡Todo al día! Ya anotó todas las medicinas de hoy.</P>
            </Card>
          ) : null}
          {doses.length === 0 ? <Empty title="Hoy no tiene medicinas por tomar." hint="Añada sus medicinas y horarios en la pestaña Medicinas." /> : null}
          {PERIODS.map((per, i) => {
            const from = i === 0 ? 0 : PERIODS[i - 1]!.until;
            const list = doses.filter((d) => { const h = new Date(d.dueAt).getHours(); return h >= from && h < per.until; });
            if (list.length === 0) return null;
            return (
              <View key={per.key} style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name={per.icon} size={18} color={t.muted} />
                  <Text style={{ color: t.muted, fontWeight: '700', fontSize: 14 }}>{per.label}</Text>
                </View>
                {list.map(doseCard)}
              </View>
            );
          })}
          </View></Reveal>
          <Reveal id="hoy" index={5}><View style={{ gap: 12 }}>
          <SectionTitle icon="cita">Citas de hoy</SectionTitle>
          {data.appointments.length === 0 ? <P muted>Sin citas hoy.</P> : null}
          {data.appointments.map((a) => (
            <Card key={a.id}>
              <TapText onPress={() => router.push(`/cita/${a.id}`)} style={{ color: t.primary, fontSize: 16, fontWeight: '600' }}>{formatTime(a.startsAt)} · {a.title}</TapText>
              {a.location ? <P muted small>{a.location}</P> : null}
            </Card>
          ))}
          </View></Reveal>
          <Reveal id="hoy" index={6}><View style={{ gap: 12 }}>
          <SectionTitle icon="sintomas">Síntomas de hoy</SectionTitle>
          {data.episodes.length === 0 ? <P muted>Hoy no ha anotado síntomas.</P> : null}
          {data.episodes.map((e) => (
            <Card key={e.id}>
              <TapText onPress={() => router.push(`/episodio/${e.id}`)} style={{ color: t.primary, fontSize: 16, fontWeight: '600' }}>
                {formatTime(e.startedAt)} · {e.kind}
              </TapText>
              <P muted small>Duró: {formatDuration(durationMinutes(e.startedAt, e.endedAt))}{e.intensity !== null ? ` · Intensidad ${e.intensity}/10` : ''}</P>
            </Card>
          ))}
          </View></Reveal>
        </>
      ) : null}
      <View style={{ height: 8 }} />
      <P muted small>Esta aplicación es un registro personal. No diagnostica ni sustituye la atención médica. En una emergencia llame a los servicios de urgencia.</P>
    </Screen>
  );
}
