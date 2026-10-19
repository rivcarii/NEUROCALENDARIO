import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Button, Card, H, P, Screen, TextField } from '../components/ui';
import { configureNotifications, rescheduleAll } from '../services/notifications';
import { SessionProvider, useSession } from '../services/session';
import { useTheme } from '../theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <Gate />
      </SessionProvider>
    </SafeAreaProvider>
  );
}

function Gate() {
  const s = useSession();
  const t = useTheme();
  useEffect(() => { configureNotifications(); }, []);

  // Mantiene sincronizados los recordatorios locales con los datos persistidos.
  useEffect(() => {
    if (s.status !== 'ready' || !s.store) return;
    const store = s.store;
    const id = setTimeout(async () => {
      try {
        const details = (await store.getSetting('notif_details')) === '1';
        const r = await rescheduleAll(store, details);
        await store.setSetting('reminder_status', r.permission ? `ok:${r.scheduled}` : 'sin_permiso');
      } catch {
        await store.setSetting('reminder_status', 'error').catch(() => undefined);
      }
    }, 800);
    return () => clearTimeout(id);
  }, [s.status, s.store, s.version]);

  if (s.status === 'loading') {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}><ActivityIndicator size="large" color={t.primary} accessibilityLabel="Abriendo" /></View>;
  }
  if (s.status === 'error') {
    return (
      <Screen>
        <H>No se pudo abrir la aplicación</H>
        <Card><Text accessibilityRole="alert" style={{ color: t.danger }}>{s.error}</Text></Card>
        <P muted>Sus datos no se han modificado. Cierre y vuelva a abrir la aplicación. Si el problema continúa, no la desinstale: restaure primero una copia de seguridad.</P>
      </Screen>
    );
  }
  if (s.status === 'onboarding') return <Onboarding />;
  if (s.status === 'locked') return <Locked />;

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerBackTitle: 'Atrás', headerStyle: { backgroundColor: t.card }, headerTintColor: t.text }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

function Onboarding() {
  const { onboard } = useSession();
  const [owner, setOwner] = useState('');
  const [person, setPerson] = useState('');
  const [rel, setRel] = useState('Mamá');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <Screen>
      <H>Bienvenido a NeuroCalendario</H>
      <P muted>Seguimiento neurológico personal y familiar. Los datos se guardan en este dispositivo. No sustituye la atención de un profesional sanitario.</P>
      <Card>
        <TextField label="Su nombre (propietario de la aplicación)" value={owner} onChangeText={setOwner} autoCapitalize="words" />
        <TextField label="Nombre de la persona principal de seguimiento" value={person} onChangeText={setPerson} autoCapitalize="words" hint="Podrá crear más perfiles después, cada uno con su historial independiente." />
        <TextField label="Parentesco o relación" value={rel} onChangeText={setRel} />
      </Card>
      <P muted small>Use esta aplicación solo con datos de personas que le hayan autorizado a registrarlos. Cada perfil tiene su propio historial y nunca se mezclan.</P>
      {err ? <Text accessibilityRole="alert" style={{ color: '#B3261E' }}>{err}</Text> : null}
      <Button
        title="Comenzar" loading={busy} disabled={!owner.trim() || !person.trim()}
        onPress={async () => {
          setBusy(true); setErr(null);
          try { await onboard(owner, person, rel); } catch (e) { setErr(e instanceof Error ? e.message : 'Error'); } finally { setBusy(false); }
        }}
      />
    </Screen>
  );
}

function Locked() {
  const { unlock } = useSession();
  useEffect(() => { void unlock(); }, [unlock]);
  return (
    <Screen>
      <H>NeuroCalendario bloqueado</H>
      <P muted>Verifique su identidad para ver la información de salud.</P>
      <Button title="Desbloquear" onPress={() => void unlock()} />
    </Screen>
  );
}
