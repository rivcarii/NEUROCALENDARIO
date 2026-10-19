import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Switch } from 'react-native';
import { z } from 'zod';
import { Button, Card, Chips, DateTimeField, ErrorBox, H, Loading, P, ProfileBar, Row, Screen, TextField, confirmDestructive, errorMessage } from '../../components/ui';
import { WEEKDAY_LABEL } from '../../domain/labels';
import { localDateKey } from '../../domain/time';
import { useActive, useSession } from '../../services/session';
import { useData } from '../../services/useData';

const medForm = z.object({
  name: z.string().trim().min(1, 'Indique el nombre'), doseText: z.string(), form: z.string(),
  prescriber: z.string(), active: z.boolean(), notes: z.string(),
});
type MedValues = z.infer<typeof medForm>;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function MedicamentoForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'nuevo';
  const { store, profile } = useActive();
  const { bump, activeProfile } = useSession();
  const [pid] = useState(profile.id); // el perfil se fija al abrir el formulario
  const [busy, setBusy] = useState(false);
  const { data, loading, error, reload } = useData(async () => ({
    med: isNew ? null : (await store.get('medication', pid, id)) ?? null,
    schedules: isNew ? [] : await store.list('schedule', pid, { where: { medicationId: id } }),
  }), [id]);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<MedValues>({
    resolver: zodResolver(medForm),
    defaultValues: { name: '', doseText: '', form: '', prescriber: '', active: true, notes: '' },
  });
  useEffect(() => {
    const m = data?.med;
    if (m) reset({ name: m.name, doseText: m.doseText, form: m.form, prescriber: m.prescriber, active: m.active, notes: m.notes });
  }, [data?.med, reset]);

  const save = handleSubmit(async (f) => {
    if (activeProfile?.id !== pid) { Alert.alert('Perfil cambiado', 'No se guardó nada para evitar mezclar datos.'); return; }
    setBusy(true);
    try {
      if (isNew) {
        const created = await store.create('medication', pid, f);
        bump();
        router.replace(`/medicamento/${created.id}`);
      } else {
        await store.update('medication', pid, id, f);
        bump();
        router.back();
      }
    } catch (e) { Alert.alert('No se pudo guardar', errorMessage(e)); } finally { setBusy(false); }
  });

  async function remove() {
    if (!(await confirmDestructive('¿Borrar esta medicina?', 'También se borrarán sus horarios y el registro de lo que tomó. No se puede deshacer.', 'Eliminar'))) return;
    try { await store.remove('medication', pid, id); bump(); router.back(); } catch (e) { Alert.alert('No se pudo eliminar', errorMessage(e)); }
  }

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!isNew && !data?.med) return <Screen><P>Esta medicina no está en el perfil activo.</P></Screen>;

  return (
    <>
      <Stack.Screen options={{ title: isNew ? 'Nueva medicina' : 'Medicina' }} />
      <ProfileBar name={profile.displayName} color={profile.color} label="Se guardará en" />
      <Screen>
        <Controller control={control} name="name" render={({ field }) => <TextField label="Nombre" value={field.value} onChangeText={field.onChange} error={errors.name?.message} />} />
        <Controller control={control} name="doseText" render={({ field }) => <TextField label="Dosis (cuánto tomar)" value={field.value} onChangeText={field.onChange} placeholder="Ej.: 1 comprimido" />} />
        <Controller control={control} name="form" render={({ field }) => <TextField label="Forma" value={field.value} onChangeText={field.onChange} placeholder="Pastilla, jarabe, gotas…" />} />
        <Controller control={control} name="prescriber" render={({ field }) => <TextField label="Recetada por" value={field.value} onChangeText={field.onChange} />} />
        <Controller control={control} name="active" render={({ field }) => (
          <Row><Switch accessibilityLabel="Medicamento activo" value={field.value} onValueChange={field.onChange} /><P>{field.value ? 'Activo' : 'Pausada (sin avisos)'}</P></Row>
        )} />
        <Controller control={control} name="notes" render={({ field }) => <TextField label="Notas" value={field.value} onChangeText={field.onChange} multiline numberOfLines={3} />} />
        <Button title="Guardar" onPress={save} loading={busy} />

        {!isNew && data ? (
          <>
            <H level={2}>Horarios de la medicina</H>
            {data.schedules.length === 0 ? <P muted>Sin horarios. Añada uno para recibir avisos.</P> : null}
            {data.schedules.map((s) => (
              <Card key={s.id}>
                <P>{s.times.join(' · ')}</P>
                <P muted small>{s.daysOfWeek ? s.daysOfWeek.map((d) => WEEKDAY_LABEL[d]).join(', ') : 'Todos los días'} · desde {s.startDate}{s.endDate ? ` hasta ${s.endDate}` : ''}</P>
                {s.instructions ? <P muted small>{s.instructions}</P> : null}
                <Row>
                  <P small>{s.remindersEnabled ? 'Con aviso' : 'Sin aviso'}</P>
                  <Button title="Eliminar" kind="secondary" onPress={async () => {
                    if (await confirmDestructive('¿Eliminar horario?', 'Se eliminará este horario y su registro de tomas.', 'Eliminar')) {
                      try { await store.remove('schedule', pid, s.id); bump(); } catch (e) { Alert.alert('Error', errorMessage(e)); }
                    }
                  }} />
                </Row>
              </Card>
            ))}
            <ScheduleAdder medicationId={id} profileId={pid} />
            <Button title="Borrar esta medicina" kind="danger" onPress={() => void remove()} />
          </>
        ) : null}
      </Screen>
    </>
  );
}

function ScheduleAdder({ medicationId, profileId }: { medicationId: string; profileId: string }) {
  const { store } = useActive();
  const { bump } = useSession();
  const [times, setTimes] = useState('08:00');
  const [days, setDays] = useState<number[]>([]);
  const [start, setStart] = useState(localDateKey(new Date()));
  const [instr, setInstr] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Card>
      <H level={2}>Añadir horario</H>
      <TextField label="Horas (como 08:00, 20:00)" value={times} onChangeText={setTimes} placeholder="08:00, 20:00" keyboardType="numbers-and-punctuation" error={err ?? undefined} />
      <Chips multi label="¿Qué días? (si no elige, todos)" options={WEEKDAY_LABEL.map((l, i) => ({ value: i, label: l }))} value={days}
        onChange={(d) => setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d])} />
      <DateTimeField label="Desde" withTime={false} date={start} onChange={(d) => d && setStart(d)} />
      <TextField label="Indicaciones del médico" value={instr} onChangeText={setInstr} />
      <Button title="Añadir horario" loading={busy} onPress={async () => {
        const list = times.split(',').map((x) => x.trim()).filter(Boolean);
        if (!list.length || !list.every((x) => HHMM.test(x))) { setErr('Escriba las horas así: 08:00, 20:00'); return; }
        setErr(null); setBusy(true);
        try {
          await store.create('schedule', profileId, { medicationId, times: list, daysOfWeek: days.length ? days : null, startDate: start, instructions: instr });
          bump(); setInstr('');
        } catch (e) { Alert.alert('No se pudo guardar', errorMessage(e)); } finally { setBusy(false); }
      }} />
    </Card>
  );
}
