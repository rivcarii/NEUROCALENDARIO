import { Stack, router } from 'expo-router';
import { Text } from 'react-native';
import { Button, Card, Empty, ErrorBox, Loading, P, Screen } from '../components/ui';
import { formatDateShort } from '../domain/time';
import { useActive } from '../services/session';
import { useData } from '../services/useData';
import { useTheme } from '../theme';

export default function Examenes() {
  const { store, profile } = useActive();
  const t = useTheme();
  const { data, loading, error, reload } = useData(() => store.list('exam', profile.id));
  return (
    <>
      <Stack.Screen options={{ title: 'Exámenes y resultados' }} />
      <Screen>
        <Button title="Nuevo examen" onPress={() => router.push('/examen/nuevo')} />
        {loading && !data ? <Loading /> : null}
        {error ? <ErrorBox message={error} onRetry={reload} /> : null}
        {data && data.length === 0 ? <Empty title="No hay exámenes registrados." /> : null}
        {data?.map((e) => (
          <Card key={e.id}>
            <Text accessibilityRole="button" onPress={() => router.push(`/examen/${e.id}`)} style={{ color: t.primary, fontSize: 17, fontWeight: '700' }}>{e.name}</Text>
            <P>{formatDateShort(e.examDate)} · {e.status === 'pendiente' ? 'Pendiente de resultado' : 'Con resultado'}</P>
            {e.status === 'con_resultado' ? <P muted small>Origen: {e.resultSource === 'informe_medico' ? 'informe médico' : 'declarado por el usuario'}</P> : null}
          </Card>
        ))}
      </Screen>
    </>
  );
}
