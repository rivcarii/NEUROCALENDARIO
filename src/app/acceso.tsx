import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Button, Card, Chips, ErrorBox, H, Loading, P, Row, Screen, TextField, confirmDestructive, errorMessage } from '../components/ui';
import { LEVEL_LABEL } from '../domain/labels';
import type { AccessLevel } from '../db/types';
import { useActive, useSession } from '../services/session';
import { useData } from '../services/useData';

export default function Acceso() {
  const { store, profile, account } = useActive();
  const { bump } = useSession();
  const [name, setName] = useState('');
  const { data, loading, error, reload } = useData(async () => {
    if (account.role !== 'owner') return null;
    const accounts = (await store.listAccounts()).filter((a) => a.role === 'family');
    const perms = await store.listPermissions(profile.id);
    return { accounts, perms };
  });

  if (account.role !== 'owner') return <Screen><P>Solo el propietario puede administrar el acceso familiar.</P></Screen>;

  return (
    <>
      <Stack.Screen options={{ title: 'Acceso familiar' }} />
      <Screen>
        <Card>
          <H level={2}>Estado de esta función</H>
          <P small>Las cuentas familiares y sus permisos se registran en este dispositivo.</P>
          <P muted small>Para que otra persona acceda desde su propio teléfono hace falta activar la sincronización segura (servidor con control de acceso por perfil), que no está habilitada en esta versión. Hasta entonces, nadie más puede ver los datos.</P>
        </Card>
        {loading && !data ? <Loading /> : null}
        {error ? <ErrorBox message={error} onRetry={reload} /> : null}
        <TextField label="Nueva cuenta familiar (nombre)" value={name} onChangeText={setName} />
        <Button title="Crear cuenta familiar" disabled={!name.trim()} onPress={async () => {
          try { await store.createFamilyAccount(name); setName(''); bump(); reload(); } catch (e) { Alert.alert('Error', errorMessage(e)); }
        }} />
        {data?.accounts.map((a) => {
          const perm = data.perms.find((p) => p.accountId === a.id && !p.revokedAt);
          return (
            <Card key={a.id}>
              <P>{a.displayName}</P>
              <P muted small>Acceso a «{profile.displayName}»: {perm ? LEVEL_LABEL[perm.level] : 'sin acceso'}</P>
              <Chips options={(['read', 'write'] as AccessLevel[]).map((l) => ({ value: l, label: LEVEL_LABEL[l] }))} value={perm?.level ?? null}
                onChange={async (l) => { try { await store.grant(profile.id, a.id, l); bump(); reload(); } catch (e) { Alert.alert('Error', errorMessage(e)); } }} />
              {perm ? (
                <Row><Button title="Revocar acceso" kind="danger" onPress={async () => {
                  if (!(await confirmDestructive('Revocar acceso', `${a.displayName} dejará de tener acceso a ${profile.displayName}.`, 'Revocar'))) return;
                  try { await store.revoke(profile.id, a.id); bump(); reload(); } catch (e) { Alert.alert('Error', errorMessage(e)); }
                }} /></Row>
              ) : null}
            </Card>
          );
        })}
      </Screen>
    </>
  );
}
