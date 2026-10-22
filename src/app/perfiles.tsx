import { Stack, router } from 'expo-router';
import { View } from 'react-native';
import { Text } from '../components/Text';
import { Button, Card, P, Row, Screen } from '../components/ui';
import { useSession } from '../services/session';
import { useTheme } from '../theme';

export default function Perfiles() {
  const { profiles, activeProfile, setActiveProfile, account } = useSession();
  const t = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: 'Personas' }} />
      <Screen>
        <P muted>Cada persona tiene su propio calendario, síntomas, medicinas, citas, estudios, documentos y resúmenes. Nunca se mezclan.</P>
        {profiles.map((p) => (
          <Card key={p.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: p.color, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>{p.displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('')}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.text, fontSize: 17, fontWeight: '600' }}>{p.displayName}{p.isPrimary ? ' · principal' : ''}</Text>
                <P muted small>{p.relationship || 'Sin relación indicada'}</P>
              </View>
            </View>
            <Row>
              {activeProfile?.id === p.id ? <P style={{ color: t.success } as never}>✔ Es quien ve ahora</P> : (
                <Button title="Ver a esta persona" onPress={async () => { await setActiveProfile(p.id); router.replace('/'); }} />
              )}
              {account?.role === 'owner' ? <Button title="Editar / eliminar" kind="secondary" onPress={() => router.push(`/perfil/${p.id}`)} /> : null}
            </Row>
          </Card>
        ))}
        {account?.role === 'owner' ? <Button title="Añadir una persona" onPress={() => router.push('/perfil/nuevo')} /> : null}
      </Screen>
    </>
  );
}
