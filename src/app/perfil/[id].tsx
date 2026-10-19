import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Switch } from 'react-native';
import { Button, Chips, P, Row, Screen, TextField, confirmDestructive, errorMessage } from '../../components/ui';
import { PROFILE_COLORS } from '../../domain/labels';
import { deleteProfileFiles } from '../../services/files';
import { useSession } from '../../services/session';

export default function PerfilForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'nuevo';
  const { store, profiles, refreshProfiles, setActiveProfile, activeProfile } = useSession();
  const existing = profiles.find((p) => p.id === id);
  const [name, setName] = useState(existing?.displayName ?? '');
  const [rel, setRel] = useState(existing?.relationship ?? '');
  const [year, setYear] = useState(existing?.birthYear ? String(existing.birthYear) : '');
  const [color, setColor] = useState(existing?.color ?? PROFILE_COLORS[profiles.length % PROFILE_COLORS.length]!);
  const [primary, setPrimary] = useState(existing?.isPrimary ?? false);
  const [confirmName, setConfirmName] = useState('');
  const [err, setErr] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!store) return;
    setBusy(true); setErr(undefined);
    try {
      const payload = { displayName: name, relationship: rel, birthYear: year ? Number(year) : null, color, isPrimary: primary };
      if (isNew) { const p = await store.createProfile(payload); await refreshProfiles(); await setActiveProfile(p.id); }
      else { await store.updateProfile(id, payload); await refreshProfiles(); }
      router.back();
    } catch (e) { setErr(errorMessage(e)); } finally { setBusy(false); }
  }

  async function remove() {
    if (!store || !existing) return;
    if (!(await confirmDestructive('Eliminar perfil y TODOS sus datos', `Se eliminarán de forma permanente los episodios, medicación, citas, exámenes, documentos y notas de ${existing.displayName}. Haga antes una copia de seguridad si desea conservarlos.`, 'Eliminar todo'))) return;
    try {
      await store.deleteProfile(existing.id);
      try { deleteProfileFiles(existing.id); } catch { /* sin archivos */ }
      await refreshProfiles();
      router.replace('/');
    } catch (e) { Alert.alert('No se pudo eliminar', errorMessage(e)); }
  }

  return (
    <>
      <Stack.Screen options={{ title: isNew ? 'Nuevo perfil' : 'Editar perfil' }} />
      <Screen>
        <TextField label="Nombre" value={name} onChangeText={setName} error={err} />
        <TextField label="Relación (ej.: Mamá, Yo)" value={rel} onChangeText={setRel} />
        <TextField label="Año de nacimiento (opcional)" value={year} onChangeText={setYear} keyboardType="number-pad" />
        <Chips label="Color de identificación" options={PROFILE_COLORS.map((c) => ({ value: c, label: c }))} value={color} onChange={setColor} />
        <Row><Switch accessibilityLabel="Perfil principal" value={primary} onValueChange={setPrimary} /><P>Perfil principal de seguimiento</P></Row>
        <P muted small>Registre datos de otra persona solo con su conocimiento y autorización.</P>
        {isNew ? <P muted small>Al crearlo pasará a ser el perfil activo. La franja de color de la parte superior siempre indica de quién son los datos que ve.</P> : null}
        <Button title="Guardar" onPress={save} loading={busy} />
        {!isNew && existing ? (
          <>
            <TextField label={`Para eliminar, escriba: ${existing.displayName}`} value={confirmName} onChangeText={setConfirmName} />
            <Button title="Eliminar perfil y sus datos" kind="danger" disabled={confirmName.trim() !== existing.displayName || existing.id === activeProfile?.id && profiles.length === 1} onPress={() => void remove()} />
            {profiles.length === 1 ? <P muted small>No puede eliminar el único perfil; cree otro primero.</P> : null}
          </>
        ) : null}
      </Screen>
    </>
  );
}
