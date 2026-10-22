import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text } from '../../components/Text';
import { z } from 'zod';
import { Button, Card, Chips, DateTimeField, ErrorBox, Loading, P, ProfileBar, Screen, TextField, confirmDestructive, errorMessage, notify } from '../../components/ui';
import { ASSOCIATED_SYMPTOMS, EPISODE_KINDS, RECOVERY_LABEL } from '../../domain/labels';
import { RECOVERY } from '../../domain/schemas';
import { durationMinutes, formatDuration, isoToLocalDateKey, localToIso, formatTime } from '../../domain/time';
import { useActive, useSession } from '../../services/session';
import { useData } from '../../services/useData';

const form = z.object({
  kind: z.string().trim().min(1, 'Cuéntenos qué sintió'),
  startDate: z.string().min(1, 'Indique la fecha de inicio'),
  startTime: z.string().min(1, 'Indique la hora de inicio'),
  endDate: z.string().nullable(),
  endTime: z.string().nullable(),
  intensity: z.number().int().min(0).max(10).nullable(),
  associated: z.array(z.string()),
  context: z.string(),
  sleepHours: z.string().refine((s) => s === '' || (!Number.isNaN(Number(s.replace(',', '.'))) && Number(s.replace(',', '.')) >= 0 && Number(s.replace(',', '.')) <= 24), 'Entre 0 y 24'),
  stress: z.number().int().min(0).max(10).nullable(),
  triggers: z.string(),
  meds: z.array(z.string()),
  notes: z.string(),
  recovery: z.enum(RECOVERY),
}).superRefine((v, ctx) => {
  if (v.endDate && v.endTime && localToIso(v.endDate, v.endTime) < localToIso(v.startDate, v.startTime)) {
    ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'La finalización no puede ser anterior al inicio' });
  }
  if ((v.endDate && !v.endTime) || (!v.endDate && v.endTime)) {
    ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'Indique fecha y hora de finalización' });
  }
});
type FormValues = z.infer<typeof form>;

const scale = Array.from({ length: 11 }, (_, i) => ({ value: i, label: String(i), a11y: `${i} de 10` }));

export default function EpisodioForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'nuevo';
  const { store, profile } = useActive();
  const { bump, activeProfile } = useSession();
  const [lockedProfile] = useState(profile.id); // el perfil se fija al abrir el formulario
  const [busy, setBusy] = useState(false);
  const [full, setFull] = useState(!isNew);

  const { data, loading, error, reload } = useData(async () => ({
    episode: isNew ? null : (await store.get('episode', lockedProfile, id)) ?? null,
    meds: await store.list('medication', lockedProfile),
  }), [id]);

  const now = new Date();
  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(form),
    defaultValues: {
      kind: '', startDate: isoToLocalDateKey(now.toISOString()), startTime: formatTime(now.toISOString()),
      endDate: null, endTime: null, intensity: null, associated: [], context: '', sleepHours: '', stress: null,
      triggers: '', meds: [], notes: '', recovery: 'desconocida',
    },
  });

  useEffect(() => {
    const e = data?.episode;
    if (!e) return;
    reset({
      kind: e.kind, startDate: isoToLocalDateKey(e.startedAt), startTime: formatTime(e.startedAt),
      endDate: e.endedAt ? isoToLocalDateKey(e.endedAt) : null, endTime: e.endedAt ? formatTime(e.endedAt) : null,
      intensity: e.intensity, associated: e.associatedSymptoms, context: e.context,
      sleepHours: e.sleepHours === null ? '' : String(e.sleepHours), stress: e.stressLevel,
      triggers: e.declaredTriggers.join(', '), meds: e.relatedMedicationIds, notes: e.notes, recovery: e.recovery,
    });
  }, [data?.episode, reset]);

  const v = watch();
  const dur = v.endDate && v.endTime ? durationMinutes(localToIso(v.startDate, v.startTime), localToIso(v.endDate, v.endTime)) : null;

  const onSubmit = handleSubmit(async (f) => {
    if (activeProfile?.id !== lockedProfile) {
      notify('Perfil cambiado', 'El perfil activo cambió mientras editaba. No se guardó nada para evitar mezclar datos. Vuelva a abrir el formulario.');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        kind: f.kind.trim(), startedAt: localToIso(f.startDate, f.startTime),
        endedAt: f.endDate && f.endTime ? localToIso(f.endDate, f.endTime) : null,
        intensity: f.intensity, associatedSymptoms: f.associated, context: f.context.trim(),
        sleepHours: f.sleepHours === '' ? null : Number(f.sleepHours.replace(',', '.')),
        stressLevel: f.stress,
        declaredTriggers: f.triggers.split(',').map((s) => s.trim()).filter(Boolean),
        relatedMedicationIds: f.meds, notes: f.notes.trim(), recovery: f.recovery, isQuick: false,
      };
      if (isNew) await store.create('episode', lockedProfile, payload);
      else await store.update('episode', lockedProfile, id, payload);
      bump();
      router.back();
    } catch (e) {
      notify('No se pudo guardar', errorMessage(e));
    } finally { setBusy(false); }
  });

  async function remove() {
    if (!(await confirmDestructive('¿Borrar este síntoma?', 'Se borrará de forma permanente. No se puede deshacer.', 'Eliminar'))) return;
    try { await store.remove('episode', lockedProfile, id); bump(); router.back(); } catch (e) { notify('No se pudo eliminar', errorMessage(e)); }
  }

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!isNew && !data?.episode) return <Screen><P>Este síntoma no está en el perfil activo.</P><Button title="Volver" onPress={() => router.back()} /></Screen>;

  return (
    <>
      <Stack.Screen options={{ title: isNew ? 'Anotar un síntoma' : 'Editar síntoma' }} />
      <ProfileBar name={profile.displayName} color={profile.color} label="Se guardará en" />
      <Screen>
        <Controller control={control} name="kind" render={({ field }) => (
          <>
            <Chips label="¿Qué sintió?" options={EPISODE_KINDS.map((k) => ({ value: k, label: k }))} value={field.value} onChange={field.onChange} />
            <TextField label="Otro, o descríbalo con sus palabras" value={field.value} onChangeText={field.onChange} error={errors.kind?.message} />
          </>
        )} />
        <DateTimeField label="¿Cuándo empezó?" date={v.startDate} time={v.startTime} error={errors.startDate?.message ?? errors.startTime?.message}
          onChange={(d, tm) => { if (d) setValue('startDate', d, { shouldValidate: true }); if (tm) setValue('startTime', tm, { shouldValidate: true }); }} />
        <DateTimeField label="¿Cuándo terminó? (opcional)" optional date={v.endDate} time={v.endTime} error={errors.endDate?.message}
          onChange={(d, tm) => { setValue('endDate', d, { shouldValidate: true }); setValue('endTime', tm, { shouldValidate: true }); }} />
        <Card><P>Duró: <Text style={{ fontWeight: '700' }}>{formatDuration(dur)}</Text></P></Card>

        <Controller control={control} name="intensity" render={({ field }) => (
          <Chips label="¿Qué tan fuerte fue? (0 = nada, 10 = lo peor)" options={scale} value={field.value} onChange={(x) => field.onChange(field.value === x ? null : x)} />
        )} />

        {!full ? <Button title="Añadir más detalles" kind="secondary" onPress={() => setFull(true)} /> : (
          <>
            <Controller control={control} name="associated" render={({ field }) => (
              <Chips multi label="¿Sintió también…?" options={ASSOCIATED_SYMPTOMS.map((k) => ({ value: k, label: k }))} value={field.value}
                onChange={(x) => field.onChange(field.value.includes(x) ? field.value.filter((y) => y !== x) : [...field.value, x])} />
            )} />
            <Controller control={control} name="context" render={({ field }) => (
              <TextField label="¿Qué estaba haciendo antes?" value={field.value} onChangeText={field.onChange} multiline numberOfLines={3} />
            )} />
            <Controller control={control} name="sleepHours" render={({ field }) => (
              <TextField label="¿Cuántas horas durmió antes? (opcional)" value={field.value} onChangeText={field.onChange} keyboardType="decimal-pad" error={errors.sleepHours?.message} />
            )} />
            <Controller control={control} name="stress" render={({ field }) => (
              <Chips label="¿Cuánto estrés sentía? (opcional)" options={scale} value={field.value} onChange={(x) => field.onChange(field.value === x ? null : x)} />
            )} />
            <Controller control={control} name="triggers" render={({ field }) => (
              <TextField label="¿Qué cree que lo provocó?" value={field.value} onChangeText={field.onChange} hint="Sepárelos con comas. Es lo que usted percibe; no es una causa comprobada." />
            )} />
            {data?.meds.length ? (
              <Controller control={control} name="meds" render={({ field }) => (
                <Chips multi label="¿Tomó alguna medicina cerca de ese momento?" options={data.meds.map((m) => ({ value: m.id, label: m.name }))} value={field.value}
                  onChange={(x) => field.onChange(field.value.includes(x) ? field.value.filter((y) => y !== x) : [...field.value, x])} />
              )} />
            ) : null}
            <Controller control={control} name="recovery" render={({ field }) => (
              <Chips label="¿Cómo quedó después?" options={RECOVERY.map((r) => ({ value: r, label: RECOVERY_LABEL[r]! }))} value={field.value} onChange={field.onChange} />
            )} />
            <Controller control={control} name="notes" render={({ field }) => (
              <TextField label="Algo más que quiera anotar" value={field.value} onChangeText={field.onChange} multiline numberOfLines={4} />
            )} />
          </>
        )}
        {!isNew && data?.episode ? (
          <P muted small>Creado por {data.episode.createdBy === store.accountId ? 'usted' : 'otra cuenta'} · última modificación por {data.episode.updatedBy === store.accountId ? 'usted' : 'otra cuenta'}.</P>
        ) : null}
        <Button title="Guardar" onPress={onSubmit} loading={busy} />
        {!isNew ? <Button title="Borrar este síntoma" kind="danger" onPress={() => void remove()} /> : null}
      </Screen>
    </>
  );
}
