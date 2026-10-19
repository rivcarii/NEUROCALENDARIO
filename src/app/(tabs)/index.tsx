import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Alert, View } from 'react-native';
import { Text } from '../../components/Text';
import { Button, Card, Empty, ErrorBox, H, Loading, P, Row, Screen, errorMessage, TapText } from '../../components/ui';
import { loadDay } from '../../domain/day';
import { durationMinutes, formatDateLong, formatDuration, formatTime, localDateKey } from '../../domain/time';
import { useActive, useSession } from '../../services/session';
import { useData } from '../../services/useData';
import { useTheme } from '../../theme';

export default function Hoy() {
  const { store, profile } = useActive();
  const { bump } = useSession();
  const t = useTheme();
  const today = localDateKey(new Date());
  const { data, loading, error, reload } = useData(() => loadDay(store, profile.id, today), [today]);

  async function markDose(medicationId: string, scheduleId: string, dueAt: string, status: 'tomada' | 'omitida') {
    try {
      await store.recordIntake(profile.id, {
        medicationId, scheduleId, scheduledAt: dueAt, status,
        takenAt: status === 'tomada' ? new Date().toISOString() : null,
      });
      bump();
      void (status === 'tomada' ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)).catch(() => undefined);
    } catch (e) { Alert.alert('No se pudo guardar', errorMessage(e)); }
  }

  async function quick(kind: string) {
    try {
      await store.create('episode', profile.id, { startedAt: new Date().toISOString(), kind, isQuick: true });
      bump();
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    } catch (e) { Alert.alert('No se pudo guardar', errorMessage(e)); }
  }

  return (
    <Screen>
      <H>{formatDateLong(today)}</H>
      <Card>
        <H level={2}>Registro rápido</H>
        <P muted small>Guarda un episodio con la hora actual en el perfil de {profile.displayName}. Puede completarlo después.</P>
        <Row>
          {['Cefalea', 'Mareo / vértigo', 'Temblor', 'Otro'].map((k) => (
            <Button key={k} title={k} kind="secondary" onPress={() => void quick(k)} />
          ))}
        </Row>
        <Button title="Registrar episodio completo" onPress={() => router.push('/episodio/nuevo')} />
      </Card>

      {loading && !data ? <Loading /> : null}
      {error ? <ErrorBox message={error} onRetry={reload} /> : null}

      {data ? (
        <>
          <H level={2}>Medicación de hoy</H>
          {data.doses.length === 0 ? <Empty title="No hay tomas programadas hoy." hint="Agregue pautas en la pestaña Medicación." /> : null}
          {data.doses.map((d) => (
            <Card key={d.dueAt + d.schedule.id}>
              <Text style={{ color: t.text, fontSize: 17, fontWeight: '600' }}>{formatTime(d.dueAt)} · {d.medication.name}</Text>
              {d.medication.doseText ? <P muted small>{d.medication.doseText}</P> : null}
              {d.intake ? (
                <P>{d.intake.status === 'tomada' ? `✔ Tomada${d.intake.takenAt ? ` a las ${formatTime(d.intake.takenAt)}` : ''}` : `Marcada como ${d.intake.status}`}</P>
              ) : null}
              <Row>
                <Button title="Tomada" kind={d.intake?.status === 'tomada' ? 'primary' : 'secondary'} onPress={() => void markDose(d.medication.id, d.schedule.id, d.dueAt, 'tomada')} />
                <Button title="Omitida" kind="secondary" onPress={() => void markDose(d.medication.id, d.schedule.id, d.dueAt, 'omitida')} />
              </Row>
            </Card>
          ))}

          <H level={2}>Citas de hoy</H>
          {data.appointments.length === 0 ? <P muted>Sin citas hoy.</P> : null}
          {data.appointments.map((a) => (
            <Card key={a.id}>
              <TapText onPress={() => router.push(`/cita/${a.id}`)} style={{ color: t.primary, fontSize: 16, fontWeight: '600' }}>{formatTime(a.startsAt)} · {a.title}</TapText>
              {a.location ? <P muted small>{a.location}</P> : null}
            </Card>
          ))}

          <H level={2}>Episodios de hoy</H>
          {data.episodes.length === 0 ? <P muted>Sin episodios registrados hoy.</P> : null}
          {data.episodes.map((e) => (
            <Card key={e.id}>
              <TapText onPress={() => router.push(`/episodio/${e.id}`)} style={{ color: t.primary, fontSize: 16, fontWeight: '600' }}>
                {formatTime(e.startedAt)} · {e.kind}
              </TapText>
              <P muted small>Duración: {formatDuration(durationMinutes(e.startedAt, e.endedAt))}{e.intensity !== null ? ` · Intensidad ${e.intensity}/10` : ''}</P>
            </Card>
          ))}
        </>
      ) : null}
      <View style={{ height: 8 }} />
      <P muted small>Esta aplicación es un registro personal. No diagnostica ni sustituye la atención médica. En una emergencia llame a los servicios de urgencia.</P>
    </Screen>
  );
}
