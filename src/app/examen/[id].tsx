import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Button, Chips, DateTimeField, ErrorBox, Loading, P, ProfileBar, Screen, TextField, confirmDestructive, errorMessage } from '../../components/ui';
import { localDateKey } from '../../domain/time';
import type { Exam } from '../../db/types';
import { useActive, useSession } from '../../services/session';
import { useData } from '../../services/useData';

export default function ExamenForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'nuevo';
  const { store, profile } = useActive();
  const [pid] = useState(profile.id); // el perfil se fija al abrir el formulario
  const { data, loading, error, reload } = useData(async () => (isNew ? null : (await store.get('exam', pid, id)) ?? null), [id]);
  if (loading && !isNew && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!isNew && !data) return <Screen><P>Este examen no existe en el perfil activo.</P></Screen>;
  return <ExamenEditor key={data?.id ?? 'nuevo'} id={id} isNew={isNew} pid={pid} initial={data} />;
}

function ExamenEditor({ id, isNew, pid, initial }: { id: string; isNew: boolean; pid: string; initial: Exam | null }) {
  const { store, profile } = useActive();
  const { bump, activeProfile } = useSession();
  const [name, setName] = useState(initial?.name ?? '');
  const [kind, setKind] = useState(initial?.kind ?? '');
  const [date, setDate] = useState(initial?.examDate ?? localDateKey(new Date()));
  const [status, setStatus] = useState<'pendiente' | 'con_resultado'>(initial?.status ?? 'pendiente');
  const [result, setResult] = useState(initial?.resultText ?? '');
  const [source, setSource] = useState<'informe_medico' | 'declarado_por_usuario'>(initial?.resultSource ?? 'declarado_por_usuario');
  const [requestedBy, setRequestedBy] = useState(initial?.requestedBy ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [err, setErr] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  async function save() {
    if (activeProfile?.id !== pid) { Alert.alert('Perfil cambiado', 'No se guardó nada para evitar mezclar datos.'); return; }
    setBusy(true); setErr(undefined);
    try {
      const payload = { name, kind, examDate: date, status, resultText: result, resultSource: source, requestedBy, notes };
      if (isNew) await store.create('exam', pid, payload); else await store.update('exam', pid, id, payload);
      bump(); router.back();
    } catch (e) { setErr(errorMessage(e)); } finally { setBusy(false); }
  }
  async function remove() {
    if (!(await confirmDestructive('Eliminar examen', 'Se eliminará este examen. Los documentos vinculados se conservan.', 'Eliminar'))) return;
    try { await store.remove('exam', pid, id); bump(); router.back(); } catch (e) { Alert.alert('No se pudo eliminar', errorMessage(e)); }
  }

  return (
    <>
      <Stack.Screen options={{ title: isNew ? 'Nuevo examen' : 'Examen' }} />
      <ProfileBar name={profile.displayName} color={profile.color} label="Se guardará en" />
      <Screen>
        <TextField label="Nombre del examen" value={name} onChangeText={setName} error={err} />
        <TextField label="Tipo" value={kind} onChangeText={setKind} placeholder="Resonancia, EEG, análisis…" />
        <DateTimeField label="Fecha" withTime={false} date={date} onChange={(d) => d && setDate(d)} />
        <TextField label="Solicitado por" value={requestedBy} onChangeText={setRequestedBy} />
        <Chips label="Estado" options={[{ value: 'pendiente', label: 'Pendiente' }, { value: 'con_resultado', label: 'Con resultado' }]} value={status} onChange={setStatus} />
        {status === 'con_resultado' ? (
          <>
            <Chips label="Origen del resultado" options={[{ value: 'informe_medico', label: 'Informe médico' }, { value: 'declarado_por_usuario', label: 'Lo declaro yo' }]} value={source} onChange={setSource} />
            <TextField label="Resultado (transcrito tal como figura)" value={result} onChangeText={setResult} multiline numberOfLines={5} hint="No interprete ni agregue conclusiones propias como si fueran del informe." />
          </>
        ) : null}
        <TextField label="Notas" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
        <Button title="Guardar" onPress={save} loading={busy} />
        {!isNew ? <Button title="Eliminar examen" kind="danger" onPress={() => void remove()} /> : null}
      </Screen>
    </>
  );
}
