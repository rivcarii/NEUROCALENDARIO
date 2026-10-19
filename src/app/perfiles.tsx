import { Stack, router } from 'expo-router';
import { Text } from 'react-native';
import { Button, Card, P, Row, Screen } from '../components/ui';
import { useSession } from '../services/session';
import { useTheme } from '../theme';

export default function Perfiles() {
  const { profiles, activeProfile, setActiveProfile, account } = useSession();
  const t = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: 'Perfiles' }} />
      <Screen>
        <P muted>Cada perfil tiene su propio calendario, episodios, medicación, citas, exámenes, documentos e informes. Nunca se mezclan.</P>
        {profiles.map((p) => (
          <Card key={p.id} style={{ borderColor: p.color, borderWidth: 2 }}>
            <Text style={{ color: t.text, fontSize: 18, fontWeight: '700' }}>{p.displayName}{p.isPrimary ? ' · principal' : ''}</Text>
            <P muted small>{p.relationship || 'Sin relación indicada'}</P>
            <Row>
              {activeProfile?.id === p.id ? <P>✔ Perfil activo</P> : (
                <Button title="Usar este perfil" onPress={async () => { await setActiveProfile(p.id); router.replace('/'); }} />
              )}
              {account?.role === 'owner' ? <Button title="Editar / eliminar" kind="secondary" onPress={() => router.push(`/perfil/${p.id}`)} /> : null}
            </Row>
          </Card>
        ))}
        {account?.role === 'owner' ? <Button title="Crear perfil nuevo" onPress={() => router.push('/perfil/nuevo')} /> : null}
      </Screen>
    </>
  );
}
