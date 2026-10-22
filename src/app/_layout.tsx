import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { Text } from '../components/Text';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Isologo } from '../components/Brand';
import { NeuroArt } from '../components/NeuroArt';
import { UpdatePrompt } from '../components/UpdatePrompt';
import { Button, Card, H, P, Screen, TextField } from '../components/ui';
import { configureNotifications, rescheduleAll } from '../services/notifications';
import { syncPush } from '../services/push';
import { SessionProvider, useSession } from '../services/session';
import { useTheme } from '../theme';
import { SYSTEM_FONT } from '../theme/type';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <Gate />
        <UpdatePrompt />
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
        // Versión web: reenvía al servicio de avisos las horas de los próximos recordatorios (si están activados).
        if (r.unsupported) await syncPush(store, details).catch(() => undefined);
        await store.setSetting('reminder_status', r.unsupported ? 'web' : r.permission ? `ok:${r.scheduled}` : 'sin_permiso');
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
      <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal', headerShadowVisible: false, headerStyle: { backgroundColor: t.bg }, headerTintColor: t.primary, headerTitleStyle: { fontFamily: SYSTEM_FONT, fontWeight: '600', fontSize: 17, color: t.text }, contentStyle: { backgroundColor: t.bg } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

function Onboarding() {
  const { onboard } = useSession();
  const t = useTheme();
  const [owner, setOwner] = useState('');
  const [person, setPerson] = useState('');
  const [rel, setRel] = useState('Mamá');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: 4, paddingTop: 8 }}>
        <Isologo size={30} stacked />
        <NeuroArt kind="cerebro" size={240} />
      </View>
      <H>Le damos la bienvenida</H>
      <P muted>Un diario para anotar cómo se siente, sus medicinas y sus citas, y compartirlo con su médico. Sus datos se guardan solo en este teléfono. No reemplaza la atención médica.</P>
      <Card>
        <TextField label="Su nombre (quien administra la app)" value={owner} onChangeText={setOwner} autoCapitalize="words" />
        <TextField label="¿A quién va a acompañar principalmente?" value={person} onChangeText={setPerson} autoCapitalize="words" hint="Después podrá añadir a otras personas, cada una con su propio historial." />
        <TextField label="¿Qué es suya esa persona? (mamá, yo…)" value={rel} onChangeText={setRel} />
      </Card>
      <P muted small>Anote datos de otra persona solo si ella lo sabe y está de acuerdo. Cada persona tiene su propio historial y nunca se mezclan.</P>
      {err ? <Text accessibilityRole="alert" style={{ color: t.danger }}>{err}</Text> : null}
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
