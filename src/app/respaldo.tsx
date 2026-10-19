import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Button, Card, H, P, ProfileBar, Screen, TextField, errorMessage } from '../components/ui';
import { buildBackup, decryptBackup, encryptBackup, isEncryptedBackup, MIN_PASSPHRASE, restoreBackup, type BackupPayload } from '../domain/backup';
import { expoFileAdapter } from '../services/files';
import { newId } from '../services/ids';
import { useActive, useSession } from '../services/session';

export default function Respaldo() {
  const { store, profile } = useActive();
  const { refreshProfiles } = useSession();
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [rpass, setRpass] = useState('');
  const [busy, setBusy] = useState<null | 'export' | 'restore'>(null);

  async function exportBackup() {
    if (pass !== pass2) { Alert.alert('Las contraseñas no coinciden'); return; }
    if (pass.length < MIN_PASSPHRASE) { Alert.alert('Contraseña débil', `Use al menos ${MIN_PASSPHRASE} caracteres.`); return; }
    setBusy('export');
    try {
      await new Promise((r) => setTimeout(r, 50)); // deja pintar el indicador
      const payload = await buildBackup(store, profile.id, expoFileAdapter);
      const enc = encryptBackup(payload, pass);
      const stamp = new Date().toISOString().slice(0, 10);
      const out = new File(Paths.cache, `NeuroCalendario_${stamp}.ncbackup`);
      if (out.exists) out.delete();
      out.create();
      out.write(JSON.stringify(enc));
      await store.auditExport(profile.id, 'backup', payload.missingFiles.length ? `${payload.missingFiles.length} adjuntos no encontrados` : 'completa');
      if (payload.missingFiles.length) Alert.alert('Aviso', `${payload.missingFiles.length} archivo(s) adjunto(s) no se encontraron y no se incluyeron.`);
      await Sharing.shareAsync(out.uri, { mimeType: 'application/octet-stream', dialogTitle: 'Guardar copia de seguridad cifrada' });
      setPass(''); setPass2('');
    } catch (e) { Alert.alert('No se pudo crear el respaldo', errorMessage(e)); } finally { setBusy(null); }
  }

  async function restore() {
    setBusy('restore');
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      const a = r.assets?.[0];
      if (r.canceled || !a) return;
      const text = await new File(a.uri).text();
      let parsed: unknown;
      try { parsed = JSON.parse(text); } catch { throw new Error('El archivo no es una copia válida.'); }
      let payload: BackupPayload;
      if (isEncryptedBackup(parsed)) {
        if (!rpass) throw new Error('Escriba la contraseña de la copia.');
        await new Promise((res) => setTimeout(res, 50));
        payload = decryptBackup(parsed, rpass);
      } else payload = parsed as BackupPayload;
      const res = await restoreBackup(store, payload, newId, expoFileAdapter);
      await refreshProfiles();
      setRpass('');
      Alert.alert('Respaldo recuperado', `Se creó un perfil nuevo con ${Object.values(res.counts).reduce((x, y) => x + y, 0)} registros. Sus perfiles existentes no se modificaron.`);
    } catch (e) { Alert.alert('No se pudo recuperar', errorMessage(e)); } finally { setBusy(null); }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Respaldo de sus datos' }} />
      <ProfileBar name={profile.displayName} color={profile.color} label="Copia de" />
      <Screen>
        <Card>
          <H level={2}>Guardar un respaldo con clave</H>
          <P muted small>Guarda todos los datos y documentos de esta persona, protegidos con una contraseña que usted elige. Si la olvida, nadie podrá abrir el respaldo: anótela en un lugar seguro.</P>
          <TextField label="Contraseña del respaldo" value={pass} onChangeText={setPass} secureTextEntry autoCapitalize="none" autoCorrect={false} />
          <TextField label="Repita la contraseña" value={pass2} onChangeText={setPass2} secureTextEntry autoCapitalize="none" autoCorrect={false} />
          <Button title="Crear y guardar respaldo" onPress={exportBackup} loading={busy === 'export'} disabled={busy !== null} />
        </Card>
        <Card>
          <H level={2}>Recuperar un respaldo</H>
          <P muted small>Se recupera como una persona NUEVA («… (recuperado)»). Nunca borra ni cambia lo que ya tiene.</P>
          <TextField label="Contraseña del respaldo" value={rpass} onChangeText={setRpass} secureTextEntry autoCapitalize="none" autoCorrect={false} />
          <Button title="Elegir el archivo y recuperar" kind="secondary" onPress={restore} loading={busy === 'restore'} disabled={busy !== null} />
        </Card>
        <P muted small>Guarde el respaldo en un lugar seguro (por ejemplo, su correo o la nube). Está protegido, pero la contraseña es lo único que lo abre.</P>
      </Screen>
    </>
  );
}
