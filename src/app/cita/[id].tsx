import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Button, Chips, DateTimeField, ErrorBox, Loading, P, ProfileBar, Screen, TextField, confirmDestructive, errorMessage } from '../../components/ui';
import { isoToLocalDateKey, formatTime, localDateKey, localToIso } from '../../domain/time';
import type { Appointment } from '../../db/types';
import { useActive, useSession } from '../../services/session';
import { useData } from '../../services/useData';

const REMIND = [
  { value: -1, label: 'Sin aviso' }, { value: 30, label: '30 min antes' }, { value: 60, label: '1 h antes' },
  { value: 180, label: '3 h antes' }, { value: 1440, label: '1 día antes' },
];

export default function CitaForm() {
  const { id, fecha } = useLocalSearchParams<{ id: string; fecha?: string }>();
  const isNew = id === 'nueva';
  const { store, profile } = useActive();
  const [pid] = useState(profile.id); // el perfil se fija al abrir el formulario
  const { data, loading, error, reload } = useData(async () => (isNew ? null : (await store.get('appointment', pid, id)) ?? null), [id]);
  if (loading && !isNew && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!isNew && !data) return <Screen><P>Esta cita no existe en el perfil activo.</P></Screen>;
  return <CitaEditor key={data?.id ?? 'nueva'} id={id} isNew={isNew} pid={pid} initial={data} fecha={fecha} />;
}

function CitaEditor({ id, isNew, pid, initial, fecha }: { id: string; isNew: boolean; pid: string; initial: Appointment | null; fecha?: string }) {
  const { store, profile } = useActive();
  const { bump, activeProfile } = useSession();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [date, setDate] = useState<string>(initial ? isoToLocalDateKey(initial.startsAt) : fecha ?? localDateKey(new Date()));
  const [time, setTime] = useState(initial ? formatTime(initial.startsAt) : '09:00');
  const [provider, setProvider] = useState(initial?.provider ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [status, setStatus] = useState<'programada' | 'realizada' | 'cancelada'>(initial?.status ?? 'programada');
  const [remind, setRemind] = useState(initial ? initial.remindMinutesBefore ?? -1 : 60);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | undefined>();

  async function save() {
    if (activeProfile?.id !== pid) { Alert.alert('Perfil cambiado', 'No se guardó nada para evitar mezclar datos.'); return; }
    setBusy(true); setErr(undefined);
    try {
      const payload = { title, startsAt: localToIso(date, time), provider, location, notes, status, remindMinutesBefore: remind < 0 ? null : remind };
      if (isNew) await store.create('appointment', pid, payload); else await store.update('appointment', pid, id, payload);
      bump(); router.back();
    } catch (e) { setErr(errorMessage(e)); } finally { setBusy(false); }
  }
  async function remove() {
    if (!(await confirmDestructive('Eliminar cita', 'Se eliminará esta cita y su recordatorio.', 'Eliminar'))) return;
    try { await store.remove('appointment', pid, id); bump(); router.back(); } catch (e) { Alert.alert('No se pudo eliminar', errorMessage(e)); }
  }

  return (
    <>
      <Stack.Screen options={{ title: isNew ? 'Nueva cita' : 'Cita' }} />
      <ProfileBar name={profile.displayName} color={profile.color} label="Se guardará en" />
      <Screen>
        <TextField label="Título" value={title} onChangeText={setTitle} error={err} placeholder="Ej.: Control con neurología" />
        <DateTimeField label="Fecha y hora" date={date} time={time} onChange={(d, tm) => { if (d) setDate(d); if (tm) setTime(tm); }} />
        <TextField label="Profesional o centro" value={provider} onChangeText={setProvider} />
        <TextField label="Lugar" value={location} onChangeText={setLocation} />
        <Chips label="Estado" options={[{ value: 'programada', label: 'Programada' }, { value: 'realizada', label: 'Realizada' }, { value: 'cancelada', label: 'Cancelada' }]} value={status} onChange={setStatus} />
        <Chips label="Recordatorio" options={REMIND} value={remind} onChange={setRemind} />
        <TextField label="Notas" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
        <Button title="Guardar" onPress={save} loading={busy} />
        {!isNew ? <Button title="Eliminar cita" kind="danger" onPress={() => void remove()} /> : null}
      </Screen>
    </>
  );
}
