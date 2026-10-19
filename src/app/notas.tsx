import { Stack, router } from 'expo-router';
import { Button, Card, Empty, ErrorBox, Loading, P, Screen, TapText } from '../components/ui';
import { formatDateShort } from '../domain/time';
import { useActive } from '../services/session';
import { useData } from '../services/useData';
import { useTheme } from '../theme';

export default function Notas() {
  const { store, profile } = useActive();
  const t = useTheme();
  const { data, loading, error, reload } = useData(() => store.list('note', profile.id));
  return (
    <>
      <Stack.Screen options={{ title: 'Notas' }} />
      <Screen>
        <Button title="Nueva nota" onPress={() => router.push('/nota/nueva')} />
        {loading && !data ? <Loading /> : null}
        {error ? <ErrorBox message={error} onRetry={reload} /> : null}
        {data && data.length === 0 ? <Empty title="No hay notas." /> : null}
        {data?.map((n) => (
          <Card key={n.id}>
            <TapText onPress={() => router.push(`/nota/${n.id}`)} style={{ color: t.primary, fontWeight: '700' }}>
              {formatDateShort(n.noteDate)} · {n.authorRole === 'cuidador' ? 'Nota del cuidador' : 'Nota personal'}
            </TapText>
            <P>{n.body.length > 200 ? `${n.body.slice(0, 200)}…` : n.body}</P>
          </Card>
        ))}
      </Screen>
    </>
  );
}
