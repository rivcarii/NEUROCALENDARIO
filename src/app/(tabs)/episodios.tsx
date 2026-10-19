import { router } from 'expo-router';
import { useState } from 'react';
import { Button, Card, Chips, Empty, ErrorBox, Loading, P, Row, Screen, TextField, TapText } from '../../components/ui';
import { RECOVERY_LABEL } from '../../domain/labels';
import { durationMinutes, formatDateTime, formatDuration, localDateKey, addDays, startOfLocalDayIso } from '../../domain/time';
import { useActive } from '../../services/session';
import { useData } from '../../services/useData';
import { useTheme } from '../../theme';

const PERIODS = [
  { value: 7, label: '7 días' }, { value: 30, label: '30 días' }, { value: 90, label: '90 días' }, { value: 0, label: 'Todo' },
];

export default function Episodios() {
  const { store, profile } = useActive();
  const t = useTheme();
  const [q, setQ] = useState('');
  const [days, setDays] = useState(30);
  const { data, loading, error, reload } = useData(async () => {
    const from = days ? startOfLocalDayIso(addDays(localDateKey(new Date()), -days + 1)) : undefined;
    return store.list('episode', profile.id, { search: q, from });
  }, [q, days]);

  return (
    <Screen>
      <Button title="Nuevo episodio" onPress={() => router.push('/episodio/nuevo')} />
      <TextField label="Buscar" value={q} onChangeText={setQ} placeholder="Tipo, contexto u observaciones" returnKeyType="search" />
      <Chips label="Período" options={PERIODS} value={days} onChange={setDays} />
      {loading && !data ? <Loading /> : null}
      {error ? <ErrorBox message={error} onRetry={reload} /> : null}
      {data && data.length === 0 ? <Empty title="No hay episodios en este período." hint={q ? 'Pruebe con otra búsqueda.' : 'Use «Nuevo episodio» o el registro rápido de Hoy.'} /> : null}
      {data?.map((e) => (
        <Card key={e.id}>
          <TapText onPress={() => router.push(`/episodio/${e.id}`)} style={{ color: t.primary, fontSize: 17, fontWeight: '700' }}>{e.kind}</TapText>
          <P>{formatDateTime(e.startedAt)} · {formatDuration(durationMinutes(e.startedAt, e.endedAt))}</P>
          <Row>
            {e.intensity !== null ? <P muted small>Intensidad {e.intensity}/10</P> : null}
            <P muted small>{RECOVERY_LABEL[e.recovery]}</P>
            {e.isQuick ? <P muted small>Registro rápido</P> : null}
          </Row>
        </Card>
      ))}
      {data ? <P muted small>{data.length} episodio(s) en {profile.displayName}</P> : null}
    </Screen>
  );
}
