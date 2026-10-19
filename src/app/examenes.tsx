import { Stack, router } from 'expo-router';
import { Button, Card, Empty, ErrorBox, Loading, P, Screen, TapText } from '../components/ui';
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
      <Stack.Screen options={{ title: 'Estudios y resultados' }} />
      <Screen>
        <Button title="Añadir un estudio" onPress={() => router.push('/examen/nuevo')} />
        {loading && !data ? <Loading /> : null}
        {error ? <ErrorBox message={error} onRetry={reload} /> : null}
        {data && data.length === 0 ? <Empty title="No hay estudios anotados." /> : null}
        {data?.map((e) => (
          <Card key={e.id}>
            <TapText onPress={() => router.push(`/examen/${e.id}`)} style={{ color: t.primary, fontSize: 17, fontWeight: '700' }}>{e.name}</TapText>
            <P>{formatDateShort(e.examDate)} · {e.status === 'pendiente' ? 'Esperando resultado' : 'Con resultado'}</P>
            {e.status === 'con_resultado' ? <P muted small>Resultado: {e.resultSource === 'informe_medico' ? 'informe del médico' : 'lo anotó usted'}</P> : null}
          </Card>
        ))}
      </Screen>
    </>
  );
}
