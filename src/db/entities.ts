import type { ZodType } from 'zod';
import {
  appointmentInput,
  documentInput,
  episodeInput,
  examInput,
  intakeInput,
  medicationInput,
  noteInput,
  scheduleInput,
} from '../domain/schemas';

export type ColType = 'text' | 'int' | 'real' | 'bool' | 'json';

export interface EntitySpec {
  table: string;
  /** Nombre en camelCase → tipo. Excluye columnas base. */
  columns: Record<string, ColType>;
  schema: ZodType;
  /** Columna usada para ordenar y filtrar por período. */
  timeColumn: string;
  /** Columnas permitidas en la búsqueda de texto libre. */
  searchable: string[];
}

export const ENTITIES = {
  episode: {
    table: 'episodes',
    columns: {
      startedAt: 'text', endedAt: 'text', kind: 'text', intensity: 'int',
      associatedSymptoms: 'json', context: 'text', sleepHours: 'real', stressLevel: 'int',
      declaredTriggers: 'json', relatedMedicationIds: 'json', notes: 'text',
      recovery: 'text', isQuick: 'bool',
    },
    schema: episodeInput,
    timeColumn: 'started_at',
    searchable: ['kind', 'context', 'notes'],
  },
  medication: {
    table: 'medications',
    columns: {
      name: 'text', doseText: 'text', form: 'text', prescriber: 'text', active: 'bool',
      startDate: 'text', endDate: 'text', notes: 'text',
    },
    schema: medicationInput,
    timeColumn: 'created_at',
    searchable: ['name', 'notes', 'prescriber'],
  },
  schedule: {
    table: 'med_schedules',
    columns: {
      medicationId: 'text', times: 'json', daysOfWeek: 'json', startDate: 'text', endDate: 'text',
      prescribedBy: 'text', instructions: 'text', remindersEnabled: 'bool',
    },
    schema: scheduleInput,
    timeColumn: 'start_date',
    searchable: ['instructions', 'prescribed_by'],
  },
  intake: {
    table: 'med_intakes',
    columns: {
      medicationId: 'text', scheduleId: 'text', scheduledAt: 'text', takenAt: 'text',
      status: 'text', notes: 'text',
    },
    schema: intakeInput,
    timeColumn: 'created_at',
    searchable: ['notes'],
  },
  appointment: {
    table: 'appointments',
    columns: {
      title: 'text', startsAt: 'text', endsAt: 'text', location: 'text', provider: 'text',
      notes: 'text', status: 'text', remindMinutesBefore: 'int',
    },
    schema: appointmentInput,
    timeColumn: 'starts_at',
    searchable: ['title', 'provider', 'location', 'notes'],
  },
  exam: {
    table: 'exams',
    columns: {
      name: 'text', kind: 'text', examDate: 'text', status: 'text', resultText: 'text',
      resultSource: 'text', requestedBy: 'text', notes: 'text',
    },
    schema: examInput,
    timeColumn: 'exam_date',
    searchable: ['name', 'kind', 'result_text', 'notes'],
  },
  document: {
    table: 'documents',
    columns: {
      title: 'text', docDate: 'text', fileName: 'text', mimeType: 'text', sizeBytes: 'int',
      sha256: 'text', storagePath: 'text', linkedEntity: 'text', linkedId: 'text', notes: 'text',
    },
    schema: documentInput,
    timeColumn: 'created_at',
    searchable: ['title', 'file_name', 'notes'],
  },
  note: {
    table: 'notes',
    columns: { body: 'text', authorRole: 'text', noteDate: 'text' },
    schema: noteInput,
    timeColumn: 'note_date',
    searchable: ['body'],
  },
} as const satisfies Record<string, EntitySpec>;

export type EntityName = keyof typeof ENTITIES;

export const snake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
export const camel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

export interface BaseFields {
  id: string;
  profileId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

