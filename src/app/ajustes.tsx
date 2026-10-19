import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Switch } from 'react-native';
import { Button, Card, H, P, Row, Screen, TextField, confirmDestructive, errorMessage } from '../components/ui';
import { deleteProfileFiles } from '../services/files';
import { APP_BUILD, checkForUpdate, updatesSupported } from '../services/updates';
import { useSession } from '../services/session';
import { useData } from '../services/useData';

export default function Ajustes() {
  const { store, profiles, appLockEnabled, setAppLock, refreshProfiles, bump } = useSession();
  const { data, reload } = useData(async () => ({
    details: (await store?.getSetting('notif_details')) === '1',
    status: (await store?.getSetting('reminder_status')) ?? 'pendiente',
  }));
  const [wipe, setWipe] = useState('');

  const statusText = (s: string) =>
    s.startsWith('ok:') ? `${s.slice(3)} recordatorio(s) programado(s)` : s === 'web' ? 'Versión web: los avisos solo suenan con la app abierta. Para avisos con la app cerrada instale la app de Android/iPhone.' : s === 'sin_permiso' ? 'Sin permiso de notificaciones: active el permiso en los ajustes del teléfono.' : s === 'error' ? 'Error al programar recordatorios' : 'Aún sin programar';

  return (
    <>
      <Stack.Screen options={{ title: 'Privacidad y ajustes' }} />
      <Screen>
        <Card>
          <H level={2}>Bloqueo de la app</H>
          <Row>
            <Switch accessibilityLabel="Bloquear con huella, rostro o código" value={appLockEnabled}
              onValueChange={async (v) => { const r = await setAppLock(v); if (!r.ok && r.message) Alert.alert('No se pudo cambiar', r.message); }} />
            <P>Pedir huella, rostro o código al abrir</P>
          </Row>
          <P muted small>Protege la entrada a la aplicación. Sus datos quedan guardados solo en este teléfono; active también el bloqueo de pantalla del teléfono para mayor seguridad.</P>
        </Card>
        <Card>
          <H level={2}>Avisos</H>
          <Row>
            <Switch accessibilityLabel="Mostrar detalles en notificaciones" value={data?.details ?? false}
              onValueChange={async (v) => { await store?.setSetting('notif_details', v ? '1' : '0'); bump(); reload(); }} />
            <P>Mostrar el nombre de la medicina o la cita en la pantalla bloqueada</P>
          </Row>
          <P muted small>Apagado por defecto: el aviso dice solo «Tiene un recordatorio pendiente», para que nadie vea sus datos.</P>
          <P small>Estado: {statusText(data?.status ?? 'pendiente')}</P>
          <P muted small>Los avisos no garantizan atención médica ni sirven como alarma de emergencia. Pueden retrasarse o no llegar si el teléfono está en ahorro de batería o sin permisos.</P>
        </Card>
        {updatesSupported() ? <UpdateCard /> : null}
        <Card>
          <H level={2}>Privacidad</H>
          <P small>• Sus datos se guardan solo en este teléfono.</P>
          <P small>• Su información de salud no se envía a ningún servicio externo ni a inteligencia artificial.</P>
          <P small>• Los resúmenes y respaldos salen de la app solo cuando usted los comparte.</P>
          <P small>• La app no genera diagnósticos ni cambia tratamientos.</P>
        </Card>
        <Card>
          <H level={2}>Eliminar todos los datos</H>
          <P muted small>Borra todos los perfiles y archivos de este dispositivo. Haga antes una copia de seguridad.</P>
          <TextField label="Escriba ELIMINAR para confirmar" value={wipe} onChangeText={setWipe} autoCapitalize="characters" />
          <Button title="Eliminar todo" kind="danger" disabled={wipe !== 'ELIMINAR'} onPress={async () => {
            if (!store) return;
            if (!(await confirmDestructive('¿Eliminar todos los datos?', 'Se borrarán todos los perfiles y documentos. No se puede deshacer.', 'Eliminar todo'))) return;
            try {
              for (const p of profiles) { await store.deleteProfile(p.id); try { deleteProfileFiles(p.id); } catch { /* sin archivos */ } }
              await refreshProfiles(); router.replace('/');
            } catch (e) { Alert.alert('No se pudo eliminar', errorMessage(e)); }
          }} />
        </Card>
      </Screen>
    </>
  );
}

function UpdateCard() {
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <Card>
      <H level={2}>Versión</H>
      <P small>{APP_BUILD.replace('+', ' · ')}</P>
      <P muted small>Pantalla: ventana {window.innerWidth}×{window.innerHeight} · dispositivo {screen.width}×{screen.height}</P>
      <Button title="Buscar actualizaciones" kind="secondary" onPress={async () => {
        setMsg('Buscando…');
        setMsg((await checkForUpdate(true)) ? 'Hay una versión nueva: aparecerá un aviso.' : 'Ya tiene la última versión.');
      }} />
      {msg ? <P muted small>{msg}</P> : null}
    </Card>
  );
}
