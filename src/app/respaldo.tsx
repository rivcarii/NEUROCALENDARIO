import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Platform } from 'react-native';
import { Button, Card, ErrorBox, H, P, ProfileBar, Row, Screen, TextField, errorMessage, notify } from '../components/ui';
import { downloadWebFile, makeWebFile, shareWebFile, type WebFile } from '../services/pdfOut';
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
  // Mensajes en pantalla (además del aviso): en el navegador es la forma fiable de saber qué pasó.
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [webFile, setWebFile] = useState<WebFile | null>(null);
  const fail = (title: string, e: unknown) => { const text = `${title}: ${errorMessage(e)}`; setMsg({ ok: false, text }); notify(title, errorMessage(e)); };

  async function exportBackup() {
    setMsg(null); setWebFile(null);
    if (pass.length < MIN_PASSPHRASE) { setMsg({ ok: false, text: `La contraseña es muy corta: use al menos ${MIN_PASSPHRASE} caracteres (lleva ${pass.length}).` }); return; }
    if (pass !== pass2) { setMsg({ ok: false, text: 'Las dos contraseñas no coinciden. Escríbalas de nuevo.' }); return; }
    setBusy('export');
    try {
      await new Promise((r) => setTimeout(r, 50)); // deja pintar el indicador
      const web = Platform.OS === 'web';
      const payload = await buildBackup(store, profile.id, web ? undefined : expoFileAdapter);
      const enc = encryptBackup(payload, pass);
      const stamp = new Date().toISOString().slice(0, 10);
      if (web) {
        // iPhone/Android: hoja de compartir (Guardar en Archivos, correo…); computador: descarga.
        const f = makeWebFile(JSON.stringify(enc), `NeuroCalendario_${stamp}.ncbackup`, 'application/octet-stream');
        setWebFile(f);
        await store.auditExport(profile.id, 'backup', 'completa (web, sin adjuntos)');
        const res = await shareWebFile(f, 'Respaldo de NeuroCalendario');
        if (res === 'no_disponible') downloadWebFile(f);
        setMsg({ ok: true, text: `Respaldo creado: ${f.name}. ${res === 'compartido' ? 'Se envió a donde eligió.' : 'Si no se guardó, use «Guardar o compartir» o «Descargar».'}` });
        setPass(''); setPass2('');
        return;
      }
      const out = new File(Paths.cache, `NeuroCalendario_${stamp}.ncbackup`);
      if (out.exists) out.delete();
      out.create();
      out.write(JSON.stringify(enc));
      await store.auditExport(profile.id, 'backup', payload.missingFiles.length ? `${payload.missingFiles.length} adjuntos no encontrados` : 'completa');
      if (payload.missingFiles.length) notify('Aviso', `${payload.missingFiles.length} archivo(s) adjunto(s) no se encontraron y no se incluyeron.`);
      await Sharing.shareAsync(out.uri, { mimeType: 'application/octet-stream', dialogTitle: 'Guardar copia de seguridad cifrada' });
      setPass(''); setPass2('');
      setMsg({ ok: true, text: 'Respaldo creado y listo para guardar.' });
    } catch (e) { fail('No se pudo crear el respaldo', e); } finally { setBusy(null); }
  }

  async function restore() {
    setMsg(null);
    setBusy('restore');
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      const a = r.assets?.[0];
      if (r.canceled || !a) return;
      const text = Platform.OS === 'web' && a.file ? await a.file.text() : await new File(a.uri).text();
      let parsed: unknown;
      try { parsed = JSON.parse(text); } catch { throw new Error('El archivo no es una copia válida.'); }
      let payload: BackupPayload;
      if (isEncryptedBackup(parsed)) {
        if (!rpass) throw new Error('Escriba la contraseña de la copia.');
        await new Promise((res) => setTimeout(res, 50));
        payload = decryptBackup(parsed, rpass);
      } else payload = parsed as BackupPayload;
      const res = await restoreBackup(store, payload, newId, Platform.OS === 'web' ? undefined : expoFileAdapter);
      await refreshProfiles();
      setRpass('');
      const restored = await store.getProfile(res.profileId);
      const summary = `Se creó la persona «${restored?.displayName ?? 'recuperada'}» con ${Object.values(res.counts).reduce((x, y) => x + y, 0)} registros. Sus datos actuales no se modificaron. Puede verla en Más → Personas.`;
      setMsg({ ok: true, text: `Respaldo recuperado. ${summary}` });
      notify('Respaldo recuperado', summary);
    } catch (e) { fail('No se pudo recuperar', e); } finally { setBusy(null); }
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
          {webFile ? (
            <Row>
              <Button title="Guardar o compartir" kind="secondary" onPress={() => { void shareWebFile(webFile, 'Respaldo de NeuroCalendario').then((r) => { if (r === 'no_disponible') downloadWebFile(webFile); }); }} />
              <Button title="Descargar" kind="secondary" onPress={() => downloadWebFile(webFile)} />
            </Row>
          ) : null}
        </Card>
        {msg ? (msg.ok ? <Card style={{ borderLeftWidth: 5, borderLeftColor: '#1F7A36' }}><P>✔ {msg.text}</P></Card> : <ErrorBox message={msg.text} />) : null}
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
