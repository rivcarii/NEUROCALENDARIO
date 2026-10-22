import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Button, Chips, DateTimeField, ErrorBox, Loading, P, ProfileBar, Screen, TextField, confirmDestructive, errorMessage, notify } from '../../components/ui';
import { localDateKey } from '../../domain/time';
import type { Note } from '../../db/types';
import { useActive, useSession } from '../../services/session';
import { useData } from '../../services/useData';

export default function NotaForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'nueva';
  const { store, profile } = useActive();
  const [pid] = useState(profile.id); // el perfil se fija al abrir el formulario
  const { data, loading, error, reload } = useData(async () => (isNew ? null : (await store.get('note', pid, id)) ?? null), [id]);
  if (loading && !isNew && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!isNew && !data) return <Screen><P>Esta nota no existe en el perfil activo.</P></Screen>;
  return <NotaEditor key={data?.id ?? 'nueva'} id={id} isNew={isNew} pid={pid} initial={data} />;
}

function NotaEditor({ id, isNew, pid, initial }: { id: string; isNew: boolean; pid: string; initial: Note | null }) {
  const { store, profile } = useActive();
  const { bump, activeProfile } = useSession();
  const [body, setBody] = useState(initial?.body ?? '');
  const [date, setDate] = useState(initial?.noteDate ?? localDateKey(new Date()));
  const [role, setRole] = useState<'persona' | 'cuidador'>(initial?.authorRole ?? 'persona');
  const [err, setErr] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  async function save() {
    if (activeProfile?.id !== pid) { notify('Perfil cambiado', 'No se guardó nada para evitar mezclar datos.'); return; }
    setBusy(true); setErr(undefined);
    try {
      const payload = { body, noteDate: date, authorRole: role };
      if (isNew) await store.create('note', pid, payload); else await store.update('note', pid, id, payload);
      bump(); router.back();
    } catch (e) { setErr(errorMessage(e)); } finally { setBusy(false); }
  }
  async function remove() {
    if (!(await confirmDestructive('¿Eliminar nota?', 'Se eliminará esta nota.', 'Eliminar'))) return;
    try { await store.remove('note', pid, id); bump(); router.back(); } catch (e) { notify('No se pudo eliminar', errorMessage(e)); }
  }
  return (
    <>
      <Stack.Screen options={{ title: isNew ? 'Nueva nota' : 'Nota' }} />
      <ProfileBar name={profile.displayName} color={profile.color} label="Se guardará en" />
      <Screen>
        <Chips label="Quién la escribe" options={[{ value: 'persona', label: 'Persona del perfil' }, { value: 'cuidador', label: 'Cuidador' }]} value={role} onChange={setRole} />
        <DateTimeField label="Fecha" withTime={false} date={date} onChange={(d) => d && setDate(d)} />
        <TextField label="Nota" value={body} onChangeText={setBody} multiline numberOfLines={8} error={err} />
        <Button title="Guardar" onPress={save} loading={busy} />
        {!isNew ? <Button title="Eliminar nota" kind="danger" onPress={() => void remove()} /> : null}
      </Screen>
    </>
  );
}
