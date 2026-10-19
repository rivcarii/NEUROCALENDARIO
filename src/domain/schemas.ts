import { z } from 'zod';

const iso = z.string().refine((s) => !Number.isNaN(Date.parse(s)) && /^\d{4}-\d{2}-\d{2}T/.test(s), {
  message: 'Fecha y hora no válidas',
}).transform((s) => new Date(s).toISOString()); // normaliza a UTC para poder ordenar y filtrar
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no válida (AAAA-MM-DD)');
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora no válida (HH:MM)');
const text = (max = 2000) => z.string().trim().max(max, `Máximo ${max} caracteres`);
const strList = z.array(z.string().trim().min(1).max(100)).max(30);

export const RECOVERY = ['completa', 'parcial', 'sin_recuperar', 'desconocida'] as const;

export const episodeInput = z
  .object({
    startedAt: iso,
    endedAt: iso.nullable().default(null),
    kind: text(100).min(1, 'Indique el tipo de episodio'),
    intensity: z.number().int().min(0).max(10).nullable().default(null),
    associatedSymptoms: strList.default([]),
    context: text().default(''),
    sleepHours: z.number().min(0).max(24).nullable().default(null),
    stressLevel: z.number().int().min(0).max(10).nullable().default(null),
    declaredTriggers: strList.default([]),
    relatedMedicationIds: z.array(z.string()).max(30).default([]),
    notes: text().default(''),
    recovery: z.enum(RECOVERY).default('desconocida'),
    isQuick: z.boolean().default(false),
  })
  .refine((e) => !e.endedAt || Date.parse(e.endedAt) >= Date.parse(e.startedAt), {
    message: 'La finalización no puede ser anterior al inicio',
    path: ['endedAt'],
  });

export const medicationInput = z.object({
  name: text(120).min(1, 'Indique el nombre'),
  doseText: text(120).default(''),
  form: text(60).default(''),
  prescriber: text(120).default(''),
  active: z.boolean().default(true),
  startDate: dateOnly.nullable().default(null),
  endDate: dateOnly.nullable().default(null),
  notes: text().default(''),
});

export const scheduleInput = z
  .object({
    medicationId: z.string().min(1),
    times: z.array(hhmm).min(1, 'Añada al menos una hora').max(12),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1).max(7).nullable().default(null),
    startDate: dateOnly,
    endDate: dateOnly.nullable().default(null),
    prescribedBy: text(120).default(''),
    instructions: text(500).default(''),
    remindersEnabled: z.boolean().default(true),
  })
  .refine((s) => !s.endDate || s.endDate >= s.startDate, {
    message: 'La fecha final no puede ser anterior a la inicial',
    path: ['endDate'],
  });

export const intakeInput = z.object({
  medicationId: z.string().min(1),
  scheduleId: z.string().nullable().default(null),
  scheduledAt: iso.nullable().default(null),
  takenAt: iso.nullable().default(null),
  status: z.enum(['tomada', 'omitida', 'pospuesta']),
  notes: text(500).default(''),
});

export const appointmentInput = z
  .object({
    title: text(150).min(1, 'Indique un título'),
    startsAt: iso,
    endsAt: iso.nullable().default(null),
    location: text(200).default(''),
    provider: text(150).default(''),
    notes: text().default(''),
    status: z.enum(['programada', 'realizada', 'cancelada']).default('programada'),
    remindMinutesBefore: z.number().int().min(0).max(60 * 24 * 14).nullable().default(null),
  })
  .refine((a) => !a.endsAt || Date.parse(a.endsAt) >= Date.parse(a.startsAt), {
    message: 'La finalización no puede ser anterior al inicio',
    path: ['endsAt'],
  });

export const examInput = z.object({
  name: text(150).min(1, 'Indique el nombre del examen'),
  kind: text(80).default(''),
  examDate: dateOnly,
  status: z.enum(['pendiente', 'con_resultado']).default('pendiente'),
  resultText: text(4000).default(''),
  resultSource: z.enum(['informe_medico', 'declarado_por_usuario']).default('declarado_por_usuario'),
  requestedBy: text(150).default(''),
  notes: text().default(''),
});

export const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'] as const;
export const MAX_FILE_BYTES = 15 * 1024 * 1024;

export const documentInput = z.object({
  title: text(150).min(1, 'Indique un título'),
  docDate: dateOnly.nullable().default(null),
  fileName: text(200).min(1),
  mimeType: z.enum(ALLOWED_MIME),
  sizeBytes: z.number().int().positive().max(MAX_FILE_BYTES, 'El archivo supera 15 MB'),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  storagePath: z.string().min(1).max(300),
  linkedEntity: z.string().nullable().default(null),
  linkedId: z.string().nullable().default(null),
  notes: text().default(''),
});

export const noteInput = z.object({
  body: text(5000).min(1, 'La nota no puede estar vacía'),
  authorRole: z.enum(['persona', 'cuidador']).default('persona'),
  noteDate: dateOnly,
});

export const profileInput = z.object({
  displayName: text(80).min(1, 'Indique un nombre'),
  relationship: text(60).default(''),
  birthYear: z.number().int().min(1900).max(2100).nullable().default(null),
  isPrimary: z.boolean().default(false),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#2F5D8A'),
});

export type EpisodeInput = z.input<typeof episodeInput>;
export type MedicationInput = z.input<typeof medicationInput>;
export type ScheduleInput = z.input<typeof scheduleInput>;
export type IntakeInput = z.input<typeof intakeInput>;
export type AppointmentInput = z.input<typeof appointmentInput>;
export type ExamInput = z.input<typeof examInput>;
export type DocumentInput = z.input<typeof documentInput>;
export type NoteInput = z.input<typeof noteInput>;
export type ProfileInput = z.input<typeof profileInput>;
