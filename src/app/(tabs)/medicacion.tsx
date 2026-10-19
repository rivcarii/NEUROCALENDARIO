import { router } from 'expo-router';
import { Button, Card, Empty, ErrorBox, Loading, P, Row, Screen, TapText } from '../../components/ui';
import { useActive } from '../../services/session';
import { useData } from '../../services/useData';
import { useTheme } from '../../theme';

export default function Medicacion() {
  const { store, profile } = useActive();
  const t = useTheme();
  const { data, loading, error, reload } = useData(async () => ({
    meds: await store.list('medication', profile.id, { order: 'asc' }),
    schedules: await store.list('schedule', profile.id),
  }));
  return (
    <Screen>
      <Button title="Agregar medicamento" onPress={() => router.push('/medicamento/nuevo')} />
      <P muted small>Registre aquí solo lo que indicó el profesional que prescribe. La app no modifica ni sugiere tratamientos.</P>
      {loading && !data ? <Loading /> : null}
      {error ? <ErrorBox message={error} onRetry={reload} /> : null}
      {data && data.meds.length === 0 ? <Empty title="Aún no hay medicamentos." hint="Agregue uno y luego sus horarios para activar los recordatorios." /> : null}
      {data?.meds.map((m) => {
        const sch = data.schedules.filter((s) => s.medicationId === m.id);
        return (
          <Card key={m.id}>
            <TapText onPress={() => router.push(`/medicamento/${m.id}`)} style={{ color: t.primary, fontSize: 17, fontWeight: '700' }}>{m.name}</TapText>
            <P muted small>{[m.doseText, m.form].filter(Boolean).join(' · ') || 'Sin dosis indicada'}</P>
            <Row>
              <P small>{m.active ? 'Activo' : 'Suspendido'}</P>
              <P small muted>{sch.length ? sch.map((s) => s.times.join(', ')).join(' | ') : 'Sin horarios'}</P>
            </Row>
          </Card>
        );
      })}
    </Screen>
  );
}
