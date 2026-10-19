import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { Button, Card, Empty, ErrorBox, Loading, P, ProfileBar, Row, Screen, TextField, confirmDestructive, errorMessage } from '../components/ui';
import { formatDateShort, localDateKey } from '../domain/time';
import { attachmentUri, deleteAttachment, storeAttachment } from '../services/files';
import { useActive, useSession } from '../services/session';
import { useData } from '../services/useData';

export default function Documentos() {
  const { store, profile } = useActive();
  const { bump } = useSession();
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const { data, loading, error, reload } = useData(() => store.list('document', profile.id));
  const web = Platform.OS === 'web';

  async function add(source: { uri: string; name: string }) {
    const pid = profile.id;
    let stored: Awaited<ReturnType<typeof storeAttachment>> | null = null;
    try {
      stored = await storeAttachment(source.uri, source.name, pid);
      await store.create('document', pid, { ...stored, title: title.trim() || stored.fileName, docDate: localDateKey(new Date()) });
      setTitle(''); bump();
    } catch (e) {
      if (stored) { try { deleteAttachment(stored.storagePath, pid); } catch { /* ya no existe */ } }
      Alert.alert('No se pudo añadir', errorMessage(e));
    }
  }

  async function pickFile() {
    setBusy(true);
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/jpeg', 'image/png'], copyToCacheDirectory: true });
      const a = r.assets?.[0];
      if (!r.canceled && a) await add({ uri: a.uri, name: a.name });
    } finally { setBusy(false); }
  }

  async function takePhoto() {
    setBusy(true);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { Alert.alert('Permiso necesario', 'Active el permiso de cámara para fotografiar documentos.'); return; }
      const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
      const a = r.assets?.[0];
      if (!r.canceled && a) await add({ uri: a.uri, name: a.fileName ?? 'foto.jpg' });
    } finally { setBusy(false); }
  }

  async function open(path: string, mime: string) {
    try { await Sharing.shareAsync(attachmentUri(path, profile.id), { mimeType: mime }); } catch (e) { Alert.alert('No se pudo abrir', errorMessage(e)); }
  }

  async function remove(id: string, path: string) {
    if (!(await confirmDestructive('¿Eliminar documento?', 'Se eliminará el archivo de este dispositivo. Esta acción no se puede deshacer.', 'Eliminar'))) return;
    try { await store.remove('document', profile.id, id); try { deleteAttachment(path, profile.id); } catch { /* ya no existe */ } bump(); } catch (e) { Alert.alert('No se pudo eliminar', errorMessage(e)); }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Documentos' }} />
      <ProfileBar name={profile.displayName} color={profile.color} label="Se guardará en" />
      <Screen>
        {web ? (
          <Empty title="Los documentos no se pueden adjuntar desde el navegador." hint="Instale la app de Android/iPhone para guardar PDF y fotos de forma privada." />
        ) : (
          <>
            <TextField label="Título del documento (opcional)" value={title} onChangeText={setTitle} />
            <Row>
              <Button title="Elegir un PDF o una foto" onPress={pickFile} loading={busy} />
              <Button title="Fotografiar" kind="secondary" onPress={takePhoto} disabled={busy} />
            </Row>
          </>
        )}
        <P muted small>Solo PDF, JPG y PNG de hasta 15 MB. Se guardan dentro de la app (no en la galería) y no se envían a ningún servidor.</P>
        {loading && !data ? <Loading /> : null}
        {error ? <ErrorBox message={error} onRetry={reload} /> : null}
        {data && data.length === 0 ? <Empty title="No hay documentos." /> : null}
        {data?.map((d) => (
          <Card key={d.id}>
            <P>{d.title}</P>
            <P muted small>{d.fileName} · {(d.sizeBytes / 1024).toFixed(0)} KB · {d.docDate ? formatDateShort(d.docDate) : ''}</P>
            <Row>
              <Button title="Abrir / compartir" kind="secondary" onPress={() => void open(d.storagePath, d.mimeType)} />
              <Button title="Eliminar" kind="danger" onPress={() => void remove(d.id, d.storagePath)} />
            </Row>
          </Card>
        ))}
      </Screen>
    </>
  );
}
