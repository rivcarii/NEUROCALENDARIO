import { Stack, router } from 'expo-router';
import { Button, Card, Empty, ErrorBox, H, Loading, P, Screen, TapText } from '../components/ui';
import { formatDateTime } from '../domain/time';
import { useActive } from '../services/session';
import { useData } from '../services/useData';
import { useTheme } from '../theme';

export default function Citas() {
  const { store, profile } = useActive();
  const t = useTheme();
  const { data, loading, error, reload } = useData(() => store.list('appointment', profile.id));
  const now = new Date().toISOString();
  const upcoming = data?.filter((a) => a.startsAt >= now && a.status === 'programada').reverse() ?? [];
  const past = data?.filter((a) => !(a.startsAt >= now && a.status === 'programada')) ?? [];
  const item = (a: NonNullable<typeof data>[number]) => (
    <Card key={a.id}>
      <TapText onPress={() => router.push(`/cita/${a.id}`)} style={{ color: t.primary, fontSize: 17, fontWeight: '700' }}>{a.title}</TapText>
      <P>{formatDateTime(a.startsAt)} · {a.status}</P>
      {a.provider || a.location ? <P muted small>{[a.provider, a.location].filter(Boolean).join(' · ')}</P> : null}
    </Card>
  );
  return (
    <>
      <Stack.Screen options={{ title: 'Citas médicas' }} />
      <Screen>
        <Button title="Nueva cita" onPress={() => router.push('/cita/nueva')} />
        {loading && !data ? <Loading /> : null}
        {error ? <ErrorBox message={error} onRetry={reload} /> : null}
        {data && data.length === 0 ? <Empty title="No hay citas registradas." /> : null}
        {upcoming.length ? <H level={2}>Próximas</H> : null}
        {upcoming.map(item)}
        {past.length ? <H level={2}>Anteriores y canceladas</H> : null}
        {past.map(item)}
        <P muted small>Los recordatorios son locales y pueden retrasarse o no entregarse (ahorro de batería, permisos, modo no molestar). No los use como único medio para no perder una cita.</P>
      </Screen>
    </>
  );
}
